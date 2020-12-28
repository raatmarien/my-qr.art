from django.db import models

from urllib.parse import unquote


def is_allowed_character(c):
    return c in 'abcdefghijklmnopqrstuvwxyz1234567890+*-.:'


def to_from_identifier(s):
    return ''.join(list(
        filter(is_allowed_character,
               s.lower())))


class RedirectItem(models.Model):
    from_identifier = models.CharField(max_length=7000)
    to_url = models.CharField(max_length=1000)
    created_at = models.DateTimeField()
    visits = models.IntegerField(default=0)

    def __str__(self):
        return f'"{self.from_identifier}" --> "{self.to_url}"'

    # Is it smart to change the from_identifier like this?
    def save(self, *args, **kwargs):
        self.from_identifier = to_from_identifier(
            unquote(self.from_identifier))
        super().save(*args, **kwargs)  # Call the "real" save() method.
