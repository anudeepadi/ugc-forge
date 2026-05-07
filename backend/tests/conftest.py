import os
from unittest.mock import patch

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.database import Base, get_db
from app.main import app

_base = os.environ.get(
    "DATABASE_URL", "postgresql+asyncpg://ugcforge:ugcforge@localhost:5433/ugcforge"
)
TEST_DATABASE_URL = _base.rsplit("/", 1)[0] + "/ugcforge_test"


@pytest_asyncio.fixture
async def db():
    """Fresh engine + tables per test, disposed after."""
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_factory = async_sessionmaker(engine, expire_on_commit=False)
    async with session_factory() as session:
        yield session

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest_asyncio.fixture
async def client(db: AsyncSession):
    async def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db
    with patch("app.api.campaigns.render_script") as mock_task:
        mock_task.delay.return_value = None
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
            yield c
    app.dependency_overrides.clear()
