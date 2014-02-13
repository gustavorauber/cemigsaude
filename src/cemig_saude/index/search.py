# -*- coding: utf-8 -*-
'''
Created on Feb 13, 2014


:author: Gustavo Rauber 
'''

from elasticsearch import Elasticsearch

def search_physicians(specialty=""):
    es = Elasticsearch()
    res = es.search(index='physicians', doc_type="physician", 
                    body={"query": { 
                        "match": {
                            "specialty": specialty
                        }
                    }})
    
    return res['hits']['hits']