'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/actions/auth';
import { stockAdjustmentSchema } from '@/lib/validation';
import { revalidatePath } from 'next/cache';

export async function getStockMovements(batchId?: string) {
  try {
    const supabase = await createClient();
    let query = supabase
      .from('stock_movements')
      .select('*, batches(batch_number, products(name)), profiles(full_name)')
      .order('created_at', { ascending: false });

    if (batchId) {
      query = query.eq('batch_id', batchId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (error: any) {
    console.error('Error fetching stock movements:', error);
    return [];
  }
}

export async function getPendingAdjustments() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('stock_movements')
      .select('*, batches(batch_number, quantity_available, products(name, generic_name)), profiles(full_name)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error: any) {
    console.error('Error fetching pending adjustments:', error);
    return [];
  }
}

export async function adjustStock(prevState: any, data: any) {
  try {
    const parsed = stockAdjustmentSchema.safeParse(data);
    if (!parsed.success) {
      return { error: parsed.error.issues[0].message };
    }

    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { error: 'Unauthorized: Session not found' };
    }

    const supabase = await createClient();

    // Determine status based on role: admins approve immediately, employees queue for approval.
    const status = currentUser.role === 'admin' ? 'approved' : 'pending';

    const { error } = await supabase.from('stock_movements').insert([
      {
        batch_id: parsed.data.batch_id,
        movement_type: parsed.data.movement_type,
        quantity: parsed.data.quantity,
        status: status,
        reason: parsed.data.reason,
        created_by: currentUser.id,
      },
    ]);

    if (error) {
      return { error: error.message };
    }

    revalidatePath('/admin/batches');
    revalidatePath('/employee/stock');
    revalidatePath('/employee/dashboard');
    return { success: true, queued: status === 'pending' };
  } catch (error: any) {
    return { error: error.message || 'An unexpected error occurred' };
  }
}

export async function approveAdjustment(id: string) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      return { error: 'Unauthorized: Admin privileges required' };
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from('stock_movements')
      .update({ status: 'approved' })
      .eq('id', id);

    if (error) {
      return { error: error.message };
    }

    revalidatePath('/admin/batches');
    revalidatePath('/employee/stock');
    revalidatePath('/employee/dashboard');
    return { success: true };
  } catch (error: any) {
    return { error: error.message || 'An unexpected error occurred' };
  }
}

export async function rejectAdjustment(id: string) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      return { error: 'Unauthorized: Admin privileges required' };
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from('stock_movements')
      .update({ status: 'rejected' })
      .eq('id', id);

    if (error) {
      return { error: error.message };
    }

    revalidatePath('/admin/batches');
    revalidatePath('/employee/stock');
    revalidatePath('/employee/dashboard');
    return { success: true };
  } catch (error: any) {
    return { error: error.message || 'An unexpected error occurred' };
  }
}

export async function returnBatchToSupplier(batchId: string, reason: string) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { error: 'Unauthorized: Session not found' };
    }

    const supabase = await createClient();
    
    // Fetch batch available quantity first
    const { data: batch, error: batchError } = await supabase
      .from('batches')
      .select('quantity_available, supplier_id')
      .eq('id', batchId)
      .single();

    if (batchError || !batch) {
      return { error: 'Batch not found' };
    }

    if (batch.quantity_available <= 0) {
      return { error: 'No stock available to return in this batch' };
    }

    // Insert stock movement of type 'return' with negative quantity
    // In our system, return movements log the stock exit.
    const { error: movementError } = await supabase.from('stock_movements').insert([
      {
        batch_id: batchId,
        movement_type: 'return',
        quantity: -batch.quantity_available,
        status: 'approved',
        reason: reason,
        created_by: currentUser.id,
      },
    ]);

    if (movementError) {
      return { error: movementError.message };
    }

    revalidatePath('/admin/batches');
    revalidatePath('/employee/stock');
    revalidatePath('/employee/alerts');
    revalidatePath('/employee/dashboard');
    return { success: true };
  } catch (error: any) {
    return { error: error.message || 'An unexpected error occurred' };
  }
}
