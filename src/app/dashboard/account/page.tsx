export const runtime = 'edge'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { accountRepository } from '@/lib/supabase/repositories/account-repository'
import AccountInfoForm from './components/account-info-form'
import ConnectionStatus from './components/connection-status'
import MembersPanel from './components/members-panel'
import BillingPanel from './components/billing-panel'

interface Props {
  searchParams: Promise<{ success?: string; error?: string; checkout?: string }>
}

export default async function AccountPage({ searchParams }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const account = await accountRepository.getByUserId(user.id)
  if (!account) redirect('/dashboard/onboarding')

  const members = await accountRepository.getMembers(account.id)
  const params = await searchParams

  return (
    <div className="max-w-2xl mx-auto space-y-8 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Conta</h1>
        <p className="text-sm text-gray-500 mt-1">Configurações da sua loja Amazon</p>
      </div>

      {params.success === 'amazon_connected' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800 text-sm">
          SP-API da Amazon conectada com sucesso.
        </div>
      )}
      {params.success === 'ads_connected' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800 text-sm">
          Ads API da Amazon conectada com sucesso.
        </div>
      )}
      {params.error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm">
          Erro na conexão: {params.error}
        </div>
      )}

      <AccountInfoForm account={account} />
      <ConnectionStatus account={account} />
      <MembersPanel account={account} members={members} currentUserId={user.id} />
      <BillingPanel account={account} />
    </div>
  )
}
