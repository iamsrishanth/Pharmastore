'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { stockAdjustmentSchema } from '@/lib/validation';
import { adjustStock } from '@/lib/actions/stock';
import { getExpiryStatus } from '@/lib/utils/expiry';
import Modal from '@/components/ui/Modal';
import {
  Search,
  AlertTriangle,
  Loader2,
  CheckCircle,
  ShieldAlert,
  Barcode,
  Sparkles,
} from 'lucide-react';

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
    requires_prescription: boolean;
  } | null;
  suppliers: {
    name: string;
  } | null;
}

interface EmployeeStockClientProps {
  batches: Batch[];
}

type AdjustmentFormData = {
  batch_id: string;
  adjustment_direction: 'decrease' | 'increase';
  quantity_input: number;
  movement_type: 'adjustment' | 'writeoff';
  reason: string;
};

export default function EmployeeStockClient({ batches }: EmployeeStockClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<AdjustmentFormData>({
    defaultValues: {
      batch_id: '',
      adjustment_direction: 'decrease',
      quantity_input: 1,
      movement_type: 'writeoff',
      reason: '',
    },
  });

  const handleOpenAdjustment = (batch: Batch) => {
    setSelectedBatch(batch);
    setError(null);
    setSuccessMsg(null);
    reset({
      batch_id: batch.id,
      adjustment_direction: 'decrease',
      quantity_input: 1,
      movement_type: 'writeoff',
      reason: '',
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (data: AdjustmentFormData) => {
    setError(null);
    setSuccessMsg(null);

    // Enforce that decrementing stock resolves to negative quantity for ledger, and vice-versa
    const signedQuantity =
      data.adjustment_direction === 'decrease' ? -Math.abs(data.quantity_input) : Math.abs(data.quantity_input);

    startTransition(async () => {
      const res = await adjustStock(null, {
        batch_id: data.batch_id,
        movement_type: data.movement_type,
        quantity: signedQuantity,
        reason: data.reason,
      });

      if (res?.error) {
        setError(res.error);
      } else {
        setSuccessMsg(
          res.queued
            ? 'Request submitted successfully! Awaiting Admin approval.'
            : 'Stock adjustment updated successfully!'
        );
        setTimeout(() => {
          setIsModalOpen(false);
          window.location.reload();
        }, 1500);
      }
    });
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
          <h1 className="text-2xl font-bold tracking-tight text-white">Live Stock Register</h1>
          <p className="text-sm text-slate-400">View available quantities, check expiry dates, and report damage or count corrections</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
          <Search className="h-4 w-4" />
        </div>
        <input
          type="text"
          placeholder="Scan barcode or search name/generic/batch..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="block w-full rounded-xl border border-slate-800 bg-slate-900/50 py-2.5 pl-9 pr-4 text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
          <Barcode className="h-5 w-5 text-slate-500" />
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/80 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <th className="p-4">Product details</th>
                <th className="p-4">Batch Code</th>
                <th className="p-4 text-center">Expiry band</th>
                <th className="p-4 text-center">Available Stock</th>
                <th className="p-4 text-center">MRP</th>
                <th className="p-4">Supplier</th>
                <th className="p-4 text-right">Ledger Adjust</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {filteredBatches.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No matching stock items found.
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
                          {batch.products?.generic_name || 'No generic'} {batch.products?.requires_prescription && (
                            <span className="ml-1.5 inline-flex rounded-md bg-red-500/10 px-1.5 py-0.2 text-[9px] font-medium text-red-400">Rx</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 font-mono text-slate-200">{batch.batch_number}</td>
                      <td className="p-4 text-center">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold border ${expiryInfo.bgClass} ${expiryInfo.borderClass} ${expiryInfo.colorClass}`}
                        >
                          {expiryInfo.label}
                        </span>
                        <div className="mt-1 text-[10px] text-slate-500">
                          Exp: {new Date(batch.expiry_date).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`font-semibold ${batch.quantity_available === 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                          {batch.quantity_available}
                        </span>
                        <span className="text-xs text-slate-500"> / {batch.quantity_received}</span>
                        <div className="text-[10px] text-slate-400 uppercase mt-0.5">{batch.products?.unit || 'units'}</div>
                      </td>
                      <td className="p-4 text-center text-slate-200 font-mono text-xs">
                        ₹{Number(batch.mrp).toFixed(2)}
                      </td>
                      <td className="p-4 text-slate-300">{batch.suppliers?.name || 'Direct / Unknown'}</td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleOpenAdjustment(batch)}
                          className="rounded-lg bg-slate-800/80 border border-slate-700 py-1.5 px-3 text-xs font-semibold text-amber-400 hover:bg-slate-800 hover:text-amber-300 transition"
                        >
                          Report Log
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjustment Request Modal */}
      {selectedBatch && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => !isPending && setIsModalOpen(false)}
          title="Report Discrepancy or Write-off"
        >
          <div className="mb-4 rounded-xl bg-slate-950/40 p-4 border border-slate-800 text-sm">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Selected Medicine</div>
            <div className="mt-1 font-bold text-white">{selectedBatch.products?.name}</div>
            <div className="text-xs text-slate-400">Batch Code: <span className="font-mono text-slate-200">{selectedBatch.batch_number}</span></div>
            <div className="mt-2 text-xs text-slate-400">Current Available Quantity: <span className="font-bold text-emerald-400">{selectedBatch.quantity_available} {selectedBatch.products?.unit || 'units'}</span></div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Action Type *
                </label>
                <select
                  {...register('adjustment_direction')}
                  className="mt-1 block w-full rounded-xl border border-slate-800 bg-slate-950/50 py-2.5 px-3 text-sm text-white outline-none focus:border-emerald-500"
                >
                  <option value="decrease">Deduct / Decrease (-)</option>
                  <option value="increase">Reconcile / Increase (+)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Adjustment Category *
                </label>
                <select
                  {...register('movement_type')}
                  className="mt-1 block w-full rounded-xl border border-slate-800 bg-slate-950/50 py-2.5 px-3 text-sm text-white outline-none focus:border-emerald-500"
                >
                  <option value="writeoff">Write-off / Breakage / Theft</option>
                  <option value="adjustment">Stock Count Adjustment</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Quantity *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  {...register('quantity_input', { valueAsNumber: true })}
                  className="mt-1 block w-full rounded-xl border border-slate-800 bg-slate-950/50 py-2.5 px-3 text-sm text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Reason for Adjustment *
                </label>
                <textarea
                  required
                  rows={3}
                  {...register('reason')}
                  placeholder="e.g. Expired capsules found, bottle broken, recount during monthly check..."
                  className="mt-1 block w-full rounded-xl border border-slate-800 bg-slate-950/50 py-2.5 px-3 text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500 resize-none"
                />
              </div>
            </div>

            {/* Note alert */}
            <div className="flex gap-2 rounded-xl bg-amber-500/5 border border-amber-500/20 p-3 text-xs text-amber-300">
              <ShieldAlert className="h-5 w-5 shrink-0" />
              <span>
                Note: Since your account has Operator / Employee permissions, this request will be sent to the Admin queue. It will not alter physical stock levels until approved by an administrator.
              </span>
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
                className="flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2.5 text-sm font-semibold text-slate-950 shadow-lg transition hover:bg-amber-400 disabled:opacity-50"
              >
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Submit Request
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
