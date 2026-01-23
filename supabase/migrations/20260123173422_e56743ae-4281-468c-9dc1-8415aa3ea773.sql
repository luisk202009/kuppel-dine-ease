-- Add linked_transaction_id column to bank_transactions for tracking inter-bank transfers
ALTER TABLE public.bank_transactions
ADD COLUMN IF NOT EXISTS linked_transaction_id UUID REFERENCES public.bank_transactions(id) ON DELETE SET NULL;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_bank_transactions_linked ON public.bank_transactions(linked_transaction_id) WHERE linked_transaction_id IS NOT NULL;