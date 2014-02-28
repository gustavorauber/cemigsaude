
import hashlib
import json

from bson.objectid import ObjectId
from django.conf import settings
from pymongo import MongoClient, DESCENDING
from time import sleep
from unidecode import unidecode

from cemig_saude.model.geocode import geocode_address

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
    
    specialties = collection.distinct("specialty")
    specialties.sort()
        
    for s in specialties:
        count = collection.find({'specialty': s}).count()
        hash = hashlib.sha256(unidecode(s).lower().strip()).hexdigest()
        
        db['specialties'].update({'_id': hash}, {"$set": { "specialty": s,                                     
                                    "count": count}}, 
                                 upsert=True)

        db['physicians'].update({'specialty': s}, 
                                {'$set': {'specialty_hash': hash}}, 
                                multi=True)

def remove_duplicates():
    db = __get_db()
    physicians = get_physicians(filter_by={"addresses.geocode.status": "OVER_QUERY_LIMIT"})
    count = 0
    
    print "Over", len(physicians)
    
    for p in physicians:
        addresses = p['addresses']
        for addr in addresses:
            if addr.get('geocode', {}).get('status', "") == "OVER_QUERY_LIMIT":
                del addr['geocode']
        
        db['physicians'].update({"_id": ObjectId(p['id'])}, 
                                {"$set": {'addresses': addresses}})
        
#         similars = db['physicians'].find({'name': p['name'],
#                                'city_hash': p['city_hash'], 
#                                'hash': {'$ne': p['hash']}})
#         
#         if similars.count() > 0:
#             count += 1            
#             db['physicians'].remove({'hash': p['hash']})
            
    print "Duplicated = ", count
            

def update_geocode():    
    db = __get_db()
    physicians = get_physicians(filter_by={"addresses.geocode": {"$exists": False}})
    
    print "Total to geocode", len(physicians)
    count = 0
    
    for p in physicians:
        for addr in p['addresses']:
            if 'geocode' not in addr:
                geocode_json = geocode_address(addr)
                addr['geocode'] = json.loads(geocode_json)
                
                if addr['geocode']['status'] == "OVER_QUERY_LIMIT":
                    print count, "QUERY LIMIT REACHED"
                    return
            
                sleep(1)
                
        db['physicians'].update({"_id": ObjectId(p['id'])}, 
                                {"$set": {'addresses': p['addresses']}})
        
        count += 1
        
        if count % 50 == 0:
            print count

def merge_addresses():
    db = __get_db()
    physicians = get_physicians()    
    
    count = 0    
    for p in physicians:        
        similars = db['physicians'].find({'name': p['name'],
                                          'email': p['email'],
                                          'register': p['register'],
                                          'hash': {'$ne': p['hash']}})
        
        if similars.count() > 0:            
            for s in similars:                
                p['addresses'].extend(s['addresses'])                
                db['physicians'].remove({'hash': s['hash']})
            
            db['physicians'].update({"_id": ObjectId(p['id'])}, 
                                {"$set": {'addresses': p['addresses']}})            
            
            count += 1            
            
    print "Merged Physicians", count
    