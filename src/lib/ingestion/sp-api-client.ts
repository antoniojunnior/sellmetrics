/**
 * Cliente para Amazon Selling Partner API (SP-API)
 * Documentação: https://developer-docs.amazon.com/sp-api/docs/reports-api-v2021-06-30-reference
 */

export interface SpApiSalesRecord {
  date: string
  sku: string
  ordersCount: number
  unitsSold: number
  grossSales: number
}

const REGION_ENDPOINTS: Record<string, string> = {
  'us-east-1': 'https://sellingpartnerapi-na.amazon.com',
  'us-west-2': 'https://sellingpartnerapi-na.amazon.com',
  'eu-west-1': 'https://sellingpartnerapi-eu.amazon.com',
  'eu-central-1': 'https://sellingpartnerapi-eu.amazon.com',
  'us-west-1': 'https://sellingpartnerapi-na.amazon.com',
}

export const spApiClient = {
  async getAccessToken() {
    const response = await fetch('https://api.amazon.com/auth/o2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: process.env.AMAZON_SP_API_REFRESH_TOKEN!,
        client_id: process.env.AMAZON_SP_API_CLIENT_ID!,
        client_secret: process.env.AMAZON_SP_API_CLIENT_SECRET!,
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`LWA Auth Failed: ${error}`)
    }

    const data = await response.json() as { access_token: string }
    return data.access_token
  },

  async getSalesAndTrafficReport(
    accountId: string,
    startDate: string,
    endDate: string
  ): Promise<SpApiSalesRecord[]> {
    const clientId = process.env.AMAZON_SP_API_CLIENT_ID
    const region = process.env.AMAZON_SP_API_REGION || 'us-east-1'
    const endpoint = REGION_ENDPOINTS[region] || REGION_ENDPOINTS['us-east-1']
    
    // Fallback para Mock se credenciais forem placeholders
    if (!clientId || clientId.includes('xxx')) {
      console.log(`[SP-API] Gerando dados simulados para ${accountId}...`)
      return this.generateMockData(startDate, endDate)
    }

    console.log(`[SP-API] Iniciando integração real para ${accountId} (${startDate} a ${endDate})`)
    
    try {
      const accessToken = await this.getAccessToken()

      // 1. Criar Relatório
      const createResponse = await fetch(`${endpoint}/reports/2021-06-30/reports`, {
        method: 'POST',
        headers: {
          'x-amz-access-token': accessToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reportType: 'GET_SALES_AND_TRAFFIC_REPORT',
          dataStartTime: `${startDate}T00:00:00Z`,
          dataEndTime: `${endDate}T23:59:59Z`,
          marketplaceIds: ['ATVPDKIKX0DER'], // Default US. Ideal vir do banco.
          reportOptions: {
            dateGranularity: 'DAY',
            asinGranularity: 'SKU'
          }
        })
      })

      if (!createResponse.ok) {
        throw new Error(`Report Creation Failed: ${await createResponse.text()}`)
      }

      const { reportId } = await createResponse.json() as { reportId: string }
      console.log(`[SP-API] Relatório criado: ${reportId}. Aguardando processamento...`)

      // 2. Polling (Aguardar conclusão)
      let reportStatus = 'IN_QUEUE'
      let documentId = ''
      let attempts = 0

      while (attempts < 15) { // Max 150 segundos
        await new Promise(r => setTimeout(resolve => setTimeout(resolve, 10000), 10000))
        attempts++

        const checkResponse = await fetch(`${endpoint}/reports/2021-06-30/reports/${reportId}`, {
          headers: { 'x-amz-access-token': accessToken }
        })
        
        const checkData = await checkResponse.json() as { processingStatus: string, reportDocumentId?: string }
        reportStatus = checkData.processingStatus
        
        if (reportStatus === 'DONE') {
          documentId = checkData.reportDocumentId!
          break
        }
        
        if (['FATAL', 'CANCELLED'].includes(reportStatus)) {
          throw new Error(`Amazon Report Processing failed with status: ${reportStatus}`)
        }
      }

      if (!documentId) throw new Error('Timeout aguardando processamento do relatório Amazon.')

      // 3. Obter URL do Documento
      const docResponse = await fetch(`${endpoint}/reports/2021-06-30/documents/${documentId}`, {
        headers: { 'x-amz-access-token': accessToken }
      })
      const { url: downloadUrl } = await docResponse.json() as { url: string }

      // 4. Baixar e Parsear
      const dataResponse = await fetch(downloadUrl)
      const reportContent = await dataResponse.json() as any

      const records: SpApiSalesRecord[] = []
      
      // Parse do formato Sales & Traffic (simplificado para o mapeamento do banco)
      if (reportContent.reportByAsin) {
        for (const item of reportContent.reportByAsin) {
          records.push({
            date: item.date,
            sku: item.sku,
            ordersCount: item.salesStats.totalOrderItems || 0,
            units_sold: item.salesStats.unitsOrdered || 0,
            grossSales: item.salesStats.orderedProductSales.amount || 0
          } as any)
        }
      }

      return records
    } catch (e: any) {
      console.error(`[SP-API] Erro na integração real: ${e.message}`)
      throw e
    }
  },

  generateMockData(startStr: string, endStr: string): SpApiSalesRecord[] {
    const start = new Date(startStr)
    const end = new Date(endStr)
    const records: SpApiSalesRecord[] = []
    const skus = ['AMZ-PROD-001', 'AMZ-PROD-002']

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0]
      for (const sku of skus) {
        records.push({
          date: dateStr,
          sku: sku,
          ordersCount: Math.floor(Math.random() * 10) + 1,
          unitsSold: Math.floor(Math.random() * 15) + 1,
          grossSales: Math.floor(Math.random() * 500) + 50
        })
      }
    }
    return records
  }
}
