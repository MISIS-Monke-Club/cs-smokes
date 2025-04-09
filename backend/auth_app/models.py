from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager


class Map(models.Model):
    map_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)
    link = models.CharField(max_length=255)
    image_link = models.CharField(max_length=255)

    def __str__(self):
        return self.name


class GrenadeClass(models.Model):
    grenade_class_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)
    description = models.CharField(max_length=255, null=True, blank=True)
    price = models.IntegerField(default=0)

    def __str__(self):
        return self.name


class Property(models.Model):
    property_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255)

    def __str__(self):
        return self.name


class UserManager(BaseUserManager):
    def create_user(self, username, email, password=None):
        if not email:
            raise ValueError("Email обязателен")
        user = self.model(username=username, email=self.normalize_email(email))
        user.set_password(password)
        user.save(using=self._db)
        return user


class User(AbstractBaseUser):
    user_id = models.AutoField(primary_key=True)
    username = models.CharField(max_length=255, unique=True)
    email = models.EmailField(max_length=255, default="")
    first_name = models.CharField(max_length=255, default="", blank=True)
    last_name = models.CharField(max_length=255, default="", blank=True)
    avatar_url = models.CharField(max_length=255, default="", blank=True)
    steam_link = models.CharField(max_length=255, default="", blank=True)
    tg_id = models.IntegerField(null=True, blank=True)
    is_banned = models.BooleanField(default=False)
    objects = UserManager()
    USERNAME_FIELD = "username"
    REQUIRED_FIELDS = ["email"]

    def __str__(self):
        return self.username


class Lineup(models.Model):
    grenade_id = models.AutoField(primary_key=True)
    map_id = models.ForeignKey(Map, on_delete=models.CASCADE)
    link_to_video = models.CharField(max_length=255)
    user_id = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    title = models.CharField(max_length=255)
    description = models.TextField()
    approved = models.BooleanField(default=False)
    views = models.IntegerField(default=0)
    preview_image_link = models.CharField(max_length=255)
    grenade_class_id = models.ForeignKey(GrenadeClass, on_delete=models.CASCADE)

    def __str__(self):
        return self.title


class PropertyList(models.Model):
    key = models.ForeignKey(Property, on_delete=models.CASCADE)
    grenade_id = models.ForeignKey(Lineup, on_delete=models.CASCADE)


class AdminType(models.Model):
    admin_type_id = models.AutoField(primary_key=True)
    is_superuser = models.BooleanField(default=False)
    is_base_admin = models.BooleanField(default=False)
    is_editor = models.BooleanField(default=False)

    def __str__(self):
        return f"AdminType {self.admin_type_id}"


class Admins(models.Model):
    user_id = models.ForeignKey(User, on_delete=models.CASCADE)
    admin_type_id = models.ForeignKey(AdminType, on_delete=models.CASCADE)

    class Meta:
        unique_together = (("user_id", "admin_type_id"),)

    def __str__(self):
        return f"Admin {self.user_id}"


class Favorites(models.Model):
    user_id = models.ForeignKey(User, on_delete=models.CASCADE)
    grenade_id = models.ForeignKey(Lineup, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = (("user_id", "grenade_id"),)

    def __str__(self):
        return f"Favorite {self.user_id} - {self.grenade_id}"
