from django.db import models


class SubnetGroup(models.Model):
    """
    Subnet Group model for organizing subnets into logical groups.
    """

    name = models.CharField(max_length=255, unique=True)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Subnet Group"
        verbose_name_plural = "Subnet Groups"
        ordering = ["name"]

    def __str__(self):
        return self.name
