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
from django.shortcuts import HttpResponse, redirect
from django.http import HttpResponseRedirect
from urllib.parse import unquote

from .models import RedirectItem, to_from_identifier
import re


def redirect_action(request):
    # Raw request line as the client sent it, before any decoding
    raw = request.META.get("REQUEST_URI") or request.get_full_path()
    path = raw.split("?", 1)[0][3:-3]            # cut off the query string and "/R/" and the last three chars
    path = re.sub(r"%20", "", path, flags=re.I)  # encoded spaces were stripped before
    path = unquote(path)                        # %93 etc. decoded once

    from_identifier = to_from_identifier(path)
    matches = RedirectItem.objects.filter(from_identifier=from_identifier)
    if matches.count() > 0:
        m = matches.first()
        m.visits += 1
        m.save()
        return redirect(matches.first().to_url)
    else:
        return HttpResponse(
            f'Redirect url not found:</br>{from_identifier}')
