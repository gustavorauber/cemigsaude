'''
Created on 12/02/2014

@author: Gustavo Rauber
'''

from cemig_saude.index.index_mapping import physician_entry_mapping
from cemig_saude.model.mongo import get_physicians
from cemig_saude.model.physician import Physician

from elasticsearch import Elasticsearch
from elasticsearch.client import IndicesClient

from unidecode import unidecode

def create_index():
    es = Elasticsearch()
    client = IndicesClient(es)
    
    try:
        client.delete('physicians')
    except Exception, e:
        print e
        
    client.create(index='physicians', 
                  body={'mappings': 
                        {'physician': physician_entry_mapping}
                        })
    

def index_all_physicians():
    es = Elasticsearch()
    
    physicians = get_physicians()
    for physician in physicians:
        phy = Physician(physician)
        
        locations = []
        cities = []
        states = []
        neighborhoods = []
        for addr in phy.get_addresses():
            if 'lat' in addr:
                locations.append({"lat": addr['lat'], "lon": addr['lon']})
                
            cities.append(unidecode(addr['city']))
            states.append(unidecode(addr['state']))
            neighborhoods.append(unidecode(addr['neighborhood']))
        
        specialty = ""
        if isinstance(phy.get_specialty(), list):
            sp = []
            for s in phy.get_specialty():
                sp.append(unidecode(s))
                
            specialty = sp
        else:        
            specialty = unidecode(phy.get_specialty())
        
        es.index(index='physicians', doc_type='physician', id=phy.get_id(),
                 body={'name': unidecode(phy.get_name()),
                       'location': locations,
                       'neighborhood': neighborhoods,
                       'city': cities,
                       'state': states,
                       'specialty': specialty})        
        

if __name__ == "__main__":
    create_index()
    index_all_physicians()
    