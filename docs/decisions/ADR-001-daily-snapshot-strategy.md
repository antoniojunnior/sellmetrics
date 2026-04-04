# ADR-001: Snapshots Diários como Fonte de Verdade

## Status
Aceito (2026-04-04)

## Contexto
O Sellmetrics precisa oferecer dashboards financeiros de alta performance e consistência histórica para vendedores Amazon. Depender de chamadas de API (SP-API e Ads API) em tempo real para renderizar telas é inviável devido aos limites de taxa (rate limits) da Amazon, latência e a natureza volátil dos dados brutos.

## Decisão
Utilizaremos a estratégia de **Snapshots Diários Persistidos** como nossa única fonte de verdade (Single Source of Truth). O sistema consumirá as APIs da Amazon exclusivamente para popular tabelas locais (`daily_sales_snapshot` e `daily_ads_snapshot`). Uma vez capturado, o dado de um dia é tratado como fato histórico.

## Consequências
- **Positivas:** Performance extrema na renderização de dashboards; Resiliência a quedas temporárias das APIs da Amazon; Capacidade de auditoria histórica.
- **Negativas:** Necessidade de um pipeline de ingestão robusto; Aumento do consumo de armazenamento no banco de dados; Requer lógica explícita para reprocessamento de períodos se necessário.
