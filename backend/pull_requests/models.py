from django.db import models


class PullRequest(models.Model):
    lineup_id = models.IntegerField()
    creator_id = models.IntegerField()
    approver_id = models.IntegerField(null=True, blank=True)
    status = models.CharField(
        max_length=10,
        choices=[
            ("open", "open"),
            ("approved", "approved"),
            ("rejected", "rejected"),
            ("cancelled", "cancelled"),
        ],
    )
    created_at = models.DateTimeField(auto_now_add=True)
    closed_at = models.DateTimeField(null=True, blank=True)


class PullRequestComment(models.Model):
    pr_id = models.IntegerField()
    user_id = models.IntegerField()
    text = models.TextField()
    parent_id = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
