import { getSales } from '@/lib/actions/sales';
import SalesLedgerClient from '@/components/dashboard/SalesLedgerClient';

export const dynamic = 'force-dynamic';

export default async function AdminSalesPage() {
  const sales = await getSales();
  return <SalesLedgerClient initialSales={sales as any} />;
}
