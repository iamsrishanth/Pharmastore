'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { batchSchema } from '@/lib/validation';
import { createBatch, updateBatch, deleteBatch } from '@/lib/actions/batches';
import { getExpiryStatus } from '@/lib/utils/expiry';
import Modal from '@/components/ui/Modal';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertTriangle,
  Loader2,
  CheckCircle,
  Calendar,
} from 'lucide-react';

import { z } from 'zod';

interface Product {
  id: string;
  name: string;
  generic_name: string | null;
  unit: string | null;
}

interface Supplier {
  id: string;
  name: string;
}

interface Batch {
  id: string;
  product_id: string;
  supplier_id: string | null;
  batch_number: string;
  mfg_date: string | null;
  expiry_date: string;
  quantity_received: number;
  quantity_available: number;
  purchase_price: number;
  mrp: number;
  selling_price: number;
  products: {
    name: string;
    generic_name: string | null;
    unit: string | null;
    tax_rate: number;
  } | null;
  suppliers: {
    name: string;
  } | null;
}

interface BatchClientProps {
  initialBatches: Batch[];
  products: Product[];
  suppliers: Supplier[];
}

type BatchFormData = z.infer<typeof batchSchema>;

export default function BatchClient({
  initialBatches,
  products,
  suppliers,
}: BatchClientProps) {
  const [batches, setBatches] = useState<Batch[]>(initialBatches);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<BatchFormData>({
    resolver: zodResolver(batchSchema) as any,
    defaultValues: {
      product_id: '',
      supplier_id: '',
      batch_number: '',
      mfg_date: '',
      expiry_date: '',
      quantity_received: 0,
      purchase_price: 0,
      mrp: 0,
      selling_price: 0,
    },
  });

  const handleOpenAdd = () => {
    setEditingBatch(null);
    setError(null);
    setSuccessMsg(null);
    reset({
      product_id: products[0]?.id || '',
      supplier_id: suppliers[0]?.id || null,
      batch_number: '',
      mfg_date: '',
      expiry_date: '',
      quantity_received: 0,
      purchase_price: 0,
      mrp: 0,
      selling_price: 0,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (batch: Batch) => {
    setEditingBatch(batch);
    setError(null);
    setSuccessMsg(null);
    reset({
      product_id: batch.product_id,
      supplier_id: batch.supplier_id,
      batch_number: batch.batch_number,
      mfg_date: batch.mfg_date || '',
      expiry_date: batch.expiry_date,
      quantity_received: batch.quantity_received,
      purchase_price: Number(batch.purchase_price),
      mrp: Number(batch.mrp),
      selling_price: Number(batch.selling_price),
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (data: BatchFormData) => {
    setError(null);
    setSuccessMsg(null);

    // Convert empty supplier_id to null
    const submissionData = {
      ...data,
      supplier_id: data.supplier_id === '' ? null : data.supplier_id,
    };

    startTransition(async () => {
      let res;
      if (editingBatch) {
        res = await updateBatch(editingBatch.id, null, submissionData);
      } else {
        res = await createBatch(null, submissionData);
      }

      if (res?.error) {
        setError(res.error);
      } else {
        setSuccessMsg(
          editingBatch ? 'Batch updated successfully' : 'Batch created & stock logged successfully'
        );
        setTimeout(() => {
          setIsModalOpen(false);
          window.location.reload();
        }, 1200);
      }
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this batch? This will revert any stock availability associated with it.')) return;

    const res = await deleteBatch(id);
    if (res?.error) {
      alert(res.error);
    } else {
      window.location.reload();
    }
  };

  const filteredBatches = batches.filter((b) => {
    const query = searchQuery.toLowerCase();
    const productName = b.products?.name.toLowerCase() || '';
    const genericName = b.products?.generic_name?.toLowerCase() || '';
    const batchNo = b.batch_number.toLowerCase();
    return productName.includes(query) || genericName.includes(query) || batchNo.includes(query);
  });

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Batch Master</h1>
          <p className="text-sm text-slate-400">Manage medicine batches, pricing, and expiry dates</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 py-2.5 px-4 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
        >
          <Plus className="h-4 w-4" />
          Add Batch (Stock-In)
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
          <Search className="h-4 w-4" />
        </div>
        <input
          type="text"
          placeholder="Search by product name, batch no..."
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
                <th className="p-4">Product Name</th>
                <th className="p-4">Batch Number</th>
                <th className="p-4 text-center">Expiry Status</th>
                <th className="p-4 text-center">Stock (Avail / Recv)</th>
                <th className="p-4 text-center">Purchase / MRP / Sell</th>
                <th className="p-4">Supplier</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {filteredBatches.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No batches found.
                  </td>
                </tr>
              ) : (
                filteredBatches.map((batch) => {
                  const expiryInfo = getExpiryStatus(batch.expiry_date);
                  return (
                    <tr key={batch.id} className="hover:bg-slate-800/20 transition duration-150">
                      <td className="p-4">
                        <div className="font-semibold text-white">
                          {batch.products?.name || 'Unknown Product'}
                        </div>
                        <div className="text-xs text-slate-400">
                          {batch.products?.generic_name || 'No generic composition'}
                        </div>
                      </td>
                      <td className="p-4 font-mono text-slate-200">{batch.batch_number}</td>
                      <td className="p-4 text-center">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold border ${expiryInfo.bgClass} ${expiryInfo.borderClass} ${expiryInfo.colorClass}`}
                        >
                          {expiryInfo.label}
                        </span>
                        <div className="mt-1 text-[10px] text-slate-500">
                          Exp: {new Date(batch.expiry_date).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`font-semibold ${batch.quantity_available === 0 ? 'text-red-400' : 'text-slate-200'}`}>
                          {batch.quantity_available}
                        </span>
                        <span className="text-xs text-slate-500"> / {batch.quantity_received}</span>
                        <div className="text-[10px] text-slate-400 uppercase mt-0.5">{batch.products?.unit || 'units'}</div>
                      </td>
                      <td className="p-4 text-center text-slate-200 font-mono text-xs">
                        ₹{Number(batch.purchase_price).toFixed(2)} / ₹{Number(batch.mrp).toFixed(2)} / ₹
                        {Number(batch.selling_price).toFixed(2)}
                      </td>
                      <td className="p-4 text-slate-300">{batch.suppliers?.name || 'Direct / Unknown'}</td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(batch)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-emerald-400 transition"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(batch.id)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-red-400 transition"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !isPending && setIsModalOpen(false)}
        title={editingBatch ? 'Edit Batch Pricing & Expiry' : 'Stock-In New Batch'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {!editingBatch ? (
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Select Product *
                </label>
                <select
                  required
                  {...register('product_id')}
                  className="mt-1 block w-full rounded-xl border border-slate-800 bg-slate-950/50 py-2.5 px-3 text-sm text-white outline-none focus:border-emerald-500"
                >
                  <option value="" disabled>Select a product...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.generic_name && `(${p.generic_name})`}
                    </option>
                  ))}
                </select>
                {errors.product_id && (
                  <p className="mt-1 text-xs text-red-400">{errors.product_id.message}</p>
                )}
              </div>
            ) : (
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Product
                </label>
                <div className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-800/30 py-2.5 px-3 text-sm text-slate-400">
                  {editingBatch.products?.name}
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Batch Number *
              </label>
              <input
                type="text"
                required
                {...register('batch_number')}
                placeholder="e.g. B-PRC103"
                className="mt-1 block w-full rounded-xl border border-slate-800 bg-slate-950/50 py-2.5 px-3 text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500"
              />
              {errors.batch_number && (
                <p className="mt-1 text-xs text-red-400">{errors.batch_number.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Supplier
              </label>
              <select
                {...register('supplier_id')}
                className="mt-1 block w-full rounded-xl border border-slate-800 bg-slate-950/50 py-2.5 px-3 text-sm text-white outline-none focus:border-emerald-500"
              >
                <option value="">Direct purchase (No supplier)</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Mfg Date
              </label>
              <input
                type="date"
                {...register('mfg_date')}
                className="mt-1 block w-full rounded-xl border border-slate-800 bg-slate-950/50 py-2.5 px-3 text-sm text-white outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Expiry Date *
              </label>
              <input
                type="date"
                required
                {...register('expiry_date')}
                className="mt-1 block w-full rounded-xl border border-slate-800 bg-slate-950/50 py-2.5 px-3 text-sm text-white outline-none focus:border-emerald-500"
              />
              {errors.expiry_date && (
                <p className="mt-1 text-xs text-red-400">{errors.expiry_date.message}</p>
              )}
            </div>

            {!editingBatch ? (
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Quantity Received *
                </label>
                <input
                  type="number"
                  required
                  {...register('quantity_received')}
                  className="mt-1 block w-full rounded-xl border border-slate-800 bg-slate-950/50 py-2.5 px-3 text-sm text-white outline-none focus:border-emerald-500"
                />
                {errors.quantity_received && (
                  <p className="mt-1 text-xs text-red-400">{errors.quantity_received.message}</p>
                )}
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Quantity Received
                </label>
                <div className="mt-1 w-full rounded-xl border border-slate-800 bg-slate-800/30 py-2.5 px-3 text-sm text-slate-400">
                  {editingBatch.quantity_received} (adjust via stock ledger)
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Purchase Price (Per Unit) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                {...register('purchase_price')}
                placeholder="₹ 0.00"
                className="mt-1 block w-full rounded-xl border border-slate-800 bg-slate-950/50 py-2.5 px-3 text-sm text-white outline-none focus:border-emerald-500"
              />
              {errors.purchase_price && (
                <p className="mt-1 text-xs text-red-400">{errors.purchase_price.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                MRP (Max Retail Price) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                {...register('mrp')}
                placeholder="₹ 0.00"
                className="mt-1 block w-full rounded-xl border border-slate-800 bg-slate-950/50 py-2.5 px-3 text-sm text-white outline-none focus:border-emerald-500"
              />
              {errors.mrp && <p className="mt-1 text-xs text-red-400">{errors.mrp.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Selling Price *
              </label>
              <input
                type="number"
                step="0.01"
                required
                {...register('selling_price')}
                placeholder="₹ 0.00"
                className="mt-1 block w-full rounded-xl border border-slate-800 bg-slate-950/50 py-2.5 px-3 text-sm text-white outline-none focus:border-emerald-500"
              />
              {errors.selling_price && (
                <p className="mt-1 text-xs text-red-400">{errors.selling_price.message}</p>
              )}
            </div>
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
              {editingBatch ? 'Save Changes' : 'Record Stock-In'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
