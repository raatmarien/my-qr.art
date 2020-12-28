from django.shortcuts import HttpResponse, render
import qr_app.qrmap as qrmap
import tempfile


# Create your views here.
def index(request):
    context = {}
    return render(request, 'qr_app/index.html', context)


def qr_template(request):
    if 'version' not in request.GET:
        return HttpResponse('Include a version')
    try:
        version = int(request.GET['version'])
    except ValueError:
        return HttpResponse('version should be an integer')
    if version < 1 or version > 40:
        return HttpResponse('version should be between 1 and 40')

    qr_map = qrmap.get_qr_map(version, 'alphanumeric', 'L')
    filename = '/tmp/' + next(tempfile._get_candidate_names()) + '.png'
    qr_map.save(filename)

    try:
        with open(filename, "rb") as f:
            return HttpResponse(f.read(), content_type="image/png")
    except IOError:
        return HttpResponse(f'Error creating QR template')
