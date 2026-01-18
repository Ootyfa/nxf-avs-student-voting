
-- ==========================================
-- 0. Cleanup (Optional: Reset Policies)
-- ==========================================
-- Run this to clear old policies if you are facing conflicts, 
-- otherwise you can skip to Table Creation.
DROP POLICY IF EXISTS "Enable read access for all users" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable update for all users" ON public.user_profiles;
-- (Repeat drop for other tables if necessary for clean slate)

-- ==========================================
-- 1. Create Universities/Colleges Table
-- ==========================================
create table if not exists public.universities (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  logo text,
  location text,
  domain text,
  points integer default 0,
  active_students integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==========================================
-- 2. Create User Profiles
-- ==========================================
create table if not exists public.user_profiles (
  email text primary key,
  name text,
  university_id uuid references public.universities(id),
  is_student boolean default false,
  points integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==========================================
-- 3. Create Master Films Table
-- ==========================================
create table if not exists public.master_films (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  director text,
  category text,
  genre text,
  duration text,
  duration_minutes integer,
  synopsis text,
  image_url text,
  poster_url text,
  trailer_url text,
  rating numeric default 0,
  votes_count integer default 0,
  status text default 'Active',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==========================================
-- 4. Create Film Votes Table
-- ==========================================
create table if not exists public.film_votes (
  id uuid default gen_random_uuid() primary key,
  film_id uuid references public.master_films(id),
  user_email text,
  user_name text,
  rating integer,
  review_text text,
  ai_score integer,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(film_id, user_email)
);

-- ==========================================
-- 5. Create Festivals Table
-- ==========================================
create table if not exists public.festivals (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  location text,
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  status text default 'Upcoming', -- 'Live', 'Upcoming', 'Ended'
  is_active boolean default false, -- Controls which one appears on Home
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==========================================
-- 6. Create Festival Films (Junction Table)
-- ==========================================
create table if not exists public.festival_films (
  id uuid default gen_random_uuid() primary key,
  festival_id uuid references public.festivals(id) not null,
  film_id uuid references public.master_films(id) not null,
  sequence_order integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(festival_id, film_id)
);

-- ==========================================
-- 7. Create Film Questions Table (New)
-- ==========================================
create table if not exists public.film_questions (
  id uuid default gen_random_uuid() primary key,
  film_id uuid references public.master_films(id),
  user_name text,
  user_email text,
  question text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ==========================================
-- 8. Enable Row Level Security (RLS)
-- ==========================================
alter table public.universities enable row level security;
alter table public.user_profiles enable row level security;
alter table public.master_films enable row level security;
alter table public.film_votes enable row level security;
alter table public.festivals enable row level security;
alter table public.festival_films enable row level security;
alter table public.film_questions enable row level security;

-- ==========================================
-- 9. Define PERMISSIVE Policies (Fixes Errors)
-- ==========================================

-- User Profiles: Allow Public Read/Insert/Update
create policy "Public Profiles Access" on public.user_profiles for select using (true);
create policy "Public Profiles Insert" on public.user_profiles for insert with check (true);
create policy "Public Profiles Update" on public.user_profiles for update using (true);

-- Film Votes: Allow Public Read/Insert/Update
create policy "Public Votes Access" on public.film_votes for select using (true);
create policy "Public Votes Insert" on public.film_votes for insert with check (true);
create policy "Public Votes Update" on public.film_votes for update using (true);

-- Film Questions: Allow Public Read/Insert
create policy "Public Questions Access" on public.film_questions for select using (true);
create policy "Public Questions Insert" on public.film_questions for insert with check (true);

-- Master Data (Films, Universities, Festivals): Read Only (mostly)
create policy "Public Read Master" on public.master_films for select using (true);
create policy "Public Update Master" on public.master_films for update using (true); -- needed for vote count increment

create policy "Public Read Unis" on public.universities for select using (true);
create policy "Public Update Unis" on public.universities for update using (true); -- needed for point increment
create policy "Public Insert Unis" on public.universities for insert with check (true); -- ADDED: Allow users to create new unis

create policy "Public Read Festivals" on public.festivals for select using (true);
create policy "Public Read FestivalFilms" on public.festival_films for select using (true);

-- ==========================================
-- 10. RPC Functions
-- ==========================================

-- Function to increment university points safely
create or replace function increment_university_points(uni_id uuid, points_to_add int)
returns void
language plpgsql
security definer
as $$
begin
  update public.universities
  set 
    points = points + points_to_add,
    active_students = active_students + 1
  where id = uni_id;
end;
$$;

-- Function to increment film vote count safely
create or replace function increment_vote(row_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  update public.master_films
  set votes_count = votes_count + 1
  where id = row_id;
end;
$$;

-- ==========================================
-- 11. Initial Seed (Run only if empty)
-- ==========================================
INSERT INTO public.festivals (name, location, start_date, end_date, status, is_active)
SELECT 'ATOM Student Awards 2024', 'Online', NOW(), NOW() + interval '30 days', 'Live', true
WHERE NOT EXISTS (SELECT 1 FROM public.festivals);

GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
