from django.db import models
from auth_app.models import User
from lineups.models import Lineup


class PullRequest(models.Model):
    STATUS_CHOICES = [
        ("OPEN", "Open"),
        ("APPROVED", "Approved"),
        ("REJECTED", "Rejected"),
        ("MERGED", "Merged"),
        ("CLOSED", "Closed"),
    ]

    id = models.AutoField(primary_key=True)
    lineup = models.ForeignKey(Lineup, on_delete=models.CASCADE)
    creator = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name="created_pull_requests"
    )
    approver = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="approved_pull_requests",
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="OPEN")
    created_at = models.DateTimeField(auto_now_add=True)
    closed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"PR-{self.id} for {self.lineup.title}"

    def get_creator_info(self):
        return {
            "user_id": self.creator.id,
            "username": self.creator.username,
            "first_name": self.creator.first_name,
            "last_name": self.creator.last_name,
            "avatar_url": self.creator.avatar_url,
        }

    def get_approver_info(self):
        if not self.approver:
            return None
        return {
            "user_id": self.approver.id,
            "username": self.approver.username,
            "first_name": self.approver.first_name,
            "last_name": self.approver.last_name,
            "avatar_url": self.approver.avatar_url,
            "admin_type": getattr(self.approver, "admin_type", None),
        }


class Comment(models.Model):
    pull_request = models.ForeignKey(
        PullRequest, related_name="comments", on_delete=models.CASCADE
    )
    author = models.ForeignKey(User, on_delete=models.CASCADE)
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
