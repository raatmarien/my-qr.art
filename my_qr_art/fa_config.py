# Workaround suggested by claude
# for fontawesome after django update

from django.apps import AppConfig

class FontAwesomeFreeConfig(AppConfig):
    name = "fontawesome-free"       # the real (hyphenated) package folder
    label = "fontawesome_free"      # valid identifier Django accepts
