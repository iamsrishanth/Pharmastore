'use client';

import { useState } from 'react';
import {
  TrendingUp,
  Activity,
  DollarSign,
  Percent,
  AlertTriangle,
  Archive,
  Layers,
  ArrowRight,
  ShieldCheck,
  Calendar,
} from 'lucide-react';

interface AnalyticsData {
  stockValuation: {
    cost: number;
    mrp: number;
    selling: number;
    marginVal: number;
    marginPercent: number;
    projectedTax: number;
  };
  expiryLoss: {
    cost: number;
    mrp: number;
  };
  supplierReturnsCredits: number;
  dailyTrends: Array<{ date: string; total: number }>;
  paymentMode: {
    cash: number;
    card: number;
    upi: number;
  };
  topSelling: Array<{ name: string; quantity: number; revenue: number }>;
}

interface AnalyticsClientProps {
  data: AnalyticsData;
}

export default function AnalyticsClient({ data }: AnalyticsClientProps) {
  // Chart calculation settings
  const dailyTrends = data.dailyTrends || [];
  const maxTotal = Math.max(...dailyTrends.map((t) => t.total), 1);
  
  // Dimensions for SVG line chart
  const svgWidth = 600;
  const svgHeight = 220;
  const padX = 50;
  const padY = 30;
  const chartW = svgWidth - padX * 2;
  const chartH = svgHeight - padY * 2;

  // Generate SVG coordinate points
  const points = dailyTrends.map((t, idx) => {
    const x = padX + (idx / Math.max(1, dailyTrends.length - 1)) * chartW;
    const y = svgHeight - padY - (t.total / maxTotal) * chartH;
    return { x, y, date: t.date, total: t.total };
  });

  const lineD = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = points.length > 0 
    ? `${lineD} L ${points[points.length - 1].x} ${svgHeight - padY} L ${points[0].x} ${svgHeight - padY} Z`
    : '';

  // Payment totals
  const payData = data.paymentMode || { cash: 0, card: 0, upi: 0 };
  const payTotal = payData.cash + payData.card + payData.upi || 1;
  const payCashPercent = (payData.cash / payTotal) * 100;
  const payCardPercent = (payData.card / payTotal) * 100;
  const payUpiPercent = (payData.upi / payTotal) * 100;

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <TrendingUp className="h-6 w-6 text-emerald-400" />
          Financial Intelligence & Margins
        </h1>
        <p className="text-sm text-slate-400">
          Executive analytics covering retail performance, catalog valuations, tax liabilities, and expiry leakage
        </p>
      </div>

      {/* Primary KPI Widgets */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Cost valuation */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Catalog Valuation (Cost)</span>
            <DollarSign className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white font-mono">
            ₹{data.stockValuation.cost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-1 text-xs text-slate-500">Total capital locked in inventory</div>
        </div>

        {/* Expected MRP valuation */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Catalog Valuation (MRP)</span>
            <DollarSign className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white font-mono">
            ₹{data.stockValuation.mrp.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-1 text-xs text-slate-500">Retail sales potential at maximum MRP</div>
        </div>

        {/* Expected margin */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Gross Profit Margin</span>
            <Percent className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-400 font-mono">
            {data.stockValuation.marginPercent.toFixed(2)}%
          </div>
          <div className="mt-1 text-xs text-slate-500">
            Estimated profit: ₹{data.stockValuation.marginVal.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
        </div>

        {/* Credit Returns valuation */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 backdrop-blur-md">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Recovered Returns</span>
            <ShieldCheck className="h-4 w-4 text-purple-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-purple-400 font-mono">
            ₹{data.supplierReturnsCredits.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-1 text-xs text-slate-500">Returned near-expiry lots (last 30 days)</div>
        </div>
      </div>

      {/* Main Charts & Leakage Breakdown */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Sales Trend Chart (Left/Center) */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md">
          <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-1.5">
            <Activity className="h-4 w-4 text-emerald-400" />
            POS Daily Sales Revenue (Last 30 Days)
          </h3>

          {/* SVG line chart */}
          <div className="relative w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-auto min-w-[500px]"
            >
              {/* Definitions for Gradients */}
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1={padX} y1={padY} x2={svgWidth - padX} y2={padY} stroke="#1e293b" strokeDasharray="3,3" />
              <line x1={padX} y1={padY + chartH / 2} x2={svgWidth - padX} y2={padY + chartH / 2} stroke="#1e293b" strokeDasharray="3,3" />
              <line x1={padX} y1={svgHeight - padY} x2={svgWidth - padX} y2={svgHeight - padY} stroke="#334155" />

              {/* Area path */}
              {areaD && <path d={areaD} fill="url(#chartGradient)" />}

              {/* Line path */}
              {lineD && (
                <path
                  d={lineD}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              )}

              {/* Dots & Labels */}
              {points.map((p, idx) => (
                <g key={idx}>
                  <circle cx={p.x} cy={p.y} r="3.5" fill="#10b981" stroke="#0f172a" strokeWidth="1.5" />
                  {/* Date labels on horizontal axis */}
                  <text
                    x={p.x}
                    y={svgHeight - 10}
                    fill="#94a3b8"
                    fontSize="9"
                    textAnchor="middle"
                    className="font-mono"
                  >
                    {p.date}
                  </text>
                  {/* Amount labels on hover (simulated via standard text tags at endpoints) */}
                  {(idx === 0 || idx === points.length - 1) && (
                    <text
                      x={p.x}
                      y={p.y - 8}
                      fill="#e2e8f0"
                      fontSize="9"
                      fontWeight="bold"
                      textAnchor="middle"
                      className="font-mono"
                    >
                      ₹{Math.round(p.total)}
                    </text>
                  )}
                </g>
              ))}
            </svg>
          </div>
        </div>

        {/* GST Liability & Expiry Leakage Card (Right) */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              Inventory Expiry Losses
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">
              Value of medicines currently in stock that have passed their expiry date
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl border border-red-500/10 bg-red-500/5 p-4 text-left">
              <div className="text-[10px] uppercase font-bold text-red-400">Loss at Cost</div>
              <div className="text-xl font-bold font-mono text-white mt-1">
                ₹{data.expiryLoss.cost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
            </div>
            <div className="rounded-xl border border-red-500/10 bg-red-500/5 p-4 text-left">
              <div className="text-[10px] uppercase font-bold text-slate-450">Loss at Retail</div>
              <div className="text-xl font-bold font-mono text-white mt-1">
                ₹{data.expiryLoss.mrp.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800/80 pt-5 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-1.5">
                <Archive className="h-4 w-4 text-amber-400" />
                Projected Tax Liabilities
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">
                Estimated GST (CGST/SGST) to be paid upon selling active catalog items
              </p>
            </div>
            <div className="rounded-xl border border-amber-500/10 bg-amber-500/5 p-4 text-left">
              <div className="text-[10px] uppercase font-bold text-amber-450">Estimated GST Payable</div>
              <div className="text-xl font-bold font-mono text-white mt-1">
                ₹{data.stockValuation.projectedTax.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Billing modes & Top Sellers */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Payment Modes */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md">
          <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-1.5">
            <Layers className="h-4 w-4 text-emerald-400" />
            Billing Payment Channels
          </h3>
          <div className="space-y-4">
            {/* Cash */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Cash Transactions</span>
                <span className="font-mono text-slate-200">
                  ₹{payData.cash.toLocaleString()} ({payCashPercent.toFixed(1)}%)
                </span>
              </div>
              <div className="h-2 w-full bg-slate-850 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: `${payCashPercent}%` }} />
              </div>
            </div>

            {/* UPI */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">UPI Payments</span>
                <span className="font-mono text-slate-200">
                  ₹{payData.upi.toLocaleString()} ({payUpiPercent.toFixed(1)}%)
                </span>
              </div>
              <div className="h-2 w-full bg-slate-850 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500" style={{ width: `${payUpiPercent}%` }} />
              </div>
            </div>

            {/* Card */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Card Terminals</span>
                <span className="font-mono text-slate-200">
                  ₹{payData.card.toLocaleString()} ({payCardPercent.toFixed(1)}%)
                </span>
              </div>
              <div className="h-2 w-full bg-slate-850 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500" style={{ width: `${payCardPercent}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Top Products */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md">
          <h3 className="text-sm font-semibold text-slate-200 mb-4 flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            Top Selling Medicines
          </h3>
          <div className="divide-y divide-slate-800/60">
            {data.topSelling.length === 0 ? (
              <div className="text-xs text-slate-500 py-6 text-center">No sales registered yet.</div>
            ) : (
              data.topSelling.map((prod, idx) => (
                <div key={idx} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="flex h-5 w-5 items-center justify-center rounded bg-slate-800 text-[10px] font-bold text-slate-400">
                      #{idx + 1}
                    </span>
                    <span className="font-bold text-white">{prod.name}</span>
                  </div>
                  <div className="text-right text-xs">
                    <div className="font-mono text-slate-200">₹{prod.revenue.toLocaleString()}</div>
                    <div className="text-[10px] text-slate-400">{prod.quantity} units sold</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
