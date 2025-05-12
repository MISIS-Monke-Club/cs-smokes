from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager


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
    email = models.EmailField(max_length=255, unique=True, null=True, blank=True)
    first_name = models.CharField(max_length=255, null=True, blank=True)
    last_name = models.CharField(max_length=255, null=True, blank=True)
    avatar_url = models.CharField(max_length=255, null=True, blank=True)
    steam_link = models.CharField(max_length=255, null=True, blank=True)
    tg_id = models.IntegerField(null=True, blank=True)
    is_banned = models.BooleanField(default=False)
    objects = UserManager()
    USERNAME_FIELD = "username"

    def __str__(self):
        return self.username


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
