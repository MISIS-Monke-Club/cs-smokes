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
    pull_request_id = models.ForeignKey(
        PullRequest, on_delete=models.CASCADE, related_name="comments"
    )
    user_id = models.IntegerField()
    text = models.TextField()
    parent_id = models.IntegerField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
