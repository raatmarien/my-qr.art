from django.urls import path

from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('qr_template/', views.qr_template, name='qr_template'),
    path('create_qr/', views.create_qr, name='create_qr'),
]
