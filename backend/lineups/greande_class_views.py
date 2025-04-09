from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from auth_app.models import GrenadeClass
from auth_app.serializers import GrenadeClassSerializer


class GrenadeClasses(APIView):
    def get(self, request):
        grenade_classes = GrenadeClass.objects.all()
        serializer = GrenadeClassSerializer(grenade_classes, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    

    def post(self,request):
        serializer=GrenadeClassSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

