from channels.generic.websocket import AsyncWebsocketConsumer
import json
from pull_requests.models import Comment, PullRequest
from pull_requests.serializers import CommentSerializer

from asgiref.sync import sync_to_async
from auth_app.models import User


class PRCommentConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.pr_id = self.scope["url_route"]["kwargs"]["pr_id"]
        self.room_group_name = f"pr_{self.pr_id}"

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)

        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        await self.channel_layer.group_send(
            self.room_group_name, {"type": "chat_message", "data": data}
        )

    @sync_to_async
    def create_comment(self, user_id, message):
        pull_request = PullRequest.objects.get(id=self.pr_id)
        author = User.objects.get(user_id=user_id)
        return Comment.objects.create(
            pull_request=pull_request, author=author, text=message
        )

    @sync_to_async
    def delete_comment(self, id):
        Comment.objects.filter(id=id, pull_request_id=self.pr_id).delete()

    async def chat_message(self, event):

        data = event["data"]
        if data["action"] == "create":
            message = data["message"]
            user_id = data["user_id"]
            await self.create_comment(user_id, message)
        elif data["action"] == "delete":
            message_id = data["message_id"]
            await self.delete_comment(message_id)
        comments = await sync_to_async(
            lambda: list(
                Comment.objects.filter(pull_request_id=self.pr_id).order_by(
                    "created_at"
                )
            )
        )()
        serializer = CommentSerializer(comments, many=True)
        await self.send(text_data=json.dumps(serializer.data, ensure_ascii=False))
