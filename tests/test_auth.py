import pytest


class TestRegister:
    @pytest.mark.asyncio
    async def test_register_success(self, client):
        response = await client.post("/auth/register", json={
            "email": "new@test.com",
            "username": "newuser",
            "password": "qwerty123"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "new@test.com"
        assert data["username"] == "newuser"
        assert data["is_verified"] == False
        assert "password" not in data

    @pytest.mark.asyncio
    async def test_register_duplicate_email(self, client, registered_user):
        response = await client.post("/auth/register", json={
            "email": "user@test.com",
            "username": "another",
            "password": "qwerty123"
        })
        assert response.status_code == 400
        assert "уже существует" in response.json()["detail"]

    @pytest.mark.asyncio
    async def test_register_invalid_email(self, client):
        response = await client.post("/auth/register", json={
            "email": "notanemail",
            "username": "user",
            "password": "qwerty123"
        })
        assert response.status_code == 422


class TestLogin:
    @pytest.mark.asyncio
    async def test_login_success(self, client, registered_user):
        response = await client.post("/auth/login", json={
            "email": "user@test.com",
            "password": "qwerty123"
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    @pytest.mark.asyncio
    async def test_login_wrong_password(self, client, registered_user):
        response = await client.post("/auth/login", json={
            "email": "user@test.com",
            "password": "wrongpassword"
        })
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_login_wrong_email(self, client):
        response = await client.post("/auth/login", json={
            "email": "nobody@test.com",
            "password": "qwerty123"
        })
        assert response.status_code == 401


class TestMe:
    @pytest.mark.asyncio
    async def test_me_success(self, client, user_token):
        response = await client.get("/auth/me", headers={
            "Authorization": f"Bearer {user_token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "user@test.com"

    @pytest.mark.asyncio
    async def test_me_without_token(self, client):
        response = await client.get("/auth/me")
        assert response.status_code == 401

    @pytest.mark.asyncio
    async def test_me_invalid_token(self, client):
        response = await client.get("/auth/me", headers={
            "Authorization": "Bearer invalidtoken"
        })
        assert response.status_code == 401