# Task Dispatch

A simple full-stack task manager built with **FastAPI**. No database — tasks
are stored in memory for the lifetime of the running server. Includes a
built-in frontend (plain HTML/CSS/JS) so it's a complete, demo-able app, not
just an API.

## Project structure

```
taskapp/
├── main.py            FastAPI app: API routes + serves the frontend
├── requirements.txt
├── render.yaml         Render deployment blueprint (optional)
└── static/
    ├── index.html
    ├── style.css
    └── script.js
```

## Run it locally

```bash
pip install -r requirements.txt
uvicorn main:app --reload
```

Open **http://127.0.0.1:8000** in your browser for the UI, or
**http://127.0.0.1:8000/docs** for the interactive API docs (Swagger).

## API routes

| Method | Route              | Description                          |
|--------|--------------------|---------------------------------------|
| POST   | `/api/tasks`        | Create a task                        |
| GET    | `/api/tasks`        | List tasks (`?completed=true/false`) |
| GET    | `/api/tasks/{id}`   | Get one task                         |
| PUT    | `/api/tasks/{id}`   | Update a task (partial update)       |
| DELETE | `/api/tasks/{id}`   | Delete one task                      |
| DELETE | `/api/tasks`        | Delete all tasks                     |

Data lives in a plain Python dict in `main.py`, so it resets whenever the
server restarts.

## Deploying on Render

1. Push this folder to a GitHub repo.
2. On Render: **New > Web Service**, connect the repo.
3. Settings:
   - **Build command:** `pip install -r requirements.txt`
   - **Start command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Click **Create Web Service** — Render builds and gives you a public URL.

(Or, if your repo has `render.yaml` at the root, use Render's **Blueprint**
deploy option and it'll pick up these settings automatically.)

## Notes

- Storage is in-memory only — every redeploy / restart / scale-to-zero on
  Render's free tier clears the task list. That's expected for an assignment
  demo; swap in a real database later if you need persistence.
- CORS is open (`allow_origins=["*"]`) so the API can also be called from a
  separate frontend if you ever split them apart.
