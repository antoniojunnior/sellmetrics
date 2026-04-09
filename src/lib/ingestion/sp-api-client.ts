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

const MARKETPLACE_IDS = [
  'A2Q3Y263D00KWC', // Brasil
  'ATVPDKIKX0DER', // USA
]

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

  async getSalesDataByOrders(
    accountId: string,
    startDate: string,
    endDate: string
  ): Promise<{ aggregated: SpApiSalesRecord[], rawItems: any[] }> {
    const clientId = process.env.AMAZON_SP_API_CLIENT_ID
    const region = process.env.AMAZON_SP_API_REGION || 'us-east-1'
    const endpoint = REGION_ENDPOINTS[region] || REGION_ENDPOINTS['us-east-1']

    if (!clientId || clientId.includes('xxx')) {
      const mock = this.generateMockData(startDate, endDate)
      return { aggregated: mock, rawItems: [] }
    }

    try {
      const accessToken = await this.getAccessToken()
      const aggregationMap: Record<string, Record<string, any>> = {}
      const rawItemsList: any[] = []

      for (const mktId of MARKETPLACE_IDS) {
        console.log(`[SP-API Orders] Buscando pedidos no Marketplace: ${mktId}`)
        
        const ordersUrl = `${endpoint}/orders/v0/orders?` + new URLSearchParams({
          CreatedAfter: `${startDate}T00:00:00Z`,
          CreatedBefore: `${endDate}T23:59:59Z`,
          MarketplaceIds: mktId,
          OrderStatuses: 'Pending,Unshipped,PartiallyShipped,Shipped,InvoiceUnconfirmed'
        })

        const ordersResponse = await fetch(ordersUrl, {
          headers: { 'x-amz-access-token': accessToken }
        })
        const ordersData = await ordersResponse.json() as any
        const orders = ordersData.payload?.Orders || []

        for (const order of orders) {
          const dateStr = order.PurchaseDate.split('T')[0]
          
          const itemsUrl = `${endpoint}/orders/v0/orders/${order.AmazonOrderId}/orderItems`
          const itemsResponse = await fetch(itemsUrl, {
            headers: { 'x-amz-access-token': accessToken }
          })
          const itemsData = await itemsResponse.json() as any
          const items = itemsData.payload?.OrderItems || []

          if (!aggregationMap[dateStr]) aggregationMap[dateStr] = {}

          for (const item of items) {
            const sku = item.SellerSKU || 'SKU-DESCONHECIDO'
            
            rawItemsList.push({
              account_id: accountId,
              marketplace_id: mktId,
              amazon_order_id: order.AmazonOrderId,
              purchase_date: order.PurchaseDate,
              sku: sku,
              quantity: item.QuantityOrdered || 0,
              item_price: Number(item.ItemPrice?.Amount || 0),
              order_status: order.OrderStatus
            })

            if (!aggregationMap[dateStr][sku]) {
              aggregationMap[dateStr][sku] = { units: 0, sales: 0, orders: 0, orderIds: new Set() }
            }
            aggregationMap[dateStr][sku].units += (item.QuantityOrdered || 0)
            aggregationMap[dateStr][sku].sales += Number(item.ItemPrice?.Amount || 0)
            aggregationMap[dateStr][sku].orderIds.add(order.AmazonOrderId)
          }
          await new Promise(r => setTimeout(r, 500)) 
        }
      }

      const aggregatedResults: SpApiSalesRecord[] = []
      Object.keys(aggregationMap).forEach(date => {
        Object.keys(aggregationMap[date]).forEach(sku => {
          const agg = aggregationMap[date][sku]
          aggregatedResults.push({
            date,
            sku,
            unitsSold: agg.units,
            grossSales: agg.sales,
            ordersCount: agg.orderIds.size
          })
        })
      })

      return { aggregated: aggregatedResults, rawItems: rawItemsList }
    } catch (e: any) {
      console.error(`[SP-API Orders] Erro Fatal: ${e.message}`)
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
          ordersCount: Math.floor(Math.random() * 5) + 1,
          unitsSold: Math.floor(Math.random() * 8) + 1,
          grossSales: Math.floor(Math.random() * 300) + 100
        })
      }
    }
    return records
  }
}
