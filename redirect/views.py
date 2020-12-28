from django.shortcuts import HttpResponse


# Create your views here.
def redirect(request):
    return HttpResponse(
        f'Hello redirect url {request.get_full_path()}')
