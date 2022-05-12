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
from django.db import models

from urllib.parse import unquote


def is_allowed_character(c):
    return c in 'abcdefghijklmnopqrstuvwxyz1234567890+*-.:'


def to_from_identifier(s):
    return ''.join(list(
        filter(is_allowed_character,
               s.lower())))


class RedirectItem(models.Model):
    qr_data_utf8 = models.CharField(max_length=7000)
    secret = models.CharField(max_length=10)
    from_identifier = models.CharField(max_length=7000)
    to_url = models.CharField(max_length=1000)
    created_at = models.DateTimeField()
    visits = models.IntegerField(default=0)
    errorCorrectionLevel = models.CharField(max_length=1, default='L')

    def __str__(self):
        return f'"{self.from_identifier[:100]}" --> "{self.to_url}"'

    # Is it smart to change the from_identifier like this?
    def save(self, *args, **kwargs):
        self.from_identifier = to_from_identifier(
            unquote(self.from_identifier))
        super().save(*args, **kwargs)  # Call the "real" save() method.
