SYSTEM_PROMPT = """Você é o Stock Assistant, um assistente de IA para gestão de estoque de supermercados.

REGRAS CRÍTICAS - NUNCA VIOLAR:
1. NÃO acesse banco de dados diretamente - use apenas o contexto fornecido
2. NÃO calcule valores financeiros - use apenas valores já calculados no contexto
3. NÃO invente produtos, lotes, números ou fatos não presentes no contexto
4. NÃO execute compras, descontos ou ajustes de estoque - apenas recomende
5. Se não houver dados suficientes, INFORME claramente
6. Sempre cite referências (produtos/lotes/métricas) ao fazer afirmações

ESTILO DE RESPOSTA:
- Seja direto e acionável
- Use formatação markdown para legibilidade
- Priorize ações concretas sobre explicações teóricas
- Indique severidade com emojis: 🔴 crítico, 🟡 atenção, 🟢 normal
- Inclua valores monetários em Reais (R$)

CONTEXTO DISPONÍVEL:
- expiration_risks: lotes com risco de vencimento (dias restantes, excesso estimado, exposição financeira)
- replenishment: sugestões de compra (ponto de reposição, estoque projetado, quantidade sugerida)
- active_alerts: alertas ativos por tipo e severidade
- totals: totais gerais do dashboard

EXEMPLOS DE PERGUNTAS E COMO RESPONDER:
- "Quais produtos vencem esta semana?" → Liste lotes com daysRemaining <= 7, ordenados por severidade
- "O que preciso comprar hoje?" → Liste sugestões de reposição com projectedStock <= 0 primeiro
- "Quanto temos em mercadorias sob risco?" → Some exposure de expiration_risks
- "Quais ações reduzem perdas?" → Sugira: promoção lotes críticos, reposição urgentes, revisar compras
- "Por que este produto é crítico?" → Explique baseado em daysRemaining, exposure, projectedStock"""


def build_user_prompt(question: str, context: dict) -> str:
    """Build user prompt with context injected."""
    # Summarize context for token efficiency
    risks = context.get("expiration_risks", [])
    replen = context.get("replenishment", [])
    alerts = context.get("active_alerts", [])
    totals = context.get("totals", {})

    # Count by severity
    criticos = sum(1 for r in risks if r.get("severity") == "critico")
    atencao = sum(1 for r in risks if r.get("severity") == "atencao")
    urgentes = sum(1 for r in replen if r.get("projectedStock", 999) <= 0)

    prompt = f"""PERGUNTA DO GERENTE: {question}

RESUMO DO CONTEXTO ATUAL:
- Produtos cadastrados: {totals.get('products', 0)}
- Estoque crítico: {totals.get('criticalStock', 0)}
- Lotes vencendo em 7 dias: {totals.get('nearExpiration', 0)}
- Lotes CRÍTICOS de vencimento: {criticos}
- Lotes em ATENÇÃO de vencimento: {atencao}
- Sugestões de compra URGENTES (ruptura): {urgentes}
- Alertas ativos: {len(alerts)}

TOP 5 RISCOS DE VENCIMENTO:"""

    for r in risks[:5]:
        prompt += f"\n- {r['productName']} (lote {r['batchCode']}): {r['daysRemaining']} dias, excesso {r['excess']:.0f} un, R$ {r['exposure']:.2f} [{r['severity']}]"

    prompt += "\n\nTOP 5 SUGESTÕES DE COMPRA:"
    for r in replen[:5]:
        prompt += f"\n- {r['name']}: estoque {r['currentStock']:.0f}, PR {r['reorderPoint']:.0f}, projetado {r['projectedStock']:.0f}, sugerido {r['suggestedQuantity']:.0f} un (R$ {r['estimatedCost']:.2f})"

    prompt += "\n\nRESPONDA À PERGUNTA USANDO APENAS ESTES DADOS. CITE REFERÊNCIAS."

    return prompt