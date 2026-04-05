/**
 * Cliente para Amazon Selling Partner API (SP-API) - Orders Focus
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
  'eu-west-1': 'https://sellingpartnerapi-eu.amazon.com',
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
    const data = await response.json() as { access_token: string }
    return data.access_token
  },

  /**
   * Nova abordagem: Busca pedidos e agrega em memória para gerar o snapshot diário.
   */
  async getSalesDataByOrders(
    accountId: string,
    startDate: string,
    endDate: string
  ): Promise<SpApiSalesRecord[]> {
    const clientId = process.env.AMAZON_SP_API_CLIENT_ID
    const region = process.env.AMAZON_SP_API_REGION || 'us-east-1'
    const endpoint = REGION_ENDPOINTS[region] || REGION_ENDPOINTS['us-east-1']
    const marketplaceId = 'ATVPDKIKX0DER' // Ideal vir da configuração

    if (!clientId || clientId.includes('xxx')) {
      return this.generateMockData(startDate, endDate)
    }

    try {
      const accessToken = await this.getAccessToken()
      
      // 1. Buscar Pedidos no intervalo
      // Filtramos por status para evitar pedidos cancelados no cálculo de receita
      const ordersUrl = `${endpoint}/orders/v0/orders?` + new URLSearchParams({
        CreatedAfter: `${startDate}T00:00:00Z`,
        CreatedBefore: `${endDate}T23:59:59Z`,
        MarketplaceIds: marketplaceId,
        OrderStatuses: 'Unshipped,PartiallyShipped,Shipped,InvoiceUnconfirmed'
      })

      const ordersResponse = await fetch(ordersUrl, {
        headers: { 'x-amz-access-token': accessToken }
      })
      const ordersData = await ordersResponse.json() as any
      const orders = ordersData.payload?.Orders || []

      // Mapa para agregar dados: { "YYYY-MM-DD": { "SKU": { units, sales, orders } } }
      const aggregationMap: Record<string, Record<string, any>> = {}

      for (const order of orders) {
        const dateStr = order.PurchaseDate.split('T')[0]
        
        // 2. Para cada pedido, buscar os itens (para pegar SKU e Preço)
        const itemsUrl = `${endpoint}/orders/v0/orders/${order.AmazonOrderId}/orderItems`
        const itemsResponse = await fetch(itemsUrl, {
          headers: { 'x-amz-access-token': accessToken }
        })
        const itemsData = await itemsResponse.json() as any
        const items = itemsData.payload?.OrderItems || []

        if (!aggregationMap[dateStr]) aggregationMap[dateStr] = {}

        for (const item of items) {
          const sku = item.SellerSKU
          if (!aggregationMap[dateStr][sku]) {
            aggregationMap[dateStr][sku] = { units: 0, sales: 0, orders: 0, orderIds: new Set() }
          }

          aggregationMap[dateStr][sku].units += item.QuantityOrdered
          aggregationMap[dateStr][sku].sales += Number(item.ItemPrice?.Amount || 0)
          aggregationMap[dateStr][sku].orderIds.add(order.AmazonOrderId)
        }
        
        // Pequeno delay para evitar Rate Limit (Orders API é restritiva)
        await new Promise(r => setTimeout(r, 500)) 
      }

      // 3. Converter o mapa para o formato SpApiSalesRecord[]
      const results: SpApiSalesRecord[] = []
      Object.keys(aggregationMap).forEach(date => {
        Object.keys(aggregationMap[date]).forEach(sku => {
          const agg = aggregationMap[date][sku]
          results.push({
            date,
            sku,
            unitsSold: agg.units,
            grossSales: agg.sales,
            ordersCount: agg.orderIds.size
          })
        })
      })

      return results
    } catch (e: any) {
      console.error(`[SP-API Orders] Erro: ${e.message}`)
      throw e
    }
  },

  generateMockData(startStr: string, endStr: string): SpApiSalesRecord[] {
    // Mantendo o mock idêntico ao anterior para consistência
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
          ordersCount: Math.floor(Math.random() * 5) + 1,
          unitsSold: Math.floor(Math.random() * 8) + 1,
          grossSales: Math.floor(Math.random() * 300) + 100
        })
      }
    }
    return records
  }
}
