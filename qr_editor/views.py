from django.shortcuts import render
from django.http import JsonResponse
import qr_app.qrmap as qrmap


def index(request):
    return render(request, 'qr_editor/index.html')


def get_qr_template(request):
    qr = qrmap.get_qr_map(int(request.POST['version']), "alphanumeric", 'L')
    return JsonResponse(qr.to_json_rep())
