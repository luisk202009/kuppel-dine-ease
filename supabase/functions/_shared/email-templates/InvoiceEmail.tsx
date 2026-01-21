import { Text, Section, Hr } from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';
import { EmailLayout } from './components/EmailLayout.tsx';
import { brandStyles, baseStyles } from './styles.ts';

interface InvoiceItem {
  item_name: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface InvoiceEmailProps {
  customerName: string;
  companyName: string;
  companyEmail?: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate?: string;
  items: InvoiceItem[];
  subtotal: number;
  totalDiscount: number;
  totalTax: number;
  total: number;
  currency: string;
  notes?: string;
  customMessage?: string;
}

const formatCurrency = (amount: number, currency: string) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
  }).format(amount);
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('es-CO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const InvoiceEmail = ({
  customerName,
  companyName,
  companyEmail,
  invoiceNumber,
  issueDate,
  dueDate,
  items,
  subtotal,
  totalDiscount,
  totalTax,
  total,
  currency,
  notes,
  customMessage,
}: InvoiceEmailProps) => {
  return (
    <EmailLayout 
      previewText={`Factura ${invoiceNumber} de ${companyName}`}
      footerExtra={
        companyEmail ? (
          <Text style={{ ...baseStyles.footerText, marginBottom: '12px' }}>
            Contacto: {companyEmail}
          </Text>
        ) : undefined
      }
    >
      <Text style={baseStyles.paragraph}>
        Hola <strong>{customerName}</strong>,
      </Text>
      
      {customMessage ? (
        <Text style={baseStyles.paragraph}>{customMessage}</Text>
      ) : (
        <Text style={baseStyles.paragraph}>
          Le enviamos la factura <strong>{invoiceNumber}</strong> correspondiente a sus servicios/productos.
        </Text>
      )}
      
      {/* Invoice Summary Box */}
      <Section style={baseStyles.infoBox}>
        <div style={{ marginBottom: '12px' }}>
          <Text style={{ 
            margin: '0 0 4px 0', 
            fontSize: '14px',
            color: brandStyles.textMuted,
          }}>
            Número de factura
          </Text>
          <Text style={{ 
            margin: '0', 
            fontSize: '18px',
            fontWeight: '600' as const,
            color: brandStyles.textPrimary,
          }}>
            {invoiceNumber}
          </Text>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <Text style={{ margin: '0', fontSize: '14px', color: brandStyles.textMuted }}>
            Fecha de emisión:
          </Text>
          <Text style={{ margin: '0', fontSize: '14px', fontWeight: '500' as const }}>
            {formatDate(issueDate)}
          </Text>
        </div>
        
        {dueDate && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <Text style={{ margin: '0', fontSize: '14px', color: brandStyles.textMuted }}>
              Fecha de vencimiento:
            </Text>
            <Text style={{ margin: '0', fontSize: '14px', fontWeight: '500' as const }}>
              {formatDate(dueDate)}
            </Text>
          </div>
        )}
        
        <Hr style={{ ...baseStyles.divider, margin: '16px 0' }} />
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ 
            margin: '0', 
            fontSize: '16px',
            fontWeight: '600' as const,
            color: brandStyles.textPrimary,
          }}>
            Total a pagar:
          </Text>
          <Text style={{ 
            margin: '0', 
            fontSize: '24px',
            fontWeight: '700' as const,
            color: brandStyles.primaryColor,
          }}>
            {formatCurrency(total, currency)}
          </Text>
        </div>
      </Section>
      
      {/* Items Table */}
      <Text style={{ 
        ...baseStyles.paragraph, 
        fontWeight: '600' as const,
        marginTop: '24px',
        marginBottom: '12px',
      }}>
        Detalle de la factura
      </Text>
      
      <table style={{ 
        width: '100%', 
        borderCollapse: 'collapse', 
        fontSize: '14px',
        marginBottom: '16px',
      }}>
        <thead>
          <tr style={{ backgroundColor: brandStyles.bgSecondary }}>
            <th style={{ 
              padding: '12px', 
              textAlign: 'left', 
              fontWeight: '600',
              borderBottom: `2px solid ${brandStyles.borderColor}`,
            }}>
              Descripción
            </th>
            <th style={{ 
              padding: '12px', 
              textAlign: 'center', 
              fontWeight: '600',
              borderBottom: `2px solid ${brandStyles.borderColor}`,
            }}>
              Cant.
            </th>
            <th style={{ 
              padding: '12px', 
              textAlign: 'right', 
              fontWeight: '600',
              borderBottom: `2px solid ${brandStyles.borderColor}`,
            }}>
              Precio
            </th>
            <th style={{ 
              padding: '12px', 
              textAlign: 'right', 
              fontWeight: '600',
              borderBottom: `2px solid ${brandStyles.borderColor}`,
            }}>
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={index}>
              <td style={{ 
                padding: '12px', 
                borderBottom: `1px solid ${brandStyles.borderColor}`,
              }}>
                {item.item_name}
              </td>
              <td style={{ 
                padding: '12px', 
                textAlign: 'center',
                borderBottom: `1px solid ${brandStyles.borderColor}`,
              }}>
                {item.quantity}
              </td>
              <td style={{ 
                padding: '12px', 
                textAlign: 'right',
                borderBottom: `1px solid ${brandStyles.borderColor}`,
              }}>
                {formatCurrency(item.unit_price, currency)}
              </td>
              <td style={{ 
                padding: '12px', 
                textAlign: 'right',
                borderBottom: `1px solid ${brandStyles.borderColor}`,
              }}>
                {formatCurrency(item.total, currency)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {/* Totals */}
      <div style={{ textAlign: 'right', marginTop: '16px' }}>
        <div style={{ marginBottom: '8px' }}>
          <Text style={{ 
            display: 'inline', 
            color: brandStyles.textMuted,
            fontSize: '14px',
          }}>
            Subtotal:
          </Text>
          <Text style={{ 
            display: 'inline', 
            marginLeft: '20px',
            fontSize: '14px',
          }}>
            {formatCurrency(subtotal, currency)}
          </Text>
        </div>
        
        {totalDiscount > 0 && (
          <div style={{ marginBottom: '8px' }}>
            <Text style={{ 
              display: 'inline', 
              color: brandStyles.textMuted,
              fontSize: '14px',
            }}>
              Descuentos:
            </Text>
            <Text style={{ 
              display: 'inline', 
              marginLeft: '20px',
              fontSize: '14px',
              color: brandStyles.errorColor,
            }}>
              -{formatCurrency(totalDiscount, currency)}
            </Text>
          </div>
        )}
        
        <div style={{ marginBottom: '8px' }}>
          <Text style={{ 
            display: 'inline', 
            color: brandStyles.textMuted,
            fontSize: '14px',
          }}>
            IVA:
          </Text>
          <Text style={{ 
            display: 'inline', 
            marginLeft: '20px',
            fontSize: '14px',
          }}>
            {formatCurrency(totalTax, currency)}
          </Text>
        </div>
      </div>
      
      {/* Notes */}
      {notes && (
        <Section style={baseStyles.warningBox}>
          <Text style={{ 
            margin: '0 0 4px 0', 
            fontWeight: '600' as const,
            color: '#92400e',
            fontSize: '14px',
          }}>
            Notas:
          </Text>
          <Text style={{ 
            margin: '0',
            color: '#92400e',
            fontSize: '14px',
          }}>
            {notes}
          </Text>
        </Section>
      )}
      
      <Text style={{ ...baseStyles.paragraph, marginTop: '24px' }}>
        Si tiene alguna pregunta sobre esta factura, no dude en contactarnos.
      </Text>
      
      <Text style={baseStyles.paragraph}>
        Atentamente,
        <br />
        <strong>{companyName}</strong>
      </Text>
    </EmailLayout>
  );
};

export default InvoiceEmail;
