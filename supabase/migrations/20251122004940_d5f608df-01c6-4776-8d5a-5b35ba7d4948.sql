-- Set all views in public schema to security_invoker
-- This ensures views respect RLS policies of the invoking user
-- rather than executing with the privileges of the view creator

do $$
declare
  r record;
begin
  for r in
    select schemaname, viewname
    from pg_views
    where schemaname = 'public'
  loop
    execute format(
      'alter view %I.%I set (security_invoker = true)',
      r.schemaname,
      r.viewname
    );
    raise notice 'Set security_invoker=true for view: %.%', r.schemaname, r.viewname;
  end loop;
end;
$$;