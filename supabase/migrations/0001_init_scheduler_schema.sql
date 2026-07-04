-- =====================================================================
-- Migration: 0001_init_scheduler_schema.sql
-- Enterprise Shift-Scheduler & Conflict Resolver
-- Target: Supabase (PostgreSQL 15+), auth.users integration, RLS enforced
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. EXTENSIONS
-- ---------------------------------------------------------------------
create extension if not exists "pgcrypto";      -- gen_random_uuid()
create extension if not exists "pg_cron";        -- scheduled maintenance / job sweeper

-- ---------------------------------------------------------------------
-- 1. CUSTOM TYPES / ENUMS
-- ---------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('junior_staff', 'senior_staff', 'manager');
  end if;

  if not exists (select 1 from pg_type where typname = 'shift_index') then
    -- '0' = Morning, '1' = Afternoon, '2' = Night
    create type public.shift_index as enum ('0', '1', '2');
  end if;

  if not exists (select 1 from pg_type where typname = 'job_status') then
    create type public.job_status as enum ('pending', 'processing', 'completed', 'failed');
  end if;
end
$$;

-- ---------------------------------------------------------------------
-- 2. CORE TABLES
-- ---------------------------------------------------------------------

-- 2.1 employees
create table if not exists public.employees (
  id                  uuid primary key references auth.users (id) on delete cascade,
  full_name           text not null check (char_length(full_name) between 1 and 200),
  email               text not null unique,
  role                public.user_role not null default 'junior_staff',
  supervisor_id       uuid references public.employees (id) on delete set null,
  max_hours_per_week  numeric(5, 2) not null default 40.00 check (max_hours_per_week > 0 and max_hours_per_week <= 168),
  hourly_rate         numeric(10, 2) check (hourly_rate is null or hourly_rate >= 0),
  is_active           boolean not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

comment on table public.employees is 'Employee master profile, 1:1 with auth.users.';

alter table public.employees
  add constraint employees_no_self_supervision
  check (supervisor_id is distinct from id);

-- 2.2 employee_constraints
create table if not exists public.employee_constraints (
  id                 uuid primary key default gen_random_uuid(),
  employee_id        uuid not null references public.employees (id) on delete cascade,
  day_of_week        smallint not null check (day_of_week between 0 and 6), -- 0 = Sun, 6 = Sat
  shift_index        public.shift_index not null,
  is_hard_constraint boolean not null default false, -- true = Blackout window; false = Preference weight
  preference_weight  smallint not null default 0 check (preference_weight between -10 and 10),
  reason             text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (employee_id, day_of_week, shift_index)
);

comment on table public.employee_constraints is 'Hard blackout constraints and soft preference weights per employee/day/shift slot.';

-- 2.3 schedule_jobs
create table if not exists public.schedule_jobs (
  id                 uuid primary key default gen_random_uuid(),
  requested_by        uuid not null references public.employees (id) on delete restrict,
  week_start_date     date not null,
  status              public.job_status not null default 'pending',
  input_payload       jsonb not null,
  result_payload      jsonb,
  error_message       text,
  solver_wall_time_ms integer,
  created_at          timestamptz not null default now(),
  started_at          timestamptz,
  completed_at        timestamptz,
  unique (week_start_date, requested_by, created_at)
);

comment on table public.schedule_jobs is 'Queue registry for asynchronous CP-SAT solver invocations.';

create index if not exists idx_schedule_jobs_status on public.schedule_jobs (status) where status in ('pending', 'processing');

-- 2.4 assigned_shifts
create table if not exists public.assigned_shifts (
  id               uuid primary key default gen_random_uuid(),
  employee_id      uuid not null references public.employees (id) on delete cascade,
  job_id           uuid references public.schedule_jobs (id) on delete set null,
  shift_date       date not null,
  shift_index      public.shift_index not null,
  is_sick_leave    boolean not null default false,
  is_manual_override boolean not null default false,
  overridden_by    uuid references public.employees (id) on delete set null,
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (employee_id, shift_date, shift_index)
);

comment on table public.assigned_shifts is 'Final materialized shift assignments.';

create index if not exists idx_assigned_shifts_employee_date on public.assigned_shifts (employee_id, shift_date);
create index if not exists idx_assigned_shifts_date on public.assigned_shifts (shift_date);

-- ---------------------------------------------------------------------
-- 3. updated_at TRIGGER HELPER
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_employees_updated_at on public.employees;
create trigger trg_employees_updated_at
  before update on public.employees
  for each row execute function public.set_updated_at();

drop trigger if exists trg_constraints_updated_at on public.employee_constraints;
create trigger trg_constraints_updated_at
  before update on public.employee_constraints
  for each row execute function public.set_updated_at();

drop trigger if exists trg_assigned_shifts_updated_at on public.assigned_shifts;
create trigger trg_assigned_shifts_updated_at
  before update on public.assigned_shifts
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 4. ROLE-RESOLUTION HELPER (SECURITY DEFINER to eliminate RLS recursion)
-- ---------------------------------------------------------------------
create or replace function public.current_employee_role()
returns public.user_role
language sql
security definer
set search_path = public
stable
as $$
  select role from public.employees where id = auth.uid();
$$;

create or replace function public.is_manager()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce((select role from public.employees where id = auth.uid()) = 'manager', false);
$$;

revoke all on function public.current_employee_role() from public;
revoke all on function public.is_manager() from public;
grant execute on function public.current_employee_role() to authenticated;
grant execute on function public.is_manager() to authenticated;

-- ---------------------------------------------------------------------
-- 5. ENABLE ROW LEVEL SECURITY
-- ---------------------------------------------------------------------
alter table public.employees             enable row level security;
alter table public.employee_constraints  enable row level security;
alter table public.schedule_jobs         enable row level security;
alter table public.assigned_shifts       enable row level security;

alter table public.employees             force row level security;
alter table public.employee_constraints  force row level security;
alter table public.schedule_jobs         force row level security;
alter table public.assigned_shifts       force row level security;

-- ---------------------------------------------------------------------
-- 6. RLS POLICIES — employees
-- ---------------------------------------------------------------------
create policy employees_manager_all
  on public.employees
  for all
  to authenticated
  using (public.is_manager())
  with check (public.is_manager());

create policy employees_self_select
  on public.employees
  for select
  to authenticated
  using (id = auth.uid());

-- ---------------------------------------------------------------------
-- 7. RLS POLICIES — employee_constraints
-- ---------------------------------------------------------------------
create policy constraints_manager_all
  on public.employee_constraints
  for all
  to authenticated
  using (public.is_manager())
  with check (public.is_manager());

create policy constraints_self_select
  on public.employee_constraints
  for select
  to authenticated
  using (employee_id = auth.uid());

-- ---------------------------------------------------------------------
-- 8. RLS POLICIES — schedule_jobs
-- ---------------------------------------------------------------------
create policy jobs_manager_all
  on public.schedule_jobs
  for all
  to authenticated
  using (public.is_manager())
  with check (public.is_manager());

-- ---------------------------------------------------------------------
-- 9. RLS POLICIES — assigned_shifts
-- ---------------------------------------------------------------------
create policy shifts_manager_all
  on public.assigned_shifts
  for all
  to authenticated
  using (public.is_manager())
  with check (public.is_manager());

create policy shifts_self_select
  on public.assigned_shifts
  for select
  to authenticated
  using (employee_id = auth.uid());

-- ---------------------------------------------------------------------
-- 10. REALTIME PUBLICATION
-- ---------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and tablename = 'assigned_shifts'
  ) then
    alter publication supabase_realtime add table public.assigned_shifts;
  end if;

  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' and tablename = 'schedule_jobs'
  ) then
    alter publication supabase_realtime add table public.schedule_jobs;
  end if;
end
$$;

-- ---------------------------------------------------------------------
-- 11. MAINTENANCE: Job Sweeper
-- ---------------------------------------------------------------------
select cron.schedule(
  'sweep-stuck-schedule-jobs',
  '*/5 * * * *',
  $$
    update public.schedule_jobs
    set status = 'failed',
        error_message = 'Job exceeded processing timeout and was auto-failed by sweeper.',
        completed_at = now()
    where status = 'processing'
      and started_at < now() - interval '15 minutes';
  $$
);