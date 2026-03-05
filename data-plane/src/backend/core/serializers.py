"""
Shared serializer base classes to avoid duplicating common field definitions (DRY).
"""

from rest_framework import serializers


class NameOnlyModelSerializer(serializers.ModelSerializer):
    """
    Base for simple models with id, name, created_at, updated_at.
    Use for Department, Category, and similar name-only list resources.
    """

    class Meta:
        fields = ["id", "name", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]
