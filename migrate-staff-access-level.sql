-- Migração: Adicionar campo accessLevel na tabela staff
-- Data: 2025-01-02
-- Descrição: Adiciona classificação de acesso para staff (admin ou staff)

-- 1. Adicionar coluna access_level (default 'staff' para manter compatibilidade)
ALTER TABLE staff 
ADD COLUMN IF NOT EXISTS access_level VARCHAR DEFAULT 'staff';

-- 2. Atualizar registros existentes para ter access_level 'staff' (se NULL)
UPDATE staff 
SET access_level = 'staff' 
WHERE access_level IS NULL;

-- 3. Criar índice para access_level (se não existir)
CREATE INDEX IF NOT EXISTS idx_staff_access_level ON staff(access_level);

-- Verificar se a migração foi aplicada corretamente
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'staff' 
  AND column_name = 'access_level';

