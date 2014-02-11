
from elasticsearch import Elasticsearch
from elasticsearch.client import IndicesClient

from index_mapping import physician_entry_mapping

def create_index():
    es = Elasticsearch()
    client = IndicesClient(es)
    
    client.delete('physicians')
    client.create(index='physicians', 
                  body={'mappings': 
                        {'physician': physician_entry_mapping}
                        })
    

if __name__ == "__main__":
    create_index()