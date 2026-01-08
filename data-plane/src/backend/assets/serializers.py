from rest_framework import serializers

from infrastructure.serializers import AssetLocationSerializer, DepartmentSerializer
from users.serializers import UserSerializer

from .models import (
    Asset,
    AssetAttachment,
    AssetCategory,
    AssetImage,
    AssetRelation,
    AssetTag,
    CalendarAlert,
    ComputerDetails,
    CustomLifecycle,
    DisplayDetails,
    NetworkDetails,
    PeripheralDetails,
    PhoneDetails,
    TechSpecs,
    Vendor,
)


class AssetTagSerializer(serializers.ModelSerializer):
    """Serializer for Asset Tag."""

    class Meta:
        model = AssetTag
        fields = [
            "id",
            "name",
            "color",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class CustomLifecycleSerializer(serializers.ModelSerializer):
    """Serializer for Custom Lifecycle."""

    class Meta:
        model = CustomLifecycle
        fields = [
            "id",
            "name",
            "description",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class VendorSerializer(serializers.ModelSerializer):
    """Serializer for Vendor."""

    class Meta:
        model = Vendor
        fields = [
            "id",
            "name",
            "contact_info",
            "website",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class TechSpecsSerializer(serializers.ModelSerializer):
    """Serializer for Tech Specs."""

    class Meta:
        model = TechSpecs
        fields = [
            "id",
            "name",
        ]
        read_only_fields = ["id"]


class AssetCategorySerializer(serializers.ModelSerializer):
    """Serializer for Asset Category."""

    tech_specs_name = serializers.CharField(source="tech_specs.name", read_only=True)
    tech_specs = TechSpecsSerializer(read_only=True)

    class Meta:
        model = AssetCategory
        fields = [
            "id",
            "name",
            "tech_specs",
            "tech_specs_name",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class ComputerDetailsSerializer(serializers.ModelSerializer):
    """Serializer for Computer Details."""

    class Meta:
        model = ComputerDetails
        fields = [
            "cpu",
            "ram",
            "storage",
            "gpu",
            "os",
            "processor",
            "memory",
            "hard_drive",
            "serial_number",
            "product_model_number",
        ]


class NetworkDetailsSerializer(serializers.ModelSerializer):
    """Serializer for Network Details."""

    class Meta:
        model = NetworkDetails
        fields = [
            "mac_address",
            "ip_address",
            "firmware",
            "ports_count",
            "throughput",
            "ports",
            "serial_number",
            "product_model_number",
            "sku",
            "upc",
            "mpn",
            "cpn",
            "ean",
            "gtin",
        ]


class DisplayDetailsSerializer(serializers.ModelSerializer):
    """Serializer for Display Details."""

    class Meta:
        model = DisplayDetails
        fields = [
            "size_inches",
            "resolution",
            "panel_type",
            "refresh_rate",
        ]


class PhoneDetailsSerializer(serializers.ModelSerializer):
    """Serializer for Phone Details."""

    class Meta:
        model = PhoneDetails
        fields = [
            "connection_interface",
            "phone_type",
            "extension",
            "serial_number",
            "product_model_number",
        ]


class PeripheralDetailsSerializer(serializers.ModelSerializer):
    """Serializer for Peripheral Details."""

    class Meta:
        model = PeripheralDetails
        fields = [
            "connection_type",
            "peripheral_type",
            "serial_number",
            "product_model_number",
        ]


class AssetAttachmentSerializer(serializers.ModelSerializer):
    """Serializer for Asset Attachment."""

    uploaded_by_name = serializers.CharField(source="uploaded_by.get_full_name", read_only=True)

    class Meta:
        model = AssetAttachment
        fields = [
            "id",
            "file",
            "name",
            "description",
            "uploaded_at",
            "uploaded_by",
            "uploaded_by_name",
        ]
        read_only_fields = ["id", "uploaded_at", "uploaded_by"]


class AssetRelationSerializer(serializers.ModelSerializer):
    """Serializer for Asset Relation."""

    related_asset_name = serializers.CharField(source="related_asset.name", read_only=True)
    related_asset_tag = serializers.CharField(source="related_asset.asset_tag", read_only=True)

    class Meta:
        model = AssetRelation
        fields = [
            "id",
            "asset",
            "related_asset",
            "related_asset_name",
            "related_asset_tag",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class AssetImageSerializer(serializers.ModelSerializer):
    """Serializer for Asset Image."""

    class Meta:
        model = AssetImage
        fields = ["id", "image", "created_at", "updated_at"]


class CalendarAlertSerializer(serializers.ModelSerializer):
    """Serializer for Calendar Alert."""

    assigned_to = UserSerializer(read_only=True)

    class Meta:
        model = CalendarAlert
        fields = ["id", "date", "message", "assigned_to", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]


class CalendarAlertCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for Calendar Alert."""

    class Meta:
        model = CalendarAlert
        fields = ["date", "message", "assigned_to"]
        read_only_fields = ["id", "created_at", "updated_at"]


class AssetSerializer(serializers.ModelSerializer):
    """Serializer for Asset with polymorphic extension details."""

    category = AssetCategorySerializer(read_only=True)
    vendor = VendorSerializer(read_only=True)
    location = AssetLocationSerializer(read_only=True)
    tags = AssetTagSerializer(many=True, read_only=True)
    departments = DepartmentSerializer(many=True, read_only=True)
    images = AssetImageSerializer(many=True, read_only=True)
    calendar_alerts = CalendarAlertSerializer(many=True, read_only=True)

    assigned_to = UserSerializer(read_only=True)
    used_by = UserSerializer(read_only=True)
    managed_by = UserSerializer(read_only=True)
    custom_lifecycle = CustomLifecycleSerializer(read_only=True)

    # Polymorphic extension details
    computer_details = ComputerDetailsSerializer(read_only=True)
    network_details = NetworkDetailsSerializer(read_only=True)
    display_details = DisplayDetailsSerializer(read_only=True)
    phone_details = PhoneDetailsSerializer(read_only=True)
    peripheral_details = PeripheralDetailsSerializer(read_only=True)

    class Meta:
        model = Asset
        fields = [
            "id",
            "name",
            "category",
            "asset_tag",
            "impact",
            "vendor",
            "notes",
            "model",
            "serial_number",
            "status",
            "purchase_date",
            "assigned_to",
            "location",
            "mac_address",
            "ip_address",
            "manufacturer",
            "tags",
            "system_uuid",
            "system_uptime",
            "in_current_state_since",
            "expected_checkin_date",
            "used_by",
            "managed_by",
            "departments",
            "custom_lifecycle",
            "purchase_price",
            "replacement_cost",
            "salvage_value",
            "useful_life_years",
            "approaching_eol_months",
            "po_number",
            "machine_serial_number",
            "product_number",
            "acquisition_date",
            "warranty_expiration",
            "installation_date",
            "calendar_alerts",
            "images",
            "attachments",
            "created_at",
            "updated_at",
            # Extension details
            "computer_details",
            "network_details",
            "display_details",
            "phone_details",
            "peripheral_details",
        ]
        read_only_fields = [
            "id",
            "images",
            "calendar_alerts",
            "attachments",
            "created_at",
            "updated_at",
        ]


class AssetCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating and updating Assets with extension details."""

    # Extension details as nested serializers for write operations
    computer_details = ComputerDetailsSerializer(required=False, allow_null=True)
    network_details = NetworkDetailsSerializer(required=False, allow_null=True)
    display_details = DisplayDetailsSerializer(required=False, allow_null=True)
    phone_details = PhoneDetailsSerializer(required=False, allow_null=True)
    peripheral_details = PeripheralDetailsSerializer(required=False, allow_null=True)

    class Meta:
        model = Asset
        fields = [
            "id",
            "name",
            "category",
            "asset_tag",
            "impact",
            "vendor",
            "notes",
            "model",
            "serial_number",
            "status",
            "purchase_date",
            "assigned_to",
            "location",
            "mac_address",
            "ip_address",
            "manufacturer",
            "tags",
            "system_uuid",
            "system_uptime",
            "in_current_state_since",
            "expected_checkin_date",
            "used_by",
            "managed_by",
            "departments",
            "custom_lifecycle",
            "purchase_price",
            "replacement_cost",
            "salvage_value",
            "useful_life_years",
            "approaching_eol_months",
            "po_number",
            "machine_serial_number",
            "product_number",
            "acquisition_date",
            "warranty_expiration",
            "installation_date",
            "calendar_alerts",
            "images",
            # Extension details
            "computer_details",
            "network_details",
            "display_details",
            "phone_details",
            "peripheral_details",
        ]
        read_only_fields = ["id", "images", "calendar_alerts", "created_at", "updated_at"]

    def create(self, validated_data):
        """Create asset with extension details."""
        # Extract extension details
        computer_details_data = validated_data.pop("computer_details", None)
        network_details_data = validated_data.pop("network_details", None)
        display_details_data = validated_data.pop("display_details", None)
        phone_details_data = validated_data.pop("phone_details", None)
        peripheral_details_data = validated_data.pop("peripheral_details", None)

        # Extract many-to-many fields
        tags = validated_data.pop("tags", [])
        departments = validated_data.pop("departments", [])

        # Create asset
        asset = Asset.objects.create(**validated_data)

        # Add many-to-many relationships
        if tags:
            asset.tags.set(tags)
        if departments:
            asset.departments.set(departments)

        # Create extension details based on category
        if computer_details_data:
            ComputerDetails.objects.create(asset=asset, **computer_details_data)
        if network_details_data:
            NetworkDetails.objects.create(asset=asset, **network_details_data)
        if display_details_data:
            DisplayDetails.objects.create(asset=asset, **display_details_data)
        if phone_details_data:
            PhoneDetails.objects.create(asset=asset, **phone_details_data)
        if peripheral_details_data:
            PeripheralDetails.objects.create(asset=asset, **peripheral_details_data)

        return asset

    def update(self, instance, validated_data):
        """Update asset with extension details."""
        # Extract extension details
        computer_details_data = validated_data.pop("computer_details", None)
        network_details_data = validated_data.pop("network_details", None)
        display_details_data = validated_data.pop("display_details", None)
        phone_details_data = validated_data.pop("phone_details", None)
        peripheral_details_data = validated_data.pop("peripheral_details", None)

        # Extract many-to-many fields
        tags = validated_data.pop("tags", None)
        departments = validated_data.pop("departments", None)

        # Update asset fields
        for attr, value in validated_data.items():
            if attr == "images":
                continue
            setattr(instance, attr, value)
        instance.save()

        # Update many-to-many relationships
        if tags is not None:
            instance.tags.set(tags)
        if departments is not None:
            instance.departments.set(departments)

        # Update extension details
        if computer_details_data:
            ComputerDetails.objects.update_or_create(asset=instance, defaults=computer_details_data)
        if network_details_data:
            NetworkDetails.objects.update_or_create(asset=instance, defaults=network_details_data)
        if display_details_data:
            DisplayDetails.objects.update_or_create(asset=instance, defaults=display_details_data)
        if phone_details_data:
            PhoneDetails.objects.update_or_create(asset=instance, defaults=phone_details_data)
        if peripheral_details_data:
            PeripheralDetails.objects.update_or_create(
                asset=instance, defaults=peripheral_details_data
            )

        return instance


# ---------------------
# Assets Chunks
# ---------------------


class AssetBasicDetailsSerializer(serializers.ModelSerializer):
    """Serializer for Asset Basic Details."""

    class Meta:
        model = Asset
        fields = [
            "id",
            "name",
            "category",
            "asset_tag",
            "impact",
            "vendor",
            "notes",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["category"] = AssetCategorySerializer(instance.category).data
        data["vendor"] = VendorSerializer(instance.vendor).data
        return data


class AssetTechSpecsSerializer(serializers.ModelSerializer):
    """Serializer for Asset Tech Specs."""

    class Meta:
        model = Asset
        fields = [
            "id",
            "name",
            "mac_address",
            "ip_address",
            "manufacturer",
            "model",
            "tags",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["vendor"] = VendorSerializer(instance.vendor).data
        data["tags"] = AssetTagSerializer(instance.tags.all(), many=True).data
        return data


# TODO: add more chunks per step
