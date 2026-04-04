Crie testes para o period-metrics-service em:
src/lib/services/__tests__/period-metrics-service.test.ts

Cenários obrigatórios a cobrir:

1. CENÁRIO BASE — período simples com 1 SKU
   - 5 dias de snapshots de vendas
   - 5 dias de snapshots de ADS
   - 1 regime de custo vigente em todo o período
   - custos fixos do mês configurados
   - inputs manuais de cupom configurados
   Esperado: todos os 20+ indicadores calculados corretamente

2. CENÁRIO SCD2 — mudança de custo no meio do período
   - 10 dias de snapshots
   - Regime de custo A vigente nos primeiros 5 dias
   - Regime de custo B vigente nos últimos 5 dias
   Esperado: COGS calculado com custo correto por dia, não com o custo atual

3. CENÁRIO DE ZEROS — período sem ADS
   - Snapshots de vendas presentes
   - Snapshots de ADS zerados
   Esperado: ACOS = 0, TACOS = 0, Conversão = 0 (sem divisão por zero)

4. CENÁRIO SEM CUSTO — SKU sem parâmetro cadastrado
   - Snapshots de vendas presentes
   - Nenhum registro em sku_cost_parameters para o SKU
   Esperado: COGS = null, indicadores dependentes = null, não zero

5. CENÁRIO MULTI-MÊS — período atravessando dois meses
   - Período: 25/03 a 05/04 (12 dias, atravessando março e abril)
   - Custos fixos de março e abril configurados com valores diferentes
   Esperado: rateio proporcional correto por mês

Use mocks para os repositórios (não depender do banco real nos testes).
Usar Jest ou Vitest, conforme já configurado no projeto.

Ao final, faça commit com:
test(services): add period metrics calculation tests

Me mostre o arquivo de testes completo com todos os cenários.
