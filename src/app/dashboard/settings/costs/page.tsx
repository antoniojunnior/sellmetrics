import { saveSkuCost } from '../actions'
import { skuCostRepository } from '@/lib/supabase/repositories/sku-cost-repository'

export default async function SkuCostsPage() {
  const accountId = 'default-account'
  const marketplaceId = 'ATVPDKIKX0DER'
  
  // Em um caso real, buscaríamos todos os SKUs conhecidos da account/marketplace
  // Para demonstração, buscaremos o histórico de um SKU exemplo se existir
  const skus = ['SKU-EXAMPLE-001']
  const costs = await Promise.all(skus.map(sku => skuCostRepository.getCostForDate(accountId, marketplaceId, sku, '2026-04-04')))

  return (
    <div className="p-6 space-y-8">
      <header>
        <h1 className="text-xl font-bold text-slate-800">Parâmetros de Custo por SKU</h1>
        <p className="text-sm text-slate-500">Gerencie os custos de aquisição e taxas (SCD2).</p>
      </header>

      <section className="bg-slate-50 p-6 rounded-lg border border-slate-200">
        <h2 className="text-sm font-bold uppercase mb-4 text-slate-600">Novo Regime de Custo</h2>
        <form action={saveSkuCost} className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 items-end">
          <input type="hidden" name="account_id" value={accountId} />
          <input type="hidden" name="marketplace_id" value={marketplaceId} />
          
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500">SKU</label>
            <input name="sku" type="text" className="w-full rounded border-slate-300 text-sm" placeholder="SKU-123" required />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500">Custo (COGS)</label>
            <input name="unit_cost" type="number" step="0.01" className="w-full rounded border-slate-300 text-sm" required />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500">Prep Unit.</label>
            <input name="prep_cost_unit" type="number" step="0.01" className="w-full rounded border-slate-300 text-sm" required />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500">Imposto (%)</label>
            <input name="tax_rate" type="number" step="0.01" className="w-full rounded border-slate-300 text-sm" required />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500">Taxa Amazon</label>
            <input name="amazon_fee_unit" type="number" step="0.01" className="w-full rounded border-slate-300 text-sm" required />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500">Vigência (A partir de)</label>
            <input name="valid_from" type="date" className="w-full rounded border-slate-300 text-sm" required />
          </div>
          <div className="md:col-span-full lg:col-span-1">
            <button type="submit" className="w-full bg-indigo-600 text-white py-2 px-4 rounded text-sm font-bold hover:bg-indigo-700 transition">
              Salvar
            </button>
          </div>
        </form>
      </section>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">SKU</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">COGS</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Prep</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Taxa (%)</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">FBA/Ref.</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase">Vigência</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200 text-sm">
            {costs.filter(c => c !== null).map((cost) => (
              <tr key={cost!.id}>
                <td className="px-6 py-4 font-medium text-slate-900">{cost!.sku}</td>
                <td className="px-6 py-4">R$ {cost!.unit_cost.toFixed(2)}</td>
                <td className="px-6 py-4">R$ {cost!.prep_cost_unit.toFixed(2)}</td>
                <td className="px-6 py-4">{(cost!.tax_rate * 100).toFixed(1)}%</td>
                <td className="px-6 py-4">R$ {cost!.amazon_fee_unit.toFixed(2)}</td>
                <td className="px-6 py-4">{cost!.valid_from}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
