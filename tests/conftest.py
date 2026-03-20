import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from core.database import Base, get_db
from main import app

TEST_DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost:5432/re_store_test"


@pytest_asyncio.fixture
async def prepare_database():
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest_asyncio.fixture
async def client(prepare_database):
    engine = prepare_database
    TestSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async def override_get_db():
        async with TestSessionLocal() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def registered_user(client):
    """Регистрируем обычного юзера и возвращаем его данные"""
    response = await client.post("/auth/register", json={
        "email": "user@test.com",
        "username": "testuser",
        "password": "qwerty123"
    })
    return response.json()


@pytest_asyncio.fixture
async def user_token(client, registered_user):
    """Логиним обычного юзера и возвращаем токен"""
    response = await client.post("/auth/login", json={
        "email": "user@test.com",
        "password": "qwerty123"
    })
    return response.json()["access_token"]


@pytest_asyncio.fixture
async def registered_admin(client):
    """Регистрируем админа"""
    response = await client.post("/auth/register", json={
        "email": "admin@test.com",
        "username": "testadmin",
        "password": "admin123"
    })
    # Достаём сессию БД и ставим is_admin = true
    db_override = app.dependency_overrides[get_db]
    async for db in db_override():
        from sqlalchemy import update
        from models.user import User
        await db.execute(
            update(User)
            .where(User.email == "admin@test.com")
            .values(is_admin=True)
        )
        await db.commit()
    return response.json()


@pytest_asyncio.fixture
async def admin_token(client, registered_admin):
    """Логиним админа и возвращаем токен"""
    response = await client.post("/auth/login", json={
        "email": "admin@test.com",
        "password": "admin123"
    })
    return response.json()["access_token"]