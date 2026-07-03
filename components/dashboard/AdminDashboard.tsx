'use client';

import { useTransition } from 'react';
import Link from 'next/link';
import { approveAdjustment, rejectAdjustment } from '@/lib/actions/stock';
import { getExpiryStatus } from '@/lib/utils/expiry';
import {
  TrendingUp,
  AlertTriangle,
  Layers,
  Check,
  X,
  Plus,
  ArrowRight,
  Package,
  Activity,
  FileSpreadsheet,
  Users,
} from 'lucide-react';

interface PendingAdjustment {
  id: string;
  batch_id: string;
  movement_type: string;
  quantity: number;
  reason: string | null;
  status: string;
  created_at: string;
  batches: {
    batch_number: string;
    quantity_available: number;
    products: {
      name: string;
      generic_name: string | null;
    } | null;
  } | null;
  profiles: {
    full_name: string;
  } | null;
}

interface AdminDashboardProps {
  stats: {
    totalProducts: number;
    costValuation: number;
    mrpValuation: number;
    lowStockCount: number;
    nearExpiryCount: number;
  };
  pendingAdjustments: PendingAdjustment[];
  lowStockList: Array<{
    id: string;
    name: string;
    generic_name: string | null;
    total_stock: number;
    reorder_level: number;
  }>;
  nearExpiryList: Array<{
    id: string;
    batch_number: string;
    expiry_date: string;
    quantity_available: number;
    product_name: string;
  }>;
}

export default function AdminDashboard({
  stats,
  pendingAdjustments,
  lowStockList,
  nearExpiryList,
}: AdminDashboardProps) {
  const [isPending, startTransition] = useTransition();

  const handleApprove = async (id: string) => {
    if (!confirm('Are you sure you want to APPROVE this stock adjustment?')) return;
    startTransition(async () => {
      const res = await approveAdjustment(id);
      if (res?.error) {
        alert(res.error);
      } else {
        window.location.reload();
      }
    });
  };

  const handleReject = async (id: string) => {
    if (!confirm('Are you sure you want to REJECT this stock adjustment?')) return;
    startTransition(async () => {
      const res = await rejectAdjustment(id);
      if (res?.error) {
        alert(res.error);
      } else {
        window.location.reload();
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 p-6 md:p-8">
        <div className="absolute top-0 right-0 h-[250px] w-[250px] rounded-full bg-emerald-500/5 blur-[80px]" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white md:text-3xl">Admin Command Center</h1>
            <p className="mt-1 text-sm text-slate-400">
              Real-time monitoring of pharmacy levels, financial valuation, and regulatory approvals
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/products"
              className="flex items-center gap-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 py-2.5 px-4 text-xs font-semibold text-slate-100 transition border border-slate-700"
            >
              <Plus className="h-4 w-4" />
              Add Product
            </Link>
            <Link
              href="/admin/batches"
              className="flex items-center gap-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 py-2.5 px-4 text-xs font-semibold text-slate-950 transition"
            >
              <Plus className="h-4 w-4" />
              Stock-In Batch
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Products */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Catalog Medicines</span>
            <div className="rounded-lg bg-slate-800 p-1.5 text-slate-300">
              <Package className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-white">{stats.totalProducts}</div>
            <div className="text-xs text-slate-500 mt-1">Unique products configured</div>
          </div>
        </div>

        {/* Stock Valuation */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Stock Valuation</span>
            <div className="rounded-lg bg-emerald-500/10 p-1.5 text-emerald-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-2xl font-bold text-white">₹{stats.mrpValuation.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
            <div className="text-xs text-slate-400 mt-1">
              Cost: <span className="font-mono text-slate-300">₹{stats.costValuation.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
            </div>
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Low Stock alerts</span>
            <div className={`rounded-lg p-1.5 ${stats.lowStockCount > 0 ? 'bg-red-500/10 text-red-400' : 'bg-slate-800 text-slate-300'}`}>
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className={`text-2xl font-bold ${stats.lowStockCount > 0 ? 'text-red-400' : 'text-white'}`}>{stats.lowStockCount}</div>
            <div className="text-xs text-slate-500 mt-1">Below target reorder levels</div>
          </div>
        </div>

        {/* Near Expiry Alert */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Near-Expiry lots</span>
            <div className={`rounded-lg p-1.5 ${stats.nearExpiryCount > 0 ? 'bg-orange-500/10 text-orange-400' : 'bg-slate-800 text-slate-300'}`}>
              <Layers className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className={`text-2xl font-bold ${stats.nearExpiryCount > 0 ? 'text-orange-400' : 'text-white'}`}>{stats.nearExpiryCount}</div>
            <div className="text-xs text-slate-500 mt-1">Expiring within 30 days</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Pending approvals on top (if any), then Alerts Side-by-Side */}
      <div className="space-y-6">
        {/* Employee Approvals Queue */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-md">
          <div className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Activity className="h-4 w-4 text-amber-400" />
                Employee Adjustments Queue
              </h2>
              <p className="text-xs text-slate-400">Awaiting supervisor check before physical stock deduction</p>
            </div>
            <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-bold text-amber-400 border border-amber-500/20">
              {pendingAdjustments.length} Pending
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800/80 text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-900/20">
                  <th className="px-6 py-3">Operator</th>
                  <th className="px-6 py-3">Medicine</th>
                  <th className="px-6 py-3">Batch</th>
                  <th className="px-6 py-3 text-center">Qty Adjustment</th>
                  <th className="px-6 py-3">Reason</th>
                  <th className="px-6 py-3 text-right">Approval Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {pendingAdjustments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-500">
                      No pending stock adjustments. System is fully aligned.
                    </td>
                  </tr>
                ) : (
                  pendingAdjustments.map((adj) => (
                    <tr key={adj.id} className="hover:bg-slate-800/10">
                      <td className="px-6 py-4 font-semibold text-slate-200">
                        {adj.profiles?.full_name || 'Staff'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-white">
                          {adj.batches?.products?.name || 'Unknown'}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {adj.batches?.products?.generic_name || ''}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-300">
                        {adj.batches?.batch_number}
                      </td>
                      <td className="px-6 py-4 text-center font-bold">
                        <span className={adj.quantity < 0 ? 'text-red-400' : 'text-emerald-400'}>
                          {adj.quantity > 0 ? `+${adj.quantity}` : adj.quantity}
                        </span>
                        <span className="text-[10px] text-slate-500 font-normal ml-1">
                          (Avail: {adj.batches?.quantity_available})
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-400 max-w-xs truncate" title={adj.reason || ''}>
                        {adj.reason || 'No reason specified'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleApprove(adj.id)}
                            disabled={isPending}
                            className="rounded-lg bg-emerald-500/10 border border-emerald-500/25 p-1 text-emerald-400 hover:bg-emerald-500/20 disabled:opacity-50 transition"
                            title="Approve"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleReject(adj.id)}
                            disabled={isPending}
                            className="rounded-lg bg-red-500/10 border border-red-500/25 p-1 text-red-400 hover:bg-red-500/20 disabled:opacity-50 transition"
                            title="Reject"
                          >
                            <X className="h-4 w-4" />
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

        {/* Side-by-side: Low Stock & Near Expiry alerts */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Low Stock Alerts */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-400" />
                Low Stock Threshold Alerts
              </h2>
              <Link
                href="/admin/products"
                className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
              >
                Catalog <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="space-y-3">
              {lowStockList.length === 0 ? (
                <div className="text-center text-xs text-slate-500 py-6">All stock levels satisfy reorder targets.</div>
              ) : (
                lowStockList.slice(0, 5).map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-xl bg-slate-950/30 p-3 border border-slate-850">
                    <div>
                      <div className="text-xs font-bold text-white">{item.name}</div>
                      <div className="text-[10px] text-slate-400">{item.generic_name || 'Generic'}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-red-400 font-bold">
                        Stock: {item.total_stock}
                      </div>
                      <div className="text-[9px] text-slate-500 mt-0.5">
                        Min: {item.reorder_level}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Near Expiry Alerts */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="h-4 w-4 text-orange-400" />
                Near Expiry & Expired Lots
              </h2>
              <Link
                href="/admin/batches"
                className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
              >
                Batches <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="space-y-3">
              {nearExpiryList.length === 0 ? (
                <div className="text-center text-xs text-slate-500 py-6">All batches are healthy and OK.</div>
              ) : (
                nearExpiryList.slice(0, 5).map((item) => {
                  const statusInfo = getExpiryStatus(item.expiry_date);
                  return (
                    <div key={item.id} className="flex items-center justify-between rounded-xl bg-slate-950/30 p-3 border border-slate-850">
                      <div>
                        <div className="text-xs font-bold text-white">{item.product_name}</div>
                        <div className="text-[10px] text-slate-400">
                          Batch: <span className="font-mono text-slate-300">{item.batch_number}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex rounded px-1.5 py-0.2 text-[9px] font-bold border ${statusInfo.bgClass} ${statusInfo.borderClass} ${statusInfo.colorClass}`}>
                          {statusInfo.label}
                        </span>
                        <div className="text-[9px] text-slate-500 mt-1">
                          Qty: {item.quantity_available} units
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
