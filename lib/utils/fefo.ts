interface BatchSelection {
  batchId: string;
  batchNumber: string;
  quantitySelected: number;
  sellingPrice: number;
  mrp: number;
  expiryDate: string;
  taxRate: number;
}

export function allocateBatchesFEFO(
  batches: Array<{
    id: string;
    batch_number: string;
    quantity_available: number;
    selling_price: number;
    mrp: number;
    expiry_date: string;
    tax_rate?: number; // fallback or directly supplied
    products?: { tax_rate: number } | null;
  }>,
  requestedQuantity: number
): { allocations: BatchSelection[]; unallocatedQuantity: number } {
  let remaining = requestedQuantity;
  const allocations: BatchSelection[] = [];

  for (const batch of batches) {
    if (remaining <= 0) break;

    const available = batch.quantity_available;
    if (available <= 0) continue;

    const quantitySelected = Math.min(available, remaining);
    allocations.push({
      batchId: batch.id,
      batchNumber: batch.batch_number,
      quantitySelected,
      sellingPrice: Number(batch.selling_price),
      mrp: Number(batch.mrp),
      expiryDate: batch.expiry_date,
      taxRate: batch.products?.tax_rate ?? batch.tax_rate ?? 12,
    });

    remaining -= quantitySelected;
  }

  return {
    allocations,
    unallocatedQuantity: remaining,
  };
}
