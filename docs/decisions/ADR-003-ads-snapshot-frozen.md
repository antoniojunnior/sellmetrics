# ADR-003: Snapshot de ADS não Reabre Histórico

## Status
Aceito

## Contexto
A Amazon Advertising API pode atualizar dados de performance de anúncios por vários dias após o evento. No entanto, o fechamento financeiro e a conciliação de snapshots exigem um ponto de corte estável.

## Decisão
O snapshot de dados de ADS será considerado "congelado" após sua captura inicial (ou após uma janela curta de estabilização pré-definida). Não reabriremos o histórico de snapshots para sincronizar atualizações tardias da Amazon que ocorram após o fechamento do snapshot diário.

## Consequências
- **Positivas:** Consistência absoluta com relatórios de fechamento gerados anteriormente; previsibilidade de processamento.
- **Negativas:** Pequenas divergências pontuais (<1%) podem ocorrer entre o painel da Amazon (que é dinâmico) e o sistema (que é estático/snapshot).
