'''
Created on 29/01/2014

@author: c057384
'''

import sys
import httplib
import urllib
import urllib2

from bs4 import BeautifulSoup 

def parse_entries(html):
    soup = BeautifulSoup(page, 'html.parser')    
    elements = soup.select('div.panelRepeaterEnd')
    
    entries = []
    
    for div in elements:
        entry = {}
        
        label = div.select('table.tabelaConveniados2 > tr > td > span.arial12')[0].get_text()
        spans = div.select('table.tabelaConveniados > tr > td > span.arial12')
        
        speciality, email, site, register,  = "", "", "", ""
        for span in spans:
            if span.get('id').endswith('EmailRept'):
                entry['email'] = span.get_text().strip()
            elif span.get('id').endswith('EspecialidadeRept'):
                entry['speciality'] = span.get_text().strip()
            elif span.get('id').endswith('Site'):
                entry['site'] = span.get_text().strip()
            elif span.get('id').endswith('Profissional'):
                entry['register'] = span.get_text().strip()
        
        addresses = []
        address_divs = div.select('#tbEnderecos')
        for address_div in address_divs:
            address = {}
            address_parts = address_div.select('tr > td.coluna_right_end > span')
            for span in address_parts:
                if span.get('id').endswith('LogradouroRept'):
                    address['street'] = span.get_text().strip()
                elif span.get('id').endswith('BairroRept'):
                    address['neighborhood'] = span.get_text().strip()
                elif span.get('id').endswith('CidadeRept'):
                    address['city'] = span.get_text().strip()
                elif span.get('id').endswith('TelefoneRept'):
                    address['phones'] = span.get_text().strip()
                elif span.get('id').endswith('FaxRept'):
                    address['fax'] = span.get_text().strip()
                    
            addresses.append(address)
        
        entry['addresses'] = addresses
        entries.append(entry)
        break
        
    return entries

def geocode_address(address):
    url = "http://maps.googleapis.com/maps/api/geocode/json?"
    params = {}    
    
    components = []
    components.append('locality:' + address['city'])
    components.append('administrative_area:MG')
    components.append('country:BR')    
    
    params['components'] = "|".join(components)
    params['address'] = address['street'].encode('utf8') + "," + address['neighborhood'].encode('utf8')
    
    request_url = url + urllib.urlencode(params)
    
    sock = urllib2.urlopen(request_url)
    response = sock.read()
    sock.close()
    
    print response    
         

if __name__ == '__main__':
    
    page = ""
    with open(sys.argv[1], 'r') as f:
        page = f.read()
        
    entries = parse_entries(page)
    
    print "Total entries", len(entries)
    
    geocode_address(entries[0]['addresses'][0])
    