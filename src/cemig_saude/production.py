# -*- coding: utf-8 -*-
'''
Created on 05/12/2014

@author: c057384
'''

from settings import *

ALLOWED_HOSTS = ['fb.cemig.com.br', '200.150.7.91', '192.168.7.80']

DEBUG = False
TEMPLATE_DEBUG = False

SITE_PREFIX = '/saude/'

LOGGING = {
    'version': 1,
    'disable_existing_loggers': True,
    'formatters': {
        'verbose': {
            'format': '[%(asctime)s][%(levelname)s][%(module)s] - %(process)d - %(message)s'
        },
        'simple': {
            'format': '%(levelname)s %(message)s'
        },
    },
    'handlers': {
        'mail_admins': {
            'level': 'ERROR',
            'class': 'django.utils.log.AdminEmailHandler'
        },
        'console': {
            'level':'INFO',
            'class':'logging.StreamHandler'
        },
        'file': {
            'level':'DEBUG',
            'class':'logging.FileHandler',
            'filename': '/cemig/saude/logs/cemigsaude.log',
            'formatter': 'verbose'
        }
    },
    'loggers': {
        'django': {
            'handlers': ['file'],
            'level': 'WARNING',
            'propagate': True
        },
        'django.request': {
            'handlers': ['file'],
            'level': 'ERROR',
            'propagate': True
        },
        'django.db.backends': {
            'handlers': ['file'],
            'level': 'WARNING',
            'propagate': True
        },
        'elasticsearch': {
            'handlers': ['file'],
            'level': 'WARNING',
            'propagate': True
        },
        'cemig_saude': {
            'handlers': ['file'],
            'level': 'INFO',
            'propagate': True
        }
    }
}

print u"Configuracao de producao carregada..."
