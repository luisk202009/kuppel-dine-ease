-- Fix security warnings by adding SET search_path to functions
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS public.user_role
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public, auth
AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_user_companies()
RETURNS SETOF UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public, auth
AS $$
  SELECT company_id FROM public.user_companies WHERE user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_user_branches()
RETURNS SETOF UUID
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public, auth
AS $$
  SELECT DISTINCT b.id 
  FROM public.branches b
  INNER JOIN public.user_companies uc ON b.company_id = uc.company_id
  WHERE uc.user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
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

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.calculate_order_total()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
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

CREATE OR REPLACE FUNCTION public.update_product_stock()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
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

CREATE OR REPLACE FUNCTION public.cast_vote(vote_type public.vote_type)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
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

CREATE OR REPLACE FUNCTION public.get_vote_counts()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
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