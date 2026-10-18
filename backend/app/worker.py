from celery import Celery

from .config import settings

celery_app = Celery("nextrole", broker=settings.REDIS_URL, backend=settings.REDIS_URL)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    include=["app.tasks"],
    beat_schedule={
        "send-interview-reminders": {
            "task": "app.tasks.send_interview_reminders",
            "schedule": 15 * 60,  # every 15 minutes
        },
    },
)