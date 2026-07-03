'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logout } from '@/lib/actions/auth';
import {
  Activity,
  LayoutDashboard,
  Pill,
  Layers,
  Users,
  Truck,
  FileSpreadsheet,
  Settings,
  ShoppingBag,
  Package,
  Bell,
  LogOut,
  Menu,
  X,
  User,
} from 'lucide-react';

interface HeaderProps {
  profile: {
    full_name: string;
    role: string;
    email?: string;
  };
}

export default function Header({ profile }: HeaderProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isAdmin = profile.role === 'admin';

  const adminLinks = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/products', label: 'Products', icon: Pill },
    { href: '/admin/batches', label: 'Batches', icon: Layers },
    { href: '/admin/employees', label: 'Employees', icon: Users },
    { href: '/admin/suppliers', label: 'Suppliers', icon: Truck },
    { href: '/admin/purchase-orders', label: 'POs', icon: FileSpreadsheet },
    { href: '/admin/settings', label: 'Settings', icon: Settings },
  ];

  const employeeLinks = [
    { href: '/employee/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/employee/billing', label: 'POS Billing', icon: ShoppingBag },
    { href: '/employee/stock', label: 'Stock Master', icon: Package },
    { href: '/employee/alerts', label: 'Alerts', icon: Bell },
  ];

  // If user is admin, they can switch to employee POS Billing or Stock if they need to,
  // or we can show them the POS Billing and Stock master inside their navbar as well!
  // Let's make sure Admins can access Billing & Stock by displaying them or adding links.
  const links = isAdmin ? adminLinks : employeeLinks;

  const isActive = (path: string) => pathname.startsWith(path);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20">
                <Activity className="h-6 w-6 animate-pulse" />
              </div>
              <span className="hidden text-lg font-bold tracking-tight text-white sm:block">
                PharmaStore
              </span>
            </Link>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex md:space-x-1 lg:space-x-2">
            {links.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? 'bg-slate-800 text-emerald-400'
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-100'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}

            {/* Quick POS Access for Admin */}
            {isAdmin && (
              <Link
                href="/employee/billing"
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-amber-400 hover:bg-slate-800/50 transition-colors"
              >
                <ShoppingBag className="h-4 w-4" />
                POS Billing
              </Link>
            )}
          </nav>

          {/* Right Section: User & Logout */}
          <div className="hidden md:flex md:items-center md:gap-4">
            {/* User Profile Badge */}
            <div className="flex items-center gap-3 border-r border-slate-800 pr-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-slate-300">
                <User className="h-4 w-4" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-sm font-semibold text-slate-100">
                  {profile.full_name}
                </span>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider ${
                    isAdmin ? 'text-emerald-400' : 'text-blue-400'
                  }`}
                >
                  {profile.role}
                </span>
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={() => logout()}
              className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-100 focus:outline-none"
            >
              {mobileMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="border-b border-slate-800 bg-slate-900 md:hidden">
          <div className="space-y-1 px-2 pt-2 pb-3">
            {links.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-base font-medium transition-colors ${
                    active
                      ? 'bg-slate-800 text-emerald-400'
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-100'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {link.label}
                </Link>
              );
            })}

            {isAdmin && (
              <Link
                href="/employee/billing"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-base font-medium text-amber-400 hover:bg-slate-800/50 transition-colors"
              >
                <ShoppingBag className="h-5 w-5" />
                POS Billing
              </Link>
            )}
          </div>

          {/* Mobile User Profile & Logout */}
          <div className="border-t border-slate-800 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-slate-300">
                <User className="h-5 w-5" />
              </div>
              <div>
                <div className="text-base font-medium text-slate-100">
                  {profile.full_name}
                </div>
                <div
                  className={`text-xs font-bold uppercase tracking-wider ${
                    isAdmin ? 'text-emerald-400' : 'text-blue-400'
                  }`}
                >
                  {profile.role}
                </div>
              </div>
            </div>
            <div className="mt-4">
              <button
                onClick={() => logout()}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/20 hover:text-red-300"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
