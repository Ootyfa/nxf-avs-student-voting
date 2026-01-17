-- ==========================================
-- 0. Cleanup & Permissions
-- ==========================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;

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
-- 5. Create Festivals Table (NEW)
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

-- Insert Default Festival Data
INSERT INTO public.festivals (name, location, start_date, end_date, status, is_active)
SELECT 'ATOM Documentary Festival', 'Ooty, India', NOW(), NOW() + interval '10 days', 'Live', true
WHERE NOT EXISTS (SELECT 1 FROM public.festivals);

-- ==========================================
-- 6. Enable Row Level Security (RLS)
-- ==========================================
alter table public.universities enable row level security;
alter table public.user_profiles enable row level security;
alter table public.master_films enable row level security;
alter table public.film_votes enable row level security;
alter table public.festivals enable row level security;

-- ==========================================
-- 7. Define Policies
-- ==========================================

-- Universities
drop policy if exists "Allow public read access on universities" on public.universities;
create policy "Allow public read access on universities" on public.universities for select using (true);

-- Master Films
drop policy if exists "Allow public read access on master_films" on public.master_films;
create policy "Allow public read access on master_films" on public.master_films for select using (true);

-- User Profiles
drop policy if exists "Allow public read access on user_profiles" on public.user_profiles;
drop policy if exists "Allow public insert on user_profiles" on public.user_profiles;
drop policy if exists "Allow public update on user_profiles" on public.user_profiles;

create policy "Allow public read access on user_profiles" on public.user_profiles for select using (true);
create policy "Allow public insert on user_profiles" on public.user_profiles for insert with check (true);
create policy "Allow public update on user_profiles" on public.user_profiles for update using (true);

-- Film Votes
drop policy if exists "Allow public read access on film_votes" on public.film_votes;
drop policy if exists "Allow public insert on film_votes" on public.film_votes;
drop policy if exists "Allow public update on film_votes" on public.film_votes;

create policy "Allow public read access on film_votes" on public.film_votes for select using (true);
create policy "Allow public insert on film_votes" on public.film_votes for insert with check (true);
create policy "Allow public update on film_votes" on public.film_votes for update using (true);

-- Festivals (NEW)
drop policy if exists "Allow public read access on festivals" on public.festivals;
create policy "Allow public read access on festivals" on public.festivals for select using (true);

-- ==========================================
-- 8. Grant Permissions
-- ==========================================
GRANT ALL ON TABLE public.universities TO anon, authenticated;
GRANT ALL ON TABLE public.user_profiles TO anon, authenticated;
GRANT ALL ON TABLE public.master_films TO anon, authenticated;
GRANT ALL ON TABLE public.film_votes TO anon, authenticated;
GRANT ALL ON TABLE public.festivals TO anon, authenticated;

-- ==========================================
-- 9. RPC Functions
-- ==========================================

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

NOTIFY pgrst, 'reload config';
