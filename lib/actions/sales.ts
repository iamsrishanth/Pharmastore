'use server';

import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/actions/auth';
import { allocateBatchesFEFO } from '@/lib/utils/fefo';
import { revalidatePath } from 'next/cache';

interface SaleItemInput {
  productId: string;
  quantity: number;
}

interface CreateSaleInput {
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  items: SaleItemInput[];
  paymentMode: 'cash' | 'card' | 'upi';
  discount: number;
  prescriptionRef?: string; // Reference number or description
  prescriptionUrl?: string; // Supabase Storage URL
}

export async function getSales() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('sales')
      .select('*, customers(name, phone), profiles(full_name)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error: any) {
    console.error('Error fetching sales:', error);
    return [];
  }
}

export async function getSaleDetails(saleId: string) {
  try {
    const supabase = await createClient();
    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .select('*, customers(*), profiles(full_name)')
      .eq('id', saleId)
      .single();

    if (saleError) throw saleError;

    const { data: items, error: itemsError } = await supabase
      .from('sale_items')
      .select('*, batches(batch_number, expiry_date, products(name, generic_name, hsn_code, tax_rate))')
      .eq('sale_id', saleId);

    if (itemsError) throw itemsError;

    return {
      ...sale,
      items: items || [],
    };
  } catch (error: any) {
    console.error('Error fetching sale details:', error);
    return null;
  }
}

export async function createSale(input: CreateSaleInput) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { error: 'Unauthorized: Session not found' };
    }

    if (!input.items || input.items.length === 0) {
      return { error: 'Cart is empty' };
    }

    const supabase = await createClient();

    // 1. Resolve customer if details are provided
    let customerId: string | null = null;
    if (input.customerPhone) {
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('id')
        .eq('phone', input.customerPhone)
        .maybeSingle();

      if (existingCustomer) {
        customerId = existingCustomer.id;
      } else if (input.customerName) {
        // Create new customer
        const { data: newCustomer, error: custError } = await supabase
          .from('customers')
          .insert([
            {
              name: input.customerName,
              phone: input.customerPhone,
              address: input.customerAddress || null,
            },
          ])
          .select('id')
          .single();

        if (custError) {
          return { error: `Failed to create customer: ${custError.message}` };
        }
        customerId = newCustomer.id;
      }
    }

    // Accumulate all batch allocations, subtotal, and tax
    let totalSubtotal = 0;
    let totalTaxAmount = 0;
    const finalAllocations: Array<{
      batchId: string;
      quantity: number;
      unitPrice: number;
      taxAmount: number;
    }> = [];

    // 2. Loop through each cart item and apply FEFO
    for (const item of input.items) {
      // Fetch product to verify prescription requirement and tax rate
      const { data: product, error: prodError } = await supabase
        .from('products')
        .select('name, requires_prescription, tax_rate')
        .eq('id', item.productId)
        .single();

      if (prodError || !product) {
        return { error: `Product not found: ${item.productId}` };
      }

      // Hard gate checkout rule: Prescription required
      if (product.requires_prescription) {
        if (!input.prescriptionRef && !input.prescriptionUrl) {
          return {
            error: `Prescription verification required for Schedule drug: ${product.name}`,
          };
        }
      }

      // Fetch unexpired batches for this product, ordered by expiry date asc
      const { data: batches, error: batchError } = await supabase
        .from('batches')
        .select('id, batch_number, quantity_available, purchase_price, mrp, selling_price, expiry_date')
        .eq('product_id', item.productId)
        .gte('expiry_date', new Date().toISOString().split('T')[0])
        .gt('quantity_available', 0)
        .order('expiry_date', { ascending: true });

      if (batchError || !batches) {
        return { error: `Failed to query stock for: ${product.name}` };
      }

      // Apply FEFO allocation
      const mappedBatches = batches.map((b) => ({
        ...b,
        tax_rate: Number(product.tax_rate),
      }));

      const { allocations, unallocatedQuantity } = allocateBatchesFEFO(
        mappedBatches,
        item.quantity
      );

      if (unallocatedQuantity > 0) {
        return {
          error: `Insufficient unexpired stock for: ${product.name}. Requested: ${item.quantity}, Short: ${unallocatedQuantity}`,
        };
      }

      // Record allocations and compute pricing
      allocations.forEach((alloc) => {
        const itemSubtotal = alloc.quantitySelected * alloc.sellingPrice;
        const itemTax = itemSubtotal * (alloc.taxRate / 100);

        totalSubtotal += itemSubtotal;
        totalTaxAmount += itemTax;

        finalAllocations.push({
          batchId: alloc.batchId,
          quantity: alloc.quantitySelected,
          unitPrice: alloc.sellingPrice,
          taxAmount: itemTax,
        });
      });
    }

    // 3. Compute final sale totals
    const finalTotal = Math.max(0, totalSubtotal + totalTaxAmount - input.discount);
    const invoiceNumber = `INV-${Date.now()}`;

    // 4. Insert Sale
    const { data: sale, error: saleError } = await supabase
      .from('sales')
      .insert([
        {
          invoice_number: invoiceNumber,
          customer_id: customerId,
          subtotal: totalSubtotal,
          tax_amount: totalTaxAmount,
          discount: input.discount,
          total: finalTotal,
          payment_mode: input.paymentMode,
          created_by: currentUser.id,
        },
      ])
      .select('id')
      .single();

    if (saleError) {
      return { error: `Failed to register sale: ${saleError.message}` };
    }

    // 5. Create Sale Items and corresponding Stock Movements
    for (const alloc of finalAllocations) {
      // Insert sale item
      const { error: itemError } = await supabase.from('sale_items').insert([
        {
          sale_id: sale.id,
          batch_id: alloc.batchId,
          quantity: alloc.quantity,
          unit_price: alloc.unitPrice,
          tax_amount: alloc.taxAmount,
        },
      ]);

      if (itemError) {
        // Rollback / Error return
        return { error: `Failed to register sale items: ${itemError.message}` };
      }

      // Insert stock movement (deducts quantity_available from batch via DB trigger)
      const { error: movementError } = await supabase.from('stock_movements').insert([
        {
          batch_id: alloc.batchId,
          movement_type: 'sale',
          quantity: -alloc.quantity,
          status: 'approved',
          reason: `POS Checkout Invoice: ${invoiceNumber}`,
          reference_type: 'sale',
          reference_id: sale.id,
          created_by: currentUser.id,
        },
      ]);

      if (movementError) {
        return { error: `Failed to update ledger stock: ${movementError.message}` };
      }
    }

    revalidatePath('/admin/dashboard');
    revalidatePath('/admin/batches');
    revalidatePath('/employee/dashboard');
    revalidatePath('/employee/stock');

    return { success: true, saleId: sale.id, invoiceNumber };
  } catch (error: any) {
    return { error: error.message || 'An unexpected checkout failure occurred' };
  }
}
