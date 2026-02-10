# Generated for contract logo (image) upload

from django.db import migrations, models
import contracts.validators


class Migration(migrations.Migration):

    dependencies = [
        ("contracts", "0002_contract_document"),
    ]

    operations = [
        migrations.AddField(
            model_name="contract",
            name="logo",
            field=models.ImageField(
                blank=True,
                help_text="Contract/carrier logo image. PNG, JPG, GIF, WebP. Max 2 MB.",
                null=True,
                upload_to=contracts.validators.contract_logo_upload_to,
                validators=[
                    contracts.validators.validate_contract_logo_extension,
                    contracts.validators.validate_contract_logo_size,
                ],
            ),
        ),
    ]
