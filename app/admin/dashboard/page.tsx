import { createClient } from '@/lib/supabase/server';
import { getPendingAdjustments } from '@/lib/actions/stock';
import { getExpiryStatus } from '@/lib/utils/expiry';
import AdminDashboard from '@/components/dashboard/AdminDashboard';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  // 1. Fetch total products count
  const { count: totalProducts } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true });

  // 2. Fetch all batches for valuation and expiry
  const { data: batches } = await supabase
    .from('batches')
    .select('*, products(name, generic_name, reorder_level)');

  const resolvedBatches = batches || [];

  // Compute valuation
  let costValuation = 0;
  let mrpValuation = 0;
  resolvedBatches.forEach((b) => {
    costValuation += b.quantity_available * Number(b.purchase_price);
    mrpValuation += b.quantity_available * Number(b.mrp);
  });

  // Near expiry filtering (expired or critical or warning status)
  const nearExpiryList = resolvedBatches
    .filter((b) => b.quantity_available > 0 && getExpiryStatus(b.expiry_date).status !== 'ok')
    .map((b) => ({
      id: b.id,
      batch_number: b.batch_number,
      expiry_date: b.expiry_date,
      quantity_available: b.quantity_available,
      product_name: b.products?.name || 'Unknown',
    }));

  const nearExpiryCount = nearExpiryList.filter((item) => {
    const status = getExpiryStatus(item.expiry_date).status;
    return status === 'expired' || status === 'critical';
  }).length;

  // 3. Fetch product stock summary and products for low-stock calculation
  const { data: products } = await supabase
    .from('products')
    .select('id, name, generic_name, reorder_level');

  const { data: summary } = await supabase
    .from('product_stock_summary')
    .select('*');

  const resolvedProducts = products || [];
  const resolvedSummary = summary || [];

  const lowStockList: Array<{
    id: string;
    name: string;
    generic_name: string | null;
    total_stock: number;
    reorder_level: number;
  }> = [];

  resolvedProducts.forEach((p) => {
    const stock = resolvedSummary.find((s) => s.product_id === p.id)?.total_stock ?? 0;
    if (stock < p.reorder_level) {
      lowStockList.push({
        id: p.id,
        name: p.name,
        generic_name: p.generic_name,
        total_stock: stock,
        reorder_level: p.reorder_level,
      });
    }
  });

  // Sort low stock list from lowest stock to highest stock relative to reorder level
  lowStockList.sort((a, b) => a.total_stock - b.total_stock);

  // 4. Fetch pending adjustments
  const pendingAdjustments = await getPendingAdjustments();

  return (
    <AdminDashboard
      stats={{
        totalProducts: totalProducts || 0,
        costValuation,
        mrpValuation,
        lowStockCount: lowStockList.length,
        nearExpiryCount,
      }}
      pendingAdjustments={pendingAdjustments}
      lowStockList={lowStockList}
      nearExpiryList={nearExpiryList}
    />
  );
}
