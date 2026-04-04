Crie a tela principal do dashboard em:
src/app/dashboard/period/page.tsx

A tela deve:

1. Permitir ao usuário selecionar intervalo de datas (startDate, endDate)
   e opcionalmente filtrar por SKU. Usar campos de data nativos do HTML
   com valores padrão de "últimos 30 dias".

2. Chamar o period-metrics-service com os parâmetros selecionados
   (importado de src/lib/services/period-metrics-service.ts).

3. Exibir os indicadores organizados nos seguintes blocos visuais:

BLOCO 1 — Cabeçalho do período
  - Intervalo selecionado (início, fim, dias)
  - Filtro de SKU (se aplicável)

BLOCO 2 — Cards de destaque (linha de KPIs principais)
  - Receita Bruta (gross_sales)
  - Receita Líquida (revenue_net)
  - Lucro do Período (profit_period)
  - Margem pós ADS (margin_post_ads em %)
  - ACOS
  - TACOS
  - Faturamento/Dia
  - Lucro/Dia (net_per_day)

BLOCO 3 — Volume & Pedidos
  - Vendas (R$), Unidades, Pedidos
  Exibir em 3 cards lado a lado

BLOCO 4 — ADS & Performance
  - ADS (R$), Vendas ADS (R$), Cliques ADS
  - ACOS, TACOS, Conversão ADS
  Exibir em tabela ou grid 2x3

BLOCO 5 — Cupons
  - Vendas Cupom, Custo Cupom
  - Cupons Distribuídos, Cupons Resgatados, Resgate (%)
  Exibir em cards compactos

BLOCO 6 — Custos & Margens
  Exibir como "waterfall" vertical mostrando a construção do resultado:
  - Receita Bruta
  - (−) COGS do período (Investimento Vendido)
  - (−) Prep total
  - (−) Imposto total
  - (−) Taxa Amazon total
  - (−) Custo Cupom
  = Total Custo Variável
  = Receita Líquida
  - Margem de Contribuição (%)
  - (−) ADS
  = Margem pós ADS (%)
  - (−) Custos Fixos do Período
  = Lucro do Período
  - Markup

BLOCO 7 — Rentabilidade
  - Lucro/Receita (%)
  - Lucro/Investimento (%)

Requisitos técnicos:
- Server Component para busca de dados; sem useEffect nem useState para dados
- Skeleton loading enquanto dados carregam (Suspense)
- Valores monetários formatados em R$ com 2 casas decimais
- Percentuais formatados com 1 casa decimal e símbolo %
- Indicadores com valor null exibir "—" (dado insuficiente), não zero
- Cores semânticas: verde para positivo, vermelho para negativo, cinza para neutro
- Layout responsivo (mobile-first, Tailwind)
- Não criar componentes de UI desnecessários; priorizar clareza sobre abstração

Ao final, faça commit com:
feat(dashboard): create period analysis main screen

Me mostre o arquivo completo.
