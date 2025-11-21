-- Add display_order column to tables for visual reordering
ALTER TABLE public.tables 
ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;

-- Create index for better performance when ordering
CREATE INDEX IF NOT EXISTS idx_tables_area_display_order 
ON public.tables(area_id, display_order);

-- Update existing tables to have sequential display_order based on created_at
WITH ranked_tables AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (PARTITION BY area_id ORDER BY created_at) - 1 AS new_order
  FROM public.tables
)
UPDATE public.tables t
SET display_order = rt.new_order
FROM ranked_tables rt
WHERE t.id = rt.id;