from django import forms


class CreateQRForm(forms.Form):
    qrurl = forms.CharField(max_length=200)
    qrdesign = forms.FileField()
