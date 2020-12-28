from django.shortcuts import HttpResponse, redirect
from django.http import HttpResponseRedirect
from urllib.parse import unquote

from .models import RedirectItem, to_from_identifier


def redirect_action(request):
    path = unquote(request.get_full_path())[3:]
    from_identifier = to_from_identifier(path)
    matches = RedirectItem.objects.filter(from_identifier=from_identifier)
    if matches.count() > 0:
        return redirect(matches.first().to_url)
    else:
        return HttpResponse(
            f'Redirect url not found:</br>{from_identifier}')
