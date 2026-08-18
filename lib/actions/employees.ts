'use server';

import { createAdminClient, createClient } from '@/lib/supabase/server';
import { employeeSchema } from '@/lib/validation';
import { revalidatePath, revalidateTag } from 'next/cache';
import { getCurrentUser } from '@/lib/actions/auth';

async function fetchEmployeesFromDb() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error: any) {
    console.error('Error fetching employees:', error);
    return [];
  }
}

export async function getEmployees() {
  return fetchEmployeesFromDb();
}

export async function createEmployee(prevState: any, data: any) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      return { error: 'Unauthorized: Admin privileges required' };
    }

    const parsed = employeeSchema.safeParse(data);
    if (!parsed.success) {
      return { error: parsed.error.issues[0].message };
    }

    if (!parsed.data.password) {
      return { error: 'Password is required when creating a new employee' };
    }

    const adminSupabase = await createAdminClient();

    // 1. Create the user in Supabase Auth
    const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
      email: parsed.data.email,
      password: parsed.data.password,
      email_confirm: true,
      user_metadata: {
        full_name: parsed.data.full_name,
        role: parsed.data.role,
      },
    });

    if (authError) {
      return { error: authError.message };
    }

    const userId = authData.user?.id;
    if (!userId) {
      return { error: 'Failed to create auth user' };
    }

    // 2. The database trigger (on_auth_user_created) automatically inserts into profiles.
    // However, let's update it to ensure phone and active state are set exactly as requested.
    const clientSupabase = await createClient();
    const { error: profileError } = await clientSupabase
      .from('profiles')
      .update({
        phone: parsed.data.phone,
        is_active: parsed.data.is_active,
      })
      .eq('id', userId);

    if (profileError) {
      // Clean up Auth user if profile sync fails
      await adminSupabase.auth.admin.deleteUser(userId);
      return { error: profileError.message };
    }

    revalidateTag('employees', 'max');
    revalidatePath('/admin/employees');
    return { success: true };
  } catch (error: any) {
    return { error: error.message || 'An unexpected error occurred' };
  }
}

export async function updateEmployee(id: string, prevState: any, data: any) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      return { error: 'Unauthorized: Admin privileges required' };
    }

    const parsed = employeeSchema.safeParse(data);
    if (!parsed.success) {
      return { error: parsed.error.issues[0].message };
    }

    const adminSupabase = await createAdminClient();

    // Fetch current auth user details for rollback support
    const { data: { user: originalUser }, error: fetchUserError } = await adminSupabase.auth.admin.getUserById(id);
    if (fetchUserError || !originalUser) {
      return { error: fetchUserError?.message || 'Employee auth record not found' };
    }

    // 1. Update Auth settings (email/password if provided)
    const updateData: { email: string; password?: string } = {
      email: parsed.data.email,
    };
    if (parsed.data.password) {
      updateData.password = parsed.data.password;
    }

    const { error: authError } = await adminSupabase.auth.admin.updateUserById(id, updateData);
    if (authError) {
      return { error: authError.message };
    }

    // 2. Update Profile fields
    const clientSupabase = await createClient();
    const { error: profileError } = await clientSupabase
      .from('profiles')
      .update({
        full_name: parsed.data.full_name,
        email: parsed.data.email,
        role: parsed.data.role,
        phone: parsed.data.phone,
        is_active: parsed.data.is_active,
      })
      .eq('id', id);

    if (profileError) {
      console.error('Profile update failed, rolling back Auth user updates:', profileError);
      const rollbackData = {
        email: originalUser.email!,
      };
      const { error: rollbackError } = await adminSupabase.auth.admin.updateUserById(id, rollbackData);
      if (rollbackError) {
        console.error('Critical: Failed to roll back Auth user updates:', rollbackError);
      }
      return { error: profileError.message };
    }

    revalidateTag('employees', 'max');
    revalidatePath('/admin/employees');
    return { success: true };
  } catch (error: any) {
    return { error: error.message || 'An unexpected error occurred' };
  }
}

export async function toggleEmployeeStatus(id: string, isActive: boolean) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      return { error: 'Unauthorized: Admin privileges required' };
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: isActive })
      .eq('id', id);

    if (error) throw error;

    revalidateTag('employees', 'max');
    revalidatePath('/admin/employees');
    return { success: true };
  } catch (error: any) {
    return { error: error.message || 'An unexpected error occurred' };
  }
}
