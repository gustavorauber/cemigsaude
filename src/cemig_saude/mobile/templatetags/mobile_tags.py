# -*- coding: utf-8 -*-
'''
Created on Feb 19, 2014

:author: Gustavo Rauber
'''

from django.template import Library

register = Library()

@register.filter
def is_instance_of(var, var_type):
    """
    Template tag to check if a variable is an instance of an arbitrary
    type.
    
    :param var: a variable
    :param string var_type: variable type to perfom the check
    :rtype: bool 
    """
    return isinstance(var, eval(var_type))