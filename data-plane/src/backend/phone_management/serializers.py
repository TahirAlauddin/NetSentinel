from rest_framework import serializers

from .models import ManagedPhoneNumber, ManagedPhoneNumberBlock


class ManagedPhoneNumberSerializer(serializers.ModelSerializer):
    phone_number_value = serializers.CharField(source="number", read_only=True)
    location_name = serializers.CharField(source="location.name", read_only=True)
    assigned_user_name = serializers.CharField(source="assigned_user.get_full_name", read_only=True)
    service_type_display = serializers.CharField(source="get_service_type_display", read_only=True)

    class Meta:
        model = ManagedPhoneNumber
        fields = [
            "id",
            "number",
            "phone_number_value",
            "location",
            "location_name",
            "assigned_user",
            "assigned_user_name",
            "name",
            "extension_number",
            "service_type",
            "service_type_display",
            "did_enabled",
            "did_external_number",
            "notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate(self, attrs):
        location = attrs.get("location")
        if self.instance and location is None:
            location = self.instance.location_id
        if not location:
            raise serializers.ValidationError(
                {"location": "Location is required so we know where this phone is located."}
            )

        service_type = attrs.get("service_type")
        extension_number = attrs.get("extension_number")
        did_enabled = attrs.get("did_enabled")
        did_external_number = attrs.get("did_external_number")

        if self.instance:
            service_type = service_type or self.instance.service_type
            extension_number = (
                extension_number
                if "extension_number" in attrs
                else self.instance.extension_number
            )
            did_enabled = did_enabled if "did_enabled" in attrs else self.instance.did_enabled
            did_external_number = (
                did_external_number
                if "did_external_number" in attrs
                else self.instance.did_external_number
            )

        if service_type == "extension" and not extension_number:
            raise serializers.ValidationError(
                {"extension_number": "Extension number is required for Extension service type."}
            )

        if did_enabled and not did_external_number:
            raise serializers.ValidationError(
                {"did_external_number": "External DID number is required when DID is enabled."}
            )

        return attrs


class ManagedPhoneNumberBlockSerializer(serializers.ModelSerializer):
    location_name = serializers.CharField(source="location.name", read_only=True)

    class Meta:
        model = ManagedPhoneNumberBlock
        fields = [
            "id",
            "location",
            "location_name",
            "name",
            "start_number",
            "end_number",
            "is_static_assignment",
            "notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate(self, attrs):
        start_number = attrs.get("start_number")
        end_number = attrs.get("end_number")

        if self.instance:
            start_number = start_number or self.instance.start_number
            end_number = end_number or self.instance.end_number

        try:
            if int(start_number) > int(end_number):
                raise serializers.ValidationError(
                    {"end_number": "End number must be greater than or equal to start number."}
                )
        except (TypeError, ValueError):
            # If non-numeric numbers are used, skip numeric ordering validation.
            pass

        return attrs
