Crie ou ajuste os seguintes arquivos de layout e navegação:

1. src/app/dashboard/layout.tsx
   Layout principal do dashboard com:
   - Sidebar lateral com links para:
     - /dashboard/period (ícone: gráfico de barras) — "Painel"
     - /dashboard/settings/costs — "Custos por SKU"
     - /dashboard/settings/fixed-costs — "Custos Fixos"
     - /dashboard/settings/manual-inputs — "Inputs Manuais"
     - /dashboard/ingestion — "Ingestão de Dados"
   - Cabeçalho com nome da aplicação "Sellmetrics" e nome do usuário logado
   - Proteção de rota: redirecionar para /login se não houver sessão ativa

2. src/app/login/page.tsx
   Tela de login simples com:
   - Email e senha
   - Autenticação via Supabase Auth
   - Redirecionar para /dashboard/period após login bem-sucedido

3. src/middleware.ts
   Middleware Next.js para:
   - Proteger todas as rotas /dashboard/* exigindo sessão Supabase
   - Redirecionar para /login se não autenticado
   - Redirecionar para /dashboard/period se já autenticado e tentar acessar /login

4. src/app/dashboard/period/page.tsx (ajuste)
   Garantir que account_id do usuário logado seja usado automaticamente
   em todas as queries, sem precisar informar manualmente.

Requisitos:
- Usar Supabase Auth (já existente no projeto)
- Sidebar responsiva (collapsível em mobile)
- Design limpo e funcional com Tailwind
- Sem bibliotecas de UI externas pesadas

Ao final, faça commit com:
feat(layout): add dashboard navigation, login screen and route protection

Me mostre cada arquivo criado ou ajustado.
