from django.contrib.auth import get_user_model
from django.db import models

from .subnet import Subnet

User = get_user_model()


class FavoriteSubnet(models.Model):
    """
    Model for storing user's favorite subnets.
    Creates a many-to-many relationship between users and subnets.
    """

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="favorite_subnets",
        help_text="User who favorited this subnet",
    )
    subnet = models.ForeignKey(
        Subnet,
        on_delete=models.CASCADE,
        related_name="favorited_by",
        help_text="Subnet that was favorited",
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Favorite Subnet"
        verbose_name_plural = "Favorite Subnets"
        unique_together = [["user", "subnet"]]
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.user.username} - {self.subnet.network}"
