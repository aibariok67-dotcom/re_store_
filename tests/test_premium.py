import pytest


class TestPremium:
    @pytest.mark.asyncio
    async def test_buy_premium_success(self, client, user_token):
        res = await client.post(
            "/premium/buy",
            headers={"Authorization": f"Bearer {user_token}"},
        )
        assert res.status_code == 200
        data = res.json()
        assert data["is_premium"] is True
        assert data["premium_until"] is None
        assert data["banner_url"] is None

    @pytest.mark.asyncio
    async def test_disable_premium_success(self, client, user_token):
        bought = await client.post(
            "/premium/buy",
            headers={"Authorization": f"Bearer {user_token}"},
        )
        assert bought.status_code == 200

        res = await client.post(
            "/premium/disable",
            headers={"Authorization": f"Bearer {user_token}"},
        )
        assert res.status_code == 200
        data = res.json()
        assert data["is_premium"] is False
        assert data["premium_until"] is None
        assert data["banner_url"] is None
        assert data["premium_theme"] == "indigo"

    @pytest.mark.asyncio
    async def test_update_profile_requires_premium(self, client, user_token):
        res = await client.patch(
            "/premium/profile",
            json={"premium_theme": "sky", "banner_url": "some-url"},
            headers={"Authorization": f"Bearer {user_token}"},
        )
        assert res.status_code == 403
        assert "премиум" in res.json().get("detail", "").lower()

    @pytest.mark.asyncio
    async def test_update_profile_success(self, client, user_token):
        bought = await client.post(
            "/premium/buy",
            headers={"Authorization": f"Bearer {user_token}"},
        )
        assert bought.status_code == 200

        res = await client.patch(
            "/premium/profile",
            json={"premium_theme": "emerald", "banner_url": "banner-test-url"},
            headers={"Authorization": f"Bearer {user_token}"},
        )
        assert res.status_code == 200
        data = res.json()
        assert data["is_premium"] is True
        assert data["premium_theme"] == "emerald"
        assert data["banner_url"] == "banner-test-url"

    @pytest.mark.asyncio
    async def test_update_profile_invalid_theme(self, client, user_token):
        bought = await client.post(
            "/premium/buy",
            headers={"Authorization": f"Bearer {user_token}"},
        )
        assert bought.status_code == 200

        res = await client.patch(
            "/premium/profile",
            json={"premium_theme": "not-a-theme", "banner_url": None},
            headers={"Authorization": f"Bearer {user_token}"},
        )
        # Pydantic валидатор выдаёт 422
        assert res.status_code == 422

    @pytest.mark.asyncio
    async def test_status(self, client, user_token):
        res = await client.get(
            "/premium/status",
            headers={"Authorization": f"Bearer {user_token}"},
        )
        assert res.status_code == 200
        data = res.json()
        assert "is_premium" in data

