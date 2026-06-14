from sqlalchemy.orm import Session
from sqlalchemy import text
from sentence_transformers import SentenceTransformer
from app.models.models import DocumentChunk, Document
from app.core.config import settings

# Reuse the same embedding model
embedding_model = SentenceTransformer(settings.EMBEDDING_MODEL)

def get_query_embedding(query: str) -> list[float]:
    """Convert user question into a vector embedding"""
    embedding = embedding_model.encode(query)
    return embedding.tolist()

def retrieve_relevant_chunks(
    query: str,
    document_id: int,
    db: Session,
    top_k: int = 8
) -> list[dict]:
    """Find the most relevant chunks for a given query using vector similarity"""

    # Step 1: Convert query to embedding
    query_embedding = get_query_embedding(query)

    # Step 2: Search for similar chunks using cosine similarity
    results = db.execute(
        text("""
            SELECT
                dc.id,
                dc.content,
                dc.chunk_index,
                1 - (dc.embedding <=> CAST(:embedding AS vector)) as similarity
            FROM document_chunks dc
            WHERE dc.document_id = :document_id
            ORDER BY dc.embedding <=> CAST(:embedding AS vector)
            LIMIT :top_k
        """),
        {
            "embedding": str(query_embedding),
            "document_id": document_id,
            "top_k": top_k
        }
    ).fetchall()

    # Step 3: Format results
    chunks = []
    for row in results:
        chunks.append({
            "id": row.id,
            "content": row.content,
            "chunk_index": row.chunk_index,
            "similarity": round(row.similarity, 4)
        })

    print("CHUNK SCORES:", [(c["chunk_index"], c["similarity"]) for c in chunks])
    chunks = [c for c in chunks if c["similarity"] > 0.0]
    return chunks


def format_context(chunks: list[dict]) -> str:
    """Format retrieved chunks into a context string for the LLM"""
    context = ""
    for i, chunk in enumerate(chunks):
        context += f"\n[Source {i+1}]:\n{chunk['content']}\n"
    return context