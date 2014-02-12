
from django.conf import settings
from pymongo import MongoClient, DESCENDING

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

def get_physicians():
    db = __get_db()
    physicians = []
    
    for p in db['physicians'].find():
        p['id'] = p['_id']
        del p['_id'] # not allowed on django templates
        physicians.append(p)
        
    return physicians

def get_one_physician():
    db = __get_db()
    collection = db['physicians']
    
    physician = collection.find_one()
    if physician:
        physician['id'] = physician['_id']
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
        physician['id'] = physician['_id']
        del physician['_id']
    
    return physician
