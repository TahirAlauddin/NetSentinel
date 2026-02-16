from rest_framework import viewsets

from .models import ManagedPhoneNumber, ManagedPhoneNumberBlock
from .serializers import ManagedPhoneNumberBlockSerializer, ManagedPhoneNumberSerializer


class ManagedPhoneNumberViewSet(viewsets.ModelViewSet):
    queryset = ManagedPhoneNumber.objects.select_related(
        "phone_number",
        "location",
        "assigned_user",
    ).all()
    serializer_class = ManagedPhoneNumberSerializer
    search_fields = ("name", "extension_number", "phone_number__number")
    ordering_fields = ("name", "extension_number", "phone_number__number", "created_at")


class ManagedPhoneNumberBlockViewSet(viewsets.ModelViewSet):
    queryset = ManagedPhoneNumberBlock.objects.select_related("location").all()
    serializer_class = ManagedPhoneNumberBlockSerializer
    search_fields = ("name", "start_number", "end_number")
    ordering_fields = ("name", "start_number", "end_number", "created_at")
