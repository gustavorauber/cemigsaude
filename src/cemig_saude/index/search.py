# -*- coding: utf-8 -*-
'''
Created on Feb 13, 2014


:author: Gustavo Rauber 
'''

from elasticsearch import Elasticsearch

def search_physicians(query="", n=10, distance=None, lat=None, lon=None,
                      show_distance=False, sort_by_distance=False, 
                      fields=["specialty", "name", "neighborhood","city"],
                      filter=None, from_record=0):
    """
    """
    es = Elasticsearch()
    
    query_body =  {  "query": {
                        "multi_match": { 
                            "query": query,
                            #"type": "cross_fields", # waiting v.1.1
                            "fields": fields,
                            #"operator": "and"
                         },                      
                    },
                    "from": from_record,
                    "size": n
            }    
    
    if filter:
        query_body['query'] = {'filtered': {'filter': {'term':  filter}}}
    
    if distance:
        query_body['filter'] = {
                "geo_distance": {                             
                             "physician.location": {
                                 "lat": lat,
                                 "lon": lon
                             },
                             'distance': str(distance) + "km"
                }
        }
        
    if show_distance:
        query_body['fields'] = ["_source"]
        query_body['script_fields'] = {
               "distance": {
                    "params": {
                        "lat": lat,
                        "lon": lon
                    },
                    "script": "doc['physician.location'].distanceInKm(lat,lon)"
                }
        }
        
    if sort_by_distance:
        query_body['sort'] = [{"_geo_distance": {
            "physician.location": {
                       "lat": lat,
                       "lon": lon
            },
            "order": "asc",
            "mode": "min",
            "unit": "km"                     
         }}]
    
    res = es.search(index='physicians', doc_type="physician", 
            body=query_body)    
    
    return res['hits']['hits'], res['hits']['total'] 

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
