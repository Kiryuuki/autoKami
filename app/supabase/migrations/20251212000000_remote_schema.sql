-- Auto Crafting Settings
CREATE TABLE public.auto_crafting_settings (
    id uuid PRIMARY KEY,
    interval_minutes integer NOT NULL,
    amount_to_craft integer NOT NULL,
    recipe_id integer NOT NULL,
    operator_wallet_id uuid NOT NULL,
    is_enabled boolean NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone NOT NULL,
    last_run_at timestamp with time zone
);

-- Harvest Logs
CREATE TABLE public.harvest_logs (
    id uuid PRIMARY KEY,
    kami_profile_id uuid NOT NULL,
    success boolean NOT NULL,
    operation_type text NOT NULL,
    tx_hash text,
    error_message text,
    created_at timestamp with time zone,
    musu_collected integer
);

-- Harvest Timers
CREATE TABLE public.harvest_timers (
    id uuid PRIMARY KEY,
    kami_entity_id text NOT NULL,
    kami_profile_id uuid NOT NULL,
    last_error text,
    last_error_at timestamp with time zone,
    created_at timestamp with time zone,
    retry_count integer,
    expires_at timestamp with time zone NOT NULL,
    kami_index integer NOT NULL
);

-- Kami Profiles
CREATE TABLE public.kami_profiles (
    id uuid PRIMARY KEY,
    kamigotchi_id uuid NOT NULL,
    operator_wallet_id uuid NOT NULL,
    last_harvest_start timestamp with time zone,
    strategy_type text,
    harvest_schedule_type text,
    auto_harvest_enabled boolean,
    harvest_node_index integer,
    auto_collect_enabled boolean,
    auto_restart_enabled boolean,
    min_health_threshold integer,
    auto_heal_enabled boolean,
    harvest_start_time time without time zone,
    harvest_end_time time without time zone,
    harvest_duration integer,
    rest_duration integer,
    last_collect timestamp with time zone,
    is_currently_harvesting boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    total_harvests integer,
    total_rests integer,
    automation_started_at timestamp with time zone,
    feed_item_id integer,
    feed_trigger_value integer,
    feed_interval_minutes integer,
    last_feed_at timestamp with time zone
);

-- Kamigotchis
CREATE TABLE public.kamigotchis (
    id uuid PRIMARY KEY,
    operator_wallet_id uuid NOT NULL,
    kami_index integer NOT NULL,
    user_id text NOT NULL,
    kami_entity_id text NOT NULL,
    kami_name text,
    encrypted_private_key text NOT NULL,
    account_id text NOT NULL,
    media_uri text,
    room_name text,
    state text,
    traits jsonb,
    updated_at timestamp with time zone,
    last_synced timestamp with time zone,
    stat_power integer,
    stat_health integer,
    stat_harmony integer,
    stat_violence integer,
    mult_fertility numeric,
    mult_bounty numeric,
    mult_metabolism numeric,
    mult_strain numeric,
    mult_defense_shift numeric,
    mult_defense_ratio numeric,
    mult_salvage_ratio numeric,
    mult_atk_spoils_ratio numeric,
    mult_atk_threshold_ratio numeric,
    mult_atk_threshold_shift numeric,
    boost_cooldown_shift integer,
    boost_intensity integer,
    current_health integer,
    level integer,
    room_index integer,
    affinities jsonb,
    stats jsonb,
    final_stats jsonb,
    created_at timestamp with time zone
);

-- Operator Wallets
CREATE TABLE public.operator_wallets (
    id uuid PRIMARY KEY,
    name text NOT NULL,
    created_at timestamp with time zone,
    is_active boolean,
    updated_at timestamp with time zone,
    account_id text NOT NULL,
    encrypted_private_key text NOT NULL,
    user_id text NOT NULL,
    wallet_address text
);

-- Rest Timers
CREATE TABLE public.rest_timers (
    id uuid PRIMARY KEY,
    expires_at timestamp with time zone NOT NULL,
    kami_profile_id uuid NOT NULL,
    kami_index integer NOT NULL,
    retry_count integer,
    last_error_at timestamp with time zone,
    created_at timestamp with time zone,
    last_error text,
    kami_entity_id text NOT NULL
);

-- System Logs
CREATE TABLE public.system_logs (
    id uuid PRIMARY KEY,
    status text NOT NULL,
    action text NOT NULL,
    user_id text,
    kami_profile_id text,
    message text NOT NULL,
    created_at timestamp with time zone,
    metadata jsonb,
    kami_index integer
);

-- User Settings
CREATE TABLE public.user_settings (
    user_id text PRIMARY KEY,
    updated_at timestamp with time zone,
    notification_email text,
    created_at timestamp with time zone,
    theme text,
    notification_on_low_health boolean,
    notification_on_error boolean,
    notification_enabled boolean,
    notification_on_harvest_complete boolean
);

-- Users
CREATE TABLE public.users (
    id text PRIMARY KEY,
    privy_user_id text NOT NULL,
    telegram_chat_id text,
    updated_at timestamp with time zone,
    created_at timestamp with time zone,
    telegram_bot_token text,
    email text,
    wallet_address text
);

-- Watchlists
CREATE TABLE public.watchlists (
    id uuid PRIMARY KEY,
    updated_at timestamp with time zone,
    kami_name text,
    user_id text NOT NULL,
    account_id text NOT NULL,
    account_name text,
    kami_entity_id text NOT NULL,
    created_at timestamp with time zone
);