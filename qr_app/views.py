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

from qrcodegen import QrCode, QrSegment
import segno


import qr_app.qrmap as qrmap
from .forms import CreateQRForm

from redirect.models import RedirectItem, to_from_identifier


def index(request):
    return render(request, 'qr_app/index.html', {})


def copyright(request):
    return render(request, 'qr_app/copyright.html', {});

def get_temp_name(extension='.png'):
    return '/tmp/' + next(tempfile._get_candidate_names()) + extension


def save_file(f):
    filename = get_temp_name()
    with open(filename, 'wb+') as destination:
        for chunk in f.chunks():
            destination.write(chunk)
    return filename


def add_qr_redirect(numbers, mistake_bit_numbers, url, prefix, error, version):
    pre_existing = RedirectItem.objects.filter(
        qr_data_utf8=numbers)
    if pre_existing.count() > 0:
        return False

    qr_secret = secrets.token_hex(10)

    r = RedirectItem.objects.create(
        qr_data_utf8=prefix + numbers,
        from_identifier=numbers, to_url=url,
        mistakes=json.dumps(mistake_bit_numbers),
        created_at=datetime.datetime.now(),
        internal_item_version=1, version=version,
        secret=qr_secret, errorCorrectionLevel=error)
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

        error = 'L'
        # if 'errorCorrectionLevel' in request.POST:
        #     error = request.POST['errorCorrectionLevel']

        urlPrefix = 'https://my-qr.art/r/'
        if 'customUrlPrefix' in request.POST:
            urlPrefix = request.POST['customUrlPrefix'] + '/'

        (qr, numbers, mistake_bit_numbers) = qrmap.create_qr_from_map(
            design, urlPrefix)

        qr_secret = add_qr_redirect(numbers, mistake_bit_numbers, url,
                                    urlPrefix, error, qr.version)
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
    ri = get_ri_from_secret(qr_secret)
    if ri is not None:
        return render(request, 'qr_app/your-qr-page.html', context={
            'qr_image': reverse('get_qr_from_secret', args=[qr_secret]),
            'qr_image_svg': reverse('get_qr_from_secret_svg', args=[qr_secret]),
            'qr_image_eps': reverse('get_qr_from_secret_eps', args=[qr_secret]),
            'qr_url': ri.to_url,
        })
    else:
        return HttpResponseNotFound('<h1>QR code not found</h1>')


def get_ri_from_secret(qr_secret):
    ri = RedirectItem.objects.filter(secret=qr_secret)
    if ri.count() > 0:
        return ri.first()
    else:
        return None


def get_qr_from_secret(request, qr_secret):
    ri = get_ri_from_secret(qr_secret)
    if ri is not None:
        if ri.internal_item_version == 0:
            qr_data_utf8 = ri.qr_data_utf8
            qr = pyqrcode.create(
                qr_data_utf8, mode='alphanumeric',
                error=ri.errorCorrectionLevel, encoding='UTF-8')
        
            qrfile = get_temp_name()
            qr.png(qrfile, scale=5)

            with open(qrfile, "rb") as f:
                return HttpResponse(f.read(), content_type="image/png")

        else:
            data = ri.qr_data_utf8
            index = data.rfind('/')
            url = data[:(index+1)]
            numbers = data[(index+1):]
            qrsegments = [
                QrSegment.make_bytes(url.encode('UTF-8')),
                QrSegment.make_numeric(numbers)
            ]
            print(url)
            print(numbers)

            qr = QrCode.encode_segments(
                qrsegments,
                QrCode.Ecc.LOW,
                boostecl=False,
                minversion=ri.version,
                maxversion=ri.version,
                mask=1)
            fixed = qrmap.fix_mistakes(qr, json.loads(ri.mistakes),
                ri.version, url)

            qrfile = get_temp_name()
            fixed.save(qrfile, scale=5)
            
            with open(qrfile, "rb") as f:
                return HttpResponse(f.read(), content_type="image/png")
    else:
        return HttpResponseNotFound('<h1>QR code not found</h1>')


def get_qr_from_secret_svg(request, qr_secret):
    ri = get_ri_from_secret(qr_secret)
    if ri is not None:
        qr_data_utf8 = ri.qr_data_utf8
        qr = pyqrcode.create(
            qr_data_utf8, mode='alphanumeric',
            error=ri.errorCorrectionLevel, encoding='UTF-8')
        
        qrfile = get_temp_name('.svg')
        qr.svg(qrfile, scale=5)

        with open(qrfile, "rb") as f:
            return HttpResponse(f.read(), content_type="image/svg+xml")
    else:
        return HttpResponseNotFound('<h1>QR code not found</h1>')


def get_qr_from_secret_eps(request, qr_secret):
    ri = get_ri_from_secret(qr_secret)
    if ri is not None:
        qr_data_utf8 = ri.qr_data_utf8
        qr = pyqrcode.create(
            qr_data_utf8, mode='alphanumeric',
            error=ri.errorCorrectionLevel, encoding='UTF-8')
        
        qrfile = get_temp_name('.eps')
        qr.eps(qrfile, scale=5)

        with open(qrfile, "rb") as f:
            return HttpResponse(f.read(), content_type="image/eps")
    else:
        return HttpResponseNotFound('<h1>QR code not found</h1>')
