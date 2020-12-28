"""
WSGI config for my_qr_art project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/3.1/howto/deployment/wsgi/
"""

import os

# We need to fix a bug in wsgi with utf-8 urls, so we use our custom wsgi
# See https://stackoverflow.com/questions/57754478/django-utf-8-urls
from my_qr_art.custom_wsgi import WSGIHandler
import django

def get_wsgi_application():
    """
    The public interface to Django's WSGI support. Return a WSGI callable.

    Avoids making django.core.handlers.WSGIHandler a public API, in case the
    internal WSGI implementation changes or moves in the future.
    """
    django.setup(set_prefix=False)
    return WSGIHandler()


os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'my_qr_art.settings')

application = get_wsgi_application()
