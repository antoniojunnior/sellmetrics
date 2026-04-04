Você irá atuar como arquiteto técnico sênior em um projeto Next.js 15 + Supabase + TypeScript.
Antes de qualquer código, crie a seguinte estrutura de diretórios e arquivos no repositório:

docs/
  prd/
    prd-amazon-aiox-simplified.md       ← PRD aprovado (conteúdo será fornecido)
  db-spec/
    2026-04-04-schema-v1.sql            ← Schema lógico das tabelas (conteúdo será fornecido)
  decisions/
    ADR-001-daily-snapshot-strategy.md  ← Decisão: snapshots diários como fonte de verdade
    ADR-002-scd2-cost-parameters.md     ← Decisão: SCD2 para parâmetros de custo
    ADR-003-ads-snapshot-frozen.md      ← Decisão: snapshot de ADS não reabre histórico

Para cada ADR, use o template padrão:
- Título
- Status (Aceito)
- Contexto
- Decisão
- Consequências

Ao final, faça commit com a mensagem:
chore(docs): initialize project spec structure and ADRs

Me informe os arquivos criados e seus caminhos exatos.
