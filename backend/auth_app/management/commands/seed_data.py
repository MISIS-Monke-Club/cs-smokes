import random
from pathlib import Path
from django.core.management.base import BaseCommand
from django.core.files import File
from django.utils import timezone

from auth_app.models import User, AdminType, Admins
from maps.models import Map
from grenade_class.models import GrenadeClass
from lineups.models import Lineup
from favorites.models import Favorites
from properties.models import Property, PropertyList
from pull_requests.models import PullRequest, Comment


class Command(BaseCommand):
    help = "Seed initial data with images"

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.SUCCESS("Starting seed..."))

        user_names = [
            ("flameX", "Иван", "Пирогов"),
            ("shadowWolf", "Анна", "Тихонова"),
            ("sniper1337", "Сергей", "Меткий"),
            ("ghostlyFox", "Дарья", "Лиса"),
            ("mollyQueen", "Елена", "Гранатова"),
            ("fragLord", "Олег", "Шарпов"),
            ("nadeMaster", "Пётр", "Грэм"),
            ("smokyNinja", "Мария", "Смирнова"),
            ("aimRush", "Никита", "Климов"),
            ("bomberPro", "Артём", "Взрывной"),
        ]
        users = []
        for username, first, last in user_names:
            user = User.objects.create_user(
                username=username,
                email=f"{username}@example.com",
                password="password123",
            )
            user.first_name = first
            user.last_name = last
            user.save()
            users.append(user)

        admin_type = AdminType.objects.create(
            is_superuser=True, is_base_admin=True, is_editor=True
        )
        Admins.objects.create(user_id=users[0], admin_type_id=admin_type)

        maps_data = [
            ("Inferno", "https://example.com/inferno", "media/maps/CS2_inferno.webp"),
            ("Nuke", "https://example.com/nuke", "media/maps/Cs2nuke.webp"),
            ("Overpass", "https://example.com/overpass", "media/maps/overpass.webp"),
        ]
        maps = []
        for name, link, img_path in maps_data:
            map_instance = Map(name=name, link=link, is_esports_pool=True)
            map_image_path = Path(img_path)
            if map_image_path.exists():
                with open(map_image_path, "rb") as img:
                    map_instance.image_link.save(
                        Path(img_path).name, File(img), save=True
                    )
            else:
                map_instance.save()
            maps.append(map_instance)

        grenade_data = [
            {
                "name": "Molotov",
                "description": "Для выжигания позиций",
                "price": 400,
                "img_path": "media/lineups/molo.jpg",
            },
            {
                "name": "HE Grenade",
                "description": "Наносит урон по области",
                "price": 300,
                "img_path": "media/lineups/xae.jpeg",
            },
            {
                "name": "Flashbang",
                "description": "Ослепляет противника",
                "price": 200,
                "img_path": "media/lineups/fleshka.webp",
            },
            {
                "name": "Smoke",
                "description": "Создаёт дымовую завесу",
                "price": 150,
                "img_path": "media/lineups/smok.jpeg",
            },
        ]
        grenade_classes = []
        for g in grenade_data:
            grenade_class = GrenadeClass(
                name=g["name"], description=g["description"], price=g["price"]
            )
            grenade_class.save()
            grenade_classes.append(grenade_class)

        properties = [
            Property.objects.create(name="Тикрейт", value="128"),
            Property.objects.create(name="Джамптроу", value="Да"),
            Property.objects.create(name="Ванвей", value="Нет"),
        ]

        for map_instance in maps:
            for i in range(3):
                grenade_class = random.choice(grenade_classes)
                grenade_name = grenade_class.name
                title = f"{grenade_name} на {map_instance.name}"

                lineup = Lineup(
                    map_id=map_instance,
                    link_to_video="https://youtube.com/demo",
                    user_id=random.choice(users),
                    title=title,
                    description=f"Описание лайнапа: {title}",
                    is_approved=True,
                    views=random.randint(10, 200),
                    grenade_class_id=grenade_class,
                )
                lineup.save()

                grenade_img_path = Path(
                    next(
                        g["img_path"]
                        for g in grenade_data
                        if g["name"] == grenade_class.name
                    )
                )
                if grenade_img_path.exists():
                    with open(grenade_img_path, "rb") as img:
                        lineup.preview_image_link.save(
                            f"{map_instance.name.lower()}_{i + 1}.jpg",
                            File(img),
                            save=True,
                        )

                for prop in properties:
                    PropertyList.objects.create(property_id=prop, grenade_id=lineup)

                Favorites.objects.create(
                    user_id=random.choice(users), grenade_id=lineup
                )

                pull = PullRequest.objects.create(
                    lineup=lineup,
                    creator=random.choice(users),
                    approver=random.choice(users),
                    status="OPEN",
                    created_at=timezone.now(),
                )
                for j in range(2):
                    Comment.objects.create(
                        pull_request=pull,
                        author=random.choice(users),
                        text=f"Комментарий {j + 1} от {users[j % len(users)].username}",
                    )

        self.stdout.write(self.style.SUCCESS("Seeding complete."))
