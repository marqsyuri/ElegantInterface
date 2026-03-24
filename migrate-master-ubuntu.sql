-- ============================================================================
-- MIGRATION MASTER - UBUNTU DEPLOYMENT
-- Script completo para criar/atualizar todas as tabelas do sistema
-- Data: 2026-01-21
-- ============================================================================

-- Criar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. TABELA: sessions (obrigatória para autenticação)
-- ============================================================================
CREATE TABLE IF NOT EXISTS sessions (
  sid VARCHAR PRIMARY KEY,
  sess JSONB NOT NULL,
  expire TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON sessions (expire);

-- ============================================================================
-- 2. TABELA: companies (empresas/salões)
-- ============================================================================
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

-- ============================================================================
-- 3. TABELA: users (usuários do sistema)
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR UNIQUE NOT NULL,
  email VARCHAR UNIQUE NOT NULL,
  password VARCHAR NOT NULL,
  role VARCHAR DEFAULT 'admin',
  first_name VARCHAR,
  last_name VARCHAR,
  profile_image_url VARCHAR,
  hero_image_url VARCHAR,
  login_banner_url VARCHAR,
  dashboard_banner_url VARCHAR,
  professional_registration VARCHAR,
  specialties TEXT,
  clinic_name VARCHAR,
  clinic_cnpj VARCHAR,
  clinic_address TEXT,
  clinic_phone VARCHAR,
  clinic_whatsapp VARCHAR,
  public_link VARCHAR UNIQUE,
  is_active BOOLEAN DEFAULT true,
  company_id INTEGER REFERENCES companies(id),
  parent_user_id INTEGER REFERENCES users(id),
  max_staff_count INTEGER DEFAULT 10,
  inactivity_days INTEGER DEFAULT 7,
  reminder_hours INTEGER DEFAULT 2,
  reminder_start_time VARCHAR DEFAULT '18:00',
  reminder_end_time VARCHAR DEFAULT '20:00',
  language VARCHAR DEFAULT 'pt-BR',
  currency VARCHAR DEFAULT 'BRL',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- 4. TABELA: categories (categorias de produtos/serviços)
-- ============================================================================
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  name VARCHAR NOT NULL,
  description TEXT,
  type VARCHAR NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- 5. TABELA: suppliers (fornecedores)
-- ============================================================================
CREATE TABLE IF NOT EXISTS suppliers (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  name VARCHAR NOT NULL,
  contact_name VARCHAR,
  email VARCHAR,
  phone VARCHAR,
  address TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- 6. TABELA: taxes (impostos)
-- ============================================================================
CREATE TABLE IF NOT EXISTS taxes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  name VARCHAR NOT NULL,
  rate DECIMAL(5, 2) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- 7. TABELA: business_hours (horário de funcionamento)
-- ============================================================================
CREATE TABLE IF NOT EXISTS business_hours (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  day_of_week VARCHAR NOT NULL,
  is_open BOOLEAN DEFAULT true,
  open_time VARCHAR,
  close_time VARCHAR,
  break_start_time VARCHAR,
  break_end_time VARCHAR,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- 8. TABELA: clients (clientes)
-- ============================================================================
CREATE TABLE IF NOT EXISTS clients (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  name VARCHAR NOT NULL,
  cpf VARCHAR,
  phone VARCHAR,
  email VARCHAR,
  password VARCHAR,
  birth_date DATE,
  profile_image TEXT,
  health_history TEXT,
  is_active BOOLEAN DEFAULT true,
  loyalty_points INTEGER DEFAULT 0,
  notify_sms BOOLEAN DEFAULT false,
  notify_whatsapp BOOLEAN DEFAULT false,
  notify_phone BOOLEAN DEFAULT false,
  last_login TIMESTAMP,
  datahr TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- 9. TABELA: inactive_clients (clientes inativos)
-- ============================================================================
CREATE TABLE IF NOT EXISTS inactive_clients (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  client_id INTEGER NOT NULL REFERENCES clients(id),
  client_name VARCHAR NOT NULL,
  client_email VARCHAR,
  client_phone VARCHAR,
  last_procedure VARCHAR,
  last_appointment_date TIMESTAMP,
  contact_preference VARCHAR,
  status INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- 10. TABELA: services (serviços)
-- ============================================================================
CREATE TABLE IF NOT EXISTS services (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  name VARCHAR NOT NULL,
  description TEXT,
  duration INTEGER,
  price DECIMAL(10, 2),
  category VARCHAR NOT NULL DEFAULT 'General',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- 11. TABELA: procedures (procedimentos)
-- ============================================================================
CREATE TABLE IF NOT EXISTS procedures (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  name VARCHAR NOT NULL,
  description TEXT,
  category VARCHAR NOT NULL,
  duration INTEGER,
  price DECIMAL(10, 2) DEFAULT 0,
  materials JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- 12. TABELA: procedure_taxes (impostos de procedimentos)
-- ============================================================================
CREATE TABLE IF NOT EXISTS procedure_taxes (
  id SERIAL PRIMARY KEY,
  procedure_id INTEGER NOT NULL REFERENCES procedures(id) ON DELETE CASCADE,
  tax_id INTEGER NOT NULL REFERENCES taxes(id)
);

-- ============================================================================
-- 13. TABELA: staff (funcionários)
-- ============================================================================
CREATE TABLE IF NOT EXISTS staff (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  company_id INTEGER REFERENCES companies(id),
  username VARCHAR UNIQUE,
  password VARCHAR,
  name VARCHAR NOT NULL,
  email VARCHAR,
  phone VARCHAR,
  ird_number VARCHAR,
  role VARCHAR NOT NULL,
  access_level VARCHAR DEFAULT 'staff',
  specialties JSONB DEFAULT '[]',
  commission_rate DECIMAL(5, 2) DEFAULT 0,
  hourly_payment BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  start_date DATE DEFAULT NOW(),
  profile_image TEXT,
  bio TEXT,
  experience VARCHAR,
  rating DECIMAL(3, 1) DEFAULT 5.0,
  total_reviews INTEGER DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- 14. TABELA: staff_schedules (horários dos funcionários)
-- ============================================================================
CREATE TABLE IF NOT EXISTS staff_schedules (
  id SERIAL PRIMARY KEY,
  staff_id INTEGER NOT NULL REFERENCES staff(id),
  day_of_week VARCHAR NOT NULL,
  start_time VARCHAR NOT NULL,
  end_time VARCHAR NOT NULL,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- 15. TABELA: staff_procedures (procedimentos que cada staff pode realizar)
-- ============================================================================
CREATE TABLE IF NOT EXISTS staff_procedures (
  id SERIAL PRIMARY KEY,
  staff_id INTEGER NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  procedure_id INTEGER NOT NULL REFERENCES procedures(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- 16. TABELA: appointments (agendamentos)
-- ============================================================================
CREATE TABLE IF NOT EXISTS appointments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  client_id INTEGER NOT NULL REFERENCES clients(id),
  service_id INTEGER,
  service_type VARCHAR NOT NULL DEFAULT 'service',
  selected_procedures JSONB DEFAULT '[]',
  appointment_date TIMESTAMP NOT NULL,
  duration INTEGER DEFAULT 60,
  status VARCHAR NOT NULL DEFAULT 'pending',
  notes TEXT,
  total_amount DECIMAL(10, 2) DEFAULT 0,
  paid_amount DECIMAL(10, 2) DEFAULT 0,
  payment_status VARCHAR DEFAULT 'pending',
  before_images JSONB DEFAULT '[]',
  after_images JSONB DEFAULT '[]',
  total_price DECIMAL(10, 2),
  total_duration INTEGER,
  procedure_count INTEGER DEFAULT 0,
  waitlist BOOLEAN DEFAULT false,
  staff_id INTEGER REFERENCES staff(id),
  professional_id INTEGER,
  selected_products JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- 17. TABELA: appointment_procedures (procedimentos do agendamento)
-- ============================================================================
CREATE TABLE IF NOT EXISTS appointment_procedures (
  id SERIAL PRIMARY KEY,
  appointment_id INTEGER NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  procedure_id INTEGER NOT NULL REFERENCES procedures(id),
  staff_id INTEGER REFERENCES staff(id),
  "order" INTEGER DEFAULT 0,
  procedure_name VARCHAR NOT NULL,
  procedure_category VARCHAR NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  duration INTEGER NOT NULL,
  materials JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- 18. TABELA: appointment_staff (staff do agendamento)
-- ============================================================================
CREATE TABLE IF NOT EXISTS appointment_staff (
  id SERIAL PRIMARY KEY,
  appointment_id INTEGER NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  staff_id INTEGER NOT NULL REFERENCES staff(id),
  is_primary BOOLEAN DEFAULT false,
  role VARCHAR,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- 19. TABELA: products (produtos)
-- ============================================================================
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  name VARCHAR NOT NULL,
  code VARCHAR NOT NULL,
  description TEXT,
  category_id INTEGER,
  supplier_id INTEGER,
  price DECIMAL(10, 2) NOT NULL,
  cost_price DECIMAL(10, 2),
  current_stock INTEGER DEFAULT 0,
  min_stock INTEGER DEFAULT 0,
  max_stock INTEGER DEFAULT 0,
  unit VARCHAR NOT NULL,
  location VARCHAR,
  barcode VARCHAR,
  weight DECIMAL(10, 2),
  dimensions JSONB,
  tags JSONB,
  images JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- 20. TABELA: appointment_products (produtos do agendamento)
-- ============================================================================
CREATE TABLE IF NOT EXISTS appointment_products (
  id SERIAL PRIMARY KEY,
  appointment_id INTEGER NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- 21. TABELA: appointment_reminders (lembretes de agendamento)
-- ============================================================================
CREATE TABLE IF NOT EXISTS appointment_reminders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  appointment_id INTEGER NOT NULL REFERENCES appointments(id),
  client_id INTEGER NOT NULL REFERENCES clients(id),
  client_name VARCHAR NOT NULL,
  client_email VARCHAR,
  client_phone VARCHAR,
  appointment_date TIMESTAMP NOT NULL,
  appointment_time VARCHAR NOT NULL,
  procedure_name VARCHAR,
  contact_preference VARCHAR,
  status INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- 22. TABELA: clinical_records (prontuários clínicos)
-- ============================================================================
CREATE TABLE IF NOT EXISTS clinical_records (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  client_id INTEGER NOT NULL REFERENCES clients(id),
  appointment_id INTEGER REFERENCES appointments(id),
  procedure_id INTEGER REFERENCES procedures(id),
  procedure_date DATE NOT NULL,
  procedure VARCHAR NOT NULL,
  observations TEXT,
  client_name VARCHAR,
  client_phone VARCHAR,
  client_email VARCHAR,
  service_requested VARCHAR,
  preferred_date VARCHAR,
  preferred_time VARCHAR,
  notes TEXT,
  result_rating INTEGER,
  before_images JSONB,
  after_images JSONB,
  next_appointment DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- 23. TABELA: transactions (transações financeiras)
-- ============================================================================
CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  client_id INTEGER REFERENCES clients(id),
  appointment_id INTEGER REFERENCES appointments(id),
  type VARCHAR NOT NULL,
  description VARCHAR NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  transaction_date DATE NOT NULL,
  category VARCHAR,
  is_paid BOOLEAN DEFAULT false,
  due_date DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- 24. TABELA: campaigns (campanhas de marketing)
-- ============================================================================
CREATE TABLE IF NOT EXISTS campaigns (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  name VARCHAR NOT NULL,
  objective TEXT,
  channel VARCHAR NOT NULL,
  message_content TEXT NOT NULL,
  status VARCHAR DEFAULT 'draft',
  total_recipients INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  scheduled_for TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- 25. TABELA: messages (mensagens)
-- ============================================================================
CREATE TABLE IF NOT EXISTS messages (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  client_id INTEGER REFERENCES clients(id),
  campaign_id INTEGER REFERENCES campaigns(id),
  type VARCHAR NOT NULL,
  channel VARCHAR NOT NULL,
  content TEXT NOT NULL,
  is_scheduled BOOLEAN DEFAULT false,
  scheduled_for TIMESTAMP,
  sent_at TIMESTAMP,
  status VARCHAR DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- 26. TABELA: feedback (avaliações de clientes)
-- ============================================================================
CREATE TABLE IF NOT EXISTS feedback (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  client_id INTEGER NOT NULL REFERENCES clients(id),
  appointment_id INTEGER REFERENCES appointments(id),
  rating INTEGER NOT NULL,
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- 27. TABELA: inventory (estoque/materiais)
-- ============================================================================
CREATE TABLE IF NOT EXISTS inventory (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  item_name VARCHAR NOT NULL,
  category VARCHAR NOT NULL,
  current_stock INTEGER DEFAULT 0,
  min_stock INTEGER DEFAULT 0,
  unit VARCHAR NOT NULL,
  last_restocked DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- 28. TABELA: loyalty_packages (pacotes de fidelidade)
-- ============================================================================
CREATE TABLE IF NOT EXISTS loyalty_packages (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  name VARCHAR NOT NULL,
  description TEXT,
  services JSONB,
  original_price DECIMAL(10, 2),
  discounted_price DECIMAL(10, 2),
  discount_percentage INTEGER,
  validity_days INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- 29. TABELA: client_packages (pacotes comprados por clientes)
-- ============================================================================
CREATE TABLE IF NOT EXISTS client_packages (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  client_id INTEGER NOT NULL REFERENCES clients(id),
  package_id INTEGER NOT NULL REFERENCES loyalty_packages(id),
  purchase_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  sessions_used INTEGER DEFAULT 0,
  total_sessions INTEGER NOT NULL,
  status VARCHAR DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- 30. TABELA: packages (novo sistema de pacotes)
-- ============================================================================
CREATE TABLE IF NOT EXISTS packages (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  client_id INTEGER NOT NULL REFERENCES clients(id),
  name VARCHAR NOT NULL,
  description TEXT,
  services JSONB DEFAULT '[]',
  products JSONB DEFAULT '[]',
  service_balance INTEGER DEFAULT 0,
  money_balance DECIMAL(10, 2) DEFAULT 0,
  total_price DECIMAL(10, 2) NOT NULL,
  validity_start_date DATE NOT NULL,
  validity_end_date DATE NOT NULL,
  status VARCHAR DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- 31. TABELA: loyalty_settings (configurações de fidelidade)
-- ============================================================================
CREATE TABLE IF NOT EXISTS loyalty_settings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) UNIQUE,
  points_per_dollar DECIMAL(10, 2) DEFAULT 1.00,
  discount_per_hundred_points DECIMAL(10, 2) DEFAULT 10.00,
  birthday_bonus_points INTEGER DEFAULT 50,
  referral_bonus_points INTEGER DEFAULT 30,
  bronze_threshold INTEGER DEFAULT 0,
  silver_threshold INTEGER DEFAULT 300,
  gold_threshold INTEGER DEFAULT 600,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- 32. TABELA: notifications (notificações)
-- ============================================================================
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  client_id INTEGER REFERENCES clients(id),
  appointment_id INTEGER REFERENCES appointments(id),
  type VARCHAR NOT NULL,
  title VARCHAR NOT NULL,
  message TEXT NOT NULL,
  channel VARCHAR NOT NULL DEFAULT 'in_app',
  status VARCHAR NOT NULL DEFAULT 'unread',
  metadata JSONB DEFAULT '{"clientName":"","appointmentDate":"1970-01-01T00:00:00.000Z","appointmentTime":null,"procedures":[],"staffName":null}',
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMP,
  scheduled_for TIMESTAMP,
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- 33. TABELA: marketing_campaigns (campanhas de marketing)
-- ============================================================================
CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  name VARCHAR NOT NULL,
  type VARCHAR NOT NULL,
  subject VARCHAR,
  content TEXT NOT NULL,
  target_audience VARCHAR NOT NULL,
  status VARCHAR DEFAULT 'draft',
  scheduled_for TIMESTAMP,
  sent_at TIMESTAMP,
  open_rate DECIMAL(5, 2) DEFAULT 0,
  click_rate DECIMAL(5, 2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- 34. TABELA: payments (pagamentos)
-- ============================================================================
CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  appointment_id INTEGER REFERENCES appointments(id),
  client_id INTEGER NOT NULL REFERENCES clients(id),
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR DEFAULT 'NZD',
  method VARCHAR NOT NULL,
  status VARCHAR DEFAULT 'pending',
  transaction_id VARCHAR,
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- 35. TABELA: social_media_posts (posts de redes sociais)
-- ============================================================================
CREATE TABLE IF NOT EXISTS social_media_posts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  platform VARCHAR NOT NULL,
  content TEXT NOT NULL,
  image_url VARCHAR,
  post_type VARCHAR NOT NULL,
  status VARCHAR DEFAULT 'draft',
  scheduled_for TIMESTAMP,
  published_at TIMESTAMP,
  engagement JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- 36. TABELA: banners (banners do sistema)
-- ============================================================================
CREATE TABLE IF NOT EXISTS banners (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  images JSONB NOT NULL,
  mode VARCHAR NOT NULL DEFAULT 'fixed',
  duration INTEGER DEFAULT 5,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- 37. TABELA: integrations (integrações)
-- ============================================================================
CREATE TABLE IF NOT EXISTS integrations (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  name VARCHAR NOT NULL,
  url TEXT NOT NULL,
  auth_type VARCHAR NOT NULL,
  auth_data TEXT,
  username VARCHAR,
  password VARCHAR,
  test_payload TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- 38. TABELA: sales (vendas)
-- ============================================================================
CREATE TABLE IF NOT EXISTS sales (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  client_id INTEGER REFERENCES clients(id),
  sale_date DATE NOT NULL,
  products JSONB NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  discount_percent DECIMAL(5, 2) DEFAULT 0,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,
  payment_method VARCHAR NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- ADICIONAR COLUNAS FALTANTES (se não existirem)
-- ============================================================================

-- Adicionar datahr em clients (se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'datahr'
  ) THEN
    ALTER TABLE clients ADD COLUMN datahr TIMESTAMP;
  END IF;
END $$;

-- Adicionar waitlist em appointments (se não existir)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'appointments' AND column_name = 'waitlist'
  ) THEN
    ALTER TABLE appointments ADD COLUMN waitlist BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Adicionar campos de login em staff (se não existirem)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'staff' AND column_name = 'username'
  ) THEN
    ALTER TABLE staff ADD COLUMN username VARCHAR UNIQUE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'staff' AND column_name = 'password'
  ) THEN
    ALTER TABLE staff ADD COLUMN password VARCHAR;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'staff' AND column_name = 'access_level'
  ) THEN
    ALTER TABLE staff ADD COLUMN access_level VARCHAR DEFAULT 'staff';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'staff' AND column_name = 'company_id'
  ) THEN
    ALTER TABLE staff ADD COLUMN company_id INTEGER REFERENCES companies(id);
  END IF;
END $$;

-- ============================================================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_client_id ON appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_staff_user_id ON staff(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_username ON staff(username);
CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);
CREATE INDEX IF NOT EXISTS idx_procedures_user_id ON procedures(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);

-- ============================================================================
-- FIM DA MIGRATION
-- ============================================================================

-- Mensagem de sucesso
DO $$ 
BEGIN
  RAISE NOTICE '✅ Migration master executada com sucesso!';
  RAISE NOTICE '📊 Todas as tabelas foram criadas/atualizadas.';
END $$;
