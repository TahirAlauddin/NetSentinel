# Generated manually: add validation and safe upload_to for AssetImage

from django.db import migrations, models

from assets.validators import (
    asset_image_upload_to,
    validate_asset_image_extension,
    validate_asset_image_size,
)


class Migration(migrations.Migration):

    dependencies = [
        ("assets", "0010_remove_assetattachment_assets_asse_content_83dbe9_idx_and_more"),
    ]

    operations = [
        migrations.AlterField(
            model_name="assetimage",
            name="image",
            field=models.ImageField(
                upload_to=asset_image_upload_to,
                validators=[
                    validate_asset_image_extension,
                    validate_asset_image_size,
                ],
            ),
        ),
    ]
