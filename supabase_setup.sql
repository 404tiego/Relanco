-- =========================================================================================
-- SUPABASE SENIOR BOILERPLATE SETUP (ROBUST EDITION)
-- =========================================================================================

-- 1. SCHEMA DEFINITION
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL PRIMARY KEY,
    email TEXT,
    role TEXT DEFAULT 'user' NOT NULL,
    is_subscriber BOOLEAN DEFAULT FALSE NOT NULL,
    has_accepted_terms BOOLEAN DEFAULT FALSE NOT NULL,
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    subscription_status TEXT,
    last_active_at TIMESTAMP WITH TIME ZONE,
    full_name TEXT,
    avatar_url TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

    CONSTRAINT profiles_role_check CHECK (role IN ('user', 'admin'))
);

-- Assurer la présence des colonnes même si la table existe déjà
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='public' AND TABLE_NAME='profiles' AND COLUMN_NAME='email') THEN
        ALTER TABLE public.profiles ADD COLUMN email TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='profiles' AND COLUMN_NAME='role') THEN
        ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'user' NOT NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='profiles' AND COLUMN_NAME='has_accepted_terms') THEN
        ALTER TABLE public.profiles ADD COLUMN has_accepted_terms BOOLEAN DEFAULT FALSE NOT NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='profiles' AND COLUMN_NAME='is_subscriber') THEN
        ALTER TABLE public.profiles ADD COLUMN is_subscriber BOOLEAN DEFAULT FALSE NOT NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='profiles' AND COLUMN_NAME='full_name') THEN
        ALTER TABLE public.profiles ADD COLUMN full_name TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='profiles' AND COLUMN_NAME='avatar_url') THEN
        ALTER TABLE public.profiles ADD COLUMN avatar_url TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='public' AND TABLE_NAME='profiles' AND COLUMN_NAME='stripe_customer_id') THEN
        ALTER TABLE public.profiles ADD COLUMN stripe_customer_id TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='public' AND TABLE_NAME='profiles' AND COLUMN_NAME='stripe_subscription_id') THEN
        ALTER TABLE public.profiles ADD COLUMN stripe_subscription_id TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='public' AND TABLE_NAME='profiles' AND COLUMN_NAME='subscription_status') THEN
        ALTER TABLE public.profiles ADD COLUMN subscription_status TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='public' AND TABLE_NAME='profiles' AND COLUMN_NAME='last_active_at') THEN
        ALTER TABLE public.profiles ADD COLUMN last_active_at TIMESTAMP WITH TIME ZONE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='public' AND TABLE_NAME='profiles' AND COLUMN_NAME='updated_at') THEN
        ALTER TABLE public.profiles ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='public' AND TABLE_NAME='profiles' AND COLUMN_NAME='created_at') THEN
        ALTER TABLE public.profiles ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL;
    END IF;
END $$;

-- 2. ROW LEVEL SECURITY (RLS) - DÉSACTIVER PUIS RÉACTIVER POUR NETTOYER
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Nettoyage des anciennes politiques
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
    DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Admins can perform all actions" ON public.profiles;
    DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
    DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;
    DROP POLICY IF EXISTS "Enable update for users based on id" ON public.profiles;
    DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
    DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
    DROP POLICY IF EXISTS "Users can insert own non-admin profile" ON public.profiles;
    DROP POLICY IF EXISTS "Users can update own self-service profile fields" ON public.profiles;
    DROP POLICY IF EXISTS "Admins can update profiles self-service fields" ON public.profiles;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

-- NOUVELLES POLITIQUES ROBUSTES
-- Helper used by admin policies. SECURITY DEFINER avoids recursive RLS checks.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = pg_catalog, public, auth
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
          AND role = 'admin'
    );
$$;

-- Defense in depth: browser-authenticated sessions must not change privilege,
-- billing, quota, or security fields even if a broad UPDATE grant is added later.
CREATE OR REPLACE FUNCTION public.prevent_profile_sensitive_field_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
DECLARE
    new_profile JSONB;
    old_profile JSONB;
    protected_column TEXT;
    protected_columns CONSTANT TEXT[] := ARRAY[
        'role',
        'is_admin',
        'credits',
        'is_subscriber',
        'stripe_customer_id',
        'stripe_subscription_id',
        'subscription_status'
    ];
BEGIN
    IF current_user NOT IN ('authenticated', 'anon') THEN
        RETURN NEW;
    END IF;

    new_profile := to_jsonb(NEW);
    old_profile := to_jsonb(OLD);

    FOREACH protected_column IN ARRAY protected_columns LOOP
        IF new_profile -> protected_column IS DISTINCT FROM old_profile -> protected_column THEN
            RAISE EXCEPTION 'Updating protected profile field "%" is not allowed', protected_column
                USING ERRCODE = '42501';
        END IF;
    END LOOP;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_profile_sensitive_field_update ON public.profiles;
CREATE TRIGGER prevent_profile_sensitive_field_update
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_profile_sensitive_field_update();

CREATE POLICY "Users can read own profile"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Admins can read all profiles"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (public.is_admin());

-- Kept for compatibility if direct profile insertion is ever granted again.
-- The signup trigger does not depend on this policy.
CREATE POLICY "Users can insert own non-admin profile"
    ON public.profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = id
        AND role = 'user'
        AND is_subscriber = FALSE
        AND stripe_customer_id IS NULL
        AND stripe_subscription_id IS NULL
        AND subscription_status IS NULL
    );

-- Column-level grants below decide which fields can actually be updated.
CREATE POLICY "Users can update own self-service profile fields"
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can update profiles self-service fields"
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 3. AUTOMATION: HANDLER FOR NEW USERS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    extracted_name TEXT;
    extracted_avatar TEXT;
BEGIN
    extracted_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        split_part(NEW.email, '@', 1)
    );

    extracted_avatar := COALESCE(
        NEW.raw_user_meta_data->>'avatar_url',
        NEW.raw_user_meta_data->>'picture'
    );

    -- Utilisation de INSERT ... ON CONFLICT pour éviter les erreurs si le profil existe déjà
    INSERT INTO public.profiles (id, email, full_name, avatar_url, role, has_accepted_terms)
    VALUES (
        NEW.id, 
        NEW.email, 
        extracted_name,
        extracted_avatar,
        'user',
        COALESCE((NEW.raw_user_meta_data->>'has_accepted_terms')::boolean, false)
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), profiles.full_name),
        avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
        updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. TRIGGER REGISTRATION
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created 
    AFTER INSERT ON auth.users 
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 10. ADMIN SESSION RPCs (least privilege, no auth schema exposure)
CREATE OR REPLACE FUNCTION public.admin_list_user_sessions(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE,
    not_after TIMESTAMP WITH TIME ZONE,
    ip TEXT,
    user_agent TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = pg_catalog, auth
AS $$
    SELECT s.id, s.user_id, s.created_at, s.not_after, s.ip::text, s.user_agent
    FROM auth.sessions AS s
    WHERE s.user_id = p_user_id
    ORDER BY s.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.admin_revoke_user_session(p_user_id UUID, p_session_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, auth
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM auth.sessions
    WHERE id = p_session_id
      AND user_id = p_user_id;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_revoke_all_user_sessions(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, auth
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM auth.sessions
    WHERE user_id = p_user_id;

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$;

-- 11. PERMISSIONS
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

REVOKE SELECT, INSERT, UPDATE, DELETE ON public.profiles FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.profiles FROM PUBLIC;
REVOKE INSERT, UPDATE, DELETE ON public.profiles FROM authenticated;
REVOKE UPDATE (
    id,
    email,
    role,
    is_subscriber,
    has_accepted_terms,
    stripe_customer_id,
    stripe_subscription_id,
    subscription_status,
    last_active_at,
    full_name,
    avatar_url,
    updated_at,
    created_at
) ON public.profiles FROM anon, authenticated, PUBLIC;

DO $$
DECLARE
    protected_column TEXT;
BEGIN
    FOREACH protected_column IN ARRAY ARRAY['is_admin', 'credits'] LOOP
        IF EXISTS (
            SELECT 1
            FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = 'public'
              AND TABLE_NAME = 'profiles'
              AND COLUMN_NAME = protected_column
        ) THEN
            EXECUTE format(
                'REVOKE UPDATE (%I) ON public.profiles FROM anon, authenticated, PUBLIC',
                protected_column
            );
        END IF;
    END LOOP;
END $$;

GRANT SELECT ON public.profiles TO authenticated;
GRANT UPDATE (
    full_name,
    avatar_url,
    has_accepted_terms,
    last_active_at,
    updated_at
) ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.admin_list_user_sessions(UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_revoke_user_session(UUID, UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_revoke_all_user_sessions(UUID) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.admin_list_user_sessions(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_revoke_user_session(UUID, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.admin_revoke_all_user_sessions(UUID) TO service_role;

-- 13. TABLE CONCESSIONS
CREATE TABLE IF NOT EXISTS public.concessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE public.concessions ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Users can read own concession" ON public.concessions;
    DROP POLICY IF EXISTS "Users can insert own concession" ON public.concessions;
    DROP POLICY IF EXISTS "Users can update own concession" ON public.concessions;
END $$;

CREATE POLICY "Users can read own concession"
    ON public.concessions
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own concession"
    ON public.concessions
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own concession"
    ON public.concessions
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

GRANT ALL ON public.concessions TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.concessions TO authenticated;

-- 12. ADMIN MANAGEMENT (Instruction pour l'utilisateur)
-- Pour promouvoir un utilisateur en administrateur, exécutez la commande suivante
-- dans l'éditeur SQL de Supabase en remplaçant 'email@example.com' :
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'email@example.com';

/*
Rollbackable RLS regression test for public.profiles.
Run manually in the Supabase SQL editor after applying this setup.

BEGIN;

INSERT INTO auth.users (
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data
)
VALUES (
    '00000000-0000-0000-0000-000000000101',
    'authenticated',
    'authenticated',
    'rls-profile-test@example.com',
    'not-used-for-rls-test',
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"RLS Profile Test"}'::jsonb
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (
    id,
    email,
    role,
    is_subscriber,
    full_name,
    avatar_url,
    has_accepted_terms,
    updated_at
)
VALUES (
    '00000000-0000-0000-0000-000000000101',
    'rls-profile-test@example.com',
    'user',
    FALSE,
    'RLS Profile Test',
    NULL,
    FALSE,
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    role = 'user',
    is_subscriber = FALSE,
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url,
    has_accepted_terms = EXCLUDED.has_accepted_terms,
    updated_at = NOW();

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000101', true);
SELECT set_config(
    'request.jwt.claims',
    '{"sub":"00000000-0000-0000-0000-000000000101","role":"authenticated"}',
    true
);

-- A normal authenticated user can read their own profile.
SELECT id, email, role
FROM public.profiles
WHERE id = '00000000-0000-0000-0000-000000000101';

-- A normal authenticated user can update allowed self-service fields.
UPDATE public.profiles
SET full_name = 'Allowed Self Service Update',
    updated_at = NOW()
WHERE id = '00000000-0000-0000-0000-000000000101';

-- A normal authenticated user cannot update the admin field.
DO $$
BEGIN
    UPDATE public.profiles
    SET role = 'admin'
    WHERE id = '00000000-0000-0000-0000-000000000101';

    RAISE EXCEPTION 'Expected role update to be blocked';
EXCEPTION
    WHEN insufficient_privilege THEN
        RAISE NOTICE 'Role update blocked as expected';
END $$;

-- Must return false.
SELECT has_column_privilege(
    'authenticated',
    'public.profiles',
    'role',
    'UPDATE'
) AS authenticated_can_update_role;

ROLLBACK;
*/
