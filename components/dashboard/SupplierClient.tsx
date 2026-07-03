'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supplierSchema } from '@/lib/validation';
import { createSupplier, updateSupplier, deleteSupplier } from '@/lib/actions/suppliers';
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

interface Supplier {
  id: string;
  name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  gstin: string | null;
  address: string | null;
  created_at: string;
}

interface SupplierClientProps {
  initialSuppliers: Supplier[];
}

type SupplierFormData = z.infer<typeof supplierSchema>;

export default function SupplierClient({ initialSuppliers }: SupplierClientProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: '',
      contact_person: '',
      phone: '',
      email: '',
      gstin: '',
      address: '',
    },
  });

  const handleOpenAdd = () => {
    setEditingSupplier(null);
    setError(null);
    setSuccessMsg(null);
    reset({
      name: '',
      contact_person: '',
      phone: '',
      email: '',
      gstin: '',
      address: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (sup: Supplier) => {
    setEditingSupplier(sup);
    setError(null);
    setSuccessMsg(null);
    reset({
      name: sup.name,
      contact_person: sup.contact_person || '',
      phone: sup.phone || '',
      email: sup.email || '',
      gstin: sup.gstin || '',
      address: sup.address || '',
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (data: SupplierFormData) => {
    setError(null);
    setSuccessMsg(null);
    startTransition(async () => {
      let res;
      if (editingSupplier) {
        res = await updateSupplier(editingSupplier.id, null, data);
      } else {
        res = await createSupplier(null, data);
      }

      if (res?.error) {
        setError(res.error);
      } else {
        setSuccessMsg(
          editingSupplier ? 'Supplier updated successfully' : 'Supplier created successfully'
        );
        setTimeout(() => {
          setIsModalOpen(false);
          window.location.reload();
        }, 1200);
      }
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this supplier?')) return;

    const res = await deleteSupplier(id);
    if (res?.error) {
      alert(res.error);
    } else {
      window.location.reload();
    }
  };

  const filteredSuppliers = suppliers.filter((s) => {
    const query = searchQuery.toLowerCase();
    const name = s.name.toLowerCase();
    const contact = s.contact_person?.toLowerCase() || '';
    const phone = s.phone || '';
    const gstin = s.gstin?.toLowerCase() || '';
    return name.includes(query) || contact.includes(query) || phone.includes(query) || gstin.includes(query);
  });

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Supplier Master</h1>
          <p className="text-sm text-slate-400">Manage medicine manufacturers, distributors, and logistics partners</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 py-2.5 px-4 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
        >
          <Plus className="h-4 w-4" />
          Add Supplier
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
          <Search className="h-4 w-4" />
        </div>
        <input
          type="text"
          placeholder="Search suppliers by name, GSTIN, phone..."
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
                <th className="p-4">Supplier Name</th>
                <th className="p-4">Contact Person</th>
                <th className="p-4">Phone / Email</th>
                <th className="p-4 font-mono">GSTIN</th>
                <th className="p-4">Address</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    No suppliers found.
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map((sup) => (
                  <tr key={sup.id} className="hover:bg-slate-800/20 transition duration-150">
                    <td className="p-4 font-semibold text-white">{sup.name}</td>
                    <td className="p-4 text-slate-300">{sup.contact_person || 'N/A'}</td>
                    <td className="p-4 text-slate-300">
                      <div>{sup.phone || 'N/A'}</div>
                      <div className="text-xs text-slate-500">{sup.email || ''}</div>
                    </td>
                    <td className="p-4 font-mono text-slate-300 text-xs">{sup.gstin || 'N/A'}</td>
                    <td className="p-4 text-slate-400 max-w-xs truncate" title={sup.address || ''}>
                      {sup.address || 'N/A'}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(sup)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-emerald-400 transition"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(sup.id)}
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
        title={editingSupplier ? 'Edit Supplier Details' : 'Register New Supplier'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Supplier / Business Name *
              </label>
              <input
                type="text"
                required
                {...register('name')}
                placeholder="e.g. Apex Distributors"
                className="mt-1 block w-full rounded-xl border border-slate-800 bg-slate-950/50 py-2.5 px-3 text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500"
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-400">{errors.name.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Contact Person
                </label>
                <input
                  type="text"
                  {...register('contact_person')}
                  placeholder="e.g. Amit Patel"
                  className="mt-1 block w-full rounded-xl border border-slate-800 bg-slate-950/50 py-2.5 px-3 text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  GSTIN (Tax ID)
                </label>
                <input
                  type="text"
                  {...register('gstin')}
                  placeholder="e.g. 07AAAAA1111A1Z1"
                  className="mt-1 block w-full rounded-xl border border-slate-800 bg-slate-950/50 py-2.5 px-3 text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Phone Number
                </label>
                <input
                  type="text"
                  {...register('phone')}
                  placeholder="e.g. +91 98765 43210"
                  className="mt-1 block w-full rounded-xl border border-slate-800 bg-slate-950/50 py-2.5 px-3 text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Email Address
                </label>
                <input
                  type="email"
                  {...register('email')}
                  placeholder="info@apex.com"
                  className="mt-1 block w-full rounded-xl border border-slate-800 bg-slate-950/50 py-2.5 px-3 text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500"
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Full Business Address
              </label>
              <textarea
                {...register('address')}
                rows={3}
                placeholder="Street address, City, Pin Code..."
                className="mt-1 block w-full rounded-xl border border-slate-800 bg-slate-950/50 py-2.5 px-3 text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500 resize-none"
              />
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
              {editingSupplier ? 'Save Changes' : 'Register Supplier'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
