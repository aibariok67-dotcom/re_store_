import pytest

@pytest.mark.asyncio
async def test_create_game(client, admin_token):
    response = await client.post("/games/",
        json={"title": "The Witcher 3", "rating": 9.5},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "The Witcher 3"
    assert data["rating"] == 9.5

@pytest.mark.asyncio
async def test_get_games(client, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    await client.post("/games/", json={"title": "Witcher 3"}, headers=headers)
    await client.post("/games/", json={"title": "Cyberpunk 2077"}, headers=headers)

    response = await client.get("/games/")
    assert response.status_code == 200
    assert len(response.json()) == 2

@pytest.mark.asyncio
async def test_get_game_not_found(client):
    response = await client.get("/games/999")
    assert response.status_code == 404

@pytest.mark.asyncio
async def test_search_by_title(client, admin_token):
    headers = {"Authorization": f"Bearer {admin_token}"}
    await client.post("/games/", json={"title": "The Witcher 3"}, headers=headers)
    await client.post("/games/", json={"title": "Cyberpunk 2077"}, headers=headers)

    response = await client.get("/games/?search=witcher")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["title"] == "The Witcher 3"

@pytest.mark.asyncio
async def test_invalid_rating(client, admin_token):
    response = await client.post("/games/",
        json={"title": "Test", "rating": 15},
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 422