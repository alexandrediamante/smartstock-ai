from sqlalchemy.orm import Session
from dataclasses import dataclass
from typing import List, Dict, Any

from app.ai.provider import AIProvider, get_ai_provider, AIResponse
from app.ai.context import build_context
from app.ai.prompts import SYSTEM_PROMPT, build_user_prompt


@dataclass
class AssistantResponse:
    answer: str
    references: List[Dict[str, str]]
    fallback: bool


class StockAssistant:
    """Orchestrates the Stock Assistant - identifies intent, gathers context, calls AI provider."""

    def __init__(self, db: Session):
        self.db = db
        self.provider: AIProvider = get_ai_provider()

    async def answer(self, question: str) -> AssistantResponse:
        """Main entry point - process question and return answer."""
        # Build context from database
        context = build_context(self.db)

        # Build prompts
        user_prompt = build_user_prompt(question, context)

        try:
            # Try AI provider
            response = await self.provider.generate_response(
                system_prompt=SYSTEM_PROMPT,
                user_prompt=user_prompt,
                context=context
            )
        except Exception:
            # Fallback to deterministic provider
            fallback_provider = get_ai_provider()  # This will return FallbackProvider if OpenAI fails
            if isinstance(fallback_provider, type(self.provider)):
                # If same type, create new fallback
                from app.ai.provider import FallbackProvider
                fallback_provider = FallbackProvider()

            response = await fallback_provider.generate_response(
                system_prompt=SYSTEM_PROMPT,
                user_prompt=user_prompt,
                context=context
            )

        return AssistantResponse(
            answer=response.answer,
            references=response.references or context.get("references", []),
            fallback=response.fallback
        )