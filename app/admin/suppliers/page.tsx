import { getSuppliers } from '@/lib/actions/suppliers';
import SupplierClient from '@/components/dashboard/SupplierClient';

export const dynamic = 'force-dynamic';

export default async function SuppliersPage() {
  const suppliers = await getSuppliers();
  return <SupplierClient initialSuppliers={suppliers} />;
}
