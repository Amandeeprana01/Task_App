from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.database import engine, Base
from app.routers import tasks, websocket

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables on startup
    Base.metadata.create_all(bind=engine)
    yield
    
app = FastAPI(
    title="TaskFlow API",
    description="Real-time Task Manager API",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tasks.router, prefix="/api/tasks", tags=["tasks"])
app.include_router(websocket.router, prefix="/ws", tags=["websocket"])

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "taskflow-backend"}
