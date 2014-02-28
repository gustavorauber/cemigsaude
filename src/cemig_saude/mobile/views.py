
from cemig_saude.index.search import search_physicians

from cemig_saude.mobile.decorators import render_to_json

from cemig_saude.model.mongo import get_one_physician, get_physicians, \
    get_specialties, sync_specialties, sync_cities, update_physicians_phones, \
    update_physicians_missing_hash, remove_duplicates, update_geocode, \
    merge_addresses
from cemig_saude.model.physician import Physician

from django.shortcuts import render_to_response
from django.template import RequestContext

def home(request, *args, **kwargs):
    ctx = {}
    return render_to_response('index.html', ctx,
                              context_instance=RequestContext(request))

def view_physician(request, *args, **kwargs):
    ctx = {}
    hash = kwargs.get('physician', '')
    ctx['physician'] = Physician(get_one_physician(filter_by={'hash': hash}))
    
    return render_to_response('view_physician.html', ctx,
                              context_instance=RequestContext(request))

def view_specialties(request, *args, **kwargs):
    ctx = {}
    ctx['specialties'] = get_specialties()
    
#     update_physicians_missing_hash()
#     update_physicians_phones()
#     sync_cities()
#     sync_specialties()

#     remove_duplicates()
#     update_geocode()
    
#     merge_addresses()
    
    return render_to_response('list_specialties.html', ctx,
                              context_instance=RequestContext(request))
    
def list_physicians(request, *args, **kwargs):
    ctx = {}    
    hash = kwargs.get('specialty', '')    
    
    ctx['physicians'] = get_physicians(filter_by={'specialty_hash': hash},
                                       sort_by='name', sort_order=1)    
    
    return render_to_response('list_physicians.html', ctx,
                              context_instance=RequestContext(request))
    
def map_search(request, *args, **kwargs):    
    ctx = {}
    return render_to_response('map_search.html', ctx,
                              context_instance=RequestContext(request))
    
@render_to_json
def search(request, *args, **kwargs):
    query = request.POST.get('q', '')
    distance = request.POST.get('d', '5')
    lat = request.POST.get('lat', '5')
    lon = request.POST.get('lon', '5')
    
    if not query:
        return []
    
    results = search_physicians(query=query, n=150, distance=distance,
                                lat=lat, lon=lon)
    physician_ids = list(x['_id'] for x in results)
    
    filter_by = {}
    filter_by['hash'] = {'$in': physician_ids}
    physicians = get_physicians(filter_by=filter_by)     
    physicians_objs = list(Physician(p).to_json() for p in physicians) 
    
    return physicians_objs
