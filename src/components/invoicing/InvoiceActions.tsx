import { useState } from 'react';
import { FileDown, Mail, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface InvoiceActionsProps {
  invoiceId: string;
  customerEmail?: string;
}

export const InvoiceActions = ({ invoiceId, customerEmail }: InvoiceActionsProps) => {
  const { toast } = useToast();
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailForm, setEmailForm] = useState({
    recipientEmail: customerEmail || '',
    subject: '',
    message: '',
  });

  const handleGeneratePdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-invoice-pdf', {
        body: { invoiceId },
      });

      if (error) throw error;

      // Create a blob and download
      const blob = new Blob([data.html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      // Open in new window for printing
      const printWindow = window.open(url, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }

      toast({
        title: 'PDF generado',
        description: `Factura ${data.invoiceNumber} lista para imprimir`,
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: 'Error',
        description: 'No se pudo generar el PDF',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleSendEmail = async () => {
    if (!emailForm.recipientEmail) {
      toast({
        title: 'Error',
        description: 'Ingresa un email de destino',
        variant: 'destructive',
      });
      return;
    }

    setIsSendingEmail(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-invoice-email', {
        body: {
          invoiceId,
          recipientEmail: emailForm.recipientEmail,
          subject: emailForm.subject || undefined,
          message: emailForm.message || undefined,
        },
      });

      if (error) throw error;

      toast({
        title: 'Email enviado',
        description: data.message,
      });
      setEmailDialogOpen(false);
    } catch (error) {
      console.error('Error sending email:', error);
      toast({
        title: 'Error',
        description: 'No se pudo enviar el email. Verifica la configuración de Resend.',
        variant: 'destructive',
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleGeneratePdf}
          disabled={isGeneratingPdf}
        >
          {isGeneratingPdf ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <FileDown className="h-4 w-4 mr-2" />
          )}
          PDF
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setEmailDialogOpen(true)}
        >
          <Mail className="h-4 w-4 mr-2" />
          Email
        </Button>
      </div>

      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar factura por email</DialogTitle>
            <DialogDescription>
              Envía esta factura directamente al cliente por correo electrónico.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email del destinatario</Label>
              <Input
                id="email"
                type="email"
                value={emailForm.recipientEmail}
                onChange={(e) => setEmailForm(prev => ({ ...prev, recipientEmail: e.target.value }))}
                placeholder="cliente@email.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Asunto (opcional)</Label>
              <Input
                id="subject"
                value={emailForm.subject}
                onChange={(e) => setEmailForm(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Se usará el asunto predeterminado"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Mensaje personalizado (opcional)</Label>
              <Textarea
                id="message"
                value={emailForm.message}
                onChange={(e) => setEmailForm(prev => ({ ...prev, message: e.target.value }))}
                placeholder="Agregar un mensaje adicional..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSendEmail} disabled={isSendingEmail}>
              {isSendingEmail ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Mail className="h-4 w-4 mr-2" />
              )}
              Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
