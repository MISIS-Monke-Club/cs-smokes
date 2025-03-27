from rest_framework.routers import DefaultRouter


class OptionalSlashRouter(DefaultRouter):
    def __init__(self):
        super().__init__()
        self.trailing_slash = "/?"
