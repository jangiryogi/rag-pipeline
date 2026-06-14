from sentence_transformers import SentenceTransformer
from sqlalchemy.orm import Session
from app.models.models import Document, DocumentChunk
from app.core.config import settings

embedding_model = SentenceTransformer(settings.EMBEDDING_MODEL)

def extract_text_from_pdf(file_bytes: bytes, filename: str = "") -> str:
    if filename.endswith(".txt"):
        return file_bytes.decode('utf-8')
    import fitz
    import pytesseract
    from PIL import Image
    doc = fitz.open(stream=file_bytes, filetype="pdf")
    text = ""
    for page in doc:
        page_text = page.get_text().strip()
        if page_text and len(page_text) > 50:
            text += page_text + "\n"
        else:
            pix = page.get_pixmap(dpi=300)
            img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
            text += pytesseract.image_to_string(img) + "\n"
    doc.close()
    return text

def chunk_text(text: str, chunk_size: int = 300, overlap: int = 100) -> list[str]:
    words = text.split()
    chunks = []
    i = 0
    while i < len(words):
        chunks.append(" ".join(words[i:i + chunk_size]))
        i += chunk_size - overlap
    return chunks

def create_embeddings(chunks: list[str]) -> list[list[float]]:
    return embedding_model.encode(chunks).tolist()

def ingest_document(filename: str, file_bytes: bytes, owner_id: int, db: Session) -> Document:
    text = extract_text_from_pdf(file_bytes, filename)
    document = Document(filename=filename, content=text[:5000], owner_id=owner_id)
    db.add(document)
    db.commit()
    db.refresh(document)
    chunks = chunk_text(text)
    embeddings = create_embeddings(chunks)
    for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
        db.add(DocumentChunk(document_id=document.id, content=chunk, embedding=embedding, chunk_index=i))
    db.commit()
    return document
