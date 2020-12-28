from django.urls import path

from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('qr_template/', views.qr_template, name='qr_template'),
]
