# ADR-001: Snapshots Diários como Fonte de Verdade

## Status
Aceito

## Contexto
O sistema precisa processar e exibir métricas de performance da Amazon de forma consistente, permitindo auditorias e garantindo que os dados visualizados hoje para uma data passada não mudem arbitrariamente.

## Decisão
Utilizaremos a estratégia de snapshots diários como nossa única fonte de verdade (Single Source of Truth). Cada dia de processamento gera um registro imutável do estado dos dados naquele momento.

## Consequências
- **Positivas:** Histórico imutável e auditável; performance otimizada para consultas históricas; isolamento de falhas em reprocessamentos retroativos.
- **Negativas:** Maior consumo de armazenamento em disco; necessidade de pipelines de ingestão rigorosos para garantir a captura diária.
