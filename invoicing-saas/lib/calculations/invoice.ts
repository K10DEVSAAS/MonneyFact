export interface InvoiceLineInput {
  quantity: number;
  unitPrice: number;
}

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function calculateLineTotal(quantity: number, unitPrice: number): number {
  return round2((quantity || 0) * (unitPrice || 0));
}

export function calculateInvoiceTotals(lines: InvoiceLineInput[], taxRate = 18) {
  const subtotal = round2(
    lines.reduce((sum, l) => sum + calculateLineTotal(l.quantity, l.unitPrice), 0)
  );
  const taxAmount = round2(subtotal * ((taxRate || 0) / 100));
  const total = round2(subtotal + taxAmount);
  return { subtotal, taxAmount, total };
}
