import { createClient } from '@/lib/supabase/server';
import { getExpiryStatus } from '@/lib/utils/expiry';
import AlertsClient from '@/components/inventory/AlertsClient';

export const dynamic = 'force-dynamic';

export default async function EmployeeAlertsPage() {
  const supabase = await createClient();

  // 1. Fetch low stock items
  const { data: products } = await supabase
    .from('products')
    .select('id, name, generic_name, reorder_level, unit');

  const { data: summaries } = await supabase
    .from('product_stock_summary')
    .select('*');

  const resolvedProducts = products || [];
  const resolvedSummaries = summaries || [];

  const lowStockItems: Array<{
    product_id: string;
    name: string;
    generic_name: string | null;
    total_stock: number;
    reorder_level: number;
    unit: string | null;
  }> = [];

  resolvedProducts.forEach((p) => {
    const stock = resolvedSummaries.find((s) => s.product_id === p.id)?.total_stock ?? 0;
    if (stock < p.reorder_level) {
      lowStockItems.push({
        product_id: p.id,
        name: p.name,
        generic_name: p.generic_name,
        total_stock: stock,
        reorder_level: p.reorder_level,
        unit: p.unit,
      });
    }
  });

  // Sort by stock level asc
  lowStockItems.sort((a, b) => a.total_stock - b.total_stock);

  // 2. Fetch near-expiry batches with quantity_available > 0
  const { data: batches } = await supabase
    .from('batches')
    .select('*, products(name, generic_name, unit), suppliers(name, phone, email)')
    .gt('quantity_available', 0)
    .order('expiry_date', { ascending: true });

  const resolvedBatches = batches || [];

  const batchAlerts = resolvedBatches
    .filter((b) => getExpiryStatus(b.expiry_date).status !== 'ok')
    .map((b) => ({
      id: b.id,
      batch_number: b.batch_number,
      expiry_date: b.expiry_date,
      quantity_available: b.quantity_available,
      purchase_price: Number(b.purchase_price),
      product_name: b.products?.name || 'Unknown',
      generic_name: b.products?.generic_name || null,
      supplier_id: b.supplier_id,
      supplier_name: b.suppliers?.name || null,
      supplier_phone: b.suppliers?.phone || null,
      supplier_email: b.suppliers?.email || null,
    }));

  return (
    <AlertsClient
      lowStockItems={lowStockItems}
      batchAlerts={batchAlerts}
    />
  );
}
