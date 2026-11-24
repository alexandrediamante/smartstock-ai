from abc import ABC, abstractmethod
from typing import List, Dict, Any
from dataclasses import dataclass

from app.core.config import get_settings


@dataclass
class AIResponse:
    answer: str
    references: List[Dict[str, str]]
    fallback: bool = False


class AIProvider(ABC):
    """Abstract base class for AI providers."""

    @abstractmethod
    async def generate_response(
        self,
        system_prompt: str,
        user_prompt: str,
        context: Dict[str, Any]
    ) -> AIResponse:
        pass

    @abstractmethod
    def is_available(self) -> bool:
        pass


class OpenAIProvider(AIProvider):
    """OpenAI API provider."""

    def __init__(self):
        self.settings = get_settings()
        self.client = None
        if self.settings.openai_api_key:
            try:
                from openai import AsyncOpenAI
                self.client = AsyncOpenAI(
                    api_key=self.settings.openai_api_key,
                    timeout=self.settings.openai_timeout
                )
            except Exception:
                self.client = None

    def is_available(self) -> bool:
        return self.client is not None

    async def generate_response(
        self,
        system_prompt: str,
        user_prompt: str,
        context: Dict[str, Any]
    ) -> AIResponse:
        if not self.is_available():
            raise RuntimeError("OpenAI client not configured")

        try:
            response = await self.client.chat.completions.create(
                model=self.settings.openai_model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
                temperature=0.3,
                max_tokens=1000,
            )

            return AIResponse(
                answer=response.choices[0].message.content or "",
                references=[],
                fallback=False
            )
        except Exception as e:
            raise RuntimeError(f"OpenAI API error: {str(e)}")


class FallbackProvider(AIProvider):
    """Deterministic fallback provider - no external API needed."""

    def is_available(self) -> bool:
        return True

    async def generate_response(
        self,
        system_prompt: str,
        user_prompt: str,
        context: Dict[str, Any]
    ) -> AIResponse:
        # Build deterministic response based on context
        answer = self._build_fallback_response(user_prompt, context)

        return AIResponse(
            answer=answer,
            references=context.get("references", []),
            fallback=True
        )

    def _build_fallback_response(self, question: str, context: Dict[str, Any]) -> str:
        """Generate rule-based response without LLM."""
        q = question.lower()

        if "venc" in q or "expir" in q:
            return self._answer_expiration(context)
        elif "compr" in q or "reposi" in q:
            return self._answer_replenishment(context)
        elif "risco" in q or "perda" in q or "exposi" in q:
            return self._answer_risk(context)
        elif "crític" in q or "critico" in q:
            return self._answer_critical(context)
        else:
            return self._answer_general(context)

    def _answer_expiration(self, context: Dict[str, Any]) -> str:
        risks = context.get("expiration_risks", [])
        if not risks:
            return "Não há lotes com risco de vencimento no período consultado."

        criticos = [r for r in risks if r.get("severity") == "critico"]
        atencao = [r for r in risks if r.get("severity") == "atencao"]

        lines = ["**Lotes com risco de vencimento:**\n"]
        if criticos:
            lines.append(f"🔴 **Críticos ({len(criticos)}):**")
            for r in criticos[:5]:
                lines.append(f"  - {r['productName']} (lote {r['batchCode']}): vence em {r['daysRemaining']} dias, {r['excess']:.0f} un. em risco (R$ {r['exposure']:.2f})")
        if atencao:
            lines.append(f"\n🟡 **Atenção ({len(atencao)}):**")
            for r in atencao[:5]:
                lines.append(f"  - {r['productName']} (lote {r['batchCode']}): vence em {r['daysRemaining']} dias, {r['excess']:.0f} un. em risco (R$ {r['exposure']:.2f})")

        total_exposure = sum(r.get("exposure", 0) for r in risks)
        lines.append(f"\n**Exposição financeira total estimada: R$ {total_exposure:.2f}**")
        lines.append("\n*Recomendação: Priorizar venda dos lotes críticos (FEFO) e avaliar promoções.*")

        return "\n".join(lines)

    def _answer_replenishment(self, context: Dict[str, Any]) -> str:
        suggestions = context.get("replenishment", [])
        if not suggestions:
            return "Nenhuma sugestão de reposição necessária no momento."

        urgentes = [s for s in suggestions if s.get("projectedStock", 0) <= 0]
        atencao = [s for s in suggestions if 0 < s.get("projectedStock", 999) <= s.get("safetyStock", 0)]

        lines = ["**Sugestões de compra:**\n"]
        if urgentes:
            lines.append(f"🔴 **Urgentes - risco de ruptura ({len(urgentes)}):**")
            for s in urgentes[:5]:
                lines.append(f"  - {s['name']}: comprar {s['suggestedQuantity']:.0f} un. (estoque projetado: {s['projectedStock']:.0f})")
        if atencao:
            lines.append(f"\n🟡 **Atenção ({len(atencao)}):**")
            for s in atencao[:5]:
                lines.append(f"  - {s['name']}: comprar {s['suggestedQuantity']:.0f} un. (estoque projetado: {s['projectedStock']:.0f})")

        total_cost = sum(s.get("estimatedCost", 0) for s in suggestions)
        lines.append(f"\n**Custo estimado total: R$ {total_cost:.2f}**")
        lines.append("\n*Nota: Verifique prazos de entrega e negociar com fornecedores.*")

        return "\n".join(lines)

    def _answer_risk(self, context: Dict[str, Any]) -> str:
        risks = context.get("expiration_risks", [])
        total_exposure = sum(r.get("exposure", 0) for r in risks)
        total_excess = sum(r.get("excess", 0) for r in risks)

        return (
            f"**Exposição financeira estimada: R$ {total_exposure:.2f}**\n"
            f"**Quantidade total em risco: {total_excess:.0f} unidades**\n\n"
            "Esta é uma estimativa baseada na venda média dos últimos 7 dias e validade dos lotes. "
            "Valores reais podem variar conforme a demanda real."
        )

    def _answer_critical(self, context: Dict[str, Any]) -> str:
        risks = context.get("expiration_risks", [])
        criticos = [r for r in risks if r.get("severity") == "critico"]

        if not criticos:
            return "Nenhum produto classificado como crítico no momento."

        lines = ["**Produtos classificados como críticos:**\n"]
        for r in criticos[:10]:
            reason = []
            if r.get("daysRemaining", 999) <= 3:
                reason.append(f"vence em {r['daysRemaining']} dias")
            if r.get("exposure", 0) >= 10000:
                reason.append(f"exposição R$ {r['exposure']:.2f}")
            lines.append(f"  - {r['productName']} (lote {r['batchCode']}): {', '.join(reason)}")

        return "\n".join(lines)

    def _answer_general(self, context: Dict[str, Any]) -> str:
        return (
            "Sou o Stock Assistant. Posso ajudar com:\n"
            "- Produtos próximos ao vencimento\n"
            "- Sugestões de compra/reposição\n"
            "- Exposição financeira de riscos\n"
            "- Ações para reduzir perdas\n"
            "- Explicar classificações de criticidade\n\n"
            "Tente perguntar: 'Quais produtos vencem esta semana?' ou 'O que comprar hoje?'"
        )


def get_ai_provider() -> AIProvider:
    """Factory function to get the appropriate AI provider."""
    settings = get_settings()
    if settings.openai_api_key:
        provider = OpenAIProvider()
        if provider.is_available():
            return provider
    return FallbackProvider()