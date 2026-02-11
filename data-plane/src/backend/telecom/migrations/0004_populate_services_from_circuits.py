# Data migration: create one Service per DataCircuit and link PhoneNumbers to it

from django.db import connection, migrations


def forwards(apps, schema_editor):
    Service = apps.get_model("telecom", "Service")
    DataCircuit = apps.get_model("telecom", "DataCircuit")
    PhoneNumber = apps.get_model("telecom", "PhoneNumber")

    # Ensure service_new_id column exists (in case 0003 was faked or partially applied)
    with connection.cursor() as cursor:
        if connection.vendor == "postgresql":
            cursor.execute(
                """
                SELECT 1 FROM information_schema.columns
                WHERE table_schema = 'public' AND table_name = 'telecom_phonenumber'
                AND column_name = 'service_new_id'
                """
            )
            has_col = cursor.fetchone() is not None
        else:
            cursor.execute("PRAGMA table_info(telecom_phonenumber)")
            has_col = any(row[1] == "service_new_id" for row in cursor.fetchall())
        if not has_col:
            field = PhoneNumber._meta.get_field("service_new")
            schema_editor.add_field(PhoneNumber, field)

    circuit_to_service = {}
    for circuit in DataCircuit.objects.select_related("provider", "location").all():
        name = circuit.circuit_id or circuit.alternate_cid or f"Circuit #{circuit.id}"
        service = Service.objects.create(
            name=name,
            provider=circuit.provider,
            location=circuit.location,
            service_category="data",
            service_type=circuit.circuit_type,
            account_number=circuit.account_number,
            security_code=circuit.security_code,
            contract_id=circuit.contract_id,
            monthly_cost=circuit.monthly_cost,
            notes=circuit.notes,
        )
        circuit_to_service[circuit.id] = service
        circuit.service_id = service.id
        circuit.save(update_fields=["service_id"])

    # Use raw SQL to avoid ORM selecting service_new_id (which may not exist in DB yet)
    with connection.cursor() as cursor:
        cursor.execute(
            "SELECT id, service_id FROM telecom_phonenumber WHERE service_id IS NOT NULL"
        )
        rows = cursor.fetchall()
    for pk, old_service_id in rows:
        service = circuit_to_service.get(old_service_id)
        if service:
            with connection.cursor() as cursor:
                cursor.execute(
                    "UPDATE telecom_phonenumber SET service_new_id = %s WHERE id = %s",
                    [service.id, pk],
                )


def backwards(apps, schema_editor):
    # Clear links; do not delete Services so we can re-run forwards if needed
    DataCircuit = apps.get_model("telecom", "DataCircuit")
    DataCircuit.objects.all().update(service_id=None)
    with connection.cursor() as cursor:
        cursor.execute("UPDATE telecom_phonenumber SET service_new_id = NULL")


class Migration(migrations.Migration):

    dependencies = [
        ("telecom", "0003_add_service_model_and_fks"),
    ]

    operations = [
        migrations.RunPython(forwards, backwards),
    ]
