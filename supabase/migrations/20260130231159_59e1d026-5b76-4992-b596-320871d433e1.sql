-- Agregar columnas para seguimiento de Dataico en facturas estándar
ALTER TABLE public.standard_invoices
ADD COLUMN IF NOT EXISTS dataico_uuid text,
ADD COLUMN IF NOT EXISTS dataico_status text,
ADD COLUMN IF NOT EXISTS cufe text,
ADD COLUMN IF NOT EXISTS dataico_sent_at timestamp with time zone;

-- Índice para búsquedas por UUID de Dataico
CREATE INDEX IF NOT EXISTS idx_standard_invoices_dataico_uuid 
ON public.standard_invoices(dataico_uuid) 
WHERE dataico_uuid IS NOT NULL;

-- Comentarios descriptivos
COMMENT ON COLUMN public.standard_invoices.dataico_uuid IS 'UUID returned by Dataico after successful submission';
COMMENT ON COLUMN public.standard_invoices.dataico_status IS 'Status of electronic invoice: pending, sent, accepted, rejected';
COMMENT ON COLUMN public.standard_invoices.cufe IS 'CUFE (Código Único de Facturación Electrónica) from DIAN';
COMMENT ON COLUMN public.standard_invoices.dataico_sent_at IS 'Timestamp when invoice was sent to Dataico';