-- ============================================================
-- Cambio Online — SQL Migration
-- Supabase Dashboard > SQL Editor'da bu dosyayı çalıştırın
-- ============================================================

-- ── UUID extension ──────────────────────────────────────────
create extension if not exists "pgcrypto";

-- ── rooms ───────────────────────────────────────────────────
create table if not exists rooms (
  id         uuid primary key default gen_random_uuid(),
  code       text unique not null,
  status     text not null default 'waiting'
               check (status in ('waiting','playing','finished')),
  host_id    uuid,
  created_at timestamptz default now()
);

-- ── players ─────────────────────────────────────────────────
create table if not exists players (
  id        uuid primary key default gen_random_uuid(),
  room_id   uuid references rooms(id) on delete cascade,
  nickname  text not null,
  seat      int  not null check (seat between 0 and 3),
  score     int  not null default 0,
  is_online boolean not null default true,
  is_ready  boolean not null default false,
  joined_at timestamptz default now(),
  unique (room_id, seat)
);

-- ── game_state ──────────────────────────────────────────────
create table if not exists game_state (
  id              uuid primary key default gen_random_uuid(),
  room_id         uuid references rooms(id) on delete cascade unique,
  deck            jsonb not null default '[]',
  discard_pile    jsonb not null default '[]',
  current_turn    int   not null default 0,
  drawn_card      jsonb,
  phase           text  not null default 'draw'
                    check (phase in ('waiting','peek','draw','action','stick_window','power','cambio_round','reveal','results')),
  cambio_caller   int,
  remaining_turns int   not null default 0,
  updated_at      timestamptz default now()
);

-- ── player_cards ────────────────────────────────────────────
create table if not exists player_cards (
  id          uuid primary key default gen_random_uuid(),
  room_id     uuid references rooms(id) on delete cascade,
  player_id   uuid references players(id) on delete cascade,
  position    int  not null check (position between 0 and 7),
  card_value  int  not null,
  card_suit   text not null,
  card_rank   text not null,
  is_revealed boolean not null default false,
  is_penalty  boolean not null default false
);

-- ── Row Level Security ──────────────────────────────────────
alter table rooms        enable row level security;
alter table players      enable row level security;
alter table game_state   enable row level security;
alter table player_cards enable row level security;

-- Herkes odaları okuyabilir
create policy "rooms_select" on rooms for select using (true);
create policy "rooms_insert" on rooms for insert with check (true);
create policy "rooms_update" on rooms for update using (true);

-- Herkes oyuncuları okuyabilir / kendini ekleyebilir
create policy "players_select" on players for select using (true);
create policy "players_insert" on players for insert with check (true);
create policy "players_update" on players for update using (true);

-- Game state herkese açık
create policy "game_state_select" on game_state for select using (true);
create policy "game_state_insert" on game_state for insert with check (true);
create policy "game_state_update" on game_state for update using (true);

-- player_cards: herkes okuyabilir (kart değerleri broadcast ile hidden tutulur)
create policy "player_cards_select" on player_cards for select using (true);
create policy "player_cards_insert" on player_cards for insert with check (true);
create policy "player_cards_update" on player_cards for update using (true);
create policy "player_cards_delete" on player_cards for delete using (true);

-- ── Realtime ────────────────────────────────────────────────
alter table game_state   replica identity full;
alter table players      replica identity full;
alter table rooms        replica identity full;

-- Realtime yayınlarını etkinleştir
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and tablename = 'game_state'
  ) then
    alter publication supabase_realtime add table game_state;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and tablename = 'players'
  ) then
    alter publication supabase_realtime add table players;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and tablename = 'rooms'
  ) then
    alter publication supabase_realtime add table rooms;
  end if;
end $$;
