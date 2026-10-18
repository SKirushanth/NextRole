from datetime import datetime, timedelta, timezone

from app import tasks
from app.database import SessionLocal
from app.models import Application, ApplicationStatus, User

from .conftest import register_and_login


def _seed(hours_from_now, status=ApplicationStatus.INTERVIEWING, reminder_sent=False):
    with SessionLocal() as db:
        user = User(email="u@example.com", hashed_password="x")
        application = Application(
            owner=user,
            company_name="Acme",
            job_title="Backend Engineer",
            status=status,
            interview_date=datetime.now(timezone.utc) + timedelta(hours=hours_from_now),
            reminder_sent=reminder_sent,
        )
        db.add_all([user, application])
        db.commit()
        return application.id


def test_reminder_sent_once_for_upcoming_interview(monkeypatch):
    sent = []
    monkeypatch.setattr(tasks, "send_email", lambda msg: sent.append(msg))
    app_id = _seed(hours_from_now=5)

    assert tasks.send_interview_reminders() == 1
    assert sent[0]["To"] == "u@example.com"
    assert "Acme" in sent[0]["Subject"]

    # second run must not send it again
    assert tasks.send_interview_reminders() == 0
    with SessionLocal() as db:
        assert db.get(Application, app_id).reminder_sent is True


def test_no_reminder_outside_window(monkeypatch):
    sent = []
    monkeypatch.setattr(tasks, "send_email", lambda msg: sent.append(msg))
    _seed(hours_from_now=72)
    assert tasks.send_interview_reminders() == 0
    assert sent == []


def test_no_reminder_for_past_interview_or_rejected(monkeypatch):
    sent = []
    monkeypatch.setattr(tasks, "send_email", lambda msg: sent.append(msg))
    _seed(hours_from_now=-2)
    assert tasks.send_interview_reminders() == 0

    with SessionLocal() as db:
        db.query(Application).delete()
        db.query(User).delete()
        db.commit()
    _seed(hours_from_now=5, status=ApplicationStatus.REJECTED)
    assert tasks.send_interview_reminders() == 0
    assert sent == []


def test_failed_send_is_retried_next_run(monkeypatch):
    def boom(msg):
        raise ConnectionError("smtp down")

    monkeypatch.setattr(tasks, "send_email", boom)
    app_id = _seed(hours_from_now=5)
    assert tasks.send_interview_reminders() == 0
    with SessionLocal() as db:
        assert db.get(Application, app_id).reminder_sent is False


def test_rescheduling_resets_reminder_flag(client, monkeypatch):
    monkeypatch.setattr(tasks, "send_email", lambda msg: None)
    headers = register_and_login(client, "owner@example.com")
    soon = (datetime.now(timezone.utc) + timedelta(hours=3)).isoformat()
    app_id = client.post(
        "/api/applications",
        json={"company_name": "Acme", "job_title": "SWE", "interview_date": soon},
        headers=headers,
    ).json()["id"]

    assert tasks.send_interview_reminders() == 1

    later = (datetime.now(timezone.utc) + timedelta(hours=6)).isoformat()
    res = client.patch(f"/api/applications/{app_id}", json={"interview_date": later}, headers=headers)
    assert res.status_code == 200
    assert tasks.send_interview_reminders() == 1  # reminded again after reschedule