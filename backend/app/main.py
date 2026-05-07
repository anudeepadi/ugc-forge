from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.router import api_router
from app.config import settings
import app.models  # noqa: F401


@asynccontextmanager
async def lifespan(app: FastAPI):
    Path(settings.local_storage_path).mkdir(parents=True, exist_ok=True)
    yield


app = FastAPI(title="UGC Forge API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")

renders_path = Path(settings.local_storage_path)
renders_path.mkdir(parents=True, exist_ok=True)
app.mount("/renders", StaticFiles(directory=str(renders_path)), name="renders")
