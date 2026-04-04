# ADR-003: Snapshot de ADS Congelado na Data

## Status
Aceito (2026-04-04)

## Contexto
A Amazon Ads API redistribui dados de atribuição de vendas por vários dias (ou semanas) após o clique original. Isso faz com que o ACOS e a Conversão de um dia passado mudem constantemente se consultados repetidamente. Para fins de fechamento gerencial e operacional, o usuário precisa de um número estável.

## Decisão
O snapshot diário de ADS será considerado **"congelado"** no momento da captura inicial (D-1). O sistema não reabrirá o histórico de snapshots de ADS para sincronizar atualizações tardias de atribuição da Amazon, a menos que um reprocessamento seja solicitado explicitamente.

## Consequências
- **Positivas:** Estabilidade absoluta dos indicadores de performance; Consistência entre relatórios gerados em momentos diferentes.
- **Negativas:** Pequenas divergências pontuais (<1-2%) podem ocorrer entre o painel oficial da Amazon e o Sellmetrics.
