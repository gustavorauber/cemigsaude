#-------------------------------------------------------------------------------
# Name:        api
# Purpose:
#
# Author:      c057384
#
# Created:     28/01/2015
# Copyright:   (c) c057384 2015
# Licence:     <your licence>
#-------------------------------------------------------------------------------

from cemig_saude.mobile.decorators import render_to_json
from cemig_saude.model.mongo import get_specialties

@render_to_json
def list_specialties(request):
    return get_specialties()