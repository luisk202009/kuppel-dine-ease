-- Create areas table
CREATE TABLE IF NOT EXISTS public.areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3b82f6',
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_areas_branch FOREIGN KEY (branch_id) REFERENCES public.branches(id) ON DELETE CASCADE,
  CONSTRAINT unique_area_name_per_branch UNIQUE (branch_id, name)
);

-- Enable RLS
ALTER TABLE public.areas ENABLE ROW LEVEL SECURITY;

-- RLS Policies for areas
CREATE POLICY "Users can view areas in their branches"
  ON public.areas
  FOR SELECT
  USING (branch_id IN (SELECT get_user_branches()));

CREATE POLICY "Admins can manage areas in their branches"
  ON public.areas
  FOR ALL
  USING (
    branch_id IN (SELECT get_user_branches()) 
    AND get_user_role() = 'admin'
  )
  WITH CHECK (
    branch_id IN (SELECT get_user_branches()) 
    AND get_user_role() = 'admin'
  );

-- Add trigger for updated_at
CREATE TRIGGER update_areas_updated_at
  BEFORE UPDATE ON public.areas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Migrate existing table areas to areas table
-- This will create default areas for all branches
INSERT INTO public.areas (branch_id, name, color, display_order)
SELECT DISTINCT 
  b.id as branch_id,
  t.area as name,
  CASE 
    WHEN t.area = 'Terraza' THEN '#10b981'
    WHEN t.area = 'Interior' THEN '#3b82f6'
    WHEN t.area = 'Plantas' THEN '#8b5cf6'
    WHEN t.area = 'Primer Piso' THEN '#f59e0b'
    WHEN t.area = 'Segundo Piso' THEN '#ef4444'
    ELSE '#6b7280'
  END as color,
  CASE 
    WHEN t.area = 'Plantas' THEN 1
    WHEN t.area = 'Primer Piso' THEN 2
    WHEN t.area = 'Segundo Piso' THEN 3
    WHEN t.area = 'Terraza' THEN 4
    WHEN t.area = 'Interior' THEN 5
    ELSE 99
  END as display_order
FROM public.tables t
CROSS JOIN public.branches b
WHERE t.area IS NOT NULL
ON CONFLICT (branch_id, name) DO NOTHING;

-- Add area_id column to tables
ALTER TABLE public.tables ADD COLUMN IF NOT EXISTS area_id UUID;

-- Update tables to reference areas by ID
UPDATE public.tables t
SET area_id = a.id
FROM public.areas a
WHERE t.area = a.name AND t.branch_id = a.branch_id;

-- Add foreign key constraint
ALTER TABLE public.tables
  ADD CONSTRAINT fk_tables_area 
  FOREIGN KEY (area_id) 
  REFERENCES public.areas(id) 
  ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_tables_area_id ON public.tables(area_id);
CREATE INDEX IF NOT EXISTS idx_areas_branch_id ON public.areas(branch_id);