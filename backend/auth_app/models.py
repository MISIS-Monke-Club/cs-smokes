from django.db import models
from django.contrib.auth.models import (
    AbstractBaseUser,
    BaseUserManager,
    PermissionsMixin,
)


class UserManager(BaseUserManager):
    def create_user(self, username, email, password=None):
        if not email:
            raise ValueError("Email обязателен")
        user = self.model(username=username, email=self.normalize_email(email))
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, email=None, password=None):

        if email is None:
            email = "adminemail1@email.ru"

        user = self.create_user(username=username, email=email, password=password)

        from .models import AdminType, Admins

        admin_type, _ = AdminType.objects.get_or_create(
            is_superuser=True,
            is_base_admin=True,
            is_editor=True,
        )
        Admins.objects.get_or_create(user_id=user, admin_type_id=admin_type)

        return user


class User(AbstractBaseUser, PermissionsMixin):
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

    @property
    def is_staff(self):
        return Admins.objects.filter(user_id=self).exists()

    @property
    def is_superuser(self):
        return Admins.objects.filter(
            user_id=self, admin_type_id__is_superuser=True
        ).exists()

    def has_perm(self, perm, obj=None):
        return self.is_superuser

    def has_module_perms(self, app_label):
        return self.is_superuser


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
