import pytest


class TestGetReviews:
    @pytest.mark.asyncio
    async def test_get_reviews_by_game(self, client, admin_token):
        # Создаём игру и отзыв
        headers = {"Authorization": f"Bearer {admin_token}"}
        game = await client.post("/games/",
            json={"title": "Witcher 3", "price": 29.99},
            headers=headers
        )
        game_id = game.json()["id"]

        await client.post("/reviews/admin",
            json={"game_id": game_id, "rating": 9.5, "text": "Отличная игра", "is_paid": False},
            headers=headers
        )

        response = await client.get(f"/reviews/game/{game_id}")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["rating"] == 9.5

    @pytest.mark.asyncio
    async def test_get_reviews_empty(self, client, admin_token):
        # Игра без отзывов
        headers = {"Authorization": f"Bearer {admin_token}"}
        game = await client.post("/games/",
            json={"title": "New Game", "price": 19.99},
            headers=headers
        )
        game_id = game.json()["id"]

        response = await client.get(f"/reviews/game/{game_id}")
        assert response.status_code == 200
        assert response.json() == []


class TestCreateUserReview:
    @pytest.mark.asyncio
    async def test_create_review_success(self, client, admin_token, user_token):
        # Создаём игру как админ
        game = await client.post("/games/",
            json={"title": "Witcher 3", "price": 29.99},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        game_id = game.json()["id"]

        # Создаём отзыв как обычный юзер
        response = await client.post("/reviews/",
            json={"game_id": game_id, "rating": 8.0, "text": "Хорошая игра"},
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["rating"] == 8.0
        assert data["is_paid"] == False
        assert data["price"] is None

    @pytest.mark.asyncio
    async def test_create_review_duplicate(self, client, admin_token, user_token):
        # Нельзя написать два отзыва на одну игру
        game = await client.post("/games/",
            json={"title": "Witcher 3", "price": 29.99},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        game_id = game.json()["id"]

        user_headers = {"Authorization": f"Bearer {user_token}"}
        await client.post("/reviews/",
            json={"game_id": game_id, "rating": 8.0, "text": "Первый отзыв"},
            headers=user_headers
        )

        response = await client.post("/reviews/",
            json={"game_id": game_id, "rating": 7.0, "text": "Второй отзыв"},
            headers=user_headers
        )
        assert response.status_code == 400
        assert "уже оставили отзыв" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_create_review_without_token(self, client, admin_token):
        game = await client.post("/games/",
            json={"title": "Witcher 3", "price": 29.99},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        game_id = game.json()["id"]

        response = await client.post("/reviews/",
            json={"game_id": game_id, "rating": 8.0, "text": "Без токена"}
        )
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_create_review_invalid_rating(self, client, admin_token, user_token):
        game = await client.post("/games/",
            json={"title": "Witcher 3", "price": 29.99},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        game_id = game.json()["id"]

        response = await client.post("/reviews/",
            json={"game_id": game_id, "rating": 15.0, "text": "Неверный рейтинг"},
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert response.status_code == 422


class TestCreateAdminReview:
    @pytest.mark.asyncio
    async def test_create_paid_review(self, client, admin_token):
        game = await client.post("/games/",
            json={"title": "Witcher 3", "price": 29.99},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        game_id = game.json()["id"]

        response = await client.post("/reviews/admin",
            json={"game_id": game_id, "rating": 9.5, "text": "Платный отзыв", "is_paid": True, "price": 4.99},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["is_paid"] == True
        assert data["price"] == 4.99

    @pytest.mark.asyncio
    async def test_create_admin_review_as_user(self, client, admin_token, user_token):
        # Обычный юзер не может создать платный отзыв
        game = await client.post("/games/",
            json={"title": "Witcher 3", "price": 29.99},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        game_id = game.json()["id"]

        response = await client.post("/reviews/admin",
            json={"game_id": game_id, "rating": 9.5, "text": "Попытка", "is_paid": True, "price": 4.99},
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert response.status_code == 403


class TestDeleteReview:
    @pytest.mark.asyncio
    async def test_delete_own_review(self, client, admin_token, user_token):
        # Юзер удаляет свой отзыв
        game = await client.post("/games/",
            json={"title": "Witcher 3", "price": 29.99},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        game_id = game.json()["id"]

        review = await client.post("/reviews/",
            json={"game_id": game_id, "rating": 8.0, "text": "Мой отзыв"},
            headers={"Authorization": f"Bearer {user_token}"}
        )
        review_id = review.json()["id"]

        response = await client.delete(f"/reviews/{review_id}",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert response.status_code == 200

    @pytest.mark.asyncio
    async def test_delete_other_user_review(self, client, admin_token, user_token):
        # Юзер не может удалить чужой отзыв
        game = await client.post("/games/",
            json={"title": "Witcher 3", "price": 29.99},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        game_id = game.json()["id"]

        review = await client.post("/reviews/admin",
            json={"game_id": game_id, "rating": 9.5, "text": "Отзыв админа", "is_paid": False},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        review_id = review.json()["id"]

        response = await client.delete(f"/reviews/{review_id}",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert response.status_code == 400

    @pytest.mark.asyncio
    async def test_admin_delete_any_review(self, client, admin_token, user_token):
        # Админ может удалить любой отзыв
        game = await client.post("/games/",
            json={"title": "Witcher 3", "price": 29.99},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        game_id = game.json()["id"]

        review = await client.post("/reviews/",
            json={"game_id": game_id, "rating": 8.0, "text": "Отзыв юзера"},
            headers={"Authorization": f"Bearer {user_token}"}
        )
        review_id = review.json()["id"]

        response = await client.delete(f"/reviews/{review_id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200