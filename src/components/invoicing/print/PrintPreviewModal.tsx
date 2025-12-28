import React from 'react';
import { StandardInvoice, PrintFormat } from '@/types/invoicing';
import { TicketReceipt } from './TicketReceipt';
import { HalfLetterInvoice } from './HalfLetterInvoice';

interface PrintPreviewModalProps {
  invoice: StandardInvoice | null;
  isOpen: boolean;
  onClose: () => void;
  companyName?: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyTaxId?: string;
}

export const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({
  invoice,
  isOpen,
  onClose,
  companyName,
  companyAddress,
  companyPhone,
  companyEmail,
  companyTaxId,
}) => {
  if (!invoice || !isOpen) return null;

  // Determine print format from invoice type
  const printFormat: PrintFormat = invoice.invoiceType?.printFormat || 
    (invoice.source === 'pos' ? 'ticket_80mm' : 'half_letter');

  // Render appropriate component based on print format
  if (printFormat === 'ticket_58mm' || printFormat === 'ticket_80mm') {
    return (
      <TicketReceipt
        invoice={invoice}
        isOpen={isOpen}
        onClose={onClose}
        printFormat={printFormat}
        companyName={companyName}
        companyAddress={companyAddress}
        companyPhone={companyPhone}
        companyTaxId={companyTaxId}
      />
    );
  }

  // half_letter or letter
  return (
    <HalfLetterInvoice
      invoice={invoice}
      isOpen={isOpen}
      onClose={onClose}
      printFormat={printFormat}
      companyName={companyName}
      companyAddress={companyAddress}
      companyPhone={companyPhone}
      companyEmail={companyEmail}
      companyTaxId={companyTaxId}
    />
  );
};
