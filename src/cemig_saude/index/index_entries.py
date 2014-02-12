'''
Created on 12/02/2014

@author: Gustavo Rauber
'''

from elasticsearch import Elasticsearch
from elasticsearch.client import IndicesClient

from index_mapping import physician_entry_mapping
from cemig_saude.model.mongo import get_physicians
from cemig_saude.model.physician import Physician

def create_index():
    es = Elasticsearch()
    client = IndicesClient(es)
    
    client.delete('physicians')
    client.create(index='physicians', 
                  body={'mappings': 
                        {'physician': physician_entry_mapping}
                        })
    

def index_all_physicians():
    es = Elasticsearch()
    
    physicians = get_physicians()
    for physician in physicians:
        phy = Physician(physician)
        
        es.index(index='physicians', doc_type='physician', id=phy.get_id(),
                 body={'name': phy.get_name(),
                       'location': { "lat": phy.get_lat(),
                                     "lon": phy.get_lon()
                                   },
                       'neighborhood': phy.get_neighborhood(),
                       'city': phy.get_city(),
                       'state': phy.get_state(),
                       'specialty': phy.get_specialty()})        
        

if __name__ == "__main__":
    create_index()
    index_all_physicians()
    