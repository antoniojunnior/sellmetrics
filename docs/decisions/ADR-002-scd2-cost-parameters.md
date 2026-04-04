# ADR-002: SCD2 para Parâmetros de Custo

## Status
Aceito (2026-04-04)

## Contexto
Parâmetros que compõem o custo de mercadoria (COGS), impostos, frete e taxas Amazon variam ao longo do tempo. Se um usuário atualizar o custo de um produto hoje, o cálculo de lucro de vendas ocorridas há três meses não deve ser alterado, sob risco de distorcer a lucratividade real daquele período.

## Decisão
Implementaremos a técnica de **Slowly Changing Dimension Type 2 (SCD2)** para todos os parâmetros de custo na tabela `sku_cost_parameters`. Cada registro terá um intervalo de vigência (`valid_from` e `valid_to`). Novas alterações de custo nunca sobrescreverão dados existentes; elas fecharão o registro atual e criarão um novo.

## Consequências
- **Positivas:** Integridade histórica absoluta; Precisão cirúrgica em relatórios financeiros retroativos.
- **Negativas:** Queries de cálculo tornam-se mais complexas (exigindo JOINs com filtros de data); A interface de configuração de custos precisa gerenciar a lógica de vigência de forma transparente.
