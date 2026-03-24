-- Migração: Adicionar campos de login na tabela staff
-- Data: 2025-01-02
-- Descrição: Adiciona username, password e companyId na tabela staff para permitir login de funcionários

-- 0. Criar tabela companies se não existir
CREATE TABLE IF NOT EXISTS companies (
  id SERIAL PRIMARY KEY,
  name VARCHAR NOT NULL,
  cnpj VARCHAR,
  address TEXT,
  phone VARCHAR,
  email VARCHAR,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 0.1. Adicionar company_id na tabela users se não existir
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id);

-- 0.2. Criar índice para company_id em users (se não existir)
CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id) WHERE company_id IS NOT NULL;

-- 1. Adicionar coluna username (nullable para staff antigos sem login)
ALTER TABLE staff 
ADD COLUMN IF NOT EXISTS username VARCHAR UNIQUE;

-- 2. Adicionar coluna password (nullable para staff antigos sem login)
ALTER TABLE staff 
ADD COLUMN IF NOT EXISTS password VARCHAR;

-- 3. Adicionar coluna company_id (nullable, referência à tabela companies)
ALTER TABLE staff 
ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id);

-- 4. Criar índice para username (se não existir)
CREATE INDEX IF NOT EXISTS idx_staff_username ON staff(username) WHERE username IS NOT NULL;

-- 5. Criar índice para company_id (se não existir)
CREATE INDEX IF NOT EXISTS idx_staff_company_id ON staff(company_id) WHERE company_id IS NOT NULL;

-- 6. Atualizar company_id dos staff existentes baseado no userId (admin)
-- Isso associa cada staff ao companyId do admin que o criou
-- Nota: Se users.company_id ainda não estiver populado, esta query não fará nada
UPDATE staff s
SET company_id = CAST(u.company_id AS INTEGER)
FROM users u
WHERE CAST(s.user_id AS INTEGER) = u.id 
  AND u.company_id IS NOT NULL
  AND s.company_id IS NULL;

-- Verificar se a migração foi aplicada corretamente
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'staff' 
  AND column_name IN ('username', 'password', 'company_id')
ORDER BY column_name;

