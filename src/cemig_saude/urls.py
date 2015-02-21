from django.conf import settings
from django.conf.urls import patterns, include, url

# Uncomment the next two lines to enable the admin:
# from django.contrib import admin
# admin.autodiscover()

mobile_patterns = patterns('cemig_saude.mobile.views',
    url(r'^show/(?P<physician>\w+)/', 'view_physician'),
    url(r'^get/distance/', 'get_physicians_by_distance'),
    url(r'^list/distance/(?P<specialty>\w+)/', 'list_physicians_by_distance'),
    url(r'^list/(?P<specialty>\w+)/', 'list_physicians'),
    url(r'^list/', 'view_specialties'),
    url(r'^map/', 'map_search'),
    url(r'^search', 'search'),
    url(r'^admin/reindex', 'reindex_physicians'),
    url(r'^admin/specialties', 'adm_sync_specialties'),
    url(r'^admin/hash', 'adm_missing_hash'),
    url(r'^$', 'home'),
)

api_patterns = patterns('cemig_saude.mobile.api',
    url(r'^api/list/?', 'list_specialties'),
    url(r'^api/physician/(?P<physician>\w+)/?', 'get_physician'),
    url(r'^api/set/favorite/?', 'set_favorite_physician'),
    url(r'^api/get/favorites/?', 'get_favorite_physicians'),
)

urlpatterns = patterns('',
    url(r'^' + settings.SITE_PREFIX.lstrip('/'), include(mobile_patterns)),
    url(r'^' + settings.SITE_PREFIX.lstrip('/'), include(api_patterns)),
)
