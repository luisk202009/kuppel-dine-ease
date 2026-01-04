-- Fix search_path for generate_receipt_number
CREATE OR REPLACE FUNCTION generate_receipt_number(p_company_id uuid, p_prefix text DEFAULT 'RC')
RETURNS TABLE(receipt_number text, sequence_number integer) AS $$
DECLARE
  next_seq integer;
BEGIN
  SELECT COALESCE(MAX(pr.sequence_number), 0) + 1 
  INTO next_seq
  FROM public.payment_receipts pr
  WHERE pr.company_id = p_company_id AND pr.prefix = p_prefix;
  
  RETURN QUERY SELECT (p_prefix || next_seq::text), next_seq;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix search_path for generate_expense_payment_number
CREATE OR REPLACE FUNCTION generate_expense_payment_number(p_company_id uuid, p_prefix text DEFAULT 'CE')
RETURNS TABLE(payment_number text, sequence_number integer) AS $$
DECLARE
  next_seq integer;
BEGIN
  SELECT COALESCE(MAX(ep.sequence_number), 0) + 1 
  INTO next_seq
  FROM public.expense_payments ep
  WHERE ep.company_id = p_company_id AND ep.prefix = p_prefix;
  
  RETURN QUERY SELECT (p_prefix || next_seq::text), next_seq;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;