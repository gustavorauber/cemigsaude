'''
Created on Feb 11, 2014

:author: Gustavo Rauber <gustavo.rauber@cemig.com.br>
'''

physician_entry_mapping = {
    'entry': {
        'properties': {
            'name': {
                'boost': 1.0,
                'index': 'analyzed',
                'analyzer': 'standard',
                'store': 'no',
                'type': 'string',
                'term_vector': 'with_positions_offsets'
            },
            "location" : {
                'type' : 'geo_point', # lat,long,
                'lat_lon': True,
                'fielddata' : {
                    'format' : 'compressed',
                    'precision' : '3m'
                }
            },
            'neighborhood': {
                'boost': 1.0,
                'index': 'analyzed',
                'analyzer': 'standard',                                    
                'store': 'no',
                'type': 'string' 
            },
            'city': {
                'boost': 1.0,
                'index': 'analyzed',
                'analyzer': 'standard',                                    
                'store': 'no',
                'type': 'string',
                'term_vector': 'with_positions_offsets'
            },
            'state': {
                'boost': 1.0,
                'index': 'analyzed',
                'analyzer': 'standard',                                    
                'store': 'no',
                'type': 'string' 
            },
            'specialty': {
                'boost': 1.0,
                'index': 'analyzed',
                'analyzer': 'standard',                                    
                'store': 'no',
                'type': 'string'
            },
            'id': {
                'index': 'no',
                'store': 'yes',
                'type': 'string'
            }
        }
    }
}
