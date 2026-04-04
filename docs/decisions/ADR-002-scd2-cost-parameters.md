# ADR-002: SCD2 para Parâmetros de Custo

## Status
Aceito

## Contexto
Parâmetros que compõem o custo de mercadoria e operação (impostos, frete, custos fixos) variam ao longo do tempo. Calcular o lucro de uma venda passada usando o custo atual geraria margens incorretas.

## Decisão
Implementaremos a técnica de Slowly Changing Dimension Type 2 (SCD2) para todos os parâmetros de custo. Cada alteração de custo criará uma nova versão do registro com data de início e fim de validade.

## Consequências
- **Positivas:** Rastreabilidade total da lucratividade histórica; precisão cirúrgica em relatórios financeiros retroativos.
- **Negativas:** Queries de JOIN mais complexas (exigindo filtros de data entre `valid_from` e `valid_to`); maior complexidade na lógica de aplicação.
