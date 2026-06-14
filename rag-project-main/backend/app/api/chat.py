from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.core.database import get_db
from app.models.models import QueryLog
from app.services.llm import generate_answer_stream

router = APIRouter()

class QuestionRequest(BaseModel):
    question: str
    document_id: int
    user_id: int = 1

class FeedbackRequest(BaseModel):
    log_id: int
    feedback: int  # 1 = thumbs up, -1 = thumbs down

@router.post("/ask")
async def ask_question(
    request: QuestionRequest,
    db: Session = Depends(get_db)
):
    """Ask a question about a document and get a streamed answer"""

    return StreamingResponse(
        generate_answer_stream(
            question=request.question,
            document_id=request.document_id,
            user_id=request.user_id,
            db=db
        ),
        media_type="text/event-stream"
    )


@router.post("/feedback")
def submit_feedback(
    request: FeedbackRequest,
    db: Session = Depends(get_db)
):
    """Submit thumbs up/down feedback for a query"""
    log = db.query(QueryLog).filter(
        QueryLog.id == request.log_id
    ).first()

    if not log:
        raise HTTPException(status_code=404, detail="Query log not found")

    log.feedback = request.feedback
    db.commit()

    return {"message": "Feedback submitted successfully"}


@router.get("/logs")
def get_query_logs(
    user_id: int = 1,
    db: Session = Depends(get_db)
):
    """Get all query logs for the dashboard"""
    logs = db.query(QueryLog).filter(
        QueryLog.user_id == user_id
    ).order_by(QueryLog.created_at.desc()).all()

    return [
        {
            "id": log.id,
            "question": log.question,
            "answer": log.answer,
            "latency_ms": log.latency_ms,
            "faithfulness_score": log.faithfulness_score,
            "relevance_score": log.relevance_score,
            "feedback": log.feedback,
            "created_at": log.created_at
        }
        for log in logs
    ]