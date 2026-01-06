from rest_framework import serializers

from ..models import SubnetGroup


class SubnetGroupSerializer(serializers.ModelSerializer):
    """Serializer for SubnetGroup."""

    class Meta:
        model = SubnetGroup
        fields = [
            "id",
            "name",
            "description",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
