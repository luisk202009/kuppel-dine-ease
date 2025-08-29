-- Create enums
CREATE TYPE public.user_role AS ENUM ('admin', 'cashier', 'demo');
CREATE TYPE public.table_status AS ENUM ('available', 'occupied', 'pending', 'reserved');
CREATE TYPE public.order_status AS ENUM ('pending', 'preparing', 'ready', 'delivered', 'paid', 'cancelled');
CREATE TYPE public.payment_method AS ENUM ('cash', 'card', 'credit', 'transfer');
CREATE TYPE public.vote_type AS ENUM ('up', 'down');
CREATE TYPE public.log_action AS ENUM ('insert', 'update', 'delete');

-- Create users table (extends auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role public.user_role NOT NULL DEFAULT 'demo',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create companies and branches
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  tax_id TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.user_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, company_id)
);

-- Create tables for restaurant
CREATE TABLE public.tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  area TEXT,
  capacity INTEGER NOT NULL DEFAULT 4,
  status public.table_status NOT NULL DEFAULT 'available',
  current_order_id UUID,
  customers INTEGER,
  waiter_id UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create product categories
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create products
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  cost DECIMAL(10,2),
  stock INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  is_alcoholic BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create customers
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  last_name TEXT,
  identification TEXT,
  phone TEXT,
  email TEXT,
  city TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create orders
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  table_id UUID REFERENCES public.tables(id),
  customer_id UUID REFERENCES public.customers(id),
  waiter_id UUID REFERENCES public.users(id),
  cashier_id UUID REFERENCES public.users(id),
  order_number TEXT NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax_rate DECIMAL(5,4) NOT NULL DEFAULT 0.19,
  tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount DECIMAL(10,2) NOT NULL DEFAULT 0,
  tip DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  status public.order_status NOT NULL DEFAULT 'pending',
  payment_method public.payment_method,
  payment_reference TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create order items
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create cash registers
CREATE TABLE public.cash_registers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  cashier_id UUID NOT NULL REFERENCES public.users(id),
  initial_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  final_amount DECIMAL(10,2),
  expected_amount DECIMAL(10,2),
  difference DECIMAL(10,2),
  notes TEXT,
  opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Create expenses
CREATE TABLE public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  cash_register_id UUID REFERENCES public.cash_registers(id),
  user_id UUID NOT NULL REFERENCES public.users(id),
  amount DECIMAL(10,2) NOT NULL,
  description TEXT NOT NULL,
  category TEXT,
  receipt_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create votes table
CREATE TABLE public.votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id),
  vote public.vote_type NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create logs table for auditing
CREATE TABLE public.logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id),
  action public.log_action NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_registers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;

-- Create security definer functions to avoid RLS recursion
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS public.user_role
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_user_companies()
RETURNS SETOF UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT company_id FROM public.user_companies WHERE user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_user_branches()
RETURNS SETOF UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT DISTINCT b.id 
  FROM public.branches b
  INNER JOIN public.user_companies uc ON b.company_id = uc.company_id
  WHERE uc.user_id = auth.uid();
$$;

-- RLS Policies for users table
CREATE POLICY "Users can view their own profile" ON public.users
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (id = auth.uid());

-- RLS Policies for companies
CREATE POLICY "Users can view their companies" ON public.companies
  FOR SELECT USING (id IN (SELECT public.get_user_companies()));

-- RLS Policies for branches
CREATE POLICY "Users can view their branches" ON public.branches
  FOR SELECT USING (id IN (SELECT public.get_user_branches()));

-- RLS Policies for user_companies
CREATE POLICY "Users can view their own company associations" ON public.user_companies
  FOR SELECT USING (user_id = auth.uid());

-- RLS Policies for tables
CREATE POLICY "Users can view tables in their branches" ON public.tables
  FOR SELECT USING (branch_id IN (SELECT public.get_user_branches()));

CREATE POLICY "Users can update tables in their branches" ON public.tables
  FOR UPDATE USING (branch_id IN (SELECT public.get_user_branches()));

-- RLS Policies for categories (visible to all authenticated users)
CREATE POLICY "Authenticated users can view categories" ON public.categories
  FOR SELECT TO authenticated USING (true);

-- RLS Policies for products (visible to all authenticated users)
CREATE POLICY "Authenticated users can view products" ON public.products
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage products" ON public.products
  FOR ALL TO authenticated 
  USING (public.get_user_role() = 'admin');

-- RLS Policies for customers (branch-scoped for non-demo users)
CREATE POLICY "Users can view customers" ON public.customers
  FOR SELECT TO authenticated USING (
    public.get_user_role() IN ('admin', 'cashier') OR 
    public.get_user_role() = 'demo'
  );

CREATE POLICY "Users can manage customers" ON public.customers
  FOR ALL TO authenticated 
  USING (public.get_user_role() IN ('admin', 'cashier'));

-- RLS Policies for orders
CREATE POLICY "Users can view orders in their branches" ON public.orders
  FOR SELECT USING (
    branch_id IN (SELECT public.get_user_branches()) OR
    public.get_user_role() = 'demo'
  );

CREATE POLICY "Users can create orders in their branches" ON public.orders
  FOR INSERT WITH CHECK (
    branch_id IN (SELECT public.get_user_branches()) AND
    public.get_user_role() IN ('admin', 'cashier')
  );

CREATE POLICY "Users can update orders in their branches" ON public.orders
  FOR UPDATE USING (
    branch_id IN (SELECT public.get_user_branches()) AND
    public.get_user_role() IN ('admin', 'cashier')
  );

-- RLS Policies for order_items
CREATE POLICY "Users can view order items" ON public.order_items
  FOR SELECT USING (
    order_id IN (
      SELECT id FROM public.orders 
      WHERE branch_id IN (SELECT public.get_user_branches()) OR
      public.get_user_role() = 'demo'
    )
  );

CREATE POLICY "Users can manage order items" ON public.order_items
  FOR ALL USING (
    order_id IN (
      SELECT id FROM public.orders 
      WHERE branch_id IN (SELECT public.get_user_branches())
    ) AND
    public.get_user_role() IN ('admin', 'cashier')
  );

-- RLS Policies for cash registers
CREATE POLICY "Users can view cash registers in their branches" ON public.cash_registers
  FOR SELECT USING (
    branch_id IN (SELECT public.get_user_branches()) OR
    public.get_user_role() = 'demo'
  );

CREATE POLICY "Users can manage cash registers in their branches" ON public.cash_registers
  FOR ALL USING (
    branch_id IN (SELECT public.get_user_branches()) AND
    public.get_user_role() IN ('admin', 'cashier')
  );

-- RLS Policies for expenses
CREATE POLICY "Users can view expenses in their branches" ON public.expenses
  FOR SELECT USING (
    branch_id IN (SELECT public.get_user_branches()) OR
    public.get_user_role() = 'demo'
  );

CREATE POLICY "Users can create expenses in their branches" ON public.expenses
  FOR INSERT WITH CHECK (
    branch_id IN (SELECT public.get_user_branches()) AND
    public.get_user_role() IN ('admin', 'cashier') AND
    user_id = auth.uid()
  );

-- RLS Policies for votes (everyone can vote, including demo users)
CREATE POLICY "Users can view all votes" ON public.votes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can cast their own vote" ON public.votes
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own vote" ON public.votes
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- RLS Policies for logs (admin only)
CREATE POLICY "Admins can view logs" ON public.logs
  FOR SELECT TO authenticated USING (public.get_user_role() = 'admin');

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.users (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'name', NEW.email),
    'demo'
  );
  RETURN NEW;
END;
$$;

-- Trigger for new user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Add update triggers for tables with updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_branches_updated_at
  BEFORE UPDATE ON public.branches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_tables_updated_at
  BEFORE UPDATE ON public.tables
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Create function to calculate order totals
CREATE OR REPLACE FUNCTION public.calculate_order_total()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  order_subtotal DECIMAL(10,2);
  order_tax DECIMAL(10,2);
  order_total DECIMAL(10,2);
BEGIN
  -- Calculate subtotal from order items
  SELECT COALESCE(SUM(total_price), 0)
  INTO order_subtotal
  FROM public.order_items
  WHERE order_id = COALESCE(NEW.order_id, OLD.order_id);

  -- Get tax rate and calculate tax
  SELECT 
    order_subtotal,
    order_subtotal * tax_rate,
    order_subtotal + (order_subtotal * tax_rate) + COALESCE(tip, 0) - COALESCE(discount, 0)
  INTO order_subtotal, order_tax, order_total
  FROM public.orders
  WHERE id = COALESCE(NEW.order_id, OLD.order_id);

  -- Update the order
  UPDATE public.orders
  SET 
    subtotal = order_subtotal,
    tax_amount = order_tax,
    total = order_total,
    updated_at = NOW()
  WHERE id = COALESCE(NEW.order_id, OLD.order_id);

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Triggers for order total calculation
CREATE TRIGGER calculate_order_total_on_insert
  AFTER INSERT ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION public.calculate_order_total();

CREATE TRIGGER calculate_order_total_on_update
  AFTER UPDATE ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION public.calculate_order_total();

CREATE TRIGGER calculate_order_total_on_delete
  AFTER DELETE ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION public.calculate_order_total();

-- Create function to update product stock
CREATE OR REPLACE FUNCTION public.update_product_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- When adding items to an order, decrease stock
  IF TG_OP = 'INSERT' THEN
    UPDATE public.products
    SET stock = stock - NEW.quantity
    WHERE id = NEW.product_id;
    RETURN NEW;
  END IF;

  -- When updating items, adjust stock difference
  IF TG_OP = 'UPDATE' THEN
    UPDATE public.products
    SET stock = stock - (NEW.quantity - OLD.quantity)
    WHERE id = NEW.product_id;
    RETURN NEW;
  END IF;

  -- When removing items, increase stock back
  IF TG_OP = 'DELETE' THEN
    UPDATE public.products
    SET stock = stock + OLD.quantity
    WHERE id = OLD.product_id;
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;

-- Triggers for stock management
CREATE TRIGGER update_stock_on_order_item_insert
  AFTER INSERT ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION public.update_product_stock();

CREATE TRIGGER update_stock_on_order_item_update
  AFTER UPDATE ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION public.update_product_stock();

CREATE TRIGGER update_stock_on_order_item_delete
  AFTER DELETE ON public.order_items
  FOR EACH ROW EXECUTE FUNCTION public.update_product_stock();

-- Create RPC function for casting votes
CREATE OR REPLACE FUNCTION public.cast_vote(vote_type public.vote_type)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  existing_vote public.vote_type;
  vote_counts JSONB;
BEGIN
  -- Check if user already voted
  SELECT vote INTO existing_vote
  FROM public.votes
  WHERE user_id = auth.uid();

  -- If user already voted, update the vote
  IF existing_vote IS NOT NULL THEN
    UPDATE public.votes
    SET vote = vote_type, created_at = NOW()
    WHERE user_id = auth.uid();
  ELSE
    -- Insert new vote
    INSERT INTO public.votes (user_id, vote)
    VALUES (auth.uid(), vote_type);
  END IF;

  -- Return current vote counts
  SELECT jsonb_build_object(
    'up', (SELECT COUNT(*) FROM public.votes WHERE vote = 'up'),
    'down', (SELECT COUNT(*) FROM public.votes WHERE vote = 'down'),
    'total', (SELECT COUNT(*) FROM public.votes),
    'user_vote', vote_type
  ) INTO vote_counts;

  RETURN vote_counts;
END;
$$;

-- Create function to get vote counts
CREATE OR REPLACE FUNCTION public.get_vote_counts()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  vote_counts JSONB;
  user_vote public.vote_type;
BEGIN
  -- Get user's current vote if any
  SELECT vote INTO user_vote
  FROM public.votes
  WHERE user_id = auth.uid();

  -- Get vote counts
  SELECT jsonb_build_object(
    'up', (SELECT COUNT(*) FROM public.votes WHERE vote = 'up'),
    'down', (SELECT COUNT(*) FROM public.votes WHERE vote = 'down'),
    'total', (SELECT COUNT(*) FROM public.votes),
    'user_vote', user_vote
  ) INTO vote_counts;

  RETURN vote_counts;
END;
$$;

-- Create indexes for better performance
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_user_companies_user_id ON public.user_companies(user_id);
CREATE INDEX idx_user_companies_company_id ON public.user_companies(company_id);
CREATE INDEX idx_orders_branch_id ON public.orders(branch_id);
CREATE INDEX idx_orders_created_at ON public.orders(created_at);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX idx_order_items_product_id ON public.order_items(product_id);
CREATE INDEX idx_products_category_id ON public.products(category_id);
CREATE INDEX idx_products_name ON public.products(name);
CREATE INDEX idx_cash_registers_branch_id ON public.cash_registers(branch_id);
CREATE INDEX idx_expenses_branch_id ON public.expenses(branch_id);
CREATE INDEX idx_votes_user_id ON public.votes(user_id);
CREATE INDEX idx_logs_table_name ON public.logs(table_name);
CREATE INDEX idx_logs_created_at ON public.logs(created_at);