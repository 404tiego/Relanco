-- ============================================================
-- RELANCO — INITIALISATION COMPLÈTE SUPABASE
-- ============================================================
-- Exécutez ce script DANS L'ORDRE dans l'éditeur SQL de Supabase :
-- 1. Ouvrez l'onglet "SQL Editor" dans Supabase
-- 2. Créez une "New query"
-- 3. Copiez-collez tout ce script
-- 4. Cliquez sur "Run"
-- ============================================================

-- ----------------------------------------------------------
-- PARTIE 1 : TABLE PROFILES (si elle n'existe pas encore)
-- ----------------------------------------------------------
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

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER STABLE
SET search_path = pg_catalog, public, auth
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
$$;

DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile"
    ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own non-admin profile" ON public.profiles;
CREATE POLICY "Users can insert own non-admin profile"
    ON public.profiles FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = id AND role = 'user' AND is_subscriber = FALSE);

DROP POLICY IF EXISTS "Users can update own self-service profile fields" ON public.profiles;
CREATE POLICY "Users can update own self-service profile fields"
    ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

GRANT ALL ON public.profiles TO service_role;
GRANT SELECT ON public.profiles TO authenticated;
GRANT UPDATE (full_name, avatar_url, has_accepted_terms, last_active_at, updated_at) ON public.profiles TO authenticated;

-- ----------------------------------------------------------
-- PARTIE 2 : TABLES RELANCO
-- ----------------------------------------------------------

-- TABLE LEADS
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    vehicle TEXT,
    source TEXT,
    status TEXT DEFAULT 'En attente',
    priority TEXT DEFAULT 'Moyenne',
    type_demande TEXT DEFAULT 'acheteur',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own leads" ON public.leads;
CREATE POLICY "Users can read own leads" ON public.leads FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own leads" ON public.leads;
CREATE POLICY "Users can insert own leads" ON public.leads FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own leads" ON public.leads;
CREATE POLICY "Users can update own leads" ON public.leads FOR UPDATE TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own leads" ON public.leads;
CREATE POLICY "Users can delete own leads" ON public.leads FOR DELETE TO authenticated USING (auth.uid() = user_id);

GRANT ALL ON public.leads TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;

-- TABLE CLIENTS
CREATE TABLE IF NOT EXISTS public.clients (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    phone TEXT,
    vehicle TEXT,
    purchase_date TEXT,
    client_type TEXT DEFAULT 'Acheteur',
    last_visit TEXT,
    next_ct TEXT,
    next_service TEXT,
    status TEXT DEFAULT 'Actif',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own clients" ON public.clients;
CREATE POLICY "Users can read own clients" ON public.clients FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own clients" ON public.clients;
CREATE POLICY "Users can insert own clients" ON public.clients FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own clients" ON public.clients;
CREATE POLICY "Users can update own clients" ON public.clients FOR UPDATE TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own clients" ON public.clients;
CREATE POLICY "Users can delete own clients" ON public.clients FOR DELETE TO authenticated USING (auth.uid() = user_id);

GRANT ALL ON public.clients TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.clients TO authenticated;

-- TABLE RELANCES
CREATE TABLE IF NOT EXISTS public.relances (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    client TEXT NOT NULL,
    vehicle TEXT,
    type TEXT NOT NULL,
    due_date TEXT,
    days_left TEXT,
    status TEXT DEFAULT 'En attente',
    channel TEXT DEFAULT 'SMS',
    sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE public.relances ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own relances" ON public.relances;
CREATE POLICY "Users can read own relances" ON public.relances FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own relances" ON public.relances;
CREATE POLICY "Users can insert own relances" ON public.relances FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own relances" ON public.relances;
CREATE POLICY "Users can update own relances" ON public.relances FOR UPDATE TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own relances" ON public.relances;
CREATE POLICY "Users can delete own relances" ON public.relances FOR DELETE TO authenticated USING (auth.uid() = user_id);

GRANT ALL ON public.relances TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.relances TO authenticated;

-- TABLE REPORTS
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    month TEXT NOT NULL,
    leads_total TEXT,
    leads_qualified TEXT,
    relances_sent TEXT,
    relances_returned TEXT,
    revenue TEXT,
    status TEXT DEFAULT 'Généré',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own reports" ON public.reports;
CREATE POLICY "Users can read own reports" ON public.reports FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own reports" ON public.reports;
CREATE POLICY "Users can insert own reports" ON public.reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own reports" ON public.reports;
CREATE POLICY "Users can update own reports" ON public.reports FOR UPDATE TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own reports" ON public.reports;
CREATE POLICY "Users can delete own reports" ON public.reports FOR DELETE TO authenticated USING (auth.uid() = user_id);

GRANT ALL ON public.reports TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reports TO authenticated;

-- TABLE CONCESSIONS
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

DROP POLICY IF EXISTS "Users can read own concession" ON public.concessions;
CREATE POLICY "Users can read own concession" ON public.concessions FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can insert own concession" ON public.concessions;
CREATE POLICY "Users can insert own concession" ON public.concessions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can update own concession" ON public.concessions;
CREATE POLICY "Users can update own concession" ON public.concessions FOR UPDATE TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Users can delete own concession" ON public.concessions;
CREATE POLICY "Users can delete own concession" ON public.concessions FOR DELETE TO authenticated USING (auth.uid() = user_id);

GRANT ALL ON public.concessions TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.concessions TO authenticated;

-- ----------------------------------------------------------
-- PARTIE 3 : COMPTE DÉMO ET DONNÉES
-- ----------------------------------------------------------

-- 1. Créer l'utilisateur démo dans auth.users
INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    role
)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'demo@relanco.fr',
    crypt('demo2025', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Julien","role":"admin"}',
    FALSE,
    'authenticated'
)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    encrypted_password = EXCLUDED.encrypted_password,
    email_confirmed_at = EXCLUDED.email_confirmed_at,
    raw_user_meta_data = EXCLUDED.raw_user_meta_data,
    updated_at = NOW();

-- 2. Créer le profil
INSERT INTO public.profiles (
    id, email, full_name, role, is_subscriber, has_accepted_terms,
    last_active_at, updated_at, created_at
)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'demo@relanco.fr',
    'Julien',
    'admin',
    TRUE,
    TRUE,
    NOW(),
    NOW(),
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    is_subscriber = EXCLUDED.is_subscriber,
    has_accepted_terms = EXCLUDED.has_accepted_terms,
    last_active_at = NOW(),
    updated_at = NOW();

-- 3. Créer la concession
DELETE FROM public.concessions WHERE user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
INSERT INTO public.concessions (user_id, name, address, phone, created_at, updated_at)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Garage Moreau Automobiles',
    '14 rue de la Paix, 69006 Lyon',
    '04 78 12 34 56',
    NOW(),
    NOW()
)
ON CONFLICT (user_id) DO UPDATE SET
    name = EXCLUDED.name,
    address = EXCLUDED.address,
    phone = EXCLUDED.phone,
    updated_at = NOW();

-- 4. Supprimer les anciens clients
DELETE FROM public.clients WHERE user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

-- 5. Insérer les 5 clients démo
INSERT INTO public.clients (
    user_id, name, first_name, last_name, email, phone,
    vehicle, purchase_date, client_type, status,
    last_visit, next_ct, next_service, created_at, updated_at
)
VALUES
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Marc Dubois', 'Marc', 'Dubois', 'marc.dubois@gmail.com', '0612345678', 'Renault Clio 4 2019', '2023-03-15', 'Acheteur', 'Actif', '2024-01-10', '2025-03-15', '2024-06-15', NOW(), NOW()),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Sophie Laurent', 'Sophie', 'Laurent', 'sophie.laurent@orange.fr', '0623456789', 'Peugeot 3008 GT 2021', '2023-06-20', 'Acheteur', 'Actif', '2024-02-05', '2025-06-20', '2024-08-20', NOW(), NOW()),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Jean-Pierre Martin', 'Jean-Pierre', 'Martin', 'jp.martin@free.fr', '0634567890', 'BMW X3 xDrive 2020', '2023-09-10', 'Acheteur', 'Actif', '2023-12-20', '2025-09-10', '2024-03-10', NOW(), NOW()),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Claire Bernard', 'Claire', 'Bernard', 'claire.bernard@sfr.fr', '0645678901', 'Audi A4 Avant 2022', '2024-01-05', 'Acheteur', 'Actif', '2024-03-15', '2026-01-05', '2024-07-05', NOW(), NOW()),
    ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Thomas Petit', 'Thomas', 'Petit', 'thomas.petit@gmail.com', '0656789012', 'Mercedes Classe A 2023', '2024-02-28', 'Acheteur', 'Actif', '2024-04-01', '2026-02-28', '2024-08-28', NOW(), NOW());

-- ----------------------------------------------------------
-- VÉRIFICATION
-- ----------------------------------------------------------
SELECT 'Table leads' AS info, COUNT(*) AS rows FROM public.leads;
SELECT 'Table clients' AS info, COUNT(*) AS rows FROM public.clients;
SELECT 'Table relances' AS info, COUNT(*) AS rows FROM public.relances;
SELECT 'Table reports' AS info, COUNT(*) AS rows FROM public.reports;
SELECT 'Table concessions' AS info, COUNT(*) AS rows FROM public.concessions;
SELECT 'Utilisateur démo' AS info, email, role FROM public.profiles WHERE email = 'demo@relanco.fr';
SELECT 'Clients démo' AS info, COUNT(*) AS total FROM public.clients WHERE user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
