import asyncio
import contextlib
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app import models  # noqa: F401 - registers all tables on Base.metadata
from app.common.exceptions import AppError
from app.core.config import settings
from app.modules.auth.router import router as auth_router
from app.modules.chat.router import router as chat_router
from app.modules.forum.router import router as forum_router
from app.modules.groups.router import router as groups_router
from app.modules.matching.router import router as matching_router
from app.modules.profiles.router import router as profiles_router
from app.modules.realtime.router import router as realtime_router
from app.modules.study_requests.router import router as requests_router
from app.modules.study_sessions.reminders import run_reminder_loop
from app.modules.study_sessions.router import router as sessions_router


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    reminders = asyncio.create_task(run_reminder_loop()) if settings.reminders_enabled else None
    yield
    if reminders:
        reminders.cancel()
        with contextlib.suppress(asyncio.CancelledError):
            await reminders


app = FastAPI(title="StudyBuddy API", lifespan=lifespan)


@app.exception_handler(AppError)
async def handle_app_error(_: Request, error: AppError) -> JSONResponse:
    # Same shape as FastAPI's own errors, so the frontend reads `detail` everywhere.
    return JSONResponse(status_code=error.status_code, content={"detail": error.message})


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_methods=["*"],
    allow_headers=["*"],
)

for router in (
    auth_router,
    profiles_router,
    matching_router,
    requests_router,
    chat_router,
    sessions_router,
    groups_router,
    forum_router,
    realtime_router,
):
    app.include_router(router, prefix=settings.api_prefix)


@app.get(f"{settings.api_prefix}/health", tags=["health"])
async def health() -> dict[str, str]:
    return {"status": "ok"}
