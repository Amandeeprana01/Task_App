from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.task import Task
from app.schemas import TaskCreate, TaskUpdate, TaskResponse
from app.websocket_manager import manager

router = APIRouter()

@router.get("/", response_model=List[TaskResponse])
def get_tasks(
    completed: Optional[bool] = None,
    priority: Optional[str] = None,
    category: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Task)
    if completed is not None:
        query = query.filter(Task.completed == completed)
    if priority:
        query = query.filter(Task.priority == priority)
    if category:
        query = query.filter(Task.category == category)
    return query.order_by(Task.created_at.desc()).all()

@router.post("/", response_model=TaskResponse)
async def create_task(task: TaskCreate, db: Session = Depends(get_db)):
    db_task = Task(**task.model_dump())
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    await manager.broadcast("task_created", {
        "id": db_task.id,
        "title": db_task.title,
        "priority": db_task.priority,
        "completed": db_task.completed,
        "category": db_task.category,
        "due_date": db_task.due_date,
    })
    return db_task

@router.get("/{task_id}", response_model=TaskResponse)
def get_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

@router.patch("/{task_id}", response_model=TaskResponse)
async def update_task(task_id: int, task_update: TaskUpdate, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    update_data = task_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(task, field, value)
    db.commit()
    db.refresh(task)
    await manager.broadcast("task_updated", {
        "id": task.id,
        "title": task.title,
        "priority": task.priority,
        "completed": task.completed,
        "category": task.category,
        "due_date": task.due_date,
    })
    return task

@router.delete("/{task_id}")
async def delete_task(task_id: int, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(task)
    db.commit()
    await manager.broadcast("task_deleted", {"id": task_id})
    return {"message": "Task deleted", "id": task_id}
