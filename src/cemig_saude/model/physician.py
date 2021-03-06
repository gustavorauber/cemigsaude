
from copy import deepcopy

class Physician():
    
    def __init__(self, json):
        self.json = json
        self.id = None
        self.name = None
        self.specialty = None
        self.email = None
        self.register = None
        self.addresses = []
    
    def get_id(self):
        if self.id is None:
            self.id = str(self.json['id'])        
        
        return self.id
        
    def get_name(self):
        if self.name is None:
            self.name = self.json['name']
        
        return self.name
    
    def get_specialty(self):
        if self.specialty is None:
            self.specialty = self.json['specialty']
        
        return self.specialty
    
    def __parse_address(self):
        if 'addresses' in self.json:
            addresses = self.json['addresses']
            
            if len(addresses) > 0:
                for address in addresses:                
                    addr = {'state': '', 'city': address['city'],
                            'neighborhood': address['neighborhood'],
                            'street': address['street'],
                            'phone': address['phones']}
                    
                    idx = address['city'].rfind('-')
                    if idx != -1:
                        addr['city'] = address['city'][:idx].strip()
                        addr['state'] = address['city'][idx + 1:].strip()
                    
                    if 'geocode' in address and address['geocode']['status'] == "OK":
                        results = address['geocode']['results']
                        if len(results) > 0:
                            result = results[0]                
                            location = result['geometry']['location']                 
                            addr['lat'] = location['lat']
                            addr['lon'] = location['lng']
                            
                    
                    self.addresses.append(addr)    
    
    def get_register(self):
        if self.register is None:
            self.register = self.json['register']
            
        return self.register

    def get_email(self):
        if self.email is None:
            self.email = self.json['email']
            
        return self.email
    
    def get_addresses(self):
        if len(self.addresses) == 0:
            self.__parse_address()
            
        return self.addresses
        
    def to_json(self):
        return self.json
        