-- Agregar columna dataico_pdf_url para almacenar URL del PDF legal
ALTER TABLE public.standard_invoices 
ADD COLUMN IF NOT EXISTS dataico_pdf_url text;

-- Agregar comentario descriptivo
COMMENT ON COLUMN public.standard_invoices.dataico_pdf_url 
IS 'URL del PDF legal generado por Dataico después de la emisión exitosa';

-- Agregar restricción UNIQUE a dataico_uuid para prevenir duplicados
-- Nota: Se permite NULL para que múltiples facturas sin emitir no violen la restricción
ALTER TABLE public.standard_invoices 
ADD CONSTRAINT standard_invoices_dataico_uuid_unique UNIQUE (dataico_uuid);