from channels.generic.websocket import AsyncWebsocketConsumer
import json

from asgiref.sync import sync_to_async
from channels.db import database_sync_to_async  # пригодится для читаемости

from pull_requests.models import Comment, PullRequest
from pull_requests.serializers import CommentSerializer
from auth_app.models import User


class PRCommentConsumer(AsyncWebsocketConsumer):
    @database_sync_to_async
    def create_comment(self, user_id: int, message: str):
        pr = PullRequest.objects.get(id=self.pr_id)
        author = User.objects.get(user_id=user_id)  # ← исправлено id→user_id
        Comment.objects.create(pull_request=pr, author=author, text=message)

    @database_sync_to_async
    def delete_comment(self, comment_id: int):
        Comment.objects.filter(id=comment_id, pull_request_id=self.pr_id).delete()

    @database_sync_to_async
    def get_comments_serialized(self):
        qs = (
            Comment.objects.filter(pull_request_id=self.pr_id)
            .select_related("author")  # избегаем ленивых запросов
            .order_by("created_at")
        )
        return CommentSerializer(qs, many=True).data

    async def connect(self):
        self.pr_id = self.scope["url_route"]["kwargs"]["pr_id"]
        self.room_group_name = f"pr_{self.pr_id}"
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()
        comments_data = await self.get_comments_serialized()
        await self.send(text_data=json.dumps(comments_data, ensure_ascii=False))

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        """
        Клиент шлёт JSON вроде:
        {"action": "create", "user_id": "1", "message": "hello"}
        или
        {"action": "delete", "message_id": 42}
        """
        try:
            data = json.loads(text_data)
        except ValueError:
            return

        action = data.get("action")
        if action not in ("create", "delete"):
            return

        await self.channel_layer.group_send(
            self.room_group_name,
            {"type": "chat_message", "data": data},
        )

    async def chat_message(self, event):
        payload = event.get("data", {})
        action = payload.get("action")

        if action == "create":
            await self.create_comment(int(payload["user_id"]), payload["message"])
        elif action == "delete":
            await self.delete_comment(payload["message_id"])

        # отдаём клиентам обновлённый список комментариев
        comments_data = await self.get_comments_serialized()
        await self.send(text_data=json.dumps(comments_data, ensure_ascii=False))
