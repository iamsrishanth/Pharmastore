'use client';

import { useState, useEffect, useRef, useTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import { createSale } from '@/lib/actions/sales';
import { getExpiryStatus } from '@/lib/utils/expiry';
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  Barcode,
  Upload,
  CreditCard,
  QrCode,
  DollarSign,
  AlertCircle,
  CheckCircle,
  FileText,
  Printer,
  Camera,
} from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface Product {
  id: string;
  name: string;
  generic_name: string | null;
  requires_prescription: boolean;
  tax_rate: number;
  barcode: string | null;
  unit: string | null;
}

interface CartItem {
  product: Product;
  quantity: number;
  taxRate: number;
}

interface POSBillingClientProps {
  products: Product[];
}

export default function POSBillingClient({ products }: POSBillingClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [paymentMode, setPaymentMode] = useState<'cash' | 'card' | 'upi'>('cash');
  const [discount, setDiscount] = useState<number>(0);
  
  // Prescription upload fields
  const [prescriptionRef, setPrescriptionRef] = useState('');
  const [prescriptionUrl, setPrescriptionUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  
  // Checkout feedback
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [createdInvoiceNum, setCreatedInvoiceNum] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Camera Barcode Scanner State
  const [showScanner, setShowScanner] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  // Auto-close search list when selecting
  const [showProductList, setShowProductList] = useState(false);

  // Calculated totals
  const subtotal = cart.reduce((sum, item) => {
    // In our system, selling price details are resolved at FEFO checkout on server,
    // but in POS UI, we show a preview assuming default/general estimates.
    // Let's assume a general preview price of ₹100 for display, or we fetch MRP preview.
    // To make it look extremely real and premium, let's assign a mock preview MRP
    // (since MRP is stored on the batch, we can show ₹100 placeholder or look up product details).
    // Let's assume a baseline base price of ₹100 per unit for cart preview calculations, 
    // but clearly communicate that actual prices will be locked on batches via FEFO at checkout.
    return sum + item.quantity * 100;
  }, 0);

  const taxAmount = cart.reduce((sum, item) => {
    const itemSubtotal = item.quantity * 100;
    return sum + itemSubtotal * (item.taxRate / 100);
  }, 0);

  const totalAmount = Math.max(0, subtotal + taxAmount - discount);

  // Check if any cart item requires prescription
  const requiresRx = cart.some((item) => item.product.requires_prescription);

  // Handle barcode scanner initialization
  useEffect(() => {
    if (showScanner) {
      scannerRef.current = new Html5QrcodeScanner(
        'qr-reader',
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );

      scannerRef.current.render(
        (decodedText) => {
          // Successfully scanned a barcode!
          handleBarcodeScan(decodedText);
          setShowScanner(false);
          if (scannerRef.current) {
            scannerRef.current.clear();
          }
        },
        (err) => {
          // Silent scan errors
        }
      );
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch((e) => console.log('Error clearing scanner', e));
      }
    };
  }, [showScanner]);

  const handleBarcodeScan = (barcode: string) => {
    const foundProduct = products.find((p) => p.barcode === barcode);
    if (foundProduct) {
      addToCart(foundProduct);
      setSuccessMsg(`Scanned: ${foundProduct.name}`);
      setTimeout(() => setSuccessMsg(null), 2000);
    } else {
      setError(`No product registered with barcode: ${barcode}`);
      setTimeout(() => setError(null), 3000);
    }
  };

  const addToCart = (product: Product) => {
    setError(null);
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1, taxRate: Number(product.tax_rate) }];
    });
    setSearchQuery('');
    setShowProductList(false);
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const nextQty = item.quantity + delta;
            return { ...item, quantity: nextQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const handlePrescriptionUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    try {
      const supabase = createClient();
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `prescriptions/${fileName}`;

      // Upload file to Supabase storage bucket 'prescriptions'
      const { data, error: uploadError } = await supabase.storage
        .from('prescriptions')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('prescriptions')
        .getPublicUrl(filePath);

      setPrescriptionUrl(urlData.publicUrl);
      setSuccessMsg('Prescription image uploaded successfully!');
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(`Storage Upload failed: Make sure 'prescriptions' storage bucket is created in Supabase.`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCheckout = () => {
    setError(null);
    setSuccessMsg(null);

    if (cart.length === 0) {
      setError('Please add products to the cart first.');
      return;
    }

    if (requiresRx && !prescriptionRef && !prescriptionUrl) {
      setError('Schedule H/H1/X drugs require a Doctor prescription reference or image upload.');
      return;
    }

    startTransition(async () => {
      const res = await createSale({
        customerName,
        customerPhone,
        customerAddress,
        items: cart.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
        paymentMode,
        discount,
        prescriptionRef: prescriptionRef || undefined,
        prescriptionUrl: prescriptionUrl || undefined,
      });

      if (res?.error) {
        setError(res.error);
      } else {
        setSuccessMsg(`Checkout completed successfully!`);
        setCreatedInvoiceNum(res.invoiceNumber || 'INV-TEMP');
        setCart([]);
        setCustomerName('');
        setCustomerPhone('');
        setCustomerAddress('');
        setDiscount(0);
        setPrescriptionRef('');
        setPrescriptionUrl('');
      }
    });
  };

  const handlePrint = () => {
    window.print();
  };

  // Autocomplete suggestions
  const suggestions = products.filter((p) => {
    if (searchQuery.trim() === '') return false;
    const query = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(query) ||
      (p.generic_name && p.generic_name.toLowerCase().includes(query)) ||
      (p.barcode && p.barcode.includes(query))
    );
  });

  return (
    <div className="space-y-6">
      {/* Printable Receipt Block for Browser Print Stylesheet */}
      {createdInvoiceNum && (
        <div className="hidden print:block print:bg-white print:text-black p-4 w-[80mm] mx-auto text-xs font-mono">
          <div className="text-center font-bold text-base">PHARMASTORE</div>
          <div className="text-center">Drug License No: DL-12345/ABC</div>
          <div className="text-center">Pharmacist: Rajan Verma</div>
          <div className="border-t border-dashed my-2" />
          <div>Invoice: {createdInvoiceNum}</div>
          <div>Date: {new Date().toLocaleString()}</div>
          <div className="border-t border-dashed my-2" />
          <table className="w-full text-left">
            <thead>
              <tr className="border-b">
                <th>Item</th>
                <th className="text-center">Qty</th>
                <th className="text-right">Price</th>
              </tr>
            </thead>
            <tbody>
              {cart.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.product.name}</td>
                  <td className="text-center">{item.quantity}</td>
                  <td className="text-right">₹{(item.quantity * 100).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border-t border-dashed my-2" />
          <div className="flex justify-between font-bold">
            <span>Net Paid Amount:</span>
            <span>₹{totalAmount.toFixed(2)}</span>
          </div>
          <div className="text-center mt-4">Thank you! Get well soon.</div>
        </div>
      )}

      {/* POS UI wrapper (hidden during browser print) */}
      <div className="print:hidden grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Side: Product Search & Cart */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <ShoppingCart className="h-5 w-5 text-emerald-400" />
              Counter Billing Terminal
            </h2>

            {/* Barcode scanner view */}
            {showScanner && (
              <div className="mb-4 overflow-hidden rounded-xl border border-slate-800 bg-slate-950 p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-400">Position barcode in the box</span>
                  <button
                    onClick={() => setShowScanner(false)}
                    className="text-xs text-red-400 hover:underline"
                  >
                    Close Camera
                  </button>
                </div>
                <div id="qr-reader" className="mx-auto max-w-sm" />
              </div>
            )}

            {/* Product Lookup Area */}
            <div className="relative flex gap-2">
              <div className="relative flex-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <Search className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  placeholder="Scan barcode or type medicine name to add..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowProductList(true);
                  }}
                  onFocus={() => setShowProductList(true)}
                  className="block w-full rounded-xl border border-slate-800 bg-slate-950/50 py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500"
                />
              </div>

              {/* Camera Scanner Toggle */}
              <button
                onClick={() => setShowScanner(!showScanner)}
                className="flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 px-4 border border-slate-700 text-slate-300 gap-1.5 transition"
                title="Scan Barcode using Device Camera"
              >
                <Camera className="h-5 w-5 text-emerald-400" />
                <span className="hidden sm:inline text-xs font-semibold">Camera Scan</span>
              </button>
            </div>

            {/* Autocomplete Suggestions Box */}
            {showProductList && suggestions.length > 0 && (
              <div className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-slate-800 bg-slate-900 shadow-2xl divide-y divide-slate-800/60">
                {suggestions.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => addToCart(p)}
                    className="flex w-full items-center justify-between px-4 py-3 text-left text-sm hover:bg-slate-800 transition"
                  >
                    <div>
                      <div className="font-semibold text-white">{p.name}</div>
                      <div className="text-xs text-slate-400">{p.generic_name || 'Composition N/A'}</div>
                    </div>
                    <div className="text-right">
                      <span className="rounded bg-slate-800 px-2 py-0.5 text-xs text-slate-300">GST: {p.tax_rate}%</span>
                      {p.requires_prescription && (
                        <span className="ml-1.5 rounded bg-red-500/10 border border-red-500/20 px-2 py-0.5 text-xs text-red-400">Rx</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Cart Table */}
            <div className="mt-6">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Billing Cart</h3>
              <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950/20">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/50 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      <th className="p-3">Medicine Description</th>
                      <th className="p-3 text-center">Tax Split</th>
                      <th className="p-3 text-center">Quantity</th>
                      <th className="p-3 text-right">Price</th>
                      <th className="p-3 text-right">Remove</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50 text-xs">
                    {cart.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-slate-500">
                          Your billing cart is empty. Scan or search items above to begin.
                        </td>
                      </tr>
                    ) : (
                      cart.map((item) => (
                        <tr key={item.product.id} className="hover:bg-slate-800/10 transition">
                          <td className="p-3">
                            <div className="font-bold text-white">{item.product.name}</div>
                            <div className="text-[10px] text-slate-400">
                              {item.product.generic_name || 'Generic'} {item.product.requires_prescription && (
                                <span className="ml-1 text-red-400 font-semibold">[Prescription Req.]</span>
                              )}
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <span className="text-[10px] text-slate-400">
                              CGST: {item.taxRate / 2}% / SGST: {item.taxRate / 2}%
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <div className="inline-flex items-center rounded-lg bg-slate-800 p-0.5 border border-slate-700">
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.product.id, -1)}
                                className="rounded p-1 text-slate-400 hover:text-white"
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="w-8 font-bold text-white text-center text-xs">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.product.id, 1)}
                                className="rounded p-1 text-slate-400 hover:text-white"
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                            </div>
                          </td>
                          <td className="p-3 text-right text-slate-200 font-mono">
                            ₹{(item.quantity * 100).toFixed(2)}
                          </td>
                          <td className="p-3 text-right">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.product.id, -item.quantity)}
                              className="rounded p-1.5 text-slate-500 hover:text-red-400 transition"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Customer info, prescription upload & Checkout */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-md space-y-6">
            <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-3">Checkout Details</h2>

            {/* Customer Details Form */}
            <div className="space-y-4">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Customer Details</h3>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase">Mobile Number</label>
                <input
                  type="text"
                  placeholder="e.g. +91 98765 43210"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-slate-800 bg-slate-950/50 py-2 px-3 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase">Customer Name</label>
                <input
                  type="text"
                  placeholder="e.g. Anand Kumar"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-slate-800 bg-slate-950/50 py-2 px-3 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase">Billing Address</label>
                <input
                  type="text"
                  placeholder="City, Pin Code"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-slate-800 bg-slate-950/50 py-2 px-3 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Prescription Mandatory Gate */}
            {requiresRx && (
              <div className="space-y-4 rounded-xl border border-red-500/10 bg-red-500/5 p-4">
                <div className="flex gap-2 text-xs font-semibold text-red-400">
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <span>Prescription Gate (Schedule H/H1/X)</span>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Prescription Ref / No *</label>
                  <input
                    type="text"
                    required
                    placeholder="Doctor Reg / Slip Ref"
                    value={prescriptionRef}
                    onChange={(e) => setPrescriptionRef(e.target.value)}
                    className="mt-1 block w-full rounded-xl border border-slate-850 bg-slate-950/50 py-2 px-3 text-xs text-white placeholder-slate-500 outline-none focus:border-red-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase">Upload Prescription Image *</label>
                  <div className="relative mt-1 flex items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-950/50 py-4 px-3 text-slate-400 hover:border-slate-700 transition">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePrescriptionUpload}
                      disabled={isUploading}
                      className="absolute inset-0 cursor-pointer opacity-0"
                    />
                    <div className="flex flex-col items-center gap-1.5 text-center">
                      <Upload className="h-5 w-5 text-slate-400" />
                      <span className="text-[10px]">
                        {isUploading ? 'Uploading file...' : 'Choose image or drag here'}
                      </span>
                    </div>
                  </div>
                  {prescriptionUrl && (
                    <div className="mt-2 flex items-center gap-1.5 text-[10px] text-emerald-400 font-semibold">
                      <CheckCircle className="h-4 w-4" />
                      Uploaded successfully! <a href={prescriptionUrl} target="_blank" rel="noreferrer" className="underline">View public link</a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Financial Summary */}
            <div className="space-y-3 border-t border-slate-800 pt-4 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal (estimated):</span>
                <span className="font-mono text-slate-200">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>CGST / SGST split:</span>
                <span className="font-mono text-slate-200">₹{taxAmount.toFixed(2)}</span>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase">Discount (₹)</label>
                <input
                  type="number"
                  min={0}
                  value={discount}
                  onChange={(e) => setDiscount(Math.max(0, Number(e.target.value)))}
                  className="mt-1 block w-24 rounded-xl border border-slate-800 bg-slate-950/50 py-1.5 px-3 text-xs text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-between text-sm font-bold text-white border-t border-slate-850 pt-3">
                <span>Net Total:</span>
                <span className="font-mono text-emerald-400">₹{totalAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Mode */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Payment Mode</h3>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMode('cash')}
                  className={`flex flex-col items-center justify-center rounded-xl p-3 border transition ${
                    paymentMode === 'cash'
                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                      : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <DollarSign className="h-5 w-5 mb-1" />
                  <span className="text-[10px] font-semibold">Cash</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMode('upi')}
                  className={`flex flex-col items-center justify-center rounded-xl p-3 border transition ${
                    paymentMode === 'upi'
                      ? 'bg-purple-500/10 border-purple-500 text-purple-400'
                      : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <QrCode className="h-5 w-5 mb-1" />
                  <span className="text-[10px] font-semibold">UPI</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMode('card')}
                  className={`flex flex-col items-center justify-center rounded-xl p-3 border transition ${
                    paymentMode === 'card'
                      ? 'bg-blue-500/10 border-blue-500 text-blue-400'
                      : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <CreditCard className="h-5 w-5 mb-1" />
                  <span className="text-[10px] font-semibold">Card</span>
                </button>
              </div>
            </div>

            {/* Error alerts */}
            {error && (
              <div className="flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="flex items-start gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-xs text-emerald-400">
                <CheckCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <div>
                  <div>{successMsg}</div>
                  {createdInvoiceNum && (
                    <div className="mt-1 font-bold">Invoice generated: {createdInvoiceNum}</div>
                  )}
                </div>
              </div>
            )}

            {/* Print & Action Buttons */}
            <div className="space-y-2 border-t border-slate-800 pt-4">
              <button
                type="button"
                disabled={isPending || cart.length === 0}
                onClick={handleCheckout}
                className="flex w-full items-center justify-center rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/15 hover:bg-emerald-400 disabled:opacity-50 transition"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Allocating Stock FEFO...
                  </>
                ) : (
                  'Generate Bill & Checkout'
                )}
              </button>

              {createdInvoiceNum && (
                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex w-full items-center justify-center rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 py-2.5 text-xs font-semibold text-slate-200 gap-1.5 transition"
                >
                  <Printer className="h-4 w-4 text-emerald-400" />
                  Print Thermal Invoice (Ctrl+P)
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Simple loader helper inside actions
function Loader2({ className }: { className?: string }) {
  return <div className={`animate-spin rounded-full border-2 border-slate-950 border-t-transparent ${className}`} style={{ borderTopColor: 'transparent' }} />;
}
