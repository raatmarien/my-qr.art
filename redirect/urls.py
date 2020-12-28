from django.urls import re_path

from . import views

urlpatterns = [
    re_path('.*', views.redirect_action, name='redirect_action'),
]
