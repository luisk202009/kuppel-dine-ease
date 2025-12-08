// Standard Invoicing Types

export type InvoiceStatus = 'draft' | 'issued' | 'paid' | 'cancelled' | 'overdue';

export interface StandardInvoice {
  id: string;
  branchId: string;
  customerId?: string;
  invoiceNumber: string;
  
  // Dates
  issueDate: Date;
  dueDate?: Date;
  
  // Currency
  currency: string;
  
  // Totals
  subtotal: number;
  totalTax: number;
  totalDiscount: number;
  total: number;
  
  // Payment
  paymentMethod?: string;
  paymentReference?: string;
  
  // Status
  status: InvoiceStatus;
  
  // Notes/Conditions
  notes?: string;
  termsConditions?: string;
  
  // Audit
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Relations (populated when fetched)
  items?: StandardInvoiceItem[];
  customer?: {
    id: string;
    name: string;
    lastName?: string;
    identification?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
  };
}

export interface StandardInvoiceItem {
  id: string;
  invoiceId: string;
  
  // Product reference or free-text
  productId?: string;
  itemName: string;
  description?: string;
  
  // Values
  quantity: number;
  unitPrice: number;
  taxRate: number;
  taxAmount: number;
  discountRate: number;
  discountAmount: number;
  subtotal: number;
  total: number;
  
  displayOrder: number;
  createdAt: Date;
}

// Form types for creating/editing
export interface StandardInvoiceFormData {
  customerId?: string;
  issueDate: Date;
  dueDate?: Date;
  currency: string;
  paymentMethod?: string;
  notes?: string;
  termsConditions?: string;
  items: StandardInvoiceItemFormData[];
}

export interface StandardInvoiceItemFormData {
  id?: string; // For existing items
  productId?: string;
  itemName: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  discountRate: number;
}

// Database row types (snake_case from Supabase)
export interface StandardInvoiceRow {
  id: string;
  branch_id: string;
  customer_id: string | null;
  invoice_number: string;
  issue_date: string;
  due_date: string | null;
  currency: string;
  subtotal: number;
  total_tax: number;
  total_discount: number;
  total: number;
  payment_method: string | null;
  payment_reference: string | null;
  status: string;
  notes: string | null;
  terms_conditions: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface StandardInvoiceItemRow {
  id: string;
  invoice_id: string;
  product_id: string | null;
  item_name: string;
  description: string | null;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  tax_amount: number;
  discount_rate: number;
  discount_amount: number;
  subtotal: number;
  total: number;
  display_order: number;
  created_at: string;
}

// Helper functions to map between DB and app types
export const mapInvoiceRowToInvoice = (row: StandardInvoiceRow): StandardInvoice => ({
  id: row.id,
  branchId: row.branch_id,
  customerId: row.customer_id || undefined,
  invoiceNumber: row.invoice_number,
  issueDate: new Date(row.issue_date),
  dueDate: row.due_date ? new Date(row.due_date) : undefined,
  currency: row.currency,
  subtotal: row.subtotal,
  totalTax: row.total_tax,
  totalDiscount: row.total_discount,
  total: row.total,
  paymentMethod: row.payment_method || undefined,
  paymentReference: row.payment_reference || undefined,
  status: row.status as InvoiceStatus,
  notes: row.notes || undefined,
  termsConditions: row.terms_conditions || undefined,
  createdBy: row.created_by,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at),
});

export const mapInvoiceItemRowToItem = (row: StandardInvoiceItemRow): StandardInvoiceItem => ({
  id: row.id,
  invoiceId: row.invoice_id,
  productId: row.product_id || undefined,
  itemName: row.item_name,
  description: row.description || undefined,
  quantity: row.quantity,
  unitPrice: row.unit_price,
  taxRate: row.tax_rate,
  taxAmount: row.tax_amount,
  discountRate: row.discount_rate,
  discountAmount: row.discount_amount,
  subtotal: row.subtotal,
  total: row.total,
  displayOrder: row.display_order,
  createdAt: new Date(row.created_at),
});

// Calculate item totals
export const calculateItemTotals = (
  quantity: number,
  unitPrice: number,
  taxRate: number,
  discountRate: number
) => {
  const subtotal = quantity * unitPrice;
  const discountAmount = subtotal * (discountRate / 100);
  const taxableAmount = subtotal - discountAmount;
  const taxAmount = taxableAmount * (taxRate / 100);
  const total = taxableAmount + taxAmount;
  
  return {
    subtotal,
    discountAmount,
    taxAmount,
    total,
  };
};

// Calculate invoice totals from items
export const calculateInvoiceTotals = (items: StandardInvoiceItemFormData[]) => {
  let subtotal = 0;
  let totalTax = 0;
  let totalDiscount = 0;
  
  items.forEach(item => {
    const itemTotals = calculateItemTotals(
      item.quantity,
      item.unitPrice,
      item.taxRate,
      item.discountRate
    );
    subtotal += itemTotals.subtotal;
    totalTax += itemTotals.taxAmount;
    totalDiscount += itemTotals.discountAmount;
  });
  
  return {
    subtotal,
    totalTax,
    totalDiscount,
    total: subtotal - totalDiscount + totalTax,
  };
};
