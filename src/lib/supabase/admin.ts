import { createClient } from '@supabase/supabase-js'

/**
 * Cliente Supabase com Service Role Key — bypass de RLS.
 * Usar EXCLUSIVAMENTE em operações server-side sem contexto de usuário:
 * ingestão de dados, jobs agendados, webhooks.
 * NUNCA expor ao cliente ou usar em rotas acessíveis pelo usuário final.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
