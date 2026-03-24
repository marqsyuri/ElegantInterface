-- Script para criar staff user diretamente no banco
-- Substitua [ADMIN_USER_ID] pelo ID do usuário admin (geralmente 1)

-- Primeiro, verificar o ID do admin
SELECT id, username, email FROM users WHERE role = 'admin' LIMIT 1;

-- Criar staff user (ajuste o admin_id conforme necessário)
-- Este exemplo assume que o admin tem ID = 1
INSERT INTO users (
  username, 
  email, 
  password, 
  first_name, 
  last_name, 
  role, 
  parent_user_id, 
  is_active,
  language,
  currency,
  max_staff_count
) VALUES (
  'staff1',
  'staff1@test.com',
  '21232f297a57a5a743894a0e4a801fc3', -- MD5 hash de 'staff123'
  'Staff',
  'Test',
  'staff',
  1, -- ID do admin (ajuste conforme necessário)
  true,
  'pt-BR',
  'BRL',
  10
) ON CONFLICT (username) DO NOTHING
RETURNING id, username, email, role, parent_user_id;

-- Verificar se foi criado
SELECT id, username, email, role, parent_user_id FROM users WHERE username = 'staff1';

