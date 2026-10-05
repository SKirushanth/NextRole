import logging
import smtplib
from datetime import datetime, timedelta, timezone
from email.message import EmailMessage

from sqlalchemy.orm import joinedload

from .config import settings
from .database import SessionLocal
from .models import Application, ApplicationStatus
from .worker import celery_app

logger = logging.getLogger(__name__)


def build_reminder_email(to_email: str, application: Application) -> EmailMessage:
    when = application.interview_date.strftime("%A, %d %B %Y at %H:%M UTC")
    msg = EmailMessage()
    msg["Subject"] = f"Interview reminder: {application.job_title} at {application.company_name}"
    msg["From"] = settings.MAIL_FROM
    msg["To"] = to_email
    lines = [
        f"You have an upcoming interview for {application.job_title} at {application.company_name}.",
        "",
        f"When: {when}",
    ]
    if application.job_url:
        lines.append(f"Posting: {application.job_url}")
    if application.notes:
        lines += ["", "Your notes:", application.notes]
    lines += ["", "Good luck!"]
    msg.set_content("\n".join(lines))
    return msg


def send_email(msg: EmailMessage) -> None:
    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as smtp:
        smtp.send_message(msg)


@celery_app.task(name="app.tasks.send_interview_reminders")
def send_interview_reminders() -> int:
    """Email users about interviews starting within REMINDER_HOURS_AHEAD. Returns emails sent."""
    now = datetime.now(timezone.utc)
    window_end = now + timedelta(hours=settings.REMINDER_HOURS_AHEAD)
    sent = 0
    with SessionLocal() as db:
        due = (
            db.query(Application)
            .options(joinedload(Application.owner))
            .filter(
                Application.interview_date.isnot(None),
                Application.interview_date > now,
                Application.interview_date <= window_end,
                Application.reminder_sent.is_(False),
                Application.status.in_([ApplicationStatus.APPLIED, ApplicationStatus.INTERVIEWING]),
            )
            .all()
        )
        for application in due:
            try:
                send_email(build_reminder_email(application.owner.email, application))
            except Exception:
                # Leave reminder_sent False so the next run retries.
                logger.exception("Failed to send reminder for application %s", application.id)
                continue
            application.reminder_sent = True
            db.commit()
            sent += 1
    logger.info("Sent %d interview reminder(s)", sent)
    return sent