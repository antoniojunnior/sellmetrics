import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { accountRepository } from '@/lib/supabase/repositories/account-repository'
import OnboardingWizard from './components/onboarding-wizard'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  let account = await accountRepository.getByUserId(user.id)

  // Auto-create account on first signup
  if (!account) {
    account = await accountRepository.createForUser(user.id)
  }

  if (account.onboarding_completed) {
    redirect('/dashboard/period')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Bem-vindo ao Sellmetrics</h1>
          <p className="text-gray-500 mt-2 text-sm">Configure sua conta em 4 passos</p>
        </div>
        <OnboardingWizard account={account} userId={user.id} />
      </div>
    </div>
  )
}
