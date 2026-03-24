#!/bin/bash

# Script de Deploy Automatizado - Estética Pro
# Uso: ./deploy.sh

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para imprimir mensagens
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Diretório do projeto (ajustar conforme necessário)
PROJECT_DIR="/root/versao/ElegantInterface-main"

# Verificar se o diretório existe
if [ ! -d "$PROJECT_DIR" ]; then
    print_error "Diretório do projeto não encontrado: $PROJECT_DIR"
    exit 1
fi

cd $PROJECT_DIR || exit 1

print_info "Diretório do projeto: $PROJECT_DIR"
print_info "Iniciando processo de atualização..."

# 1. Backup do banco de dados
print_info "📦 Fazendo backup do banco de dados..."
BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).sql"
if pg_dump -U postgres estetica_pro > "$BACKUP_FILE" 2>/dev/null; then
    print_success "Backup criado: $BACKUP_FILE"
else
    print_warning "Não foi possível criar backup do banco (continuando...)"
fi

# 2. Parar aplicação
print_info "⏸️  Parando aplicação..."
if pm2 stop estetica-pro 2>/dev/null; then
    print_success "Aplicação parada"
else
    print_warning "Aplicação não estava rodando ou PM2 não está instalado"
fi

# 3. Limpar e atualizar dependências
print_info "🧹 Limpando cache e node_modules..."
rm -rf node_modules package-lock.json
npm cache clean --force

print_info "📥 Instalando dependências..."
if npm install; then
    print_success "Dependências instaladas"
else
    print_error "Falha ao instalar dependências"
    exit 1
fi

# 4. Atualizar banco de dados (se necessário)
print_info "🗄️  Sincronizando banco de dados..."
if npm run db:push 2>/dev/null; then
    print_success "Banco de dados sincronizado"
else
    print_warning "db:push falhou ou não há mudanças no schema (continuando...)"
fi

# 5. Build
print_info "🔨 Fazendo build do sistema..."
if npm run build; then
    print_success "Build concluído"
else
    print_error "Falha no build"
    exit 1
fi

# 6. Verificar se .env existe
if [ ! -f ".env" ]; then
    print_warning "Arquivo .env não encontrado!"
    print_info "Criando .env a partir do exemplo (se existir)..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        print_warning "Arquivo .env criado. CONFIGURE AS VARIÁVEIS ANTES DE CONTINUAR!"
        exit 1
    else
        print_error "Arquivo .env não existe e não há .env.example"
        exit 1
    fi
fi

# 7. Reiniciar aplicação
print_info "▶️  Reiniciando aplicação..."
if pm2 restart estetica-pro 2>/dev/null; then
    print_success "Aplicação reiniciada"
elif pm2 start npm --name "estetica-pro" -- start 2>/dev/null; then
    print_success "Aplicação iniciada"
else
    print_error "Falha ao iniciar aplicação com PM2"
    print_info "Tentando iniciar manualmente..."
    if npm start &; then
        print_warning "Aplicação iniciada manualmente (sem PM2)"
    else
        print_error "Falha ao iniciar aplicação"
        exit 1
    fi
fi

# 8. Aguardar alguns segundos
print_info "⏳ Aguardando inicialização..."
sleep 5

# 9. Verificar status
print_info "📊 Verificando status da aplicação..."
if command -v pm2 &> /dev/null; then
    pm2 status
    print_info "📋 Últimas 20 linhas de log:"
    pm2 logs estetica-pro --lines 20 --nostream
fi

# 10. Testar se está respondendo
print_info "🔍 Testando se a aplicação está respondendo..."
if curl -f http://localhost:5000/api/health > /dev/null 2>&1; then
    print_success "Aplicação está respondendo!"
elif curl -f http://localhost:5000 > /dev/null 2>&1; then
    print_success "Aplicação está respondendo!"
else
    print_warning "Aplicação pode não estar respondendo ainda (verifique os logs)"
fi

print_success "🎉 Deploy concluído!"
print_info "Verifique os logs com: pm2 logs estetica-pro"

