-- Script para criar a tabela banners
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

-- Índice para melhor performance nas consultas por user_id
CREATE INDEX IF NOT EXISTS idx_banners_user_id ON banners(user_id);
CREATE INDEX IF NOT EXISTS idx_banners_is_active ON banners(is_active);


