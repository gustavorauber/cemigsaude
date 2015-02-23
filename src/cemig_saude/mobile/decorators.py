# -*- coding: utf-8 -*-
'''
Created on Feb 13, 2014

Module that reunites useful decorators for VIEW methods

:author: Gustavo Rauber
'''

from django.http import HttpResponse
from django.http import Http404

from functools import wraps

try:
    import ujson as json
except Exception, e:
    import json

def render_to_json(f):
    """
    Renders a JSON response with a given returned instance.
    Assumes json.dumps() can handle the result.

    ::

        @render_to_json()
        def a_view(request, arg1, argN):
            ...
            return {'x': range(4)}

    Raises **Http404** if view response is None
    """
    @wraps(f)
    def inner(request, *args, **kwargs):
        result = f(request, *args, **kwargs)
        if result is None:
            raise Http404

        r = HttpResponse(content_type='application/json')
        if result:
            r.__setitem__("Access-Control-Allow-Origin", "*")
            r.write(json.dumps(result))
        else:
            r.write("{}")
        return r
    return inner
