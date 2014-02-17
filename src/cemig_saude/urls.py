from django.conf.urls import patterns, include, url

# Uncomment the next two lines to enable the admin:
# from django.contrib import admin
# admin.autodiscover()

urlpatterns = patterns('',
    # Examples:
    # url(r'^$', 'cemig_saude.views.home', name='home'),
    # url(r'^cemig_saude/', include('cemig_saude.foo.urls')),

    # Uncomment the admin/doc line below to enable admin documentation:
    # url(r'^admin/doc/', include('django.contrib.admindocs.urls')),

    # Uncomment the next line to enable the admin:
    # url(r'^admin/', include(admin.site.urls)),
    
    url(r'^show/(?P<physician>\w+)/', 'cemig_saude.mobile.views.view_physician'),
    url(r'^list/(?P<specialty>\w+)/', 'cemig_saude.mobile.views.list_physicians'),
    url(r'^list/', 'cemig_saude.mobile.views.view_specialties'),
    url(r'^map/', 'cemig_saude.mobile.views.map_search'),
    url(r'^search', 'cemig_saude.mobile.views.search'),
    url(r'^$', 'cemig_saude.mobile.views.home'),
)
