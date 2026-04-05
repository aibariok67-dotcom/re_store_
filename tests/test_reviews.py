import pytest


class TestGetReviews:
    @pytest.mark.asyncio
    async def test_get_reviews_by_game(self, client, admin_token, user_token):
        game = await client.post(
            "/games/",
            json={"title": "Witcher 3"},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        game_id = game.json()["id"]

        await client.post(
            "/reviews/",
            json={"game_id": game_id, "rating": 9.5, "text": "Отличная игра"},
            headers={"Authorization": f"Bearer {user_token}"},
        )

        response = await client.get(f"/reviews/game/{game_id}")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["rating"] == 9.5

    @pytest.mark.asyncio
    async def test_get_reviews_empty(self, client, admin_token):
        game = await client.post(
            "/games/",
            json={"title": "New Game"},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        game_id = game.json()["id"]

        response = await client.get(f"/reviews/game/{game_id}")
        assert response.status_code == 200
        assert response.json() == []


class TestCreateUserReview:
    @pytest.mark.asyncio
    async def test_create_review_success(self, client, admin_token, user_token):
        game = await client.post(
            "/games/",
            json={"title": "Witcher 3"},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        game_id = game.json()["id"]

        response = await client.post(
            "/reviews/",
            json={"game_id": game_id, "rating": 8.0, "text": "Хорошая игра"},
            headers={"Authorization": f"Bearer {user_token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["rating"] == 8.0
        assert data["text"] == "Хорошая игра"

    @pytest.mark.asyncio
    async def test_create_review_duplicate(self, client, admin_token, user_token):
        game = await client.post(
            "/games/",
            json={"title": "Witcher 3"},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        game_id = game.json()["id"]

        user_headers = {"Authorization": f"Bearer {user_token}"}
        await client.post(
            "/reviews/",
            json={"game_id": game_id, "rating": 8.0, "text": "Первый отзыв"},
            headers=user_headers,
        )

        response = await client.post(
            "/reviews/",
            json={"game_id": game_id, "rating": 7.0, "text": "Второй отзыв"},
            headers=user_headers,
        )
        assert response.status_code == 409
        assert "уже существует" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_create_review_without_token(self, client, admin_token):
        game = await client.post(
            "/games/",
            json={"title": "Witcher 3"},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        game_id = game.json()["id"]

        response = await client.post(
            "/reviews/",
            json={"game_id": game_id, "rating": 8.0, "text": "Без токена"},
        )
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_create_review_invalid_rating(self, client, admin_token, user_token):
        game = await client.post(
            "/games/",
            json={"title": "Witcher 3"},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        game_id = game.json()["id"]

        response = await client.post(
            "/reviews/",
            json={"game_id": game_id, "rating": 15.0, "text": "Неверный рейтинг"},
            headers={"Authorization": f"Bearer {user_token}"},
        )
        assert response.status_code == 422


class TestDeleteReview:
    @pytest.mark.asyncio
    async def test_delete_own_review(self, client, admin_token, user_token):
        game = await client.post(
            "/games/",
            json={"title": "Witcher 3"},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        game_id = game.json()["id"]

        review = await client.post(
            "/reviews/",
            json={"game_id": game_id, "rating": 8.0, "text": "Мой личный отзыв"},
            headers={"Authorization": f"Bearer {user_token}"},
        )
        review_id = review.json()["id"]

        response = await client.delete(
            f"/reviews/{review_id}",
            headers={"Authorization": f"Bearer {user_token}"},
        )
        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_delete_other_user_review(self, client, admin_token, user_token):
        other = await client.post(
            "/auth/register",
            json={
                "email": "other@test.com",
                "username": "otheruser",
                "password": "qwerty123",
            },
        )
        assert other.status_code == 200
        other_login = await client.post(
            "/auth/login",
            json={"email": "other@test.com", "password": "qwerty123"},
        )
        other_token = other_login.json()["access_token"]

        game = await client.post(
            "/games/",
            json={"title": "Witcher 3"},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        game_id = game.json()["id"]

        review = await client.post(
            "/reviews/",
            json={"game_id": game_id, "rating": 9.5, "text": "Отзыв юзера"},
            headers={"Authorization": f"Bearer {user_token}"},
        )
        review_id = review.json()["id"]

        response = await client.delete(
            f"/reviews/{review_id}",
            headers={"Authorization": f"Bearer {other_token}"},
        )
        assert response.status_code == 403

    @pytest.mark.asyncio
    async def test_admin_delete_any_review(self, client, admin_token, user_token):
        game = await client.post(
            "/games/",
            json={"title": "Witcher 3"},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        game_id = game.json()["id"]

        review = await client.post(
            "/reviews/",
            json={"game_id": game_id, "rating": 8.0, "text": "Отзыв юзера"},
            headers={"Authorization": f"Bearer {user_token}"},
        )
        review_id = review.json()["id"]

        response = await client.delete(
            f"/reviews/{review_id}",
            headers={"Authorization": f"Bearer {admin_token}"},
        )
        assert response.status_code == 200