from django.db.models.signals import post_migrate
from django.dispatch import receiver
from django.utils.timezone import now
from auth_app.models import User
from lineups.models import Lineup
from pull_requests.models import PullRequest, Comment

@receiver(post_migrate)
def create_mock_pull_request_and_comment(sender, **kwargs):
    if PullRequest.objects.exists():
        return
    user = User.objects.first()
    lineup = Lineup.objects.first()
    pr = PullRequest.objects.create(
        lineup=lineup,
        creator=user,
        status="OPEN",
        created_at=now()
    )

    Comment.objects.create(
        pull_request=pr,
        author=user,
        text="Это тестовый комментарий к Pull Request.",
        created_at=now()
    )