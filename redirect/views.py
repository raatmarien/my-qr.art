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


def redirect_action(request):
    # 3 to cut off the /R/
    path = unquote(request.get_full_path())[3:]
    # Apache makes this /r/ at the end replacing the last 3 characters
    # for some reason. So we cut off the last three characters. We
    # need to do the same when saving urls
    path = path[:-3]

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
