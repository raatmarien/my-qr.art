# Patch suggested by Claude 2026-10-21
# Keep the UTF-8 URL handling from the old custom handler
# See https://stackoverflow.com/questions/57754478/django-utf-8-urls
from django.core.handlers import wsgi as django_wsgi


def get_bytes_from_wsgi(environ, key, default):
    value = environ.get(key, default)
    return value.encode('utf8')


# Django's get_path_info/get_script_name/get_str_from_wsgi look this up at call time
# django_wsgi.get_bytes_from_wsgi = get_bytes_from_wsgi

WSGIHandler = django_wsgi.WSGIHandler
