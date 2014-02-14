
from cemig_saude.index.search import search_physicians

from cemig_saude.mobile.decorators import render_to_json

from cemig_saude.model.mongo import get_one_physician, get_physicians
from cemig_saude.model.physician import Physician

from django.shortcuts import render_to_response
from django.template import RequestContext

def view_physician(request, *args, **kwargs):
    ctx = {}
    ctx['physician'] = Physician(get_one_physician())
    
    return render_to_response('view_physician.html', ctx,
                              context_instance=RequestContext(request))
    
@render_to_json
def search(request, *args, **kwargs):
    query = request.POST.get('q', '')
    results = search_physicians(specialty=query, n=150)
    physician_ids = list(x['_id'] for x in results)
    
    print len(results)
    
    filter_by = {}
    filter_by['hash'] = {'$in': physician_ids}
    physicians = get_physicians(filter_by=filter_by)     
    physicians_objs = list(Physician(p).to_json() for p in physicians) 
    
    return physicians_objs