-- ============================================
-- PHARMASTORE DATABASE SCHEMA & POLICIES
-- ============================================

-- Enable UUID extension if not enabled
create extension if not exists "uuid-ossp";

-- ============================================
-- 0. BRANCHES
-- ============================================
create table if not exists public.branches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  location text,
  phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.branches enable row level security;

-- ============================================
-- 1. PROFILES (extends Supabase auth.users)
-- ============================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text,
  role text not null check (role in ('super_admin', 'admin', 'manager', 'employee')),
  phone text,
  is_active boolean not null default true,
  branch_id uuid references public.branches(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.profiles enable row level security;

-- ============================================
-- 2. SUPPLIERS
-- ============================================
create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_person text,
  phone text,
  email text,
  gstin text,
  address text,
  created_at timestamptz not null default now()
);

alter table public.suppliers enable row level security;

-- ============================================
-- 3. PRODUCTS (master catalog — no expiry or quantity here)
-- ============================================
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  generic_name text,
  manufacturer text,
  category text,
  composition text,
  strength text,
  pack_size text,
  unit text,
  hsn_code text,
  barcode text unique,
  requires_prescription boolean not null default false,
  reorder_level integer not null default 10,
  tax_rate numeric not null default 12,
  created_at timestamptz not null default now()
);

alter table public.products enable row level security;

-- ============================================
-- 4. BATCHES (one row per purchased lot — expiry lives here)
-- ============================================
create table if not exists public.batches (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  supplier_id uuid references public.suppliers(id) on delete set null,
  batch_number text not null,
  mfg_date date,
  expiry_date date not null,
  quantity_received integer not null CHECK (quantity_received >= 0),
  quantity_available integer not null CHECK (quantity_available >= 0),
  purchase_price numeric not null CHECK (purchase_price >= 0),
  mrp numeric not null CHECK (mrp >= 0),
  selling_price numeric not null CHECK (selling_price >= 0),
  branch_id uuid references public.branches(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.batches enable row level security;

-- ============================================
-- 5. PURCHASE ORDERS
-- ============================================
create table if not exists public.purchase_orders (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid references public.suppliers(id) on delete set null,
  status text not null default 'pending'
    check (status in ('pending','partial','received','cancelled')),
  order_date date not null default current_date,
  expected_date date,
  created_by uuid references public.profiles(id) on delete set null,
  branch_id uuid references public.branches(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.purchase_orders enable row level security;

create table if not exists public.purchase_order_items (
  id uuid primary key default gen_random_uuid(),
  po_id uuid not null references public.purchase_orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  quantity integer not null check (quantity > 0),
  unit_price numeric not null check (unit_price >= 0)
);

alter table public.purchase_order_items enable row level security;

-- ============================================
-- 6. STOCK MOVEMENTS (immutable ledger — the source of truth)
-- ============================================
create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.batches(id) on delete cascade,
  movement_type text not null
    check (movement_type in ('purchase','sale','return','adjustment','writeoff')),
  quantity integer not null, -- positive for stock-in, negative for stock-out
  status text not null default 'approved'
    check (status in ('pending','approved','rejected')),
  reason text,
  reference_type text, -- e.g. 'sale_item', 'po_item', 'writeoff_request'
  reference_id uuid,
  created_by uuid references public.profiles(id) on delete set null,
  branch_id uuid references public.branches(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.stock_movements enable row level security;

-- ============================================
-- 7. CUSTOMERS
-- ============================================
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text unique,
  address text,
  created_at timestamptz not null default now()
);

alter table public.customers enable row level security;

-- ============================================
-- 8. SALES / BILLING
-- ============================================
create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  invoice_number text not null unique,
  customer_id uuid references public.customers(id) on delete set null,
  subtotal numeric not null check (subtotal >= 0),
  tax_amount numeric not null check (tax_amount >= 0),
  discount numeric not null default 0 check (discount >= 0),
  total numeric not null check (total >= 0),
  payment_mode text check (payment_mode in ('cash','card','upi')),
  created_by uuid references public.profiles(id) on delete set null,
  branch_id uuid references public.branches(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.sales enable row level security;

create table if not exists public.sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales(id) on delete cascade,
  batch_id uuid not null references public.batches(id) on delete cascade,
  quantity integer not null check (quantity > 0),
  unit_price numeric not null check (unit_price >= 0),
  tax_amount numeric not null check (tax_amount >= 0)
);

alter table public.sale_items enable row level security;

-- ============================================
-- 9. NOTIFICATIONS
-- ============================================
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  message text not null,
  target_role text check (target_role in ('admin', 'employee', 'all')),
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.notifications enable row level security;

-- ============================================
-- 10. AUDIT LOG
-- ============================================
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity text not null,
  entity_id uuid,
  old_value jsonb,
  new_value jsonb,
  created_at timestamptz not null default now()
);

alter table public.audit_logs enable row level security;

-- ============================================
-- AGGREGATION VIEW — stock is computed, never stored twice
-- ============================================
create or replace view public.product_stock_summary
with (security_invoker = true)
as
select
  p.id as product_id,
  p.name,
  p.generic_name,
  coalesce(sum(b.quantity_available)
    filter (where b.expiry_date >= current_date), 0)::integer as total_stock,
  min(b.expiry_date)
    filter (where b.quantity_available > 0 and b.expiry_date >= current_date) as nearest_expiry
from public.products p
left join public.batches b on b.product_id = p.id
group by p.id, p.name, p.generic_name;


-- ============================================
-- RLS HELPER FUNCTIONS & POLICIES
-- ============================================

-- Reusable helper to check if current user is an active super admin
create or replace function public.is_super_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'super_admin' and is_active = true
  );
$$ language sql security definer stable;

-- Reusable helper to check if current user is an active admin (includes super admin)
create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('super_admin', 'admin') and is_active = true
  );
$$ language sql security definer stable;

-- Reusable helper to check if current user is active staff (super admin, admin, manager, or employee)
create or replace function public.is_active_staff()
returns boolean as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and is_active = true
  );
$$ language sql security definer stable;

-- Reusable helper to check if current user has access to a specific branch
create or replace function public.has_branch_access(record_branch_id uuid)
returns boolean as $$
declare
  user_role text;
  user_branch uuid;
begin
  select role, branch_id into user_role, user_branch
  from public.profiles where id = auth.uid() and is_active = true;

  -- Active Super Admins and Admins have global access
  if user_role in ('super_admin', 'admin') then
    return true;
  end if;

  -- Managers and Employees are restricted to their assigned branch
  return user_branch = record_branch_id;
end;
$$ language plpgsql security definer stable;

-- 1. Profiles Policies
create policy "Staff can view active profiles in their branch or all if admin"
  on public.profiles for select
  using (
    public.is_admin() or 
    (public.is_active_staff() and branch_id = (select branch_id from public.profiles where id = auth.uid()))
  );

create policy "Admins can modify profiles"
  on public.profiles for all
  using (public.is_admin());

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- 2. Suppliers Policies
create policy "Staff can view suppliers"
  on public.suppliers for select
  using (public.is_active_staff());

create policy "Admins can modify suppliers"
  on public.suppliers for all
  using (public.is_admin());

-- 3. Products Policies
create policy "Staff can view products"
  on public.products for select
  using (public.is_active_staff());

create policy "Staff can insert products"
  on public.products for insert
  with check (public.is_active_staff());

create policy "Staff can update products"
  on public.products for update
  using (public.is_active_staff());

create policy "Only admins can delete products"
  on public.products for delete
  using (public.is_admin());

-- 4. Batches Policies
create policy "Staff can view batches"
  on public.batches for select
  using (public.is_active_staff() and public.has_branch_access(branch_id));

create policy "Staff can insert batches"
  on public.batches for insert
  with check (public.is_active_staff() and public.has_branch_access(branch_id));

create policy "Staff can update batches"
  on public.batches for update
  using (public.is_active_staff() and public.has_branch_access(branch_id));

create policy "Only admins can delete batches"
  on public.batches for delete
  using (public.is_admin() and public.has_branch_access(branch_id));

-- 5. Purchase Orders Policies
create policy "Staff can view purchase orders"
  on public.purchase_orders for select
  using (public.is_active_staff() and public.has_branch_access(branch_id));

create policy "Staff can create purchase orders"
  on public.purchase_orders for insert
  with check (public.is_active_staff() and public.has_branch_access(branch_id));

create policy "Staff can update purchase orders"
  on public.purchase_orders for update
  using (public.is_active_staff() and public.has_branch_access(branch_id));

create policy "Only admins can delete purchase orders"
  on public.purchase_orders for delete
  using (public.is_admin() and public.has_branch_access(branch_id));

create policy "Staff can view purchase order items"
  on public.purchase_order_items for select
  using (public.is_active_staff() and exists (
    select 1 from public.purchase_orders where id = po_id and public.has_branch_access(branch_id)
  ));

create policy "Staff can manage purchase order items"
  on public.purchase_order_items for all
  using (public.is_active_staff() and exists (
    select 1 from public.purchase_orders where id = po_id and public.has_branch_access(branch_id)
  ));

-- 6. Stock Movements Policies
create policy "Staff can view stock movements"
  on public.stock_movements for select
  using (public.is_active_staff() and public.has_branch_access(branch_id));

create policy "Staff can insert stock movements"
  on public.stock_movements for insert
  with check (public.is_active_staff() and public.has_branch_access(branch_id));

-- 7. Customers Policies
create policy "Staff can view/manage customers"
  on public.customers for all
  using (public.is_active_staff());

-- 8. Sales Policies
create policy "Staff can view sales"
  on public.sales for select
  using (public.is_active_staff() and public.has_branch_access(branch_id));

create policy "Staff can insert sales"
  on public.sales for insert
  with check (public.is_active_staff() and public.has_branch_access(branch_id));

create policy "Staff can view sale items"
  on public.sale_items for select
  using (public.is_active_staff() and exists (
    select 1 from public.sales where id = sale_id and public.has_branch_access(branch_id)
  ));

create policy "Staff can insert sale items"
  on public.sale_items for insert
  with check (public.is_active_staff() and exists (
    select 1 from public.sales where id = sale_id and public.has_branch_access(branch_id)
  ));

-- 9. Notifications Policies
create policy "Staff can view notifications"
  on public.notifications for select
  using (public.is_active_staff());

create policy "Staff can update notifications (mark read)"
  on public.notifications for update
  using (public.is_active_staff());

create policy "Admins can manage notifications"
  on public.notifications for all
  using (public.is_admin());

-- 10. Audit Logs Policies
create policy "Admins can view audit logs"
  on public.audit_logs for select
  using (public.is_admin());

-- Note: No insert/update policies for audit logs since they are written by system triggers.


-- ============================================
-- DATABASE TRIGGERS
-- ============================================

-- 1. Automate profile creation from auth.users
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, role, phone, is_active)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', 'New Employee'),
    new.email,
    'employee', -- Enforce safe default role, do not trust client metadata
    new.phone,
    true
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger on auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- 2. Immutable Ledger: Sync batch stock quantity available on stock_movement insert or update
create or replace function public.update_batch_stock_level()
returns trigger as $$
declare
  current_qty integer;
  qty_diff integer := 0;
begin
  if tg_op = 'INSERT' then
    if new.status = 'approved' then
      qty_diff := new.quantity;
    end if;
  elsif tg_op = 'UPDATE' then
    if old.status = 'pending' and new.status = 'approved' then
      qty_diff := new.quantity;
    elsif old.status = 'approved' and new.status = 'approved' then
      qty_diff := new.quantity - old.quantity;
    elsif old.status = 'approved' and new.status = 'rejected' then
      qty_diff := -old.quantity;
    end if;
  end if;

  if qty_diff <> 0 then
    select quantity_available into current_qty 
    from public.batches 
    where id = new.batch_id;
    
    if current_qty is null then
      raise exception 'Batch with ID % not found', new.batch_id;
    end if;

    if current_qty + qty_diff < 0 then
      raise exception 'Stock level cannot go negative for batch ID %. Available: %, requested change: %', 
        new.batch_id, current_qty, qty_diff;
    end if;

    update public.batches
    set quantity_available = quantity_available + qty_diff
    where id = new.batch_id;
  end if;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trigger_update_batch_stock on public.stock_movements;
create trigger trigger_update_batch_stock
  after insert or update on public.stock_movements
  for each row
  execute function public.update_batch_stock_level();


-- 3. Automate Stock Movement on new Batch creation
create or replace function public.auto_create_purchase_movement()
returns trigger as $$
begin
  -- Only log purchase movement if initial quantity_received > 0
  if new.quantity_received > 0 then
    insert into public.stock_movements (batch_id, movement_type, quantity, reason, reference_type, reference_id, created_by)
    values (
      new.id, 
      'purchase', 
      new.quantity_received, 
      'Initial stock-in on batch creation', 
      'batch',
      new.id,
      auth.uid()
    );
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trigger_auto_purchase_movement on public.batches;
create trigger trigger_auto_purchase_movement
  after insert on public.batches
  for each row
  execute function public.auto_create_purchase_movement();


-- 4. Audit Log Trigger Function
create or replace function public.audit_trigger_func()
returns trigger as $$
declare
  old_v jsonb := null;
  new_v jsonb := null;
  ent_id uuid := null;
  u_id uuid := null;
begin
  if tg_op = 'DELETE' then
    old_v := to_jsonb(old);
    ent_id := old.id;
  elsif tg_op = 'UPDATE' then
    old_v := to_jsonb(old);
    new_v := to_jsonb(new);
    ent_id := new.id;
  elsif tg_op = 'INSERT' then
    new_v := to_jsonb(new);
    ent_id := new.id;
  end if;

  begin
    u_id := auth.uid();
  exception when others then
    u_id := null;
  end;

  insert into public.audit_logs (user_id, action, entity, entity_id, old_value, new_value)
  values (u_id, tg_op, tg_table_name, ent_id, old_v, new_v);

  return new;
end;
$$ language plpgsql security definer;

-- Attach Audit triggers
drop trigger if exists audit_products on public.products;
create trigger audit_products
  after insert or update or delete on public.products
  for each row execute function public.audit_trigger_func();

drop trigger if exists audit_batches on public.batches;
create trigger audit_batches
  after insert or update or delete on public.batches
  for each row execute function public.audit_trigger_func();

drop trigger if exists audit_stock_movements on public.stock_movements;
create trigger audit_stock_movements
  after insert or update or delete on public.stock_movements
  for each row execute function public.audit_trigger_func();

drop trigger if exists audit_profiles on public.profiles;
create trigger audit_profiles
  after insert or update or delete on public.profiles
  for each row execute function public.audit_trigger_func();





-- ============================================
-- PRIVILEGE ESCALATION PREVENTION
-- ============================================
create or replace function public.check_profile_update()
returns trigger as $$
declare
  admin_exists boolean;
begin
  -- Check if any active admin profile exists in the system
  select exists (
    select 1 from public.profiles where role = 'admin' and is_active = true
  ) into admin_exists;

  if not admin_exists then
    -- Tighten bootstrap hatch: only allow creating the first admin
    if new.role is distinct from 'admin' or new.is_active is distinct from true then
      raise exception 'Bootstrap phase: The first profile must be set to role = admin and is_active = true.';
    end if;
    
    -- Emit warning and log audit trail
    raise warning 'SYSTEM BOOTSTRAP: First admin profile bootstrap initiated for user ID %', new.id;
    
    insert into public.audit_logs (user_id, action, entity, entity_id, new_value)
    values (new.id, 'BOOTSTRAP', 'profiles', new.id, jsonb_build_object('role', new.role, 'is_active', new.is_active, 'bootstrap', true));
  else
    -- Check if target profile is a super_admin or is being set to super_admin
    if old.role = 'super_admin' or new.role = 'super_admin' then
      if not public.is_super_admin() then
        raise exception 'Only super administrators can manage super administrator roles and profiles.';
      end if;
    end if;

    -- Prevent non-admins from altering role or is_active fields
    if not public.is_admin() then
      if new.role is distinct from old.role then
        raise exception 'Only administrators can change profile roles.';
      end if;
      if new.is_active is distinct from old.is_active then
        raise exception 'Only administrators can change profile active status.';
      end if;
    end if;
  end if;
  
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trigger_check_profile_update on public.profiles;
create trigger trigger_check_profile_update
  before update on public.profiles
  for each row
  execute function public.check_profile_update();


