from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from auth_app.models import Property
from auth_app.serializers import PropertySerializer
from django.shortcuts import get_object_or_404
from drf_spectacular.utils import extend_schema, OpenApiExample
from rest_framework.permissions import IsAuthenticated, AllowAny


class PropertyViews(APIView):

    def get_permissions(self):
        if self.request.method == "POST":
            return [IsAuthenticated()]
        return [AllowAny()]

    def get(self, requset):

        propeties = Property.objects.all()

        serializer = PropertySerializer(propeties, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, requset):
        serializer = PropertySerializer(data=requset.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ProperyViewsRUD(APIView):

    permission_classes = [IsAuthenticated]

    def put(self, request, pk):
        grenade_class_obj = get_object_or_404(Property, pk=pk)
        serializer = PropertySerializer(grenade_class_obj, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def patch(self, request, pk):
        grenade_class_obj = get_object_or_404(Property, pk=pk)
        serializer = PropertySerializer(
            grenade_class_obj, data=request.data, partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, requset, pk):
        grenade_class_obj = get_object_or_404(Property, pk=pk)
        grenade_class_obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
