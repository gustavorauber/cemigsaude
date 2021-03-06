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
from cemig_saude.model.mongo import get_specialties, get_one_physician, \
    add_favorite, remove_favorite, get_favorites, get_physicians
from cemig_saude.model.physician import Physician

from distutils.util import strtobool

from logging import getLogger

log = getLogger(__name__)

@render_to_json
def list_specialties(request):
    return get_specialties()

@render_to_json
def get_physician(request, *args, **kwargs):
    hash = kwargs.get('physician', '')
    user = request.POST.get('user', '')

    physician = get_one_physician(filter_by={'hash': hash})

    # @TODO: Enhance this
    if user and hash in get_favorites(filter_by={'_id': user}):
        physician['favorite'] = True

    return physician

@render_to_json
def get_favorite_physicians(request, *args, **kwargs):
    user = request.POST.get('user', '')

    log.info('Get Favorites request - User [%s]', user)

    favorites = get_favorites(filter_by={'_id': user})

    try:
        if len(favorites) > 0:
            filter_by = {}
            filter_by['hash'] = {'$in': favorites}
            physicians = get_physicians(filter_by=filter_by)
            physicians_objs = list(Physician(p).to_json() for p in physicians)

            return physicians
    except Exception, e:
        log.exception('get_favorite_physicians [%s] %s', user, e)

    return []

@render_to_json
def set_favorite_physician(request, *args, **kwargs):
    user = request.POST.get('user', '')
    hash = request.POST.get('physician', '').rstrip('#')
    like = strtobool(request.POST.get('like', '1'))

    try:
        if like:
            add_favorite(user, hash)
        else:
            remove_favorite(user, hash)

        return True
    except Exception, e:
        log.exception('set_favorite_physician [%s %s %s] %s', user, hash, like,
                                                                            e)

    return False
