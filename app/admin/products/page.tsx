import { getProducts } from '@/lib/actions/products';
import ProductClient from '@/components/inventory/ProductClient';

// Ensure the page is treated dynamically to get fresh DB states
export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
  const products = await getProducts();
  return <ProductClient initialProducts={products} />;
}
