from django.urls import path

from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('get_qr_template', views.get_qr_template, name='get_qr_template'),
]
