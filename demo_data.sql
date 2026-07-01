-- ============================================================
-- RELANCO — DONNÉES DE DÉMONSTRATION
-- ============================================================
-- Exécutez ce script dans l'éditeur SQL de Supabase (SQL Editor)
-- pour créer le compte de démo et les données d'exemple.

-- ----------------------------------------------------------
-- 1. CRÉER L'UTILISATEUR DE DÉMO (auth.users)
-- ----------------------------------------------------------
-- Le mot de passe est 'demo2025' (hashé avec bcrypt)
-- L'ID est fixe pour pouvoir référencer les données liées

INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    new_email,
    new_email_confirmed_at,
    invited_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change_token_current,
    reauthentication_token,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    last_sign_in_at,
    phone,
    phone_confirmed_at,
    phone_change,
    phone_change_token,
    confirmed_at,
    email_change_confirm_status,
    banned_until,
    is_sso_user,
    is_anonymous
)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', -- UUID fixe du compte démo
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'demo@relanco.fr',
    crypt('demo2025', gen_salt('bf')),      -- Mot de passe hashé
    NOW(),
    NULL,
    NULL,
    NULL,
    NULL,
    '',
    '',
    '',
    '',
    '',
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Julien","role":"admin"}',
    NOW(),
    NOW(),
    NOW(),
    NULL,
    NULL,
    '',
    '',
    NOW(),
    0,
    NULL,
    FALSE,
    FALSE
)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    encrypted_password = EXCLUDED.encrypted_password,
    raw_user_meta_data = EXCLUDED.raw_user_meta_data,
    updated_at = NOW();

-- ----------------------------------------------------------
-- 2. CRÉER/METTRE À JOUR LE PROFIL (public.profiles)
-- ----------------------------------------------------------
-- Le trigger handle_new_user crée automatiquement le profil,
-- mais on s'assure ici que tout est correct.

INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    is_subscriber,
    has_accepted_terms,
    last_active_at,
    updated_at,
    created_at
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

-- ----------------------------------------------------------
-- 3. CRÉER LA CONCESSION ASSOCIÉE
-- ----------------------------------------------------------
DELETE FROM public.concessions WHERE user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

INSERT INTO public.concessions (
    user_id,
    name,
    address,
    phone,
    created_at,
    updated_at
)
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

-- 4. SUPPRIMER LES ANCIENS CLIENTS DU COMPTE DÉMO (si existent)
-- ----------------------------------------------------------
DELETE FROM public.clients WHERE user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

-- ----------------------------------------------------------
-- 5. INSÉRER 5 CLIENTS D'EXEMPLE
-- ----------------------------------------------------------
INSERT INTO public.clients (
    user_id,
    name,
    first_name,
    last_name,
    email,
    phone,
    vehicle,
    purchase_date,
    client_type,
    status,
    last_visit,
    next_ct,
    next_service,
    created_at,
    updated_at
)
VALUES
    (
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        'Marc Dubois',
        'Marc',
        'Dubois',
        'marc.dubois@gmail.com',
        '0612345678',
        'Renault Clio 4 2019',
        '2023-03-15',
        'Acheteur',
        'Actif',
        '2024-01-10',
        '2025-03-15',
        '2024-06-15',
        NOW(),
        NOW()
    ),
    (
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        'Sophie Laurent',
        'Sophie',
        'Laurent',
        'sophie.laurent@orange.fr',
        '0623456789',
        'Peugeot 3008 GT 2021',
        '2023-06-20',
        'Acheteur',
        'Actif',
        '2024-02-05',
        '2025-06-20',
        '2024-08-20',
        NOW(),
        NOW()
    ),
    (
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        'Jean-Pierre Martin',
        'Jean-Pierre',
        'Martin',
        'jp.martin@free.fr',
        '0634567890',
        'BMW X3 xDrive 2020',
        '2023-09-10',
        'Acheteur',
        'Actif',
        '2023-12-20',
        '2025-09-10',
        '2024-03-10',
        NOW(),
        NOW()
    ),
    (
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        'Claire Bernard',
        'Claire',
        'Bernard',
        'claire.bernard@sfr.fr',
        '0645678901',
        'Audi A4 Avant 2022',
        '2024-01-05',
        'Acheteur',
        'Actif',
        '2024-03-15',
        '2026-01-05',
        '2024-07-05',
        NOW(),
        NOW()
    ),
    (
        'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        'Thomas Petit',
        'Thomas',
        'Petit',
        'thomas.petit@gmail.com',
        '0656789012',
        'Mercedes Classe A 2023',
        '2024-02-28',
        'Acheteur',
        'Actif',
        '2024-04-01',
        '2026-02-28',
        '2024-08-28',
        NOW(),
        NOW()
    );

-- ----------------------------------------------------------
-- VÉRIFICATION
-- ----------------------------------------------------------
SELECT 'Utilisateur créé' AS info, email, role FROM public.profiles WHERE email = 'demo@relanco.fr';
SELECT 'Clients créés' AS info, COUNT(*) AS total FROM public.clients WHERE user_id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
