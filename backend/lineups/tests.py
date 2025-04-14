from rest_framework.test import APITestCase
from rest_framework import status
from auth_app.models import Map


class TestMapSuccessRespone(APITestCase):
    def setUp(self):
        self.map = Map.objects.create(
            name="Dust II",
            link="https://example.com/dust2",
            image_link="https://example.com/img/dust2.jpg",
        )
        self.map_id = self.map.map_id

        self.valid_data = {
            "name": "Inferno",
            "link": "https://example.com/inferno",
            "image_link": "https://example.com/img/inferno.jpg",
        }
        self.patch_data = {"name": "Anubis"}

    def test_get_maps_list(self):
        response = self.client.get("/api/maps/")
        print("\n[test_get_maps_list] Status:", response.status_code)
        print("Response:", response.data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_get_map_detail(self):
        response = self.client.get(f"/api/maps/{self.map_id}/")
        print(f"\n[test_get_map_detail] Status:", response.status_code)
        print("Response:", response.data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_post_map(self):
        response = self.client.post("/api/maps/", data=self.valid_data)
        print("\n[test_post_map] Status:", response.status_code)
        print("Response:", response.data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_put_map(self):
        response = self.client.put(f"/api/maps/{self.map_id}/", data=self.valid_data)
        print(f"\n[test_put_map] Status:", response.status_code)
        print("Response:", response.data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_patch_map(self):
        response = self.client.patch(f"/api/maps/{self.map_id}/", data=self.patch_data)
        print(f"\n[test_patch_map] Status:", response.status_code)
        print("Response:", response.data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_delete_map(self):
        response = self.client.delete(f"/api/maps/{self.map_id}/")
        print(f"\n[test_delete_map] Status:", response.status_code)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)


class TestMapListExactResponse(APITestCase):
    def setUp(self):
        Map.objects.all().delete()
        self.map = Map.objects.create(
            name="Dust II",
            link="https://example.com/dust2",
            image_link="https://example.com/img/dust2.jpg",
        )

    def test_exact_json_response(self):
        expected = [
            {
                "map_id": self.map.map_id,
                "name": "Dust II",
                "link": "https://example.com/dust2",
                "image_link": "https://example.com/img/dust2.jpg",
            }
        ]

        response = self.client.get("/api/maps/")
        print("\n[test_exact_json_response - list] Status:", response.status_code)
        print("Expected:", expected)
        print("Actual:", response.data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, expected)


class TestMapDetailExactResponse(APITestCase):
    def setUp(self):
        self.map = Map.objects.create(
            name="Inferno",
            link="https://example.com/inferno",
            image_link="https://example.com/img/inferno.jpg",
        )

    def test_exact_json_response(self):
        expected = {
            "map_id": self.map.map_id,
            "name": "Inferno",
            "link": "https://example.com/inferno",
            "image_link": "https://example.com/img/inferno.jpg",
        }

        response = self.client.get(f"/api/maps/{self.map.map_id}/")
        print("\n[test_exact_json_response - detail] Status:", response.status_code)
        print("Expected:", expected)
        print("Actual:", response.data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, expected)


class TestMapCreateExactResponse(APITestCase):
    def test_post_map_and_check_exact_response(self):
        payload = {
            "name": "Mirage",
            "link": "https://example.com/mirage",
            "image_link": "https://example.com/img/mirage.jpg",
        }

        response = self.client.post("/api/maps/", data=payload, format="json")
        print(
            "\n[test_post_map_and_check_exact_response] Status:", response.status_code
        )
        print("Response:", response.data)

        expected = {
            "map_id": response.data["map_id"],
            "name": "Mirage",
            "link": "https://example.com/mirage",
            "image_link": "https://example.com/img/mirage.jpg",
        }

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data, expected)


class TestMapPutExactResponse(APITestCase):
    def setUp(self):
        self.map = Map.objects.create(
            name="Inferno",
            link="https://example.com/inferno",
            image_link="https://example.com/img/inferno.jpg",
        )
        self.map_id = self.map.map_id

    def test_put_map_and_check_exact_response(self):
        updated = {
            "name": "Overpass",
            "link": "https://example.com/overpass",
            "image_link": "https://example.com/img/overpass.jpg",
        }

        response = self.client.put(
            f"/api/maps/{self.map_id}/", data=updated, format="json"
        )
        print("\n[test_put_map_and_check_exact_response] Status:", response.status_code)
        print("Response:", response.data)

        expected = {
            "map_id": self.map_id,
            "name": "Overpass",
            "link": "https://example.com/overpass",
            "image_link": "https://example.com/img/overpass.jpg",
        }

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, expected)


class TestMapPatchExactResponse(APITestCase):
    def setUp(self):
        self.map = Map.objects.create(
            name="Ancient",
            link="https://example.com/ancient",
            image_link="https://example.com/img/ancient.jpg",
        )
        self.map_id = self.map.map_id

    def test_patch_map_and_check_exact_response(self):
        patch_data = {"name": "Vertigo"}

        response = self.client.patch(
            f"/api/maps/{self.map_id}/", data=patch_data, format="json"
        )
        print(
            "\n[test_patch_map_and_check_exact_response] Status:", response.status_code
        )
        print("Response:", response.data)

        expected = {
            "map_id": self.map_id,
            "name": "Vertigo",
            "link": "https://example.com/ancient",
            "image_link": "https://example.com/img/ancient.jpg",
        }

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, expected)


class TestMapDeleteExactResponse(APITestCase):
    def setUp(self):
        self.map = Map.objects.create(
            name="Train",
            link="https://example.com/train",
            image_link="https://example.com/img/train.jpg",
        )
        self.map_id = self.map.map_id

    def test_delete_map(self):
        response = self.client.delete(f"/api/maps/{self.map_id}/")
        print(f"\n[test_delete_map] DELETE Status:", response.status_code)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        get_response = self.client.get(f"/api/maps/{self.map_id}/")
        print(f"[test_delete_map] GET after delete Status:", get_response.status_code)
        self.assertEqual(get_response.status_code, status.HTTP_404_NOT_FOUND)
