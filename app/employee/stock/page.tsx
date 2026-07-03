import { getBatches } from '@/lib/actions/batches';
import EmployeeStockClient from '@/components/inventory/EmployeeStockClient';

export const dynamic = 'force-dynamic';

export default async function EmployeeStockPage() {
  const batches = await getBatches();
  return <EmployeeStockClient batches={batches} />;
}
