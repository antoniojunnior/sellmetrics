'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { ingestionService } from '@/lib/ingestion/ingestion-service'

export async function runIngestYesterday(formData: FormData): Promise<void> {
  const supabase = await createClient()
  const accountId = formData.get('account_id') as string
  const marketplaceId = formData.get('marketplace_id') as string
  const adsProfileId = formData.get('ads_profile_id') as string
  
  try {
    await ingestionService.ingestYesterday(accountId, marketplaceId, adsProfileId)
    
    await supabase.from('ingestion_logs').insert({
      account_id: accountId,
      type: 'incremental',
      status: 'success',
      days_processed: 1
    })
  } catch (e: any) {
    await supabase.from('ingestion_logs').insert({
      account_id: accountId,
      type: 'incremental',
      status: 'error',
      days_processed: 0,
      error_message: e.message
    })
  }

  revalidatePath('/dashboard/ingestion')
}

export async function runIngestHistorical(formData: FormData): Promise<void> {
  const supabase = await createClient()
  const accountId = formData.get('account_id') as string
  const marketplaceId = formData.get('marketplace_id') as string
  const adsProfileId = formData.get('ads_profile_id') as string
  const startDate = formData.get('startDate') as string
  const endDate = formData.get('endDate') as string

  try {
    await ingestionService.ingestHistorical(accountId, marketplaceId, adsProfileId, startDate, endDate)
    
    const diff = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 3600 * 24)) + 1

    await supabase.from('ingestion_logs').insert({
      account_id: accountId,
      type: 'historical',
      status: 'success',
      days_processed: diff
    })
  } catch (e: any) {
    const errorMessage = e.message || 'Erro desconhecido na ingestão'
    console.error('Ingestion Action Error:', errorMessage)
    
    await supabase.from('ingestion_logs').insert({
      account_id: accountId,
      type: 'historical',
      status: 'error',
      days_processed: 0,
      error_message: errorMessage
    })
  }

  revalidatePath('/dashboard/ingestion')
}
