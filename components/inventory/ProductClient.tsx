'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { productSchema } from '@/lib/validation';
import { createProduct, updateProduct, deleteProduct } from '@/lib/actions/products';
import Modal from '@/components/ui/Modal';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertTriangle,
  Loader2,
  CheckCircle,
} from 'lucide-react';

import { z } from 'zod';

interface Product {
  id: string;
  name: string;
  generic_name: string | null;
  manufacturer: string | null;
  category: string | null;
  composition: string | null;
  strength: string | null;
  pack_size: string | null;
  unit: string | null;
  hsn_code: string | null;
  barcode: string | null;
  requires_prescription: boolean;
  reorder_level: number;
  tax_rate: number;
}

interface ProductClientProps {
  initialProducts: Product[];
}

type ProductFormData = z.infer<typeof productSchema>;

export default function ProductClient({ initialProducts }: ProductClientProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema) as any,
    defaultValues: {
      name: '',
      generic_name: '',
      manufacturer: '',
      category: '',
      composition: '',
      strength: '',
      pack_size: '',
      unit: '',
      hsn_code: '',
      barcode: '',
      requires_prescription: false,
      reorder_level: 10,
      tax_rate: 12,
    },
  });

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setError(null);
    setSuccessMsg(null);
    reset({
      name: '',
      generic_name: '',
      manufacturer: '',
      category: '',
      composition: '',
      strength: '',
      pack_size: '',
      unit: 'Tablets',
      hsn_code: '',
      barcode: '',
      requires_prescription: false,
      reorder_level: 10,
      tax_rate: 12,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setError(null);
    setSuccessMsg(null);
    reset({
      name: product.name,
      generic_name: product.generic_name || '',
      manufacturer: product.manufacturer || '',
      category: product.category || '',
      composition: product.composition || '',
      strength: product.strength || '',
      pack_size: product.pack_size || '',
      unit: product.unit || '',
      hsn_code: product.hsn_code || '',
      barcode: product.barcode || '',
      requires_prescription: product.requires_prescription,
      reorder_level: product.reorder_level,
      tax_rate: product.tax_rate,
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (data: ProductFormData) => {
    setError(null);
    setSuccessMsg(null);
    startTransition(async () => {
      let res;
      if (editingProduct) {
        res = await updateProduct(editingProduct.id, null, data);
      } else {
        res = await createProduct(null, data);
      }

      if (res?.error) {
        setError(res.error);
      } else {
        setSuccessMsg(
          editingProduct ? 'Product updated successfully' : 'Product created successfully'
        );
        // Optimistically update lists or wait for server revalidation.
        // For simplicity and direct reactivity, we reload or update locally.
        setTimeout(() => {
          setIsModalOpen(false);
          window.location.reload();
        }, 1200);
      }
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product? All corresponding batches will be deleted!')) return;

    const res = await deleteProduct(id);
    if (res?.error) {
      alert(res.error);
    } else {
      window.location.reload();
    }
  };

  const filteredProducts = products.filter((p) => {
    const query = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(query) ||
      (p.generic_name && p.generic_name.toLowerCase().includes(query)) ||
      (p.barcode && p.barcode.includes(query))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Product Master</h1>
          <p className="text-sm text-slate-400">Manage medicine inventory items and details</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 py-2.5 px-4 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
        >
          <Plus className="h-4 w-4" />
          Add Product
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
          <Search className="h-4 w-4" />
        </div>
        <input
          type="text"
          placeholder="Search by name, generic, barcode..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="block w-full rounded-xl border border-slate-800 bg-slate-900/50 py-2 pl-9 pr-4 text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
        />
      </div>

      {/* Table Container */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/80 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <th className="p-4">Name & Composition</th>
                <th className="p-4">Category</th>
                <th className="p-4">Barcode / HSN</th>
                <th className="p-4 text-center">Prescription</th>
                <th className="p-4 text-center">Tax Rate</th>
                <th className="p-4 text-center">Reorder Lvl</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No products found.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-800/20 transition duration-150">
                    <td className="p-4">
                      <div className="font-semibold text-white">{product.name}</div>
                      <div className="text-xs text-slate-400">
                        {product.generic_name || 'No generic name'} {product.strength && `(${product.strength})`}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="rounded-md bg-slate-800 px-2.5 py-1 text-xs text-slate-300">
                        {product.category || 'General'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="text-slate-200">{product.barcode || 'N/A'}</div>
                      <div className="text-xs text-slate-500">{product.hsn_code || 'HSN: N/A'}</div>
                    </td>
                    <td className="p-4 text-center">
                      {product.requires_prescription ? (
                        <span className="inline-flex rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-400 ring-1 ring-red-500/20">
                          Required
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-slate-800 px-2.5 py-0.5 text-xs font-medium text-slate-400">
                          None
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-center text-slate-200">{product.tax_rate}%</td>
                    <td className="p-4 text-center text-slate-200">{product.reorder_level} {product.unit || 'units'}</td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(product)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-emerald-400 transition"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-red-400 transition"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !isPending && setIsModalOpen(false)}
        title={editingProduct ? 'Edit Product Details' : 'Add New Product to Catalog'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Product Name *
              </label>
              <input
                type="text"
                required
                {...register('name')}
                placeholder="e.g. Paracetamol 650mg"
                className="mt-1 block w-full rounded-xl border border-slate-800 bg-slate-950/50 py-2.5 px-3 text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
              />
              {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Generic Name
              </label>
              <input
                type="text"
                {...register('generic_name')}
                placeholder="e.g. Acetaminophen"
                className="mt-1 block w-full rounded-xl border border-slate-800 bg-slate-950/50 py-2.5 px-3 text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Manufacturer
              </label>
              <input
                type="text"
                {...register('manufacturer')}
                placeholder="e.g. Cipla Ltd."
                className="mt-1 block w-full rounded-xl border border-slate-800 bg-slate-950/50 py-2.5 px-3 text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Composition / Chemical Structure
              </label>
              <input
                type="text"
                {...register('composition')}
                placeholder="e.g. Paracetamol IP 650mg"
                className="mt-1 block w-full rounded-xl border border-slate-800 bg-slate-950/50 py-2.5 px-3 text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Category
              </label>
              <input
                type="text"
                {...register('category')}
                placeholder="e.g. Analgesic, Antibiotic"
                className="mt-1 block w-full rounded-xl border border-slate-800 bg-slate-950/50 py-2.5 px-3 text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Strength
              </label>
              <input
                type="text"
                {...register('strength')}
                placeholder="e.g. 650 mg, 500 ml"
                className="mt-1 block w-full rounded-xl border border-slate-800 bg-slate-950/50 py-2.5 px-3 text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Pack Size
              </label>
              <input
                type="text"
                {...register('pack_size')}
                placeholder="e.g. 15 Tablets, 1 Bottle"
                className="mt-1 block w-full rounded-xl border border-slate-800 bg-slate-950/50 py-2.5 px-3 text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Unit Name
              </label>
              <input
                type="text"
                {...register('unit')}
                placeholder="e.g. Tablets, Syrup"
                className="mt-1 block w-full rounded-xl border border-slate-800 bg-slate-950/50 py-2.5 px-3 text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                HSN Code
              </label>
              <input
                type="text"
                {...register('hsn_code')}
                placeholder="e.g. 300490"
                className="mt-1 block w-full rounded-xl border border-slate-800 bg-slate-950/50 py-2.5 px-3 text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Barcode Number
              </label>
              <input
                type="text"
                {...register('barcode')}
                placeholder="e.g. 890100200300"
                className="mt-1 block w-full rounded-xl border border-slate-800 bg-slate-950/50 py-2.5 px-3 text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Reorder Threshold Level
              </label>
              <input
                type="number"
                {...register('reorder_level')}
                className="mt-1 block w-full rounded-xl border border-slate-800 bg-slate-950/50 py-2.5 px-3 text-sm text-white outline-none focus:border-emerald-500"
              />
              {errors.reorder_level && (
                <p className="mt-1 text-xs text-red-400">{errors.reorder_level.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                GST Rate (%)
              </label>
              <select
                {...register('tax_rate')}
                className="mt-1 block w-full rounded-xl border border-slate-800 bg-slate-950/50 py-2.5 px-3 text-sm text-white outline-none focus:border-emerald-500"
              >
                <option value={0}>0% (Exempt)</option>
                <option value={5}>5%</option>
                <option value={12}>12%</option>
                <option value={18}>18%</option>
                <option value={28}>28%</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 py-2">
            <input
              type="checkbox"
              id="requires_prescription"
              {...register('requires_prescription')}
              className="h-4 w-4 rounded border-slate-800 bg-slate-950/50 text-emerald-500 focus:ring-emerald-500/20"
            />
            <label htmlFor="requires_prescription" className="text-sm font-semibold text-slate-300">
              Requires Doctor prescription for checkout (Schedule H/H1/X)
            </label>
          </div>

          {/* Feedback alerts */}
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-400">
              <CheckCircle className="h-5 w-5 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="flex justify-end gap-3 border-t border-slate-800 pt-4">
            <button
              type="button"
              disabled={isPending}
              onClick={() => setIsModalOpen(false)}
              className="rounded-xl border border-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-400 hover:bg-slate-800 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-lg transition hover:bg-emerald-400 disabled:opacity-50"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {editingProduct ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
