"""
IP Note serializers for IPAM.
"""

from rest_framework import serializers

from ..models import IPNote, IPNoteAttachment, IPNoteComment


class IPNoteAttachmentSerializer(serializers.ModelSerializer):
    """Serializer for IPNoteAttachment model."""

    uploaded_by_username = serializers.CharField(source="uploaded_by.username", read_only=True)

    class Meta:
        model = IPNoteAttachment
        fields = [
            "id",
            "note",
            "file",
            "filename",
            "file_size",
            "content_type",
            "uploaded_by",
            "uploaded_by_username",
            "uploaded_at",
        ]
        read_only_fields = [
            "id",
            "uploaded_by",
            "uploaded_at",
            "file_size",
        ]


class IPNoteCommentSerializer(serializers.ModelSerializer):
    """Serializer for IPNoteComment model."""

    author_username = serializers.CharField(source="author.username", read_only=True)
    author_full_name = serializers.SerializerMethodField()

    def get_author_full_name(self, obj):
        """Return author's full name."""
        if obj.author:
            return obj.author.get_full_name() or obj.author.username
        return "Unknown"

    class Meta:
        model = IPNoteComment
        fields = [
            "id",
            "note",
            "content",
            "author",
            "author_username",
            "author_full_name",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "author",
            "created_at",
            "updated_at",
        ]


class IPNoteSerializer(serializers.ModelSerializer):
    """Serializer for IPNote model."""

    created_by_username = serializers.CharField(source="created_by.username", read_only=True)
    updated_by_username = serializers.CharField(source="updated_by.username", read_only=True)
    created_by_full_name = serializers.SerializerMethodField()
    updated_by_full_name = serializers.SerializerMethodField()
    attachments = IPNoteAttachmentSerializer(many=True, read_only=True)
    comments = IPNoteCommentSerializer(many=True, read_only=True)
    comments_count = serializers.SerializerMethodField()
    versions_count = serializers.SerializerMethodField()

    def get_created_by_full_name(self, obj):
        """Return creator's full name."""
        if obj.created_by:
            return obj.created_by.get_full_name() or obj.created_by.username
        return "Unknown"

    def get_updated_by_full_name(self, obj):
        """Return updater's full name."""
        if obj.updated_by:
            return obj.updated_by.get_full_name() or obj.updated_by.username
        return "Unknown"

    def get_comments_count(self, obj):
        """Return number of comments."""
        return obj.comments.count()

    def get_versions_count(self, obj):
        """Return number of versions."""
        if obj.parent_note:
            return obj.parent_note.versions.count() + 1
        return obj.versions.count() + 1

    class Meta:
        model = IPNote
        fields = [
            "id",
            "ip_address",
            "title",
            "content",
            "is_public",
            "is_pinned",
            "created_by",
            "created_by_username",
            "created_by_full_name",
            "updated_by",
            "updated_by_username",
            "updated_by_full_name",
            "version",
            "parent_note",
            "attachments",
            "comments",
            "comments_count",
            "versions_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "created_by",
            "updated_by",
            "version",
            "parent_note",
            "created_at",
            "updated_at",
        ]


class IPNoteCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating and updating IPNote."""

    class Meta:
        model = IPNote
        fields = [
            "ip_address",
            "title",
            "content",
            "is_public",
            "is_pinned",
        ]

    def create(self, validated_data):
        """Create a new note and set the creator."""
        validated_data["created_by"] = self.context["request"].user
        validated_data["updated_by"] = self.context["request"].user
        return super().create(validated_data)

    def update(self, instance, validated_data):
        """Update note and create a new version if content changed."""
        user = self.context["request"].user

        # Check if content changed
        if "content" in validated_data and validated_data["content"] != instance.content:
            # Create new version
            new_version = instance.create_version(
                user=user,
                new_content=validated_data["content"],
                new_title=validated_data.get("title", instance.title),
            )
            # Update the new version with other fields
            for key, value in validated_data.items():
                if key != "content":
                    setattr(new_version, key, value)
            new_version.save()
            return new_version

        # Update current version
        validated_data["updated_by"] = user
        return super().update(instance, validated_data)
