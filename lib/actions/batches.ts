'use server';

import { createClient } from '@/lib/supabase/server';
import { batchSchema } from '@/lib/validation';
import { revalidatePath } from 'next/cache';

export async function getBatches(productId?: string) {
  try {
    const supabase = await createClient();
    let query = supabase
      .from('batches')
      .select('*, products(name, generic_name, unit, tax_rate, barcode), suppliers(name)')
      .order('expiry_date', { ascending: true });

    if (productId) {
      query = query.eq('product_id', productId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (error: any) {
    console.error('Error fetching batches:', error);
    return [];
  }
}

export async function createBatch(prevState: any, data: any) {
  try {
    const parsed = batchSchema.safeParse(data);
    if (!parsed.success) {
      return { error: parsed.error.issues[0].message };
    }

    const supabase = await createClient();

    // Ensure quantity_available starts at 0.
    // The DB trigger trigger_auto_purchase_movement will create a purchase movement,
    // which in turn triggers trigger_update_batch_stock to set quantity_available to quantity_received.
    const batchData = {
      ...parsed.data,
      quantity_available: 0,
    };

    const { error } = await supabase.from('batches').insert([batchData]);

    if (error) {
      return { error: error.message };
    }

    revalidatePath('/admin/batches');
    revalidatePath('/admin/products');
    revalidatePath('/employee/stock');
    return { success: true };
  } catch (error: any) {
    return { error: error.message || 'An unexpected error occurred' };
  }
}

export async function updateBatch(id: string, prevState: any, data: any) {
  try {
    // For update, we parse using batchSchema, but we ignore quantity_received/quantity_available mutations
    const parsed = batchSchema.safeParse(data);
    if (!parsed.success) {
      return { error: parsed.error.issues[0].message };
    }

    const supabase = await createClient();

    // Exclude quantity fields from standard update to preserve ledger integrity
    const { quantity_received, quantity_available, ...updateFields } = parsed.data;

    const { error } = await supabase
      .from('batches')
      .update(updateFields)
      .eq('id', id);

    if (error) {
      return { error: error.message };
    }

    revalidatePath('/admin/batches');
    revalidatePath('/employee/stock');
    return { success: true };
  } catch (error: any) {
    return { error: error.message || 'An unexpected error occurred' };
  }
}

export async function deleteBatch(id: string) {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('batches').delete().eq('id', id);

    if (error) throw error;

    revalidatePath('/admin/batches');
    revalidatePath('/employee/stock');
    return { success: true };
  } catch (error: any) {
    return { error: error.message || 'An unexpected error occurred' };
  }
}
