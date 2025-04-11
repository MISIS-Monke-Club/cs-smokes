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


def create_mock_greande_class(apps, schema_editor):
    grenade_class = apps.get_model("auth_app", "GrenadeClass")

    grenade_classes = [
        {
            "name": "Световая граната",
            "description": "слепит врага",
            "price": 200,
        },
        {
            "name": "Осколочная граната",
            "description": "Наносит урон по области",
            "price": 300,
        },
        {
            "name": "Дымовая граната",
            "description": "Создает дымовую завесу в определенном радиусе",
            "price": 500,
        },
    ]

    for gc_data in grenade_classes:
        grenade_class.objects.create(**gc_data)


def delete_mock_grenade_class(apps, schema_editor):
    gc = apps.get_model("auth_app", "GrenadeClass")
    gc.objects.all().delete()


class Migration(migrations.Migration):

    operations = [
        migrations.RunPython(create_mock_maps, delete_mock_maps),
        migrations.RunPython(create_mock_greande_class, delete_mock_grenade_class),
    ]
