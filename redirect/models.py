from django.db import models


class RedirectItem(models.Model):
    from_identifier = models.CharField(max_length=7000)
    to_url = models.CharField(max_length=1000)
    created_at = models.DateTimeField()

    def __str__(self):
        return f'From "{self.from_identifier}" to "{self.to_url}"'
