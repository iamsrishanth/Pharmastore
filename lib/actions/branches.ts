'use server';

import { createClient } from '@/lib/supabase/server';
import { branchSchema } from '@/lib/validation';
import { getCurrentUser } from '@/lib/actions/auth';
import { revalidatePath, revalidateTag } from 'next/cache';

const isPlaceholder = process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('placeholder-project');

interface BranchItem {
  id: string;
  name: string;
  code: string;
  location: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
}

// In-memory mock storage for local testing
let mockBranches: BranchItem[] = [
  { id: 'br-1', name: 'Hyderabad Main Branch', code: 'HYD-01', location: 'Banjara Hills, Hyderabad', phone: '+91 98765 43210', is_active: true, created_at: new Date().toISOString() },
  { id: 'br-2', name: 'Secunderabad Outlet', code: 'SEC-02', location: 'MG Road, Secunderabad', phone: '+91 98765 43211', is_active: true, created_at: new Date().toISOString() },
  { id: 'br-3', name: 'Gachibowli Warehouse', code: 'GAC-WH', location: 'Financial District, Hyderabad', phone: '+91 98765 43212', is_active: true, created_at: new Date().toISOString() },
  { id: 'br-4', name: 'Vijayawada Branch', code: 'VIJ-03', location: 'Benz Circle, Vijayawada', phone: '+91 98765 43213', is_active: false, created_at: new Date().toISOString() }
];

async function fetchBranchesFromDb() {
  try {
    if (isPlaceholder) {
      return mockBranches;
    }

    const supabase = await createClient(); // Authenticated client
    const { data, error } = await supabase
      .from('branches')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error: any) {
    console.error('Error fetching branches:', error);
    return [];
  }
}

export async function getBranches() {
  return fetchBranchesFromDb();
}

export async function createBranch(prevState: any, data: any) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      return { error: 'Unauthorized: Admin privileges required' };
    }

    const parsed = branchSchema.safeParse(data);
    if (!parsed.success) {
      return { error: parsed.error.issues[0].message };
    }

    if (isPlaceholder) {
      // Check for code uniqueness
      if (mockBranches.some(b => b.code.toUpperCase() === parsed.data.code.toUpperCase())) {
        return { error: 'A branch with this code already exists' };
      }
      const newBranch: BranchItem = {
        id: `br-${Date.now()}`,
        name: parsed.data.name,
        code: parsed.data.code,
        location: parsed.data.location ?? null,
        phone: parsed.data.phone ?? null,
        is_active: parsed.data.is_active ?? true,
        created_at: new Date().toISOString()
      };
      mockBranches.push(newBranch);
      revalidateTag('branches', 'max');
      revalidatePath('/admin/branches');
      return { success: true };
    }

    const supabase = await createClient();
    const { error } = await supabase.from('branches').insert([parsed.data]);

    if (error) {
      if (error.code === '23505') {
        return { error: 'A branch with this code already exists' };
      }
      return { error: error.message };
    }

    revalidateTag('branches', 'max');
    revalidatePath('/admin/branches');
    return { success: true };
  } catch (error: any) {
    return { error: error.message || 'An unexpected error occurred' };
  }
}

export async function updateBranch(id: string, prevState: any, data: any) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      return { error: 'Unauthorized: Admin privileges required' };
    }

    const parsed = branchSchema.safeParse(data);
    if (!parsed.success) {
      return { error: parsed.error.issues[0].message };
    }

    if (isPlaceholder) {
      const idx = mockBranches.findIndex(b => b.id === id);
      if (idx === -1) {
        return { error: 'Branch not found' };
      }
      // Check code uniqueness excluding current branch
      if (mockBranches.some(b => b.id !== id && b.code.toUpperCase() === parsed.data.code.toUpperCase())) {
        return { error: 'A branch with this code already exists' };
      }
      mockBranches[idx] = {
        id,
        name: parsed.data.name,
        code: parsed.data.code,
        location: parsed.data.location ?? null,
        phone: parsed.data.phone ?? null,
        is_active: parsed.data.is_active ?? true,
        created_at: mockBranches[idx].created_at
      };
      revalidateTag('branches', 'max');
      revalidatePath('/admin/branches');
      return { success: true };
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from('branches')
      .update(parsed.data)
      .eq('id', id);

    if (error) {
      if (error.code === '23505') {
        return { error: 'A branch with this code already exists' };
      }
      return { error: error.message };
    }

    revalidateTag('branches', 'max');
    revalidatePath('/admin/branches');
    return { success: true };
  } catch (error: any) {
    return { error: error.message || 'An unexpected error occurred' };
  }
}

export async function toggleBranchStatus(id: string, is_active: boolean) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      return { error: 'Unauthorized: Admin privileges required' };
    }

    if (isPlaceholder) {
      const idx = mockBranches.findIndex(b => b.id === id);
      if (idx === -1) {
        return { error: 'Branch not found' };
      }
      mockBranches[idx].is_active = is_active;
      revalidateTag('branches', 'max');
      revalidatePath('/admin/branches');
      return { success: true };
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from('branches')
      .update({ is_active })
      .eq('id', id);

    if (error) throw error;

    revalidateTag('branches', 'max');
    revalidatePath('/admin/branches');
    return { success: true };
  } catch (error: any) {
    return { error: error.message || 'An unexpected error occurred' };
  }
}


