"""
IP Address Note Models for IPAM.

Models for rich text notes and comments on IP addresses with history/versioning.
"""

from django.contrib.auth import get_user_model
from django.db import models

from .ip_address import IPAddress

User = get_user_model()


class IPNote(models.Model):
    """
    Model for IP address notes.
    
    Supports rich text notes with versioning and attachments.
    """

    ip_address = models.ForeignKey(
        IPAddress,
        on_delete=models.CASCADE,
        related_name="notes",
        help_text="IP address this note belongs to",
    )
    title = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Note title (optional)",
    )
    content = models.TextField(
        help_text="Note content (supports markdown/HTML)",
    )
    is_public = models.BooleanField(
        default=True,
        help_text="Whether the note is visible to all users",
    )
    is_pinned = models.BooleanField(
        default=False,
        help_text="Whether the note is pinned to the top",
    )
    
    # Author information
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_ip_notes",
        help_text="User who created this note",
    )
    updated_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="updated_ip_notes",
        help_text="User who last updated this note",
    )
    
    # Version tracking
    version = models.IntegerField(
        default=1,
        help_text="Note version number",
    )
    parent_note = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="versions",
        help_text="Parent note (for versioning)",
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "IP Note"
        verbose_name_plural = "IP Notes"
        ordering = ["-is_pinned", "-created_at"]
        indexes = [
            models.Index(fields=["ip_address", "-created_at"]),
            models.Index(fields=["ip_address", "-is_pinned"]),
            models.Index(fields=["created_by", "-created_at"]),
        ]

    def __str__(self):
        title = self.title or "Untitled Note"
        return f"{self.ip_address.address} - {title}"

    def create_version(self, user: User, new_content: str, new_title: str = None) -> "IPNote":
        """Create a new version of this note."""
        new_version = IPNote.objects.create(
            ip_address=self.ip_address,
            title=new_title or self.title,
            content=new_content,
            is_public=self.is_public,
            is_pinned=self.is_pinned,
            created_by=self.created_by,
            updated_by=user,
            version=self.version + 1,
            parent_note=self.parent_note or self,
        )
        return new_version


class IPNoteAttachment(models.Model):
    """
    Model for file attachments on IP notes.
    """

    note = models.ForeignKey(
        IPNote,
        on_delete=models.CASCADE,
        related_name="attachments",
        help_text="Note this attachment belongs to",
    )
    file = models.FileField(
        upload_to="ip_notes/attachments/%Y/%m/%d/",
        help_text="Attachment file",
    )
    filename = models.CharField(
        max_length=255,
        help_text="Original filename",
    )
    file_size = models.IntegerField(
        help_text="File size in bytes",
    )
    content_type = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="File content type",
    )
    uploaded_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="uploaded_ip_note_attachments",
        help_text="User who uploaded this attachment",
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "IP Note Attachment"
        verbose_name_plural = "IP Note Attachments"
        ordering = ["-uploaded_at"]

    def __str__(self):
        return f"{self.note} - {self.filename}"


class IPNoteComment(models.Model):
    """
    Model for comments/replies on IP notes.
    """

    note = models.ForeignKey(
        IPNote,
        on_delete=models.CASCADE,
        related_name="comments",
        help_text="Note this comment belongs to",
    )
    content = models.TextField(
        help_text="Comment content",
    )
    author = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="ip_note_comments",
        help_text="User who wrote this comment",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "IP Note Comment"
        verbose_name_plural = "IP Note Comments"
        ordering = ["created_at"]
        indexes = [
            models.Index(fields=["note", "created_at"]),
        ]

    def __str__(self):
        return f"Comment on {self.note} by {self.author}"
