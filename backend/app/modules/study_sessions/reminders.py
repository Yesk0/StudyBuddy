import asyncio
import logging
from datetime import datetime, timedelta

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import SessionFactory
from app.core.email import EmailError, mailer
from app.core.time import format_local, utcnow
from app.modules.groups.service import groups_by_id
from app.modules.profiles.service import get_summaries
from app.modules.study_sessions import repository
from app.modules.study_sessions.models import StudySession
from app.modules.study_sessions.service import ACCEPTED, session_participants
from app.modules.users import repository as users

logger = logging.getLogger(__name__)

REMIND_BEFORE = timedelta(hours=24)


async def _with_whom(
    session: AsyncSession, study_session: StudySession, user_id: int, participants: list[int]
) -> str:
    if study_session.group_id is not None:
        groups = await groups_by_id(session, [study_session.group_id])
        group = groups.get(study_session.group_id)
        return f"your group “{group.name}”" if group else "your group"
    names = await get_summaries(session, [uid for uid in participants if uid != user_id])
    return ", ".join(summary.full_name for summary in names.values()) or "your study partner"


def _reminder_text(study_session: StudySession, with_whom: str) -> tuple[str, str]:
    where = "Online" if study_session.format == "online" else "In person"
    if study_session.location:
        where = f"{where} · {study_session.location}"
    when = format_local(study_session.starts_at)
    subject = f"Reminder: {study_session.title} on {when}"
    body = (
        f"Hi!\n\nThis is a reminder about your study session with {with_whom}.\n\n"
        f"{study_session.title}\n"
        f"When: {when} ({study_session.duration_minutes} min)\n"
        f"Where: {where}\n\n"
        f"Open StudyBuddy: {settings.app_url}/sessions\n"
    )
    return subject, body


async def _remind(session: AsyncSession, study_session: StudySession) -> int:
    participants = await session_participants(session, study_session)
    sent = 0
    for user in await users.list_by_ids(session, participants):
        subject, body = _reminder_text(
            study_session, await _with_whom(session, study_session, user.id, participants)
        )
        try:
            await mailer.send(user.email, subject, body)
            sent += 1
        except EmailError:
            logger.warning("Reminder for session %s to user %s failed", study_session.id, user.id)
    return sent


async def send_due_reminders(session: AsyncSession, now: datetime | None = None) -> int:
    """Emails every participant of confirmed sessions starting within 24 hours, once."""
    now = now or utcnow()
    due = await repository.list_needing_reminder(session, ACCEPTED, now, now + REMIND_BEFORE)
    sent = 0
    for study_session in due:
        # Claim the session first so a reminder is never sent twice.
        claimed = await repository.claim_reminder(session, study_session.id, now)
        await session.commit()
        if claimed:
            sent += await _remind(session, study_session)
    return sent


async def run_reminder_loop() -> None:
    while True:
        try:
            async with SessionFactory() as session:
                await send_due_reminders(session)
        except Exception:
            logger.exception("Sending session reminders failed")
        await asyncio.sleep(settings.reminder_check_seconds)
