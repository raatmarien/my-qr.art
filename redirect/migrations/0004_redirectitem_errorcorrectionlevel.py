# Generated by Django 3.1.8 on 2022-05-12 17:30

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('redirect', '0003_auto_20210105_1749'),
    ]

    operations = [
        migrations.AddField(
            model_name='redirectitem',
            name='errorCorrectionLevel',
            field=models.CharField(default='L', max_length=1),
        ),
    ]
