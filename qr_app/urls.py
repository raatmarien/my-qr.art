# My-QR.Art - A web app to design QR codes for your URL.
# Copyright (C) 2021 Marien Raat - mail@marienraat.nl

# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU Affero General Public License as
# published by the Free Software Foundation, either version 3 of the
# License, or (at your option) any later version.

# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.

# You should have received a copy of the GNU Affero General Public License
# along with this program.  If not, see <https://www.gnu.org/licenses/>.
from django.urls import path

from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('copyright/', views.copyright, name='copyright'),
    path('your-qr-image/<str:qr_secret>',
         views.get_qr_from_secret,
         name='get_qr_from_secret'),
    path('your-qr-image-svg/<str:qr_secret>',
         views.get_qr_from_secret_svg,
         name='get_qr_from_secret_svg'),
    path('your-qr-image-eps/<str:qr_secret>',
         views.get_qr_from_secret_eps,
         name='get_qr_from_secret_eps'),
    path('your-qr/<str:qr_secret>', views.get_your_qr_page, name='get_your_qr_page'),
    path('create_qr_arr/', views.create_qr_from_array, name='create_qr_from_array'),
]
