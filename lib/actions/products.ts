'use server';

import { createClient } from '@/lib/supabase/server';
import { productSchema } from '@/lib/validation';
import { revalidatePath, revalidateTag } from 'next/cache';
import { getCurrentUser } from '@/lib/actions/auth';
import { hasAdminRole } from '@/lib/roles';

async function fetchProductsFromDb(searchQuery?: string) {
  try {
    const supabase = await createClient();
    let query = supabase.from('products').select('*').order('name', { ascending: true });

    if (searchQuery) {
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

export async function getProducts(searchQuery?: string) {
  return fetchProductsFromDb(searchQuery);
}

export async function createProduct(prevState: any, data: any) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { error: 'Unauthorized: Login required' };
    }

    const parsed = productSchema.safeParse(data);
    if (!parsed.success) {
      return { error: parsed.error.issues[0].message };
    }

    const productData = {
      ...parsed.data,
      generic_name: parsed.data.generic_name || null,
      manufacturer: parsed.data.manufacturer || null,
      category: parsed.data.category || null,
      composition: parsed.data.composition || null,
      strength: parsed.data.strength || null,
      pack_size: parsed.data.pack_size || null,
      unit: parsed.data.unit || null,
      hsn_code: parsed.data.hsn_code || null,
      barcode: parsed.data.barcode || null,
    };

    const supabase = await createClient();
    const { error } = await supabase.from('products').insert([productData]);

    if (error) {
      if (error.code === '23505') {
        return { error: 'A product with this barcode already exists' };
      }
      return { error: 'Failed to create product' };
    }

    revalidateTag('products', 'max');
    revalidatePath('/admin/products');
    revalidatePath('/employee/stock');
    return { success: true };
  } catch (error: any) {
    return { error: 'An unexpected error occurred' };
  }
}

export async function updateProduct(id: string, prevState: any, data: any) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { error: 'Unauthorized: Login required' };
    }

    const parsed = productSchema.safeParse(data);
    if (!parsed.success) {
      return { error: parsed.error.issues[0].message };
    }

    const productData = {
      ...parsed.data,
      generic_name: parsed.data.generic_name || null,
      manufacturer: parsed.data.manufacturer || null,
      category: parsed.data.category || null,
      composition: parsed.data.composition || null,
      strength: parsed.data.strength || null,
      pack_size: parsed.data.pack_size || null,
      unit: parsed.data.unit || null,
      hsn_code: parsed.data.hsn_code || null,
      barcode: parsed.data.barcode || null,
    };

    const supabase = await createClient();
    const { error } = await supabase
      .from('products')
      .update(productData)
      .eq('id', id);

    if (error) {
      if (error.code === '23505') {
        return { error: 'A product with this barcode already exists' };
      }
      return { error: 'Failed to update product' };
    }

    revalidateTag('products', 'max');
    revalidatePath('/admin/products');
    revalidatePath('/employee/stock');
    return { success: true };
  } catch (error: any) {
    return { error: 'An unexpected error occurred' };
  }
}

export async function deleteProduct(id: string) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || !hasAdminRole(currentUser)) {
      return { error: 'Unauthorized: Admin privileges required' };
    }

    const supabase = await createClient();
    const { error } = await supabase.from('products').delete().eq('id', id);

    if (error) {
      return { error: 'Failed to delete product' };
    }

    revalidateTag('products', 'max');
    revalidatePath('/admin/products');
    revalidatePath('/employee/stock');
    return { success: true };
  } catch (error: any) {
    return { error: 'An unexpected error occurred' };
  }
}
