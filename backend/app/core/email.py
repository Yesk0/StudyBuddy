import asyncio
import logging
import smtplib
from dataclasses import dataclass
from email.message import EmailMessage

from app.core.config import settings

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class OutgoingEmail:
    to: str
    subject: str
    body: str


class EmailError(Exception):
    pass


class Mailer:
    """Sends plain-text emails through SMTP, the log, or an in-memory outbox (tests)."""

    def __init__(self) -> None:
        self.outbox: list[OutgoingEmail] = []

    @property
    def backend(self) -> str:
        if settings.email_backend == "auto":
            return "smtp" if settings.smtp_host else "console"
        return settings.email_backend

    async def send(self, to: str, subject: str, body: str) -> None:
        email = OutgoingEmail(to=to, subject=subject, body=body)
        match self.backend:
            case "memory":
                self.outbox.append(email)
            case "console":
                logger.warning("Email to %s | %s\n%s", to, subject, body)
            case _:
                try:
                    await asyncio.to_thread(_send_smtp, email)
                except (OSError, smtplib.SMTPException) as error:
                    logger.exception("Could not send email to %s", to)
                    raise EmailError("Could not send the email. Try again later.") from error


def _send_smtp(email: OutgoingEmail) -> None:
    message = EmailMessage()
    message["From"] = settings.smtp_from
    message["To"] = email.to
    message["Subject"] = email.subject
    message.set_content(email.body)

    with smtplib.SMTP(settings.smtp_host, settings.smtp_port, timeout=15) as client:
        if settings.smtp_starttls:
            client.starttls()
        if settings.smtp_username:
            client.login(settings.smtp_username, settings.smtp_password)
        client.send_message(message)


mailer = Mailer()
