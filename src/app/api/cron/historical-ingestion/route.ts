export const runtime = 'edge'

import { NextRequest, NextResponse } from 'next/server'
import { ingestionService } from '@/lib/ingestion/ingestion-service'

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('Authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const accountId = process.env.DEFAULT_ACCOUNT_ID
  const marketplaceId = process.env.DEFAULT_MARKETPLACE_ID ?? 'A2Q3Y263D00KWC'
  const adsProfileId = process.env.DEFAULT_ADS_PROFILE_ID ?? ''

  if (!accountId) {
    return NextResponse.json({ error: 'DEFAULT_ACCOUNT_ID not set' }, { status: 500 })
  }

  let startDate: string
  let endDate: string

  try {
    const body = await request.json()
    startDate = body.startDate
    endDate = body.endDate
  } catch {
    return NextResponse.json({ error: 'Body must be JSON with startDate and endDate (YYYY-MM-DD)' }, { status: 400 })
  }

  if (!startDate || !endDate || !/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
    return NextResponse.json({ error: 'startDate and endDate required in YYYY-MM-DD format' }, { status: 400 })
  }

  if (startDate > endDate) {
    return NextResponse.json({ error: 'startDate must be <= endDate' }, { status: 400 })
  }

  try {
    const result = await ingestionService.ingestHistorical(accountId, marketplaceId, adsProfileId, startDate, endDate)
    return NextResponse.json({ ok: true, result })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
