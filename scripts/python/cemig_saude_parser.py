'''
Created on 29/01/2014

@author: c057384
'''

import json
import os
import sys
import hashlib
import httplib
import urllib
import urllib2

from bs4 import BeautifulSoup
from time import sleep
from pymongo import MongoClient, DESCENDING

from selenium import webdriver
from selenium.common.exceptions import NoSuchElementException
from selenium.webdriver.common.keys import Keys

from unidecode import unidecode

SLEEP_TIME = 5


def get_db():
    client = MongoClient("127.0.0.1", 27017)
    return client['local']

def get_entry_hash(entry):
    base_string = entry['name']
    return hashlib.sha256(unidecode(base_string).strip().lower()).hexdigest()     

def parse_entries(html):
    soup = BeautifulSoup(html, 'html.parser')    
    elements = soup.select('div.panelRepeaterEnd')
    
    entries = []
    
    for div in elements:
        entry = {}
        
        # Obtain third-party physician ID
        for el in div.previous_elements:
            if el:
                if el.name == "a":
                    entry['cemig_saude_id'] = el.get('name')                
                    break
        
        entry['name'] = div.select('table.tabelaConveniados2 > tbody > tr > td > span.arial12')[0].get_text()
        spans = div.select('table.tabelaConveniados > tbody > tr > td > span.arial12')
        
        for span in spans:
            if span.get('id').endswith('EmailRept'):
                entry['email'] = span.get_text().strip()
            elif span.get('id').endswith('EspecialidadeRept'):
                entry['specialty'] = span.get_text().strip()
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
                    address['phones'] = span.get_text().strip().split('/')
                elif span.get('id').endswith('FaxRept'):
                    address['fax'] = span.get_text().strip()
                    
            addresses.append(address)
        
        entry['addresses'] = addresses
        entries.append(entry)        
        
    return entries

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
#    proxy = urllib2.ProxyHandler({'http': 'http://c057384:XXX@proxycemig.cemig.ad.corp:8080'})
#    auth = urllib2.HTTPBasicAuthHandler()
#    opener = urllib2.build_opener(proxy, auth, urllib2.HTTPHandler)
#    urllib2.install_opener(opener)

    sock = urllib2.urlopen(request_url)
    response = sock.read()
    sock.close()
    
    return response    

def fetch_all_physicians():
    url = "http://www.cemigsaude.org.br/Paginas/Geral/Prosaude/Convenios/Convenios_Disponiveis.aspx"
    
    driver = webdriver.PhantomJS(service_log_path='')
#    driver = webdriver.PhantomJS(service_log_path='',
#                                 executable_path="D:\Users\c057384\phantomjs\phantomjs")
    driver.set_window_size(1024, 768)
    
    try:
        i = 136
        
        while True:
            downloaded = False
            
            driver.get(url)
            
            sleep(SLEEP_TIME)
            
            page = driver.page_source            
            
            iframe = driver.find_element_by_id("MSOPageViewerWebPart_WebPartWPQ1")
            driver.switch_to_frame(iframe)
            options = driver.find_elements_by_css_selector("#cboCidade > option")
            
            for j, option in enumerate(options):
                if i == j:
                    downloaded = True
                    print i, option.text
                    city = unidecode(option.text)     
                    option.click()       
                
                    submit = driver.find_element_by_id("btnConsulta")
                    submit.click()
                    
                    sleep(SLEEP_TIME)
                    
                    page = driver.page_source
                    with open(city + ".html", "w") as f:
                        f.write(page.encode('utf8'))
            
            if not downloaded:
                break
                    
            i += 1
        
    except Exception, e:
        print e
    finally:
        driver.quit()

def fetch_specialties(driver, id):
    filename = 'specialties/' + str(id) + '.html'
    
    # Skip existing files
    if os.path.exists(filename):
        return
    
    url = "http://legado.cemigsaude.org.br/portal/prosaude/Convenios/ConsultaConveniado.aspx?codigo=" + str(id)
    
    driver.get(url)            
    sleep(SLEEP_TIME)
    
    page = driver.page_source
    with open(filename, 'w') as f:
        f.write(page.encode('utf8'))        

def make_fake_click(driver):
    driver.get("http://www.cemigsaude.org.br/Paginas/Geral/Prosaude/Convenios/Convenios_Disponiveis.aspx")
    sleep(SLEEP_TIME)
    
    iframe = driver.find_element_by_id("MSOPageViewerWebPart_WebPartWPQ1")
    driver.switch_to_frame(iframe)
    options = driver.find_elements_by_css_selector("#cboCidade > option")
    
    for j, option in enumerate(options):
        if 1 == j:
            downloaded = True
            city = unidecode(option.text)     
            option.click()       
        
            submit = driver.find_element_by_id("btnConsulta")
            submit.click()
            
            sleep(SLEEP_TIME)
            break
            
def fetch_all_missings_specialties():
    missing_specialties_ids = set()
    
    db = get_db()
    physicians = db['physicians'].find()
    for p in physicians:
        if p.get('cemig_saude_id', '') and not p.get('specialty'):
            missing_specialties_ids.add(p['cemig_saude_id'])
    
    if len(missing_specialties_ids) > 0:
        print "Physicians missing specialty:", len(missing_specialties_ids)
        
#         driver = webdriver.PhantomJS(service_log_path='')
        driver = webdriver.PhantomJS(service_log_path='',
                                     executable_path="D:\Users\c057384\phantomjs\phantomjs")
        driver.set_window_size(1024, 768)        
        make_fake_click(driver)
             
        count = 0
        for id in missing_specialties_ids:
            fetch_specialties(driver, id)
            sleep(SLEEP_TIME)
            
            count += 1
            
            if count % 5 == 0:
                if count % 10 == 0:
                    print count
                    
                make_fake_click(driver)

def parse_specialties(filename):
    specialties = []
    html = ""
    with open(filename, 'r') as f:
        html = f.read()
        
    soup = BeautifulSoup(html, 'html.parser')
    items = soup.select('#grdEspecialidade > tbody > tr > td')
    for i, td in enumerate(items):
        if i > 0:
            specialty = td.get_text().strip()
            specialties.append(specialty)
        
    return specialties
                
def update_missing_specialties():
    missing_specialties_ids = set()
    
    db = get_db()
    physicians = db['physicians'].find()
    for p in physicians:
        if p.get('cemig_saude_id', '') and not p.get('specialty'):
            missing_specialties_ids.add(p['cemig_saude_id'])                

    count = 0
    if len(missing_specialties_ids) > 0:
        for id in missing_specialties_ids:
            filename = 'specialties/' + str(id) + '.html'
            
            if os.path.exists(filename):
                specialties = parse_specialties(filename)
                
                db['physicians'].update(
                            {"cemig_saude_id": id}, 
                            {"$set": {'specialty': specialties}})
                
                count += 1
                
                
    print "Updated physicians = ", count

def parse_physicians():
    print "YO", sys.argv[1]
    
    page = ""
    with open(sys.argv[1], 'r') as f:
        page = f.read()
        
    entries = parse_entries(page)
    
    print "Total entries", len(entries)
    
    db = get_db()
    collection = db['physicians']
    
    #to check: 1103 - BH
    for i, entry in enumerate(entries):
        for address in entry['addresses']:    
            geocode_json = geocode_address(address)
            address['geocode'] = json.loads(geocode_json)
            
            sleep(1)
            
        collection.insert(entry)        
        print i    
        
def consolidate_cemig_saude_ids():
    db = get_db()
    collection = db['physicians']
    
    count = 0
    for filename in os.listdir(sys.argv[1]):
        page = ""
        with open(sys.argv[1].strip('/') + '/' + filename, 'r') as f:
            page = f.read()     
            
        physicians = parse_entries(page)
        for p in physicians:
            if 'cemig_saude_id' in p:
                count += 1
                db['physicians'].update(
                            {"name": p['name'], "register": p['register']}, 
                            {"$set": {'cemig_saude_id': p['cemig_saude_id']}})
                
    print "Records updated", count

if __name__ == '__main__':
    
    # Fetch ALL
#    fetch_all_physicians()
#    exit(-1)
    
#     consolidate_cemig_saude_ids()
#     fetch_all_missings_specialties()

    update_missing_specialties()
    
# Just a test
#     db = get_db()
#     physicians = db['physicians'].find()
#     all = set()
#     for p in physicians:
#         x = unidecode(p['name']) + " " + unidecode(p.get('register', ''))
#         
#         if x not in all:
#             all.add(x)
#         else:
#             print x
            
            
        
            
    