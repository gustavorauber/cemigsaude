# -*- coding: utf-8 -*-
'''
Created on Feb 13, 2014


:author: Gustavo Rauber 
'''

from elasticsearch import Elasticsearch

def search_physicians(specialty="", n=10):
    es = Elasticsearch()
    res = es.search(index='physicians', doc_type="physician", 
            body={"query": {
                      "multi_match": { 
                            "query": specialty,
                            #"type": "cross_fields", # waiting v.1.1
                            "fields": ["specialty", "name", "neighborhood"],
                            #"operator": "and"                
                      }                  
                  },
                  "size": n
            })
    
    return res['hits']['hits']