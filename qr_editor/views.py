from django.shortcuts import render
from django.http import JsonResponse


def index(request):
    return render(request, 'qr_editor/index.html')


def get_qr_template(request):
    return JsonResponse({'width': 20, 'height': 20})
