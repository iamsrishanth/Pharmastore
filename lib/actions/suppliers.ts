'use server';

import { createClient } from '@/lib/supabase/server';
import { supplierSchema } from '@/lib/validation';
import { revalidatePath } from 'next/cache';

export async function getSuppliers() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error: any) {
    console.error('Error fetching suppliers:', error);
    return [];
  }
}

export async function createSupplier(prevState: any, data: any) {
  try {
    const parsed = supplierSchema.safeParse(data);
    if (!parsed.success) {
      return { error: parsed.error.issues[0].message };
    }

    const supabase = await createClient();
    const { error } = await supabase.from('suppliers').insert([parsed.data]);

    if (error) {
      return { error: error.message };
    }

    revalidatePath('/admin/suppliers');
    return { success: true };
  } catch (error: any) {
    return { error: error.message || 'An unexpected error occurred' };
  }
}

export async function updateSupplier(id: string, prevState: any, data: any) {
  try {
    const parsed = supplierSchema.safeParse(data);
    if (!parsed.success) {
      return { error: parsed.error.issues[0].message };
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from('suppliers')
      .update(parsed.data)
      .eq('id', id);

    if (error) {
      return { error: error.message };
    }

    revalidatePath('/admin/suppliers');
    return { success: true };
  } catch (error: any) {
    return { error: error.message || 'An unexpected error occurred' };
  }
}

export async function deleteSupplier(id: string) {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('suppliers').delete().eq('id', id);

    if (error) throw error;

    revalidatePath('/admin/suppliers');
    return { success: true };
  } catch (error: any) {
    return { error: error.message || 'An unexpected error occurred' };
  }
}
