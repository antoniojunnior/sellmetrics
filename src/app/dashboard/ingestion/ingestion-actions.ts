'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { ingestionService } from '@/lib/ingestion/ingestion-service'

export async function runIngestYesterday(accountId: string, marketplaceId: string, adsProfileId: string) {
  const supabase = await createClient()
  
  try {
    const result = await ingestionService.ingestYesterday(accountId, marketplaceId, adsProfileId)
    
    await supabase.from('ingestion_logs').insert({
      account_id: accountId,
      type: 'incremental',
      status: 'success',
      days_processed: 1
    })
    
    revalidatePath('/dashboard/ingestion')
    return { success: true }
  } catch (e: any) {
    await supabase.from('ingestion_logs').insert({
      account_id: accountId,
      type: 'incremental',
      status: 'error',
      days_processed: 0,
      error_message: e.message
    })
    return { error: e.message }
  }
}

export async function runIngestHistorical(formData: FormData) {
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

    revalidatePath('/dashboard/ingestion')
    return { success: true }
  } catch (e: any) {
    await supabase.from('ingestion_logs').insert({
      account_id: accountId,
      type: 'historical',
      status: 'error',
      error_message: e.message
    })
    return { error: e.message }
  }
}
