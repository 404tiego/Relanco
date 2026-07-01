-- ============================================================
-- RELANCO — FIX SUPABASE (utilisateur existant)
-- ============================================================
-- L'utilisateur demo@relanco.fr existe déjà dans Supabase.
-- Ce script crée uniquement les tables manquantes et les données associées.
--
-- 1. Ouvrez l'onglet "SQL Editor" dans Supabase
-- 2. Créez une "New query"
-- 3. Copiez-collez ce script
-- 4. Cliquez sur "Run"
-- ============================================================

-- ----------------------------------------------------------
-- PARTIE 1 : TABLES MANQUANTES
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

-- ----------------------------------------------------------
-- PARTIE 2 : RÉCUPÉRER L'UUID DU COMPTE DÉMO EXISTANT
-- ----------------------------------------------------------
DO $$
DECLARE
    demo_id UUID;
BEGIN
    -- Récupérer l'ID de l'utilisateur démo
    SELECT id INTO demo_id FROM auth.users WHERE email = 'demo@relanco.fr';

    IF demo_id IS NULL THEN
        RAISE EXCEPTION 'Utilisateur demo@relanco.fr non trouvé dans auth.users';
    END IF;

    -- 2. Créer le profil
    INSERT INTO public.profiles (
        id, email, full_name, role, is_subscriber, has_accepted_terms,
        last_active_at, updated_at, created_at
    )
    VALUES (
        demo_id,
        'demo@relanco.fr',
        'Julien',
        'admin',
        TRUE,
        TRUE,
        NOW(),
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO NOTHING;

    -- 3. Créer la concession
    INSERT INTO public.concessions (user_id, name, address, phone, created_at, updated_at)
    VALUES (
        demo_id,
        'Garage Moreau Automobiles',
        '14 rue de la Paix, 69006 Lyon',
        '04 78 12 34 56',
        NOW(),
        NOW()
    )
    ON CONFLICT (user_id) DO NOTHING;

    -- 4. Supprimer les anciens clients
    DELETE FROM public.clients WHERE user_id = demo_id;

    -- 5. Insérer les 5 clients démo
    INSERT INTO public.clients (
        user_id, name, first_name, last_name, email, phone,
        vehicle, purchase_date, client_type, status,
        last_visit, next_ct, next_service, created_at, updated_at
    )
    VALUES
        (demo_id, 'Marc Dubois', 'Marc', 'Dubois', 'marc.dubois@gmail.com', '0612345678', 'Renault Clio 4 2019', '2023-03-15', 'Acheteur', 'Actif', '2024-01-10', '2025-03-15', '2024-06-15', NOW(), NOW()),
        (demo_id, 'Sophie Laurent', 'Sophie', 'Laurent', 'sophie.laurent@orange.fr', '0623456789', 'Peugeot 3008 GT 2021', '2023-06-20', 'Acheteur', 'Actif', '2024-02-05', '2025-06-20', '2024-08-20', NOW(), NOW()),
        (demo_id, 'Jean-Pierre Martin', 'Jean-Pierre', 'Martin', 'jp.martin@free.fr', '0634567890', 'BMW X3 xDrive 2020', '2023-09-10', 'Acheteur', 'Actif', '2023-12-20', '2025-09-10', '2024-03-10', NOW(), NOW()),
        (demo_id, 'Claire Bernard', 'Claire', 'Bernard', 'claire.bernard@sfr.fr', '0645678901', 'Audi A4 Avant 2022', '2024-01-05', 'Acheteur', 'Actif', '2024-03-15', '2026-01-05', '2024-07-05', NOW(), NOW()),
        (demo_id, 'Thomas Petit', 'Thomas', 'Petit', 'thomas.petit@gmail.com', '0656789012', 'Mercedes Classe A 2023', '2024-02-28', 'Acheteur', 'Actif', '2024-04-01', '2026-02-28', '2024-08-28', NOW(), NOW());

    -- Afficher le résultat
    RAISE NOTICE 'Utilisateur démo trouvé : %', demo_id;
END $$;

-- ----------------------------------------------------------
-- VÉRIFICATION
-- ----------------------------------------------------------
SELECT 'Table profiles' AS info, COUNT(*) AS rows FROM public.profiles;
SELECT 'Table clients' AS info, COUNT(*) AS rows FROM public.clients;
SELECT 'Table concessions' AS info, COUNT(*) AS rows FROM public.concessions;
SELECT 'Table leads' AS info, COUNT(*) AS rows FROM public.leads;
SELECT 'Table relances' AS info, COUNT(*) AS rows FROM public.relances;
SELECT 'Table reports' AS info, COUNT(*) AS rows FROM public.reports;
SELECT 'Profil démo' AS info, id, email, role FROM public.profiles WHERE email = 'demo@relanco.fr';
SELECT 'Concession démo' AS info, name, address FROM public.concessions WHERE user_id = (SELECT id FROM auth.users WHERE email = 'demo@relanco.fr');
SELECT 'Clients démo' AS info, COUNT(*) AS total FROM public.clients WHERE user_id = (SELECT id FROM auth.users WHERE email = 'demo@relanco.fr');
