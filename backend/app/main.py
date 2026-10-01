from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import API_PREFIX, CORS_ORIGINS
from app.core.database import connect
from app.modules import profiles
from app.modules.profiles.models import create_tables


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    connection = connect()
    try:
        create_tables(connection)
    finally:
        connection.close()
    yield


app = FastAPI(title="StudyBuddy API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(profiles.router, prefix=API_PREFIX)
