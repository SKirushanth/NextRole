# NextRole: Job Application Tracker

Track job applications, interview dates and notes, with automatic email reminders before interviews.

## Architecture

```
Browser ──▶ web (nginx + React) ──/api──▶ api (FastAPI) ──▶ PostgreSQL
                                             │
                                             ▼
                                           Redis ◀── beat (every 15 min)
                                             │
                                             ▼
                                        worker (Celery) ──SMTP──▶ MailHog (dev inbox)
```

| Service   | Tech                     | Purpose                                      |
|-----------|--------------------------|----------------------------------------------|
| `web`     | React + Vite, nginx      | UI, and proxies `/api` to the backend        |
| `api`     | FastAPI, SQLAlchemy, JWT | REST API: auth and applications              |
| `db`      | PostgreSQL 16            | Storage                                      |
| `redis`   | Redis 7                  | Celery broker                                |
| `worker`  | Celery                   | Sends interview reminder emails              |
| `beat`    | Celery beat              | Triggers the reminder check every 15 minutes |
| `mailhog` | MailHog                  | Catches emails in development                |

## Run everything

Requires Docker Desktop.

```bash
docker compose up --build
```

| What            | Where                      |
|-----------------|----------------------------|
| App             | http://localhost:8080      |
| API docs        | http://localhost:8000/docs |
| Reminder emails | http://localhost:8025      |

Stop with `Ctrl+C`, or `docker compose down`. Add `-v` to also delete the database.

## Develop without rebuilding images

Run only the infrastructure in Docker and the code locally:

```bash
docker compose up -d db redis mailhog
# backend: cd backend && uvicorn app.main:app --reload
# frontend: cd frontend && npm install && npm run dev
```
For local backend runs, set `DATABASE_URL` in `backend/.env`. The database is only reachable from other containers unless you publish its port in `docker-compose.yml`.

## Tests

```bash
cd backend
pip install -r requirements.txt
pytest
```
Tests run against SQLite, so no services are needed.

## Roadmap

- [x] API, background worker, React UI
- [x] Docker Compose
- [ ] CI with GitHub Actions
- [ ] Database migrations (Alembic)
- [ ] Infrastructure as code (Terraform) and cloud deployment
- [ ] Monitoring (Prometheus and Grafana)