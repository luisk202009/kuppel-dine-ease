-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('reports', 'reports', false)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

-- Create storage policies for product images
CREATE POLICY "Product images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated users can upload product images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'product-images' AND 
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = 'products'
);

CREATE POLICY "Admins can manage product images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'product-images' AND 
  public.get_user_role() = 'admin'
);

-- Create storage policies for reports
CREATE POLICY "Admins can view reports" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'reports' AND 
  public.get_user_role() = 'admin'
);

CREATE POLICY "Admins can upload reports" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'reports' AND 
  public.get_user_role() = 'admin'
);

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.votes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tables;
ALTER PUBLICATION supabase_realtime ADD TABLE public.cash_registers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.expenses;