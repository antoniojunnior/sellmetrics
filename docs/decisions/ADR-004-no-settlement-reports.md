# ADR-004: Abstração de Custos Amazon (Sem Settlement Reports)

## Status
Aceito (2026-04-04)

## Contexto
Os Settlement Reports da Amazon (relatórios de pagamento) possuem um desalinhamento temporal severo em relação às datas de venda efetiva, dificultando a conciliação diária de lucratividade. Além disso, a estrutura de taxas da Amazon é complexa e granular.

## Decisão
Não utilizaremos os Settlement Reports como fonte primária de custos variáveis no MVP. Em vez disso, as taxas da Amazon (Comissão + FBA) serão **parametrizadas manualmente** pelo usuário (como um valor consolidado por unidade) e versionadas via SCD2.

## Consequências
- **Positivas:** Simplicidade extrema no cálculo de margem em tempo real; Independência de relatórios financeiros de baixa frequência (quinzenais).
- **Negativas:** Dependência direta da qualidade e precisão dos parâmetros informados manualmente pelo operador; Risco de divergência se houver mudanças drásticas de taxas não refletidas pelo usuário.
