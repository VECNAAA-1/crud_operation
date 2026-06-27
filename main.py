"""
Task Dispatch — a simple FastAPI task manager with a built-in frontend.
------------------------------------------------------------------------
No database — tasks live in memory in a Python dict. Data resets when
the server restarts. Built to be deployed as-is on Render.

Local run:
    pip install -r requirements.txt
    uvicorn main:app --reload

Then open http://127.0.0.1:8000 in your browser.
"""

from fastapi import FastAPI, HTTPException, status
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional
from itertools import count
from pathlib import Path

app = FastAPI(
    title="Task Dispatch API",
    description="A simple in-memory CRUD API for managing tasks.",
    version="1.0.0",
)

# Allow the frontend (served from anywhere) to call the API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "static"

# ---------------------------------------------------------------------------
# In-memory "database"
# ---------------------------------------------------------------------------
tasks_db: dict[int, dict] = {}
id_counter = count(1)  # auto-incrementing IDs starting at 1


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------
class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, example="Buy groceries")
    description: Optional[str] = Field(None, example="Milk, eggs, bread")
    completed: bool = Field(False, example=False)


class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, example="Buy groceries and fruits")
    description: Optional[str] = Field(None, example="Milk, eggs, bread, apples")
    completed: Optional[bool] = Field(None, example=True)


class Task(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    completed: bool = False


# ---------------------------------------------------------------------------
# API routes (prefixed with /api so they don't clash with the frontend)
# ---------------------------------------------------------------------------

@app.post("/api/tasks", response_model=Task, status_code=status.HTTP_201_CREATED, tags=["Tasks"])
def create_task(task: TaskCreate):
    """Create a new task."""
    new_id = next(id_counter)
    new_task = {"id": new_id, **task.dict()}
    tasks_db[new_id] = new_task
    return new_task


@app.get("/api/tasks", response_model=list[Task], tags=["Tasks"])
def get_all_tasks(completed: Optional[bool] = None):
    """Get all tasks. Optionally filter with ?completed=true/false."""
    if completed is None:
        return list(tasks_db.values())
    return [t for t in tasks_db.values() if t["completed"] == completed]


@app.get("/api/tasks/{task_id}", response_model=Task, tags=["Tasks"])
def get_task(task_id: int):
    """Get a single task by its ID."""
    task = tasks_db.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail=f"Task with id {task_id} not found")
    return task


@app.put("/api/tasks/{task_id}", response_model=Task, tags=["Tasks"])
def update_task(task_id: int, task_update: TaskUpdate):
    """Update an existing task (partial update — only send fields you want to change)."""
    task = tasks_db.get(task_id)
    if not task:
        raise HTTPException(status_code=404, detail=f"Task with id {task_id} not found")

    update_data = task_update.dict(exclude_unset=True)
    task.update(update_data)
    tasks_db[task_id] = task
    return task


@app.delete("/api/tasks/{task_id}", tags=["Tasks"])
def delete_task(task_id: int):
    """Delete a task by its ID."""
    if task_id not in tasks_db:
        raise HTTPException(status_code=404, detail=f"Task with id {task_id} not found")
    del tasks_db[task_id]
    return {"message": f"Task {task_id} deleted successfully"}


@app.delete("/api/tasks", tags=["Tasks"])
def delete_all_tasks():
    """Delete ALL tasks (use with caution)."""
    tasks_db.clear()
    return {"message": "All tasks deleted successfully"}


# ---------------------------------------------------------------------------
# Frontend — serve the static UI
# ---------------------------------------------------------------------------
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


@app.get("/", include_in_schema=False)
def serve_frontend():
    return FileResponse(STATIC_DIR / "index.html")
