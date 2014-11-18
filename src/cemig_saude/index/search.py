# -*- coding: utf-8 -*-
'''
Created on Feb 13, 2014


:author: Gustavo Rauber 
'''

from elasticsearch import Elasticsearch

def search_physicians(query="", n=10, distance=None, lat=None, lon=None):
    es = Elasticsearch()
    res = es.search(index='physicians', doc_type="physician", 
            body={  "query": {
                        "multi_match": { 
                            "query": query,
                            #"type": "cross_fields", # waiting v.1.1
                            "fields": ["specialty", "name", "neighborhood", 
                                       "city"],
                            #"operator": "and"         
                               
                         },                      
                    },
                    "size": n,
                    "filter": {
                         "geo_distance": {
                             "distance": str(distance) + "km",
                             "physician.location": {
                                 "lat": lat,
                                 "lon": lon
                             }
                         }
                    }
            })
    
    return res['hits']['hits']

def search_specialties(distance=None, lat=None, lon=None):
    es = Elasticsearch()
    res = es.search(index='physicians', doc_type="physician", 
            body={  "query": {
                        "match_all": {},                      
                    },
                    "facets": {
                        "specialty": {
                            "terms": {
                                "field": "specialty",
                                "all_terms": True
                            }
                        }
                    },
                    "size": n,
                    "filter": {
                         "geo_distance": {
                             "distance": str(distance) + "km",
                             "physician.location": {
                                 "lat": lat,
                                 "lon": lon
                             }
                         }
                    }
            })
    
    
    return res['hits']['hits']
