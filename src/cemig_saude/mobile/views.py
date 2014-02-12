
from cemig_saude.model.mongo import get_one_physician
from cemig_saude.model.physician import Physician

from django.shortcuts import render_to_response
from django.template import RequestContext

def view_physician(request, *args, **kwargs):
    ctx = {}
    ctx['physician'] = Physician(get_one_physician())
    
    print ctx['physician'].get_lat(), ctx['physician'].get_lon() 
    
    return render_to_response('view_physician.html', ctx,
                              context_instance=RequestContext(request))