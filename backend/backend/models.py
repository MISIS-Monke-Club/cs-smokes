from django.db import models

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

    def __str__(self):
        return self.name

class LineupTypeValues(models.Model):
    value_id = models.AutoField(primary_key=True)
    value = models.CharField(max_length=255)

    def __str__(self):
        return self.value

class LineupType(models.Model):
    type_id = models.AutoField(primary_key=True)
    key_name = models.CharField(max_length=255)
    value_id = models.ForeignKey(LineupTypeValues, on_delete=models.CASCADE)

    def __str__(self):
        return self.key_name

class User(models.Model):
    user_id = models.AutoField(primary_key=True)
    username = models.CharField(max_length=255)
    avatar_url = models.CharField(max_length=255)
    steam_link = models.CharField(max_length=255)
    tg_id = models.IntegerField()
    email = models.CharField(max_length=255)
    first_name = models.CharField(max_length=255)
    last_name = models.CharField(max_length=255)
    is_banned = models.BooleanField(default=False)

    def __str__(self):
        return self.username

class Lineup(models.Model):
    grenade_id = models.AutoField(primary_key=True)
    map_id = models.ForeignKey(Map, on_delete=models.CASCADE)
    grenade_class_id = models.ForeignKey(GrenadeClass, on_delete=models.CASCADE)
    type_id = models.ForeignKey(LineupType, on_delete=models.CASCADE)
    link_to_video = models.CharField(max_length=255)
    user_id = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    title = models.CharField(max_length=255)
    description = models.TextField()
    approved = models.BooleanField(default=False)
    views = models.IntegerField(default=0)
    preview_image_link = models.CharField(max_length=255)

    def __str__(self):
        return self.title

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
        unique_together = (('user_id', 'admin_type_id'),)

    def __str__(self):
        return f"Admin {self.user_id}"

class Favorites(models.Model):
    user_id = models.ForeignKey(User, on_delete=models.CASCADE)
    grenade_id = models.ForeignKey(Lineup, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = (('user_id', 'grenade_id'),)

    def __str__(self):
        return f"Favorite {self.user_id} - {self.grenade_id}"