import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('remediation', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='incident',
            name='human_intervened_at',
            field=models.DateTimeField(blank=True, help_text="Set when a human takes over — halts the agent loop (checked cooperatively between ReAct turns) and stops run_incident_agent's poller from ever retrying this incident again.", null=True),
        ),
        migrations.AddField(
            model_name='incident',
            name='human_intervention_note',
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name='incident',
            name='human_intervened_by',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='intervened_incidents', to=settings.AUTH_USER_MODEL),
        ),
    ]
