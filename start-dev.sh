#!/bin/bash

# Script Bash para inicialização do projeto Estética Pro
# Verifica dependências e inicia client + server em sequência

echo "🚀 Iniciando Estética Pro - Linux"
echo "================================="

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Função para verificar se um comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Função para verificar se PostgreSQL está rodando
check_postgresql() {
    if command_exists systemctl; then
        systemctl is-active --quiet postgresql
    elif command_exists service; then
        service postgresql status >/dev/null 2>&1
    else
        # Fallback: tentar conectar
        psql -U postgres -c "SELECT 1;" >/dev/null 2>&1
    fi
}

# Função para verificar se o banco existe
check_database() {
    export DATABASE_URL="postgresql://postgres:1234@localhost:5432/estetica_pro"
    psql -U postgres -d estetica_pro -c "SELECT 1;" >/dev/null 2>&1
}

# Verificações iniciais
echo -e "${YELLOW}🔍 Verificando dependências...${NC}"

# Verificar Node.js
if ! command_exists node; then
    echo -e "${RED}❌ Node.js não encontrado. Instale Node.js v18+ primeiro.${NC}"
    echo -e "${YELLOW}   Ubuntu/Debian: sudo apt install nodejs npm${NC}"
    echo -e "${YELLOW}   CentOS/RHEL: sudo yum install nodejs npm${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js encontrado: $(node --version)${NC}"

# Verificar npm
if ! command_exists npm; then
    echo -e "${RED}❌ npm não encontrado.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ npm encontrado: $(npm --version)${NC}"

# Verificar PostgreSQL
if ! command_exists psql; then
    echo -e "${RED}❌ PostgreSQL não encontrado. Instale PostgreSQL primeiro.${NC}"
    echo -e "${YELLOW}   Ubuntu/Debian: sudo apt install postgresql postgresql-contrib${NC}"
    echo -e "${YELLOW}   CentOS/RHEL: sudo yum install postgresql postgresql-server${NC}"
    exit 1
fi

# Verificar se PostgreSQL está rodando
if ! check_postgresql; then
    echo -e "${RED}❌ PostgreSQL não está rodando. Inicie o serviço PostgreSQL primeiro.${NC}"
    echo -e "${YELLOW}   Ubuntu/Debian: sudo systemctl start postgresql${NC}"
    echo -e "${YELLOW}   CentOS/RHEL: sudo systemctl start postgresql${NC}"
    exit 1
fi
echo -e "${GREEN}✅ PostgreSQL está rodando${NC}"

# Verificar arquivo .env
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}❌ Arquivo .env não encontrado. Criando...${NC}"
    cat > .env << EOF
DATABASE_URL=postgresql://postgres:1234@localhost:5432/estetica_pro
SESSION_SECRET=estetica_pro_session_secret_key_2024_very_long_and_secure_string
NODE_ENV=development
PORT=5000
EOF
    echo -e "${GREEN}✅ Arquivo .env criado${NC}"
fi

# Verificar se o banco existe
if ! check_database; then
    echo -e "${RED}❌ Banco 'estetica_pro' não encontrado ou não acessível.${NC}"
    echo -e "${YELLOW}   Verifique se:${NC}"
    echo -e "${YELLOW}   - PostgreSQL está rodando${NC}"
    echo -e "${YELLOW}   - Senha do usuário 'postgres' é '1234'${NC}"
    echo -e "${YELLOW}   - Banco 'estetica_pro' foi criado${NC}"
    echo ""
    echo -e "${CYAN}   Para criar o banco, execute:${NC}"
    echo -e "${CYAN}   sudo -u postgres psql -c 'CREATE DATABASE estetica_pro;'${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Banco 'estetica_pro' acessível${NC}"

# Verificar dependências npm
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Instalando dependências...${NC}"
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Erro ao instalar dependências${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ Dependências instaladas${NC}"
fi

# Verificar se as portas estão livres
if lsof -Pi :5000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Porta 5000 está em uso. Tentando liberar...${NC}"
    PID=$(lsof -Pi :5000 -sTCP:LISTEN -t)
    if [ ! -z "$PID" ]; then
        echo -e "${YELLOW}   Processo usando porta 5000: PID $PID${NC}"
    fi
fi

echo ""
echo -e "${GREEN}🎯 Iniciando aplicação...${NC}"
echo -e "${GREEN}=========================${NC}"

# Função para limpar processos ao sair
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Parando aplicação...${NC}"
    kill $CLIENT_PID $SERVER_PID 2>/dev/null
    exit 0
}

# Capturar Ctrl+C
trap cleanup SIGINT SIGTERM

# Iniciar client em background
echo -e "${CYAN}🌐 Iniciando frontend (Vite)...${NC}"
npm run start:client &
CLIENT_PID=$!

# Aguardar 5 segundos
echo -e "${YELLOW}⏳ Aguardando 5 segundos para o frontend inicializar...${NC}"
sleep 5

# Iniciar server em background
echo -e "${CYAN}🔧 Iniciando backend (Express)...${NC}"
npm run start:server &
SERVER_PID=$!

echo ""
echo -e "${GREEN}🎉 Aplicação iniciada com sucesso!${NC}"
echo -e "${GREEN}=================================${NC}"
echo -e "${CYAN}📱 Frontend: http://localhost:5173${NC}"
echo -e "${CYAN}🔧 Backend:  http://localhost:5000${NC}"
echo -e "${CYAN}🔑 Login:    admin / admin${NC}"
echo ""
echo -e "${YELLOW}💡 Para parar a aplicação, pressione Ctrl+C${NC}"

# Aguardar indefinidamente
wait




