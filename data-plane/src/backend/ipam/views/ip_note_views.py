"""
IP Note ViewSets for IPAM.
"""

from django.db import models
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser

from ..models import IPNote, IPNoteAttachment, IPNoteComment
from ..serializers import (
    IPNoteSerializer,
    IPNoteCreateUpdateSerializer,
    IPNoteAttachmentSerializer,
    IPNoteCommentSerializer,
)


class IPNoteViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing IP notes.
    
    Provides CRUD operations for IP address notes with versioning.
    """

    queryset = IPNote.objects.select_related(
        "ip_address", "created_by", "updated_by"
    ).prefetch_related("attachments", "comments").all()
    serializer_class = IPNoteSerializer

    def get_serializer_class(self):
        """Use create/update serializer for POST/PUT/PATCH requests."""
        if self.action in ["create", "update", "partial_update"]:
            return IPNoteCreateUpdateSerializer
        return IPNoteSerializer

    def get_queryset(self):
        """Filter notes by IP address and visibility."""
        queryset = super().get_queryset()

        # Filter by IP address
        ip_address_id = self.request.query_params.get("ip_address")
        if ip_address_id:
            queryset = queryset.filter(ip_address_id=ip_address_id)

        # Filter by author
        created_by = self.request.query_params.get("created_by")
        if created_by:
            queryset = queryset.filter(created_by_id=created_by)

        # Filter by pinned status
        is_pinned = self.request.query_params.get("is_pinned")
        if is_pinned is not None:
            queryset = queryset.filter(is_pinned=is_pinned.lower() == "true")

        # Filter by public/private
        is_public = self.request.query_params.get("is_public")
        if is_public is not None:
            queryset = queryset.filter(is_public=is_public.lower() == "true")
        else:
            # By default, show public notes and user's own private notes
            if self.request.user.is_authenticated:
                queryset = queryset.filter(
                    models.Q(is_public=True) | models.Q(created_by=self.request.user)
                )

        return queryset

    @action(detail=True, methods=["get"], url_path="versions")
    def versions(self, request, pk=None):
        """Get all versions of a note."""
        note = self.get_object()
        
        # Get parent note
        parent = note.parent_note or note
        
        # Get all versions
        versions = IPNote.objects.filter(
            models.Q(id=parent.id) | models.Q(parent_note=parent)
        ).order_by("version")

        serializer = IPNoteSerializer(versions, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=True, methods=["post"], url_path="pin")
    def pin(self, request, pk=None):
        """Pin or unpin a note."""
        note = self.get_object()
        note.is_pinned = not note.is_pinned
        note.updated_by = request.user
        note.save()
        
        serializer = IPNoteSerializer(note)
        return Response(serializer.data, status=status.HTTP_200_OK)


class IPNoteAttachmentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing IP note attachments.
    """

    queryset = IPNoteAttachment.objects.select_related("note", "uploaded_by").all()
    serializer_class = IPNoteAttachmentSerializer
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        """Filter attachments by note."""
        queryset = super().get_queryset()

        note_id = self.request.query_params.get("note")
        if note_id:
            queryset = queryset.filter(note_id=note_id)

        return queryset

    def perform_create(self, serializer):
        """Set the user who uploaded the attachment."""
        file = self.request.FILES.get("file")
        if file:
            serializer.save(
                uploaded_by=self.request.user,
                filename=file.name,
                file_size=file.size,
                content_type=file.content_type,
            )


class IPNoteCommentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing IP note comments.
    """

    queryset = IPNoteComment.objects.select_related("note", "author").all()
    serializer_class = IPNoteCommentSerializer

    def get_queryset(self):
        """Filter comments by note."""
        queryset = super().get_queryset()

        note_id = self.request.query_params.get("note")
        if note_id:
            queryset = queryset.filter(note_id=note_id)

        return queryset.order_by("created_at")

    def perform_create(self, serializer):
        """Set the author when creating a comment."""
        serializer.save(author=self.request.user)
