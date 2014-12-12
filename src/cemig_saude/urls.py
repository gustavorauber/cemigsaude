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
    url(r'^$', 'home'),
)

urlpatterns = patterns('',
    url(r'^' + settings.SITE_PREFIX.lstrip('/'), include(mobile_patterns)),
)
