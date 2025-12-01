-- Script para migrar a tabela users para autenticação local
-- Backup dos dados existentes e conversão da tabela

-- 1. Criar tabela temporária com novos campos
CREATE TABLE users_new (
    id SERIAL PRIMARY KEY,
    username VARCHAR UNIQUE NOT NULL,
    email VARCHAR UNIQUE NOT NULL,
    password VARCHAR NOT NULL, -- MD5 hash
    first_name VARCHAR,
    last_name VARCHAR,
    profile_image_url VARCHAR,
    hero_image_url VARCHAR,
    professional_registration VARCHAR,
    specialties TEXT,
    clinic_name VARCHAR,
    clinic_cnpj VARCHAR,
    clinic_address TEXT,
    clinic_phone VARCHAR,
    clinic_whatsapp VARCHAR,
    public_link VARCHAR UNIQUE,
    is_active BOOLEAN DEFAULT true,
    role VARCHAR DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Migrar dados existentes (se houver)
INSERT INTO users_new (
    username, email, password, first_name, last_name, 
    profile_image_url, hero_image_url, professional_registration,
    specialties, clinic_name, clinic_cnpj, clinic_address,
    clinic_phone, clinic_whatsapp, public_link, created_at, updated_at
)
SELECT 
    COALESCE(email, 'user' || ROW_NUMBER() OVER ()) as username,
    COALESCE(email, 'user' || ROW_NUMBER() OVER () || '@example.com') as email,
    '21232f297a57a5a743894a0e4a801fc3' as password, -- 'admin' em MD5
    first_name, last_name, profile_image_url, hero_image_url,
    professional_registration, specialties, clinic_name, clinic_cnpj,
    clinic_address, clinic_phone, clinic_whatsapp, public_link,
    created_at, updated_at
FROM users;

-- 3. Dropar tabela antiga e renomear nova
DROP TABLE users CASCADE;
ALTER TABLE users_new RENAME TO users;

-- 4. Criar usuário admin padrão se não existir
INSERT INTO users (username, email, password, first_name, last_name, clinic_name, public_link, is_active, role)
VALUES ('admin', 'admin@esteticapro.com', '21232f297a57a5a743894a0e4a801fc3', 'Admin', 'Sistema', 'Estética Pro', 'admin-link', true, 'admin')
ON CONFLICT (username) DO NOTHING;