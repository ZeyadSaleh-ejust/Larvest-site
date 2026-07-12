from django.db import models


class WindyAccessLog(models.Model):
    """Simple IP-based rate limiter for Windy API access (2 per day)."""
    ip_address = models.GenericIPAddressField()
    accessed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'windy_access_log'

    def __str__(self):
        return f"{self.ip_address} - {self.accessed_at}"
