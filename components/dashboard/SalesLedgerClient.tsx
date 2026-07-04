'use client';

import { useState, useTransition } from 'react';
import { getSaleDetails } from '@/lib/actions/sales';
import Modal from '@/components/ui/Modal';
import {
  FileText,
  Search,
  Calendar,
  CreditCard,
  User,
  ArrowUpDown,
  Download,
  Eye,
  Activity,
} from 'lucide-react';

interface Sale {
  id: string;
  invoice_number: string;
  customer_id: string | null;
  subtotal: any;
  tax_amount: any;
  discount: any;
  total: any;
  payment_mode: string;
  created_by: string;
  created_at: string;
  customers: {
    name: string;
    phone: string;
  } | null;
  profiles: {
    full_name: string;
  } | null;
}

interface SalesLedgerClientProps {
  initialSales: Sale[];
}

export default function SalesLedgerClient({ initialSales }: SalesLedgerClientProps) {
  const [sales, setSales] = useState<Sale[]>(initialSales);
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all'); // all, today, week, month
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'total-desc' | 'total-asc'>('date-desc');

  // Detail Modal States
  const [selectedSaleDetails, setSelectedSaleDetails] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleViewDetails = (saleId: string) => {
    setSelectedSaleDetails(null);
    setIsModalOpen(true);
    startTransition(async () => {
      const details = await getSaleDetails(saleId);
      if (details) {
        setSelectedSaleDetails(details);
      }
    });
  };

  const handleExportCSV = () => {
    const headers = [
      'Invoice Number',
      'Date',
      'Customer Name',
      'Customer Phone',
      'Payment Mode',
      'Subtotal',
      'Tax Amount',
      'Discount',
      'Total Net Paid',
      'Cashier'
    ];

    const rows = filteredAndSortedSales.map((s) => [
      s.invoice_number,
      new Date(s.created_at).toLocaleString(),
      `"${(s.customers?.name || 'Walk-in Customer').replace(/"/g, '""')}"`,
      s.customers?.phone || 'N/A',
      s.payment_mode.toUpperCase(),
      Number(s.subtotal).toFixed(2),
      Number(s.tax_amount).toFixed(2),
      Number(s.discount).toFixed(2),
      Number(s.total).toFixed(2),
      `"${(s.profiles?.full_name || 'System').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\ufeff' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `sales_ledger_${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 1. Filter Logic
  const filteredAndSortedSales = sales
    .filter((s) => {
      // Search text filter
      const query = searchQuery.toLowerCase();
      const invoiceNo = (s.invoice_number || '').toLowerCase();
      const custName = s.customers?.name?.toLowerCase() || 'walk-in customer';
      const custPhone = s.customers?.phone || '';
      const cashierName = s.profiles?.full_name?.toLowerCase() || '';

      const matchesSearch =
        invoiceNo.includes(query) ||
        custName.includes(query) ||
        custPhone.includes(query) ||
        cashierName.includes(query);

      // Payment Mode filter
      const matchesPayment =
        paymentFilter === 'all' || s.payment_mode === paymentFilter;

      // Date Range filter
      let matchesDate = true;
      const saleDate = new Date(s.created_at);
      const now = new Date();
      if (dateFilter === 'today') {
        matchesDate = saleDate.toDateString() === now.toDateString();
      } else if (dateFilter === 'week') {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(now.getDate() - 7);
        matchesDate = saleDate >= oneWeekAgo;
      } else if (dateFilter === 'month') {
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(now.getMonth() - 1);
        matchesDate = saleDate >= oneMonthAgo;
      }

      return matchesSearch && matchesPayment && matchesDate;
    })
    .sort((a, b) => {
      // 2. Sort Logic
      if (sortBy === 'date-desc') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortBy === 'date-asc') {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      if (sortBy === 'total-desc') {
        return Number(b.total) - Number(a.total);
      }
      if (sortBy === 'total-asc') {
        return Number(a.total) - Number(b.total);
      }
      return 0;
    });

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <FileText className="h-6 w-6 text-emerald-400" />
            Sales Ledger (Invoices)
          </h1>
          <p className="text-sm text-slate-400">View, sort, filter, and export pharmacy billing records</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-800 hover:text-white text-slate-300 py-2.5 px-4 text-sm font-semibold transition cursor-pointer"
        >
          <Download className="h-4 w-4" />
          Export Ledger (CSV)
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        {/* Search */}
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder="Invoice / Customer / Phone / Cashier"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full rounded-xl border border-slate-800 bg-slate-900/40 py-2.5 pl-9 pr-4 text-xs text-white placeholder-slate-550 outline-none focus:border-emerald-500 transition"
          />
        </div>

        {/* Payment mode filter */}
        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          className="block w-full rounded-xl border border-slate-800 bg-slate-900/40 py-2.5 px-3 text-xs text-slate-300 outline-none focus:border-emerald-500 transition"
        >
          <option value="all">All Payment Channels</option>
          <option value="cash">Cash Only</option>
          <option value="card">Card Only</option>
          <option value="upi">UPI Only</option>
        </select>

        {/* Date Filter */}
        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="block w-full rounded-xl border border-slate-800 bg-slate-900/40 py-2.5 px-3 text-xs text-slate-300 outline-none focus:border-emerald-500 transition"
        >
          <option value="all">All Time History</option>
          <option value="today">Today Only</option>
          <option value="week">Last 7 Days</option>
          <option value="month">Last 30 Days</option>
        </select>

        {/* Sorting Dropdown */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="block w-full rounded-xl border border-slate-800 bg-slate-900/40 py-2.5 px-3 text-xs text-slate-300 outline-none focus:border-emerald-500 transition"
        >
          <option value="date-desc">Date: Newest First</option>
          <option value="date-asc">Date: Oldest First</option>
          <option value="total-desc">Invoice Value: High to Low</option>
          <option value="total-asc">Invoice Value: Low to High</option>
        </select>
      </div>

      {/* Sales Ledger Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/80 text-xs font-semibold uppercase tracking-wider text-slate-400">
                <th className="p-4">Invoice #</th>
                <th className="p-4">Timestamp</th>
                <th className="p-4">Customer Details</th>
                <th className="p-4 text-center">Payment Mode</th>
                <th className="p-4 text-right">Gross Subtotal</th>
                <th className="p-4 text-right">Tax (GST)</th>
                <th className="p-4 text-right">Net Paid</th>
                <th className="p-4 text-center">Pharmacist</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredAndSortedSales.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500">
                    No matching sales ledger files found.
                  </td>
                </tr>
              ) : (
                filteredAndSortedSales.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/10 transition">
                    <td className="p-4 font-mono font-bold text-white">{s.invoice_number}</td>
                    <td className="p-4 text-slate-400 flex items-center gap-1.5 mt-1.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-500" />
                      {new Date(s.created_at).toLocaleString()}
                    </td>
                    <td className="p-4">
                      <div className="text-white font-semibold">{s.customers?.name || 'Walk-in Customer'}</div>
                      <div className="text-[10px] text-slate-400">{s.customers?.phone || 'No Phone'}</div>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase ${
                        s.payment_mode === 'cash'
                          ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                          : s.payment_mode === 'card'
                          ? 'border-sky-500/20 bg-sky-500/10 text-sky-455'
                          : 'border-amber-500/20 bg-amber-500/10 text-amber-400'
                      }`}>
                        <CreditCard className="h-3 w-3" />
                        {s.payment_mode}
                      </span>
                    </td>
                    <td className="p-4 text-right text-slate-350">₹{Number(s.subtotal).toFixed(2)}</td>
                    <td className="p-4 text-right text-slate-350">₹{Number(s.tax_amount).toFixed(2)}</td>
                    <td className="p-4 text-right font-bold text-emerald-400">₹{Number(s.total).toFixed(2)}</td>
                    <td className="p-4 text-center text-slate-400">{s.profiles?.full_name || 'System'}</td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleViewDetails(s.id)}
                        className="inline-flex items-center gap-1 rounded bg-slate-800 hover:bg-slate-700 py-1.5 px-3 font-semibold text-slate-200 transition cursor-pointer"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Details Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Invoice Receipt Inspector"
      >
        {isPending && (
          <div className="flex h-40 flex-col items-center justify-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-400" />
            <span className="text-xs text-slate-400">Fetching sale details from secure ledger...</span>
          </div>
        )}

        {!isPending && !selectedSaleDetails && (
          <div className="p-4 text-center text-red-400">Failed to fetch invoice details.</div>
        )}

        {!isPending && selectedSaleDetails && (
          <div className="space-y-4 text-xs">
            {/* Header info */}
            <div className="grid grid-cols-2 gap-4 border-b border-slate-800 pb-4">
              <div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider">Invoice Number</div>
                <div className="text-sm font-bold text-white">{selectedSaleDetails.invoice_number}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider">Timestamp</div>
                <div className="text-slate-300">{new Date(selectedSaleDetails.created_at).toLocaleString()}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider">Customer Name</div>
                <div className="text-slate-200">{selectedSaleDetails.customers?.name || 'Walk-in Customer'}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-slate-500 uppercase tracking-wider">Customer Phone</div>
                <div className="text-slate-200">{selectedSaleDetails.customers?.phone || 'Walk-in'}</div>
              </div>
            </div>

            {/* Items List */}
            <div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-2 font-bold">Dispensed Items</div>
              <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-3 space-y-2.5">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800/80 text-[10px] uppercase font-bold text-slate-500">
                      <th className="pb-1.5">Medicine</th>
                      <th className="pb-1.5">Batch</th>
                      <th className="pb-1.5 text-center">Qty</th>
                      <th className="pb-1.5 text-right">Unit MRP</th>
                      <th className="pb-1.5 text-right font-bold">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900/50">
                    {selectedSaleDetails.items?.map((item: any, idx: number) => (
                      <tr key={idx} className="text-slate-300">
                        <td className="py-2">
                          <div className="font-semibold text-slate-200">{item.batches?.products?.name}</div>
                          <div className="text-[9px] text-slate-500">{item.batches?.products?.generic_name}</div>
                        </td>
                        <td className="py-2 font-mono text-slate-400">{item.batches?.batch_number}</td>
                        <td className="py-2 text-center">{item.quantity}</td>
                        <td className="py-2 text-right">₹{Number(item.unit_price).toFixed(2)}</td>
                        <td className="py-2 text-right font-bold text-white">₹{(item.quantity * Number(item.unit_price)).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div className="rounded-xl border border-slate-800/60 bg-slate-900/20 p-3 space-y-2">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal (Net Price)</span>
                <span>₹{Number(selectedSaleDetails.subtotal).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Tax Amount (GST split)</span>
                <span>₹{Number(selectedSaleDetails.tax_amount).toFixed(2)}</span>
              </div>
              {Number(selectedSaleDetails.discount) > 0 && (
                <div className="flex justify-between text-amber-400 font-semibold">
                  <span>Special Discount Applied</span>
                  <span>-₹{Number(selectedSaleDetails.discount).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-slate-800 pt-2 text-sm font-bold text-white">
                <span>Total Amount Paid ({selectedSaleDetails.payment_mode.toUpperCase()})</span>
                <span className="text-emerald-400">₹{Number(selectedSaleDetails.total).toFixed(2)}</span>
              </div>
            </div>

            {/* Verification details */}
            <div className="flex items-center justify-between border-t border-slate-800 pt-3 text-[10px] text-slate-500">
              <span>Pharmacist: {selectedSaleDetails.profiles?.full_name || 'System'}</span>
              <span>Invoice Ref: {selectedSaleDetails.id.substring(0, 8)}...</span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

// Loader mock
function Loader2(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
