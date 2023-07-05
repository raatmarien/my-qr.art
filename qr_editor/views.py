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
from django.shortcuts import render
from django.http import JsonResponse
import qr_app.qrmap as qrmap


def index(request):
    return render(request, 'qr_editor/index.html')


def get_qr_template(request):
    error = 'L'
    if 'errorCorrectionLevel' in request.POST:
        error = request.POST['errorCorrectionLevel']

    urlPrefix = 'HTTPS://MY-QR.ART/R'
    if 'customUrlPrefix' in request.POST:
        urlPrefix = request.POST['customUrlPrefix'].upper()
    

    template = qrmap.get_qr_map_with_hints(
        int(request.POST['version']),
        "alphanumeric", error, urlPrefix)
    return JsonResponse(template.to_json_rep())
