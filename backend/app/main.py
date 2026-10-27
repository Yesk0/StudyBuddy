from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import app.models  # noqa: F401 - registers all tables on Base.metadata
from app.core.config import settings
from app.modules.auth.router import router as auth_router
from app.modules.chat.router import router as chat_router
from app.modules.matching.router import router as matching_router
from app.modules.profiles.router import router as profiles_router
from app.modules.realtime.router import router as realtime_router
from app.modules.study_requests.router import router as requests_router
from app.modules.study_sessions.router import router as sessions_router

app = FastAPI(title="StudyBuddy API")

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
    realtime_router,
):
    app.include_router(router, prefix=settings.api_prefix)


@app.get(f"{settings.api_prefix}/health", tags=["health"])
async def health() -> dict[str, str]:
    return {"status": "ok"}
