import { getBatches } from '@/lib/actions/batches';
import { getProducts } from '@/lib/actions/products';
import { getSuppliers } from '@/lib/actions/suppliers';
import BatchClient from '@/components/inventory/BatchClient';

export const dynamic = 'force-dynamic';

export default async function BatchesPage() {
  const [batches, products, suppliers] = await Promise.all([
    getBatches(),
    getProducts(),
    getSuppliers(),
  ]);

  return (
    <BatchClient
      initialBatches={batches}
      products={products}
      suppliers={suppliers}
    />
  );
}
