'use client';

import { useState } from 'react';
import Link from 'next/link';
import { getExpiryStatus } from '@/lib/utils/expiry';
import {
  ShoppingBag,
  Package,
  Bell,
  Search,
  AlertTriangle,
  Pill,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';

interface ProductStockSummary {
  product_id: string;
  name: string;
  generic_name: string | null;
  total_stock: number;
  nearest_expiry: string | null;
}

interface EmployeeDashboardProps {
  profile: {
    full_name: string;
  };
  stats: {
    totalItems: number;
    lowStockCount: number;
    expiringCount: number;
  };
  productSummaries: ProductStockSummary[];
}

export default function EmployeeDashboard({
  profile,
  stats,
  productSummaries,
}: EmployeeDashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSummaries = productSummaries.filter((p) => {
    const query = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(query) ||
      (p.generic_name && p.generic_name.toLowerCase().includes(query))
    );
  });

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 to-slate-900 border border-slate-800 p-6 md:p-8">
        <div className="absolute top-0 right-0 h-[200px] w-[200px] rounded-full bg-blue-500/5 blur-[80px]" />
        <div>
          <h1 className="text-2xl font-bold text-white md:text-3xl">
            Welcome back, {profile.full_name}!
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            PharmaStore Counter Dashboard • Live POS Billing and Stock Lookup
          </p>
        </div>
      </div>

      {/* Quick Access Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link
          href="/employee/billing"
          className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50 p-6 transition duration-200 hover:border-emerald-500/30 hover:bg-slate-900"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition duration-200">
            <ShoppingBag className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-base font-bold text-white">POS Billing Counter</h3>
          <p className="mt-1 text-xs text-slate-400">Scan items, verify prescriptions, and print GST invoice PDFs</p>
          <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-emerald-400">
            Open Billing <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition duration-200" />
          </div>
        </Link>

        <Link
          href="/employee/stock"
          className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50 p-6 transition duration-200 hover:border-blue-500/30 hover:bg-slate-900"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 group-hover:scale-110 transition duration-200">
            <Package className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-base font-bold text-white">Stock Master</h3>
          <p className="mt-1 text-xs text-slate-400">View batches, check stock levels, and report damage/write-offs</p>
          <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-blue-400">
            View Stock <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition duration-200" />
          </div>
        </Link>

        <Link
          href="/employee/alerts"
          className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/50 p-6 transition duration-200 hover:border-orange-500/30 hover:bg-slate-900"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10 text-orange-400 group-hover:scale-110 transition duration-200">
            <Bell className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-base font-bold text-white">Stock Alerts</h3>
          <p className="mt-1 text-xs text-slate-400">Review medicines below reorder thresholds and near-expiry batches</p>
          <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-orange-400">
            Check Alerts <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition duration-200" />
          </div>
        </Link>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Active Medicines</div>
          <div className="mt-2 text-2xl font-bold text-white">{stats.totalItems}</div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Low Stock Warning</div>
          <div className={`mt-2 text-2xl font-bold ${stats.lowStockCount > 0 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
            {stats.lowStockCount}
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-5">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Expiring/Critical Lots</div>
          <div className={`mt-2 text-2xl font-bold ${stats.expiringCount > 0 ? 'text-orange-400 animate-pulse' : 'text-white'}`}>
            {stats.expiringCount}
          </div>
        </div>
      </div>

      {/* Quick Search Stock Section */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Quick Stock Lookup</h2>
            <p className="text-xs text-slate-400">Instantly look up availability and nearest expiry date for any item</p>
          </div>
          <div className="relative w-full max-w-xs">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              placeholder="Search medicine name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full rounded-xl border border-slate-800 bg-slate-950/50 py-2 pl-9 pr-4 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Results list */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredSummaries.length === 0 ? (
            <div className="col-span-full py-8 text-center text-xs text-slate-500">
              No matching medicines found in catalog.
            </div>
          ) : (
            filteredSummaries.slice(0, 9).map((prod) => {
              const hasStock = prod.total_stock > 0;
              const expiryInfo = prod.nearest_expiry ? getExpiryStatus(prod.nearest_expiry) : null;

              return (
                <div
                  key={prod.product_id}
                  className="rounded-xl border border-slate-800 bg-slate-950/30 p-4 hover:border-slate-700 transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex gap-2">
                      <div className="mt-0.5 rounded-lg bg-emerald-500/10 p-1 text-emerald-400">
                        <Pill className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white line-clamp-1">{prod.name}</h4>
                        <p className="text-[10px] text-slate-400 line-clamp-1">
                          {prod.generic_name || 'No composition'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-850 pt-3 text-xs">
                    <div>
                      <div className="text-[10px] uppercase text-slate-500 tracking-wider">Total Stock</div>
                      <div className={`mt-0.5 font-bold ${hasStock ? 'text-emerald-400' : 'text-red-400'}`}>
                        {hasStock ? `${prod.total_stock} Available` : 'Out of Stock'}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] uppercase text-slate-500 tracking-wider">Next Expiry</div>
                      <div className="mt-0.5 text-slate-300 font-semibold">
                        {expiryInfo ? (
                          <span className={expiryInfo.colorClass}>
                            {new Date(prod.nearest_expiry!).toLocaleDateString('en-IN', {
                              month: 'short',
                              year: '2-digit',
                            })}
                          </span>
                        ) : (
                          'N/A'
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
