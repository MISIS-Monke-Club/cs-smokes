from django.db import migrations


def create_mock_maps(apps, schema_editor):
    Map = apps.get_model("auth_app", "Map")

    mock_maps = [
        {
            "name": "Mirage",
            "link": "https://example.com/mirage",
            "image_link": "https://example.com/images/mirage.jpg",
        },
        {
            "name": "Dust 2",
            "link": "https://example.com/dust2",
            "image_link": "https://example.com/images/dust2.jpg",
        },
    ]

    for map_data in mock_maps:
        Map.objects.create(**map_data)


def delete_mock_maps(apps, schema_editor):
    Map = apps.get_model("auth_app", "Map")
    Map.objects.all().delete()


class Migration(migrations.Migration):

    operations = [
        migrations.RunPython(create_mock_maps, delete_mock_maps),
    ]
