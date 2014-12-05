# -*- coding: utf-8 -*-
import os
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "cemig_saude.production")

# New Relic Monitoring
# import newrelic.agent
# newrelic.agent.initialize('/catho/aggregator/current/newrelic.ini')

from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()

# New Relic Monitoring
# application = newrelic.agent.wsgi_application()(application)

#import djcelery
#djcelery.setup_loader()
