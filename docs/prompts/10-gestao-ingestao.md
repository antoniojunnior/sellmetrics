Crie a tela de gestão de ingestão em:
src/app/dashboard/ingestion/page.tsx

A tela deve exibir:

1. STATUS DOS SNAPSHOTS
   - Último snapshot de vendas (daily_sales_snapshot): data mais recente disponível por conta/marketplace/SKU
   - Último snapshot de ADS (daily_ads_snapshot): data mais recente disponível
   - Lacunas detectadas: dias sem snapshot no intervalo entre a data mais antiga e hoje

2. AÇÕES DISPONÍVEIS
   - Botão "Atualizar D-1": chama ingestYesterday para a conta atual
     (executa ingestão do dia anterior e atualiza os snapshots)
   - Botão "Carga histórica": abre formulário com startDate e endDate
     e chama ingestHistorical para o intervalo informado
     (com aviso: "Esta operação pode demorar alguns minutos")
   - Botão "Reprocessar período": abre formulário com startDate e endDate
     e reprocessa snapshots daquele intervalo (substitui dados existentes)

3. LOG DE INGESTÃO
   - Tabela com últimas 20 execuções:
     data/hora, tipo (incremental/histórica/reprocessamento), status (sucesso/erro), dias processados, mensagem de erro se houver

Requisitos:
- As ações de ingestão devem ser Server Actions que chamam o ingestion-service
- Mostrar loading/spinner enquanto a ingestão está em andamento
- Não bloquear a UI durante ingestão longa (usar streaming ou polling simples)
- Log de ingestão pode ser uma tabela simples no Supabase:
  ingestion_logs (id, account_id, type, status, days_processed, error_message, executed_at)
  Criar também a migration desta tabela em docs/db/

Ao final, faça commit com:
feat(ingestion): create ingestion status and control screen

Me mostre o arquivo completo e a migration da tabela ingestion_logs.
