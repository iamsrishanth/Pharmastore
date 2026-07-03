import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/actions/auth';
import { getExpiryStatus } from '@/lib/utils/expiry';
import EmployeeDashboard from '@/components/dashboard/EmployeeDashboard';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function EmployeeDashboardPage() {
  const profile = await getCurrentUser();
  if (!profile) {
    redirect('/login');
  }

  const supabase = await createClient();

  // 1. Fetch total products count
  const { count: totalItems } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true });

  // 2. Fetch stock summaries
  const { data: summaries } = await supabase
    .from('product_stock_summary')
    .select('*');

  const resolvedSummaries = summaries || [];

  // 3. Fetch batches for counting expired/critical lots
  const { data: batches } = await supabase
    .from('batches')
    .select('id, expiry_date, quantity_available')
    .gt('quantity_available', 0);

  const resolvedBatches = batches || [];
  const expiringCount = resolvedBatches.filter((b) => {
    const status = getExpiryStatus(b.expiry_date).status;
    return status === 'expired' || status === 'critical';
  }).length;

  // 4. Fetch products to calculate low stock counts
  const { data: products } = await supabase
    .from('products')
    .select('id, reorder_level');

  const resolvedProducts = products || [];
  const lowStockCount = resolvedProducts.filter((p) => {
    const stock = resolvedSummaries.find((s) => s.product_id === p.id)?.total_stock ?? 0;
    return stock < p.reorder_level;
  }).length;

  return (
    <EmployeeDashboard
      profile={profile}
      stats={{
        totalItems: totalItems || 0,
        lowStockCount,
        expiringCount,
      }}
      productSummaries={resolvedSummaries.map((s) => ({
        product_id: s.product_id,
        name: s.name,
        generic_name: s.generic_name,
        total_stock: s.total_stock,
        nearest_expiry: s.nearest_expiry,
      }))}
    />
  );
}
