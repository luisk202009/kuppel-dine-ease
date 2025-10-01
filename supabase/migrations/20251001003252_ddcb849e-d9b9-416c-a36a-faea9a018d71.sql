-- Phase 1: Data Cleanup Migration
-- Remove all area_id references from tables
UPDATE public.tables 
SET area_id = NULL;

-- Delete all existing areas to start fresh
DELETE FROM public.areas;