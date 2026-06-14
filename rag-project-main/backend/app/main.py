from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import engine, Base
from app.api import documents, chat
from app.core.config import settings

# Create all database tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="RAG Pipeline API",
    description="A full-stack RAG system with evals and monitoring",
    version="1.0.0"
)

# Allow React frontend to talk to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(documents.router, prefix="/api/documents", tags=["documents"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])

@app.get("/")
def root():
    return {"message": "RAG Pipeline API is running"}

@app.get("/health")
def health():
    return {"status": "healthy"}