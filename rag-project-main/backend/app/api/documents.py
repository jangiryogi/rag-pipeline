from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.models import Document
from app.services.ingestion import ingest_document

router = APIRouter()

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    user_id: int = 1,  # hardcoded for now, will add auth later
    db: Session = Depends(get_db)
):
    """Upload a PDF document and ingest it into the RAG pipeline"""

    # Validate file type
    if not (file.filename.endswith(".pdf") or file.filename.endswith(".txt")):
        raise HTTPException(status_code=400, detail="Only PDF and TXT files are supported")
    
    # Read file bytes
    file_bytes = await file.read()

    # Run ingestion pipeline
    document = ingest_document(
        filename=file.filename,
        file_bytes=file_bytes,
        owner_id=user_id,
        db=db
    )

    return {
        "message": "Document uploaded and processed successfully",
        "document_id": document.id,
        "filename": document.filename
    }


@router.get("/")
def list_documents(
    user_id: int = 1,
    db: Session = Depends(get_db)
):
    """List all uploaded documents"""
    documents = db.query(Document).filter(
        Document.owner_id == user_id
    ).all()

    return [
        {
            "id": doc.id,
            "filename": doc.filename,
            "created_at": doc.created_at
        }
        for doc in documents
    ]


@router.delete("/{document_id}")
def delete_document(
    document_id: int,
    user_id: int = 1,
    db: Session = Depends(get_db)
):
    """Delete a document and all its chunks"""
    document = db.query(Document).filter(
        Document.id == document_id,
        Document.owner_id == user_id
    ).first()

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    db.delete(document)
    db.commit()

    return {"message": "Document deleted successfully"}