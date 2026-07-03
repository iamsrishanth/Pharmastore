'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { employeeSchema } from '@/lib/validation';
import { createEmployee, updateEmployee, toggleEmployeeStatus } from '@/lib/actions/employees';
import Modal from '@/components/ui/Modal';
import {
  Plus,
  Search,
  Edit2,
  UserCheck,
  UserX,
  AlertTriangle,
  Loader2,
  CheckCircle,
} from 'lucide-react';

import { z } from 'zod';

interface Profile {
  id: string;
  full_name: string;
  email: string | null;
  role: string;
  phone: string | null;
  is_active: boolean;
  created_at: string;
}

interface EmployeeClientProps {
  initialEmployees: Profile[];
}

type EmployeeFormData = z.infer<typeof employeeSchema>;

export default function EmployeeClient({ initialEmployees }: EmployeeClientProps) {
  const [employees, setEmployees] = useState<Profile[]>(initialEmployees);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EmployeeFormData>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      full_name: '',
      email: '',
      password: '',
      role: 'employee',
      phone: '',
      is_active: true,
    },
  });

  const handleOpenAdd = () => {
    setEditingEmployee(null);
    setError(null);
    setSuccessMsg(null);
    reset({
      full_name: '',
      email: '',
      password: '',
      role: 'employee',
      phone: '',
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (emp: Profile) => {
    setEditingEmployee(emp);
    setError(null);
    setSuccessMsg(null);
    reset({
      full_name: emp.full_name,
      email: emp.email || '',
      password: '', // leave empty to not change password
      role: emp.role as 'admin' | 'employee',
      phone: emp.phone || '',
      is_active: emp.is_active,
    });
    setIsModalOpen(true);
  };

  const onSubmit = async (data: EmployeeFormData) => {
    setError(null);
    setSuccessMsg(null);
    startTransition(async () => {
      let res;
      if (editingEmployee) {
        res = await updateEmployee(editingEmployee.id, null, data);
      } else {
        res = await createEmployee(null, data);
      }

      if (res?.error) {
        setError(res.error);
      } else {
        setSuccessMsg(
          editingEmployee
            ? 'Employee details updated successfully'
            : 'Employee registered successfully'
        );
        setTimeout(() => {
          setIsModalOpen(false);
          window.location.reload();
        }, 1200);
      }
    });
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    const actionText = currentStatus ? 'deactivate' : 'activate';
    if (!confirm(`Are you sure you want to ${actionText} this user account?`)) return;

    const res = await toggleEmployeeStatus(id, !currentStatus);
    if (res?.error) {
      alert(res.error);
    } else {
      window.location.reload();
    }
  };

  const filteredEmployees = employees.filter((e) => {
    const query = searchQuery.toLowerCase();
    const name = e.full_name.toLowerCase();
    const email = e.email?.toLowerCase() || '';
    const phone = e.phone || '';
    return name.includes(query) || email.includes(query) || phone.includes(query);
  });

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Employee Management</h1>
          <p className="text-sm text-slate-400">Add, edit, or deactivate store operators and administrators</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500 py-2.5 px-4 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
        >
          <Plus className="h-4 w-4" />
          Add Employee
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
          <Search className="h-4 w-4" />
        </div>
        <input
          type="text"
          placeholder="Search employees by name, email, phone..."
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
                <th className="p-4">Full Name</th>
                <th className="p-4">Email Address</th>
                <th className="p-4">Role Badge</th>
                <th className="p-4">Contact Phone</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500">
                    No employees found.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-800/20 transition duration-150">
                    <td className="p-4 font-semibold text-white">{emp.full_name}</td>
                    <td className="p-4 text-slate-300">{emp.email || 'No email associated'}</td>
                    <td className="p-4">
                      <span
                        className={`inline-flex rounded-md px-2.5 py-1 text-xs font-semibold tracking-wide border uppercase ${
                          emp.role === 'admin'
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                            : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                        }`}
                      >
                        {emp.role}
                      </span>
                    </td>
                    <td className="p-4 text-slate-300">{emp.phone || 'N/A'}</td>
                    <td className="p-4 text-center">
                      {emp.is_active ? (
                        <span className="inline-flex rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-400">
                          Deactivated
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(emp)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-emerald-400 transition"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(emp.id, emp.is_active)}
                          className={`rounded-lg p-1.5 transition ${
                            emp.is_active
                              ? 'text-red-400 hover:bg-slate-800 hover:text-red-300'
                              : 'text-emerald-400 hover:bg-slate-800 hover:text-emerald-300'
                          }`}
                          title={emp.is_active ? 'Deactivate User' : 'Activate User'}
                        >
                          {emp.is_active ? (
                            <UserX className="h-4 w-4" />
                          ) : (
                            <UserCheck className="h-4 w-4" />
                          )}
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
        title={editingEmployee ? 'Edit Employee Details' : 'Register New Employee'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Full Name *
              </label>
              <input
                type="text"
                required
                {...register('full_name')}
                placeholder="e.g. Rahul Sharma"
                className="mt-1 block w-full rounded-xl border border-slate-800 bg-slate-950/50 py-2.5 px-3 text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500"
              />
              {errors.full_name && (
                <p className="mt-1 text-xs text-red-400">{errors.full_name.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Email Address *
              </label>
              <input
                type="email"
                required
                {...register('email')}
                placeholder="rahul@pharmastore.com"
                className="mt-1 block w-full rounded-xl border border-slate-800 bg-slate-950/50 py-2.5 px-3 text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Password {editingEmployee && '(leave blank to keep current)'} *
              </label>
              <input
                type="password"
                required={!editingEmployee}
                {...register('password')}
                placeholder="••••••••"
                className="mt-1 block w-full rounded-xl border border-slate-800 bg-slate-950/50 py-2.5 px-3 text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500"
              />
              {errors.password && (
                <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Contact Phone
                </label>
                <input
                  type="text"
                  {...register('phone')}
                  placeholder="+91 XXXXX XXXXX"
                  className="mt-1 block w-full rounded-xl border border-slate-800 bg-slate-950/50 py-2.5 px-3 text-sm text-white placeholder-slate-500 outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  User Role *
                </label>
                <select
                  required
                  {...register('role')}
                  className="mt-1 block w-full rounded-xl border border-slate-800 bg-slate-950/50 py-2.5 px-3 text-sm text-white outline-none focus:border-emerald-500"
                >
                  <option value="employee">Employee</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 py-2">
              <input
                type="checkbox"
                id="is_active"
                {...register('is_active')}
                className="h-4 w-4 rounded border-slate-800 bg-slate-950/50 text-emerald-500 focus:ring-emerald-500/20"
              />
              <label htmlFor="is_active" className="text-sm font-semibold text-slate-300">
                Account Active (User can log in)
              </label>
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
              {editingEmployee ? 'Save Changes' : 'Register User'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
