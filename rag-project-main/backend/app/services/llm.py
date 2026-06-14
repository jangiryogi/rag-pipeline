import httpx
import json
import time
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.models import QueryLog
from app.services.retrieval import retrieve_relevant_chunks, format_context


def build_prompt(question: str, context: str) -> str:
    return f"""You are an expert academic assistant specializing in statistics and mathematics.

Use ONLY the information from the context below to answer the question accurately.
If the answer involves formulas or equations, explain them clearly.
If the answer is not in the context, say "I couldn't find this information in the document."

Context:
{context}

Question: {question}

Provide a clear, detailed answer:"""


async def generate_answer_stream(
    question: str,
    document_id: int,
    user_id: int,
    db: Session
):
    """Stream answer from Ollama and log the query"""

    start_time = time.time()

    # Step 1: Retrieve relevant chunks
    chunks = retrieve_relevant_chunks(question, document_id, db)
    context = format_context(chunks)
    retrieved_text = json.dumps([c["content"] for c in chunks])

    # Step 2: Build prompt
    prompt = build_prompt(question, context)

    # Step 3: Stream response from Ollama
    full_answer = ""

    async with httpx.AsyncClient(timeout=120.0) as client:
        async with client.stream(
            "POST",
            f"{settings.OLLAMA_BASE_URL}/api/generate",
            json={
                "model": settings.LLM_MODEL,
                "prompt": prompt,
                "stream": True,
                "options": {
                    "temperature": 0.1,
                    "num_ctx": 4096
                }
            }
        ) as response:
            async for line in response.aiter_lines():
                if line:
                    data = json.loads(line)
                    token = data.get("response", "")
                    full_answer += token
                    yield f"data: {json.dumps({'token': token})}\n\n"

                    if data.get("done"):
                        break

    # Step 4: Calculate latency
    latency_ms = (time.time() - start_time) * 1000

    # Step 5: Log query to database
    query_log = QueryLog(
        user_id=user_id,
        question=question,
        answer=full_answer,
        retrieved_chunks=retrieved_text,
        latency_ms=latency_ms
    )
    db.add(query_log)
    db.commit()
    db.refresh(query_log)

    # Step 6: Send final metadata to frontend
    yield f"data: {json.dumps({'done': True, 'log_id': query_log.id, 'chunks': chunks})}\n\n"