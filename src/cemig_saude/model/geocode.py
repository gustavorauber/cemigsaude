import urllib
import urllib2

from unidecode import unidecode

def treat_street_address(street_address):    
    idx = street_address.rfind('-')
    if idx != -1:
        return street_address[:idx].strip()
    return street_address

def treat_city(city):
    idx = city.rfind('-')
    if idx != -1:
        return city[:idx].strip()
    return city

def geocode_address(address):
    url = "http://maps.googleapis.com/maps/api/geocode/json?"
    params = {}    
    
    components = []
    components.append('locality:' + unidecode(treat_city(address['city'])))
#     components.append('administrative_area:MG')
    components.append('country:BR')    
    
    params['components'] = "|".join(components)
    params['address'] = unidecode(treat_street_address(address['street'])) 
    #+ "," + unidecode(address['neighborhood'])
    params['sensor'] = "false"
    
    request_url = url + urllib.urlencode(params)
    
    # Proxy Handling
    proxy = urllib2.ProxyHandler({'http': 'http://c057384:XXX@proxycemig.cemig.ad.corp:8080'})
    auth = urllib2.HTTPBasicAuthHandler()
    opener = urllib2.build_opener(proxy, auth, urllib2.HTTPHandler)
    urllib2.install_opener(opener)

    sock = urllib2.urlopen(request_url)
    response = sock.read()
    sock.close()
    
    return response    