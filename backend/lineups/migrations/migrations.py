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


def create_mock_properties(apps, schema_editor):
    Property = apps.get_model("auth_app", "Property")

    mock_properties = [
        {"name": "Дальность броска"},
        {"name": "Время восстановления"},
        {"name": "Радиус воздействия"},
    ]

    for prop_data in mock_properties:
        Property.objects.create(**prop_data)


def delete_mock_properties(apps, schema_editor):
    Property = apps.get_model("auth_app", "Property")
    Property.objects.all().delete()


def create_mock_property_list(apps, schema_editor):
    PropertyList = apps.get_model("auth_app", "PropertyList")
    Property = apps.get_model("auth_app", "Property")
    Lineup = apps.get_model("auth_app", "Lineup")

    property1 = Property.objects.get(pk=1)
    property2 = Property.objects.get(pk=2)
    grenade1 = Lineup.objects.get(pk=1)
    grenade2 = Lineup.objects.get(pk=2)

    mock_property_list = [
        {
            "property_id": property1,
            "grenade_id": grenade1,
        },
        {
            "property_id": property2,
            "grenade_id": grenade2,
        },
    ]

    for prop_list_data in mock_property_list:
        PropertyList.objects.create(**prop_list_data)


def delete_mock_property_list(apps, schema_editor):
    PropertyList = apps.get_model("auth_app", "PropertyList")
    PropertyList.objects.all().delete()


def create_mock_lineups(apps, schema_editor):
    Lineup = apps.get_model("auth_app", "Lineup")
    GrenadeClass = apps.get_model("auth_app", "GrenadeClass")
    Map = apps.get_model("auth_app", "Map")
    User = apps.get_model("auth_app", "User")

    grenade1 = GrenadeClass.objects.get(pk=1)
    grenade2 = GrenadeClass.objects.get(pk=2)
    map1 = Map.objects.get(pk=1)
    map2 = Map.objects.get(pk=2)
    user1 = User.objects.get(pk=1)
    user2 = User.objects.get(pk=2)

    mock_lineups = [
        {
            "map_id": map1,
            "link_to_video": "https://example.com/video1",
            "user_id": user1,
            "title": "Флешка на А",
            "description": "Описание гранаты 1",
            "is_approved": True,
            "views": 123,
            "preview_image_link": "https://example.com/preview1.jpg",
            "grenade_class_id": grenade1,
        },
        {
            "map_id": map2,
            "link_to_video": "https://example.com/video2",
            "user_id": user2,
            "title": "Смок в окно",
            "description": "Описание гранаты 2",
            "is_approved": False,
            "views": 456,
            "preview_image_link": "https://example.com/preview2.jpg",
            "grenade_class_id": grenade2,
        },
    ]

    for lineup_data in mock_lineups:
        Lineup.objects.create(**lineup_data)


def delete_mock_lineups(apps, schema_editor):
    Lineup = apps.get_model("auth_app", "Lineup")
    Lineup.objects.all().delete()


class Migration(migrations.Migration):

    operations = [
        migrations.RunPython(create_mock_maps, delete_mock_maps),
        migrations.RunPython(create_mock_greande_class, delete_mock_grenade_class),
        migrations.RunPython(create_mock_properties, delete_mock_properties),
        migrations.RunPython(create_mock_lineups, delete_mock_lineups),
        migrations.RunPython(create_mock_property_list, delete_mock_property_list),
    ]
