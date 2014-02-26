
import hashlib

from bson.objectid import ObjectId
from django.conf import settings
from pymongo import MongoClient, DESCENDING
from unidecode import unidecode

__client = None

def __get_db(new_connection=False):    
    global __client
    
    if new_connection:
        client = MongoClient(settings.MONGO_HOST, settings.MONGO_PORT)
        return client['local']
    
    if __client is None:
        __client = MongoClient(settings.MONGO_HOST, settings.MONGO_PORT)
        
    db = __client['local']
    
    return db

def get_physicians(filter_by={}, n=None, sort_by=None, sort_order=DESCENDING):
    db = __get_db()
    physicians = []
    filters = {}
    
    if filter_by != {}:
        filters = filter_by
        
    cursor = db['physicians'].find(filters)
        
    if sort_by is not None:
        cursor = cursor.sort(sort_by, sort_order)
    
    if n:
        cursor = cursor.limit(n)
    
    for p in cursor:
        p['id'] = str(p['_id'])
        del p['_id'] # not allowed on django templates
        physicians.append(p)
        
    return physicians

def get_specialties():
    db = __get_db()
    specialties = []
    
    cursor = db['specialties'].find().sort('specialty')
    for p in cursor:
        p['id'] = str(p['_id'])
        del p['_id'] # not allowed on django templates
        specialties.append(p)
    
    return specialties

def get_one_physician(filter_by={}):
    db = __get_db()
    collection = db['physicians']
    
    physician = collection.find_one(filter_by)
    if physician:
        physician['id'] = str(physician['_id'])
        del physician['_id']
    
    return physician

def get_physician_by_id(id):
    """
    Loads a specific physician
    
    :param string id: the physician unique identifier    
    """
    db = __get_db()
    collection = db['physicians']
    
    physician = collection.find_one({'_id': str(id)})
    if physician:
        physician['id'] = str(physician['_id'])
        del physician['_id']
    
    return physician

def update_physicians_missing_hash():
    db = __get_db()
    collection = db['physicians']
    physicians = get_physicians(filter_by={'hash': {'$exists': False}})
    for p in physicians:
        collection.update({"_id": ObjectId(p['id'])}, 
                          {'$set': {'hash': str(p['id'])}})        

def update_physicians_phones():
    db = __get_db()
    collection = db['physicians']
    physicians = get_physicians(filter_by={'addresses.phones': {"$regex": "/"}})
    
    for p in physicians:
        for address in p['addresses']:
            address['phones'] = address['phones'].split('/')
            
            for phone in address['phones']:
                phone = phone.strip()
            
        collection.update({'hash': p['hash']}, 
                          {'$set': {'addresses': p['addresses']}})        
        
def sync_cities():
    db = __get_db()
    collection = db['physicians']
    cities = collection.distinct("addresses.city")
    
    for c in cities:
        hash = hashlib.sha256(unidecode(c).lower().strip()).hexdigest()
        idx = c.rfind('-')
        
        if idx != -1:
            city = c[:idx].strip()
            uf = c[idx + 1:].strip()
        else:
            city = c
            uf = ""
            
        db['cities'].update({'_id': hash}, {"$set": { "city": city,
                                                      "uf": uf}}, 
                                 upsert=True) 

        print db['physicians'].update({'addresses.city': c}, 
                                {'$set': {'city_hash': hash}}, 
                                multi=True)
        
def sync_specialties():
    db = __get_db()
    collection = db['physicians']
    cities = db['cities'].find()
    
    specialties = collection.distinct("specialty")
    specialties.sort()

    for c in cities:
        city_hash = c['_id']
        
        for s in specialties:
            count = collection.find({'specialty': s,
                                     'city_hash': city_hash}).count()
            
            if count == 0:
                continue
            
            hash = hashlib.sha256(unidecode(s).lower().strip()).hexdigest()
            
            db['specialties'].update({'_id': hash}, {"$set": { "specialty": s,
                                        "city_hash": city_hash, 
                                        "count": count}}, 
                                     upsert=True)
    
            db['physicians'].update({'specialty': s}, 
                                    {'$set': {'specialty_hash': hash}}, 
                                    multi=True)
        