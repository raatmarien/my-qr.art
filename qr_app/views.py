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

from django.shortcuts import HttpResponse, render
from django.http import JsonResponse
from django.core.validators import URLValidator
from django.core.exceptions import ValidationError
from django.urls import reverse
import qr_app.pyqrcode as pyqrcode
import tempfile
import datetime
import json
import base64
import secrets

import qr_app.qrmap as qrmap
from .forms import CreateQRForm

from redirect.models import RedirectItem, to_from_identifier


def index(request):
    return render(request, 'qr_app/index.html', {})


def pro_mode(request):
    context = {}
    return render(request, 'qr_app/pro-mode.html', context)


def qr_template(request):
    if 'version' not in request.GET:
        return HttpResponse('Include a version')
    try:
        version = int(request.GET['version'])
    except ValueError:
        return HttpResponse('version should be an integer')
    if version < 1 or version > 40:
        return HttpResponse('version should be between 1 and 40')

    qr_map = qrmap.get_qr_map(version, 'alphanumeric', 'L', 'https://my-qr.art/r/')
    filename = '/tmp/' + next(tempfile._get_candidate_names()) + '.png'
    qr_map.save(filename)

    try:
        with open(filename, "rb") as f:
            return HttpResponse(f.read(), content_type="image/png")
    except IOError:
        return HttpResponse(f'Error creating QR template')


def copyright(request):
    return render(request, 'qr_app/copyright.html', {});

def get_temp_name():
    return '/tmp/' + next(tempfile._get_candidate_names()) + '.png'


def save_file(f):
    filename = get_temp_name()
    with open(filename, 'wb+') as destination:
        for chunk in f.chunks():
            destination.write(chunk)
    return filename


def add_qr_redirect(qr, url):
    index = qr.data.index(b'/R/')
    ident = qr.data[index+3:-3]
    from_identifier = ident.decode('UTF-8')
    from_identifier_search = to_from_identifier(from_identifier)
    pre_existing = RedirectItem.objects.filter(
        from_identifier=from_identifier_search)
    if pre_existing.count() > 0:
        return False

    qr_secret = secrets.token_hex(10)

    r = RedirectItem.objects.create(
        qr_data_utf8=qr.data.decode('UTF-8'),
        from_identifier=from_identifier, to_url=url,
        created_at=datetime.datetime.now(),
        secret=qr_secret)
    r.save()

    return qr_secret


def create_qr_from_array(request):
    if request.method == 'POST':
        url = request.POST['qrurl']

        try:
            URLValidator()(url)
        except ValidationError:
            return JsonResponse({
                "success": False,
                "error": "Specify a correct URL. Make sure that your\
                URL starts with 'https://' or 'http://'.",
                })

        design = qrmap.QrMap.from_array(json.loads(request.POST['qrdesign']))
        qr = qrmap.create_qr_from_map(
            design, 'HTTPS://MY-QR.ART/R', 'alphanumeric', 'L')

        qr_secret = add_qr_redirect(qr, url)
        if qr_secret == False:
            return JsonResponse({
                "success": False,
                "error": "This QR code already exists. Change a few\
                pixels or try a different size",
                })


        return JsonResponse({
            "success": True,
            "qr_page": reverse('get_your_qr_page', args=[qr_secret]),
        })
    else:
        return HttpResponse('Only accessible as POST')


def get_your_qr_page(request, qr_secret):
    return render(request, 'qr_app/your-qr-page.html', context={
        'qrImage': reverse('get_qr_from_secret', args=[qr_secret]),
        })


def get_qr_from_secret(request, qr_secret):
    ri = RedirectItem.objects.filter(secret=qr_secret)
    if ri.count() > 0:
        qr_data_utf8 = ri.first().qr_data_utf8
        qr = pyqrcode.create(
            qr_data_utf8, mode='alphanumeric',
            error='L', encoding='UTF-8')
        
        qrfile = get_temp_name()
        qr.png(qrfile, scale=5)

        with open(qrfile, "rb") as f:
            return HttpResponse(f.read(), content_type="image/png")


def create_qr(request):
    if request.method == 'POST':
        form = CreateQRForm(request.POST, request.FILES)
        if True:#form.is_valid():
            qrdesign = request.FILES.get('qrdesign', None)
            filename = save_file(qrdesign)
            qr = qrmap.create_qr_from_design(
                filename, 'HTTPS://MY-QR.ART/R', 'alphanumeric', 'L')

            qrfile = get_temp_name()
            qr.png(qrfile, scale=5)

            add_qr_redirect(qr, request.POST['qrurl'])

            with open(qrfile, "rb") as f:
                return HttpResponse(f.read(), content_type="image/png")
        else:
            return HttpResponse('Form invalid')
    else:
        return HttpResponse('Only accessible as POST')
