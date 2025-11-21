-- Enable full row data for realtime updates
ALTER TABLE public.orders REPLICA IDENTITY FULL;
ALTER TABLE public.tables REPLICA IDENTITY FULL;