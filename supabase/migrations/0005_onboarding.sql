create or replace function public.create_tenant_with_owner(
  tenant_name text,
  tenant_slug text,
  owner_full_name text,
  owner_phone text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_tenant_id uuid;
  owner_role_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication is required';
  end if;

  insert into public.tenants (name, slug)
  values (tenant_name, tenant_slug)
  returning id into new_tenant_id;

  insert into public.roles (tenant_id, name, permissions)
  values
    (new_tenant_id, 'owner', '{"all": true}'::jsonb),
    (new_tenant_id, 'admin', '{"students": true, "groups": true, "attendance": true, "payments": true, "expenses": true, "settings": false}'::jsonb),
    (new_tenant_id, 'staff', '{"students": true, "groups": true, "attendance": true, "payments": true, "expenses": false, "settings": false}'::jsonb);

  select id
  into owner_role_id
  from public.roles
  where tenant_id = new_tenant_id
    and name = 'owner';

  insert into public.users (id, tenant_id, role_id, full_name, phone, role)
  values (auth.uid(), new_tenant_id, owner_role_id, owner_full_name, owner_phone, 'owner');

  return new_tenant_id;
end;
$$;

grant execute on function public.create_tenant_with_owner(text, text, text, text) to authenticated;
