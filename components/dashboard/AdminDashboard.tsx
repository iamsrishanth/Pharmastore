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
    <div className="space-y-8 pb-10">
      {/* Welcome Banner: Twilight Sky */}
      <div className="relative overflow-hidden rounded-3xl konoha-sky-bg border-4 border-slate-800 p-6 md:p-8 shadow-2xl">
        {/* Portal Glow */}
        <div className="absolute top-1/2 right-10 md:right-20 h-[180px] w-[180px] rounded-full konoha-portal-glow -translate-y-1/2 pointer-events-none" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between z-10">
          <div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2 drop-shadow-md">
              <span>🍃</span> Hokage Command Center
            </h1>
            <p className="mt-1 text-sm text-amber-100 font-semibold drop-shadow-md">
              Real-time monitoring of Leaf pharmacy levels, chakra supply valuation, and regulatory approvals
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/products"
              className="flex items-center gap-1.5 rounded-lg border-2 border-[#8a6341] bg-[#f2e8d0] hover:bg-[#e8d9b9] py-2 px-4 text-xs font-bold text-[#3a2418] transition shadow-md hover:scale-105"
            >
              <Plus className="h-4 w-4" />
              Add Product Scroll
            </Link>
            <Link
              href="/admin/batches"
              className="flex items-center gap-1.5 rounded-lg border-2 border-[#5c3a21] bg-amber-500 hover:bg-amber-400 py-2 px-4 text-xs font-bold text-slate-950 transition shadow-md hover:scale-105"
            >
              <Plus className="h-4 w-4" />
              Stock-In Batch
            </Link>
          </div>
        </div>
      </div>

      {/* Wood desk planning surface */}
      <div className="wood-desk-bg p-6 md:p-8 rounded-3xl space-y-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 pt-2">
          {/* Total Medicines */}
          <div className="scroll-container-card p-5 transition-transform hover:-translate-y-1">
            <div className="flex items-center justify-between text-[#4a3c2c]">
              <span className="scroll-label-sans">Catalog Medicines</span>
              <div className="rounded-lg bg-[#8a6341]/10 p-1.5 text-[#5c3a21]">
                <Package className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4">
              <div className="scroll-metric-bold text-3xl">{stats.totalProducts}</div>
              <div className="text-xs text-[#555555] font-semibold mt-1 scroll-text-serif">Unique products configured</div>
            </div>
          </div>

          {/* Stock Valuation */}
          <div className="scroll-container-card p-5 transition-transform hover:-translate-y-1">
            <div className="flex items-center justify-between text-[#4a3c2c]">
              <span className="scroll-label-sans">Stock Valuation</span>
              <div className="rounded-lg bg-emerald-700/10 p-1.5 text-emerald-800">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4">
              <div className="scroll-metric-bold text-3xl">₹{stats.mrpValuation.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
              <div className="text-xs text-[#555555] font-semibold mt-1 scroll-text-serif">
                Cost: <span className="font-mono text-emerald-850 font-bold">₹{stats.costValuation.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
              </div>
            </div>
          </div>

          {/* Low Stock Alerts */}
          <div className="scroll-container-card p-5 transition-transform hover:-translate-y-1">
            <div className="flex items-center justify-between text-[#4a3c2c]">
              <span className="scroll-label-sans">Low Stock Alerts</span>
              <div className={`rounded-lg p-1.5 ${stats.lowStockCount > 0 ? 'bg-red-500/20 text-red-700' : 'bg-[#8a6341]/10 text-[#5c3a21]'}`}>
                <AlertTriangle className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4">
              <div className={`scroll-metric-bold text-3xl ${stats.lowStockCount > 0 ? 'text-red-700 animate-pulse' : ''}`}>{stats.lowStockCount}</div>
              <div className="text-xs text-[#555555] font-semibold mt-1 scroll-text-serif">Below target reorder levels</div>
            </div>
          </div>

          {/* Near-Expiry Lots */}
          <div className="scroll-container-card p-5 transition-transform hover:-translate-y-1">
            <div className="flex items-center justify-between text-[#4a3c2c]">
              <span className="scroll-label-sans">Near-Expiry Lots</span>
              <div className={`rounded-lg p-1.5 ${stats.nearExpiryCount > 0 ? 'bg-amber-600/20 text-amber-800' : 'bg-[#8a6341]/10 text-[#5c3a21]'}`}>
                <Layers className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-4">
              <div className={`scroll-metric-bold text-3xl ${stats.nearExpiryCount > 0 ? 'text-amber-800' : ''}`}>{stats.nearExpiryCount}</div>
              <div className="text-xs text-[#555555] font-semibold mt-1 scroll-text-serif">Expiring within 30 days</div>
            </div>
          </div>
        </div>

        {/* Main Grid: Pending approvals on top (if any), then Alerts Side-by-Side */}
        <div className="space-y-8">
          {/* Employee Approvals Queue */}
          <div className="scroll-container-card p-6">
            <div className="border-b border-[#8a6341]/40 pb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-[#2c1e11] flex items-center gap-2 scroll-heading border-0 pb-0">
                  <Activity className="h-5 w-5 text-amber-700" />
                  Employee Adjustments Ledger
                </h2>
                <p className="text-xs text-[#555555] font-semibold scroll-text-serif">Awaiting Hokage scroll signature before physical stock deduction</p>
              </div>
              <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-bold text-amber-800 border border-amber-600/30 self-start">
                {pendingAdjustments.length} Pending
              </span>
            </div>

            <div className="overflow-x-auto mt-4">
              <table className="w-full text-left border-collapse scroll-text-serif">
                <thead>
                  <tr className="border-b border-[#8a6341]/30 text-[10px] font-bold uppercase tracking-wider text-[#4a3c2c] bg-[#8a6341]/5">
                    <th className="px-4 py-3">Operator</th>
                    <th className="px-4 py-3">Medicine</th>
                    <th className="px-4 py-3">Batch</th>
                    <th className="px-4 py-3 text-center">Qty Adjustment</th>
                    <th className="px-4 py-3">Reason</th>
                    <th className="px-4 py-3 text-right">Signature Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#8a6341]/20 text-xs">
                  {pendingAdjustments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-[#555555] font-semibold">
                        No pending stock adjustments. System is fully aligned.
                      </td>
                    </tr>
                  ) : (
                    pendingAdjustments.map((adj) => (
                      <tr key={adj.id} className="hover:bg-[#8a6341]/5 transition-colors">
                        <td className="px-4 py-4 font-bold text-[#3a2418]">
                          {adj.profiles?.full_name || 'Staff'}
                        </td>
                        <td className="px-4 py-4">
                          <div className="font-bold text-[#1a1a1a]">
                            {adj.batches?.products?.name || 'Unknown'}
                          </div>
                          <div className="text-[10px] text-[#555555] font-semibold">
                            {adj.batches?.products?.generic_name || ''}
                          </div>
                        </td>
                        <td className="px-4 py-4 font-mono text-[#3a2418]">
                          {adj.batches?.batch_number}
                        </td>
                        <td className="px-4 py-4 text-center font-bold">
                          <span className={adj.quantity < 0 ? 'text-red-700' : 'text-emerald-700'}>
                            {adj.quantity > 0 ? `+${adj.quantity}` : adj.quantity}
                          </span>
                          <span className="text-[10px] text-[#555555] font-normal ml-1">
                            (Avail: {adj.batches?.quantity_available})
                          </span>
                        </td>
                        <td className="px-4 py-4 text-[#333333] font-medium max-w-xs truncate" title={adj.reason || ''}>
                          {adj.reason || 'No reason specified'}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleApprove(adj.id)}
                              disabled={isPending}
                              className="rounded-lg bg-emerald-700/10 border border-emerald-700/25 p-1 text-emerald-800 hover:bg-emerald-700/20 disabled:opacity-50 transition cursor-pointer"
                              title="Approve"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleReject(adj.id)}
                              disabled={isPending}
                              className="rounded-lg bg-red-700/10 border border-red-700/25 p-1 text-red-800 hover:bg-red-700/20 disabled:opacity-50 transition cursor-pointer"
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
            <div className="scroll-container-card p-6">
              <div className="flex items-center justify-between mb-4 border-b border-[#8a6341]/40 pb-3">
                <h2 className="text-base font-bold text-[#2c1e11] flex items-center gap-2 scroll-heading border-0 pb-0">
                  <AlertTriangle className="h-4 w-4 text-red-700" />
                  Low Stock Threshold Alerts
                </h2>
                <Link
                  href="/admin/products"
                  className="text-xs text-emerald-850 hover:text-emerald-750 font-bold flex items-center gap-1 scroll-text-serif"
                >
                  Catalog <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="space-y-3 scroll-text-serif">
                {lowStockList.length === 0 ? (
                  <div className="text-center text-xs text-[#555555] py-6 font-semibold">All stock levels satisfy reorder targets.</div>
                ) : (
                  lowStockList.slice(0, 5).map((item) => (
                    <div key={item.id} className="flex items-center justify-between rounded-lg bg-[#8a6341]/5 p-3 border border-[#8a6341]/20">
                      <div>
                        <div className="text-xs font-bold text-[#1a1a1a]">{item.name}</div>
                        <div className="text-[10px] text-[#555555]">{item.generic_name || 'Generic'}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-red-700 font-bold">
                          Stock: {item.total_stock}
                        </div>
                        <div className="text-[9px] text-[#555555] font-semibold mt-0.5">
                          Min: {item.reorder_level}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Near Expiry Alerts */}
            <div className="scroll-container-card p-6">
              <div className="flex items-center justify-between mb-4 border-b border-[#8a6341]/40 pb-3">
                <h2 className="text-base font-bold text-[#2c1e11] flex items-center gap-2 scroll-heading border-0 pb-0">
                  <Layers className="h-4 w-4 text-amber-700" />
                  Near Expiry & Expired Lots
                </h2>
                <Link
                  href="/admin/batches"
                  className="text-xs text-emerald-850 hover:text-emerald-750 font-bold flex items-center gap-1 scroll-text-serif"
                >
                  Batches <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="space-y-3 scroll-text-serif">
                {nearExpiryList.length === 0 ? (
                  <div className="text-center text-xs text-[#555555] py-6 font-semibold">All batches are healthy and OK.</div>
                ) : (
                  nearExpiryList.slice(0, 5).map((item) => {
                    const statusInfo = getExpiryStatus(item.expiry_date);
                    let colorClass = "text-emerald-800 bg-emerald-100 border-emerald-300";
                    if (statusInfo.status === 'expired') colorClass = "text-red-800 bg-red-100 border-red-300";
                    else if (statusInfo.status === 'critical') colorClass = "text-orange-800 bg-orange-100 border-orange-300";
                    else if (statusInfo.status === 'warning') colorClass = "text-amber-800 bg-amber-100 border-amber-300";
                    
                    return (
                      <div key={item.id} className="flex items-center justify-between rounded-lg bg-[#8a6341]/5 p-3 border border-[#8a6341]/20">
                        <div>
                          <div className="text-xs font-bold text-[#1a1a1a]">{item.product_name}</div>
                          <div className="text-[10px] text-[#555555]">
                            Batch: <span className="font-mono text-[#3a2418]">{item.batch_number}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex rounded px-1.5 py-0.2 text-[9px] font-bold border ${colorClass}`}>
                            {statusInfo.label}
                          </span>
                          <div className="text-[9px] text-[#555555] font-semibold mt-1">
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
    </div>
  );
}
