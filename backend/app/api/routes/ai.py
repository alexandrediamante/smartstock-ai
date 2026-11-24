from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional

from app.core.database import get_db
from app.ai.assistant import StockAssistant

router = APIRouter()


class ChatRequest(BaseModel):
    question: str


class ChatReference(BaseModel):
    type: str  # product, batch, metric
    id: str
    label: str


class ChatResponse(BaseModel):
    answer: str
    references: List[ChatReference] = []
    fallback: bool = False


@router.post("/ai/chat", response_model=ChatResponse)
async def chat_with_assistant(
    request: ChatRequest,
    db: Session = Depends(get_db),
):
    """Chat with the Stock Assistant AI."""
    assistant = StockAssistant(db)
    response = await assistant.answer(request.question)

    return ChatResponse(
        answer=response.answer,
        references=[
            ChatReference(type=r.type, id=r.id, label=r.label)
            for r in response.references
        ],
        fallback=response.fallback,
    )


@router.get("/ai/suggestions")
def get_suggested_questions():
    """Get suggested questions for the Stock Assistant."""
    return {
        "questions": [
            "Quais produtos podem vencer esta semana?",
            "O que preciso comprar hoje?",
            "Quanto temos em mercadorias sob risco?",
            "Quais ações podem reduzir as perdas?",
            "Por que este produto foi classificado como crítico?",
        ]
    }