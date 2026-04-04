# Changelog — Sellmetrics

Todas as mudanças relevantes no projeto serão documentadas neste arquivo.

## [1.0.0] - 2026-04-04

### Adicionado
- **Arquitetura Base:** Inicialização do projeto Next.js 15 com TypeScript e Tailwind CSS.
- **Banco de Dados (Supabase):** 
  - Migrações para snapshots de vendas e ADS.
  - Implementação de SCD2 para parâmetros de custo.
  - Tabelas de custos fixos, inputs manuais e logs de ingestão.
  - Configuração de Row Level Security (RLS) para multi-tenant por `account_id`.
- **Camada de Dados:** 
  - Repositórios tipados para acesso ao banco via Supabase server.
  - Lógica de rateio proporcional de custos fixos por período.
- **Serviços de Negócio:** 
  - `periodMetricsService` para cálculo de todos os indicadores financeiros e operacionais (20+ métricas).
- **Pipeline de Ingestão:** 
  - Clientes para Amazon SP-API e Ads API com retry exponencial.
  - Serviço de ingestão histórica em lotes e incremental diária (D-1).
- **Interface de Usuário:** 
  - Dashboard de análise por período com filtros de data e SKU.
  - Telas de configuração para custos SKU, custos fixos e inputs manuais.
  - Tela de gestão de ingestão com logs e status em tempo real.
- **Segurança e Autenticação:** 
  - Integração com Supabase Auth.
  - Middleware de proteção de rotas `/dashboard/*`.
  - Tela de login e redirecionamentos automáticos.
- **Documentação:** 
  - PRD completo.
  - ADR-001 até ADR-004 formalizados.
  - Configuração de ambiente de testes com Jest.
