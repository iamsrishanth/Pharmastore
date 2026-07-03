'use server';

import { createClient } from '@/lib/supabase/server';
import { productSchema } from '@/lib/validation';
import { revalidatePath } from 'next/cache';

export async function getProducts(searchQuery?: string) {
  try {
    const supabase = await createClient();
    let query = supabase.from('products').select('*').order('name', { ascending: true });

    if (searchQuery) {
      // If it contains only digits, match barcode or name
      if (/^\d+$/.test(searchQuery)) {
        query = query.or(`barcode.eq.${searchQuery},name.ilike.%${searchQuery}%`);
      } else {
        query = query.or(`name.ilike.%${searchQuery}%,generic_name.ilike.%${searchQuery}%`);
      }
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (error: any) {
    console.error('Error fetching products:', error);
    return [];
  }
}

export async function createProduct(prevState: any, data: any) {
  try {
    const parsed = productSchema.safeParse(data);
    if (!parsed.success) {
      return { error: parsed.error.issues[0].message };
    }

    const supabase = await createClient();
    const { error } = await supabase.from('products').insert([parsed.data]);

    if (error) {
      if (error.code === '23505') {
        return { error: 'A product with this barcode already exists' };
      }
      return { error: error.message };
    }

    revalidatePath('/admin/products');
    revalidatePath('/employee/stock');
    return { success: true };
  } catch (error: any) {
    return { error: error.message || 'An unexpected error occurred' };
  }
}

export async function updateProduct(id: string, prevState: any, data: any) {
  try {
    const parsed = productSchema.safeParse(data);
    if (!parsed.success) {
      return { error: parsed.error.issues[0].message };
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from('products')
      .update(parsed.data)
      .eq('id', id);

    if (error) {
      if (error.code === '23505') {
        return { error: 'A product with this barcode already exists' };
      }
      return { error: error.message };
    }

    revalidatePath('/admin/products');
    revalidatePath('/employee/stock');
    return { success: true };
  } catch (error: any) {
    return { error: error.message || 'An unexpected error occurred' };
  }
}

export async function deleteProduct(id: string) {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('products').delete().eq('id', id);

    if (error) throw error;

    revalidatePath('/admin/products');
    revalidatePath('/employee/stock');
    return { success: true };
  } catch (error: any) {
    return { error: error.message || 'An unexpected error occurred' };
  }
}
