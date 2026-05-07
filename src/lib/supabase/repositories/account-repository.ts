import { createClient } from '../server'
import { createAdminClient } from '../admin'
import { Account, AccountMember, AccountRole } from '../types'

export const accountRepository = {
  async getByUserId(userId: string): Promise<Account | null> {
    // Use admin client to bypass RLS — auth check is the caller's responsibility
    const admin = createAdminClient()

    // Primary: find by owner_id (Phase 1 accounts)
    const { data: byOwner } = await admin
      .from('accounts')
      .select('*')
      .eq('owner_id', userId)
      .maybeSingle()

    if (byOwner) return byOwner as Account

    // Fallback: Phase 0 accounts where id = auth.uid()
    const { data: byId } = await admin
      .from('accounts')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    return byId as Account | null
  },

  async createForUser(userId: string): Promise<Account> {
    const admin = createAdminClient()
    // Use userId as account id for backward compat with settings pages (account_id = auth.uid())
    const accountId = userId

    const { data, error } = await admin
      .from('accounts')
      .insert({
        id: accountId,
        owner_id: userId,
        marketplace_id: 'A2Q3Y263D00KWC',
        ads_profile_id: '',
        active: true,
        plan_id: 'free',
        trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        onboarding_completed: false,
        onboarding_step: 1,
      })
      .select()
      .single()

    if (error) throw new Error(`Failed to create account: ${error.message}`)

    // Create owner membership
    await admin.from('account_members').insert({
      account_id: accountId,
      user_id: userId,
      role: 'owner',
      accepted_at: new Date().toISOString(),
    })

    return data as Account
  },

  async getById(accountId: string): Promise<Account | null> {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('accounts')
      .select('*')
      .eq('id', accountId)
      .maybeSingle()

    if (error) throw new Error(`Failed to fetch account: ${error.message}`)
    return data as Account | null
  },

  async update(accountId: string, fields: Partial<Omit<Account, 'id' | 'created_at'>>): Promise<void> {
    const supabase = await createClient()
    const { error } = await supabase
      .from('accounts')
      .update(fields)
      .eq('id', accountId)

    if (error) throw new Error(`Failed to update account: ${error.message}`)
  },

  async updateEncryptedTokens(accountId: string, tokens: {
    sp_api_refresh_token_enc?: string
    ads_refresh_token_enc?: string
  }): Promise<void> {
    const admin = createAdminClient()
    const { error } = await admin
      .from('accounts')
      .update(tokens)
      .eq('id', accountId)

    if (error) throw new Error(`Failed to update tokens: ${error.message}`)
  },

  async updateBilling(accountId: string, fields: {
    asaas_customer_id?: string | null
    asaas_subscription_id?: string | null
    plan_id?: string
    trial_ends_at?: string | null
  }): Promise<void> {
    const admin = createAdminClient()
    const { error } = await admin
      .from('accounts')
      .update(fields)
      .eq('id', accountId)

    if (error) throw new Error(`Failed to update billing fields: ${error.message}`)
  },

  async advanceOnboarding(accountId: string, step: number): Promise<void> {
    const supabase = await createClient()
    const completed = step >= 4
    const { error } = await supabase
      .from('accounts')
      .update({ onboarding_step: step, onboarding_completed: completed })
      .eq('id', accountId)

    if (error) throw new Error(`Failed to advance onboarding: ${error.message}`)
  },

  // ─── Members ────────────────────────────────────────────────────────────────

  async getMembers(accountId: string): Promise<AccountMember[]> {
    try {
      const supabase = await createClient()
      const { data, error } = await supabase
        .from('account_members')
        .select('*')
        .eq('account_id', accountId)
        .order('invited_at', { ascending: true })

      if (error) return []
      return (data ?? []) as AccountMember[]
    } catch {
      return []
    }
  },

  async inviteMember(accountId: string, userId: string, role: AccountRole): Promise<void> {
    const supabase = await createClient()
    const { error } = await supabase
      .from('account_members')
      .upsert({ account_id: accountId, user_id: userId, role }, {
        onConflict: 'account_id,user_id'
      })

    if (error) throw new Error(`Failed to invite member: ${error.message}`)
  },

  async removeMember(accountId: string, userId: string): Promise<void> {
    const supabase = await createClient()
    const { error } = await supabase
      .from('account_members')
      .delete()
      .eq('account_id', accountId)
      .eq('user_id', userId)
      .neq('role', 'owner')

    if (error) throw new Error(`Failed to remove member: ${error.message}`)
  },

  // Returns the first account the user belongs to (as owner or member).
  async getAccountForRequest(userId: string): Promise<Account | null> {
    // Primary path: user is owner
    const owned = await accountRepository.getByUserId(userId)
    if (owned) return owned

    // Secondary path: user is a member (not owner)
    const supabase = await createClient()
    const { data: member } = await supabase
      .from('account_members')
      .select('account_id')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle()

    if (!member) return null
    return accountRepository.getById(member.account_id)
  },
}
