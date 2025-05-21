from channels.generic.websocket import AsyncWebsocketConsumer
import json


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
        message = data["message"]

        await self.channel_layer.group_send(
            self.room_group_name, {"type": "chat_message", "message": message}
        )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({"message": event["message"]}))
