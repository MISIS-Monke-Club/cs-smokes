from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync


def notify_ws_comment(pr_id, comment_data):
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f"pr_{pr_id}_comments", {"type": "new_comment", "comment": comment_data}
    )
