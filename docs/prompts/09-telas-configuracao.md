Crie as seguintes telas de configuração em src/app/dashboard/settings/:

1. src/app/dashboard/settings/costs/page.tsx
   Tela: "Parâmetros de Custo por SKU"

   Funcionalidades:
   - Listar todos os SKUs com seus regimes de custo vigentes
   - Para cada SKU mostrar: unit_cost, prep_cost_unit, tax_rate, amazon_fee_unit, valid_from
   - Botão "Novo regime de custo" por SKU:
     - Abre formulário com campos: unit_cost, prep_cost_unit, tax_rate (%), amazon_fee_unit, valid_from
     - Ao salvar: chama createCostParameters do sku-cost-repository
     - O repositório fecha automaticamente o valid_to do regime anterior
   - Link "Ver histórico" por SKU: lista todos os regimes com suas vigências

   Validações:
   - valid_from não pode ser anterior ao valid_from do regime mais recente
   - Todos os campos numéricos devem ser positivos
   - tax_rate deve ser entre 0 e 1 (ou aceitar percentual e converter internamente)

2. src/app/dashboard/settings/fixed-costs/page.tsx
   Tela: "Custos Fixos Mensais"

   Funcionalidades:
   - Listar meses com custos fixos cadastrados
   - Formulário por mês: accounting_fees, rent, amazon_prime, other_fixed_costs
   - Exibir total_fixed_month calculado em tempo real no formulário
   - Ao salvar: chama upsertFixedCostsMonth do fixed-costs-repository

3. src/app/dashboard/settings/manual-inputs/page.tsx
   Tela: "Inputs Manuais de Período"

   Funcionalidades:
   - Formulário por período (start_date, end_date):
     coupon_sales_value, coupon_cost_value, coupon_distributed, coupon_redeemed, manual_notes
   - Listar períodos já cadastrados com seus valores
   - Ao salvar: chama upsertPeriodManualInputs do period-manual-inputs-repository

Requisitos gerais:
- Usar Server Actions para mutações (não API routes)
- Validação com zod antes de persistir
- Feedback de sucesso/erro inline (sem modais pesados)
- Formulários simples, sem bibliotecas de form manager externas
- Navegação entre as três telas via tabs ou sidebar secundária

Ao final, faça commit com:
feat(settings): create cost parameters and manual inputs screens

Me mostre cada arquivo criado.
