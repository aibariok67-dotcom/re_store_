import pytest

@pytest.mark.asyncio
async def test_create_game(client):
    response = await client.post("/games/", json={
        "title": "The Witcher 3",
        "price": 29.99,
        "rating": 9.5
    })
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "The Witcher 3"
    assert data["price"] == 29.99
    assert data["rating"] == 9.5

@pytest.mark.asyncio
async def test_get_games(client):
    await client.post("/games/", json={"title": "Witcher 3", "price": 29.99})
    await client.post("/games/", json={"title": "Cyberpunk 2077", "price": 49.99})

    response = await client.get("/games/")
    assert response.status_code == 200
    assert len(response.json()) == 2

@pytest.mark.asyncio
async def test_get_game_not_found(client):
    response = await client.get("/games/999")
    assert response.status_code == 404

@pytest.mark.asyncio
async def test_search_by_title(client):
    await client.post("/games/", json={"title": "The Witcher 3", "price": 29.99})
    await client.post("/games/", json={"title": "Cyberpunk 2077", "price": 49.99})

    response = await client.get("/games/?search=witcher")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["title"] == "The Witcher 3"

@pytest.mark.asyncio
async def test_filter_by_price(client):
    await client.post("/games/", json={"title": "Cheap Game", "price": 5.99})
    await client.post("/games/", json={"title": "Expensive Game", "price": 99.99})

    response = await client.get("/games/?max_price=10")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["title"] == "Cheap Game"

@pytest.mark.asyncio
async def test_invalid_rating(client):
    response = await client.post("/games/", json={"title": "Test", "price": 10.0, "rating": 15})
    assert response.status_code == 422

@pytest.mark.asyncio
async def test_invalid_price(client):
    response = await client.post("/games/", json={"title": "Test", "price": -5})
    assert response.status_code == 422