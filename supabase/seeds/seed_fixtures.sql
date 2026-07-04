-- =====================================================================
-- Seed Fixtures: seed_fixtures.sql
-- Population script for verification of RLS and Solver Daemons
-- =====================================================================

-- 1. Create temporary entries inside auth.users for schema matching
-- (In a real Supabase environment, these are created via Auth signup/invite API)
insert into auth.users (id, email, raw_user_meta_data)
values 
  ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'manager@enterprise-scheduler.io', '{"role":"manager"}'),
  ('b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', 'senior.staff@enterprise-scheduler.io', '{"role":"senior_staff"}'),
  ('c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f', 'junior.staff1@enterprise-scheduler.io', '{"role":"junior_staff"}'),
  ('d4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a', 'junior.staff2@enterprise-scheduler.io', '{"role":"junior_staff"}')
on conflict (id) do nothing;

-- 2. Populate public.employees profiles
insert into public.employees (id, full_name, email, role, supervisor_id, max_hours_per_week, hourly_rate, is_active)
values
  ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Evelyn Vance (Ops Director)', 'manager@enterprise-scheduler.io', 'manager', null, 40.00, 75.00, true),
  ('b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', 'Marcus Broady (Shift Lead)', 'senior.staff@enterprise-scheduler.io', 'senior_staff', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 40.00, 42.50, true),
  ('c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f', 'Jane Doe (Associate)', 'junior.staff1@enterprise-scheduler.io', 'junior_staff', 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', 32.00, 22.00, true),
  ('d4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a', 'John Smith (Associate)', 'junior.staff2@enterprise-scheduler.io', 'junior_staff', 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e', 24.00, 21.50, true)
on conflict (id) do update set
  full_name = excluded.full_name,
  role = excluded.role,
  max_hours_per_week = excluded.max_hours_per_week,
  is_active = excluded.is_active;

-- 3. Ingest sample employee preferences and hard blackout limits
insert into public.employee_constraints (employee_id, day_of_week, shift_index, is_hard_constraint, preference_weight, reason)
values
  -- Jane Doe cannot work Night shifts (shift_index = '2') on Sundays (day_of_week = 0)
  ('c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f', 0, '2', true, 0, 'Hard constraint: Weekend educational commitment'),
  -- John Smith prefers Morning shifts (shift_index = '0') on Mondays (day_of_week = 1)
  ('d4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a', 1, '0', false, 8, 'Soft preference: Commute alignment')
on conflict (employee_id, day_of_week, shift_index) do update set
  is_hard_constraint = excluded.is_hard_constraint,
  preference_weight = excluded.preference_weight,
  reason = excluded.reason;