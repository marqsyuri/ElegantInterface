# 🚀 Guia de Atualização e Deploy no Linux

## 📋 Processo Completo de Atualização

### **Pré-requisitos no Servidor Linux**

```bash
# Verificar Node.js (versão 18+)
node --version

# Verificar npm
npm --version

# Verificar PostgreSQL
psql --version

# Instalar PM2 (gerenciador de processos)
npm install -g pm2
```

---

## 🔄 **Processo de Atualização (Atualizar Sistema Existente)**

### **Passo 1: Fazer Backup do Sistema Atual**

```bash
# Conectar ao servidor Linux via SSH
ssh usuario@servidor-linux

# Navegar para o diretório do projeto
cd /root/versao/ElegantInterface-main

# Fazer backup do banco de dados
pg_dump -U postgres estetica_pro > backup_$(date +%Y%m%d_%H%M%S).sql

# Fazer backup dos arquivos (opcional, mas recomendado)
cp -r . ../ElegantInterface-main-backup-$(date +%Y%m%d)
```

### **Passo 2: Parar o Sistema Atual**

```bash
# Parar o PM2 (se estiver usando)
pm2 stop estetica-pro
# ou
pm2 stop all

# Verificar se parou
pm2 list
```

### **Passo 3: Atualizar os Arquivos**

**Opção A: Via Upload/SCP (do Windows para Linux)**

```powershell
# No Windows, usando WinSCP ou similar
# 1. Conectar ao servidor Linux
# 2. Navegar para /root/versao/ElegantInterface-main
# 3. Fazer upload dos arquivos atualizados (exceto node_modules, .env, dist)
```

**Opção B: Via Git (se usar controle de versão)**

```bash
# No servidor Linux
cd /root/versao/ElegantInterface-main
git pull origin main
# ou
git fetch origin
git checkout main
git pull
```

**Opção C: Via SCP (linha de comando)**

```powershell
# No Windows PowerShell
scp -r C:\Projetos\replitSaloon\ElegantInterface-main\* usuario@servidor:/root/versao/ElegantInterface-main/
```

### **Passo 4: Instalar/Atualizar Dependências**

```bash
# No servidor Linux
cd /root/versao/ElegantInterface-main

# Limpar cache e node_modules antigos (opcional, mas recomendado)
rm -rf node_modules package-lock.json

# Instalar dependências
npm install

# Verificar se instalou corretamente
npm list --depth=0
```

### **Passo 5: Atualizar Banco de Dados (se houver mudanças no schema)**

```bash
# Sincronizar schema com o banco
npm run db:push

# OU executar migrations específicas (se houver)
# psql -U postgres -d estetica_pro -f migrate-add-datahr-to-clients.sql
```

### **Passo 6: Build do Sistema**

```bash
# Fazer build para produção
npm run build

# Verificar se o build foi criado
ls -la dist/
ls -la client/dist/
```

### **Passo 7: Verificar Configurações (.env)**

```bash
# Verificar se o .env está configurado corretamente
cat .env

# Deve conter:
# DATABASE_URL=postgresql://postgres:SENHA@localhost:5432/estetica_pro
# SESSION_SECRET=chave_secreta_segura
# NODE_ENV=production
# PORT=5000
```

### **Passo 8: Reiniciar o Sistema**

```bash
# Iniciar com PM2
pm2 start npm --name "estetica-pro" -- start

# OU se já tiver um arquivo de configuração PM2
pm2 restart estetica-pro

# Verificar status
pm2 status
pm2 logs estetica-pro --lines 50
```

### **Passo 9: Verificar se Está Funcionando**

```bash
# Verificar se a aplicação está respondendo
curl http://localhost:5000/api/health

# Verificar logs
pm2 logs estetica-pro --lines 100

# Verificar processos
pm2 list
```

---

## 🆕 **Processo de Deploy Inicial (Primeira Instalação)**

### **Passo 1: Preparar o Servidor**

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Configurar PostgreSQL
sudo -u postgres psql
# Dentro do psql:
CREATE DATABASE estetica_pro;
CREATE USER estetica_user WITH PASSWORD 'senha_segura';
GRANT ALL PRIVILEGES ON DATABASE estetica_pro TO estetica_user;
\q
```

### **Passo 2: Copiar Arquivos para o Servidor**

```bash
# Criar diretório
mkdir -p /root/versao/ElegantInterface-main
cd /root/versao/ElegantInterface-main

# Copiar arquivos (via SCP, Git, ou upload)
```

### **Passo 3: Configurar Ambiente**

```bash
# Criar arquivo .env
nano .env

# Adicionar:
DATABASE_URL=postgresql://estetica_user:senha_segura@localhost:5432/estetica_pro
SESSION_SECRET=gerar_chave_secreta_aleatoria_aqui
NODE_ENV=production
PORT=5000
```

### **Passo 4: Instalar e Build**

```bash
# Instalar dependências
npm install

# Importar banco de dados (se houver backup)
psql -U estetica_user -d estetica_pro -f backup_estetica_pro.sql

# Sincronizar schema
npm run db:push

# Build
npm run build
```

### **Passo 5: Configurar PM2**

```bash
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar aplicação
pm2 start npm --name "estetica-pro" -- start

# Configurar para iniciar automaticamente
pm2 startup
pm2 save
```

### **Passo 6: Configurar Nginx (Opcional - para domínio)**

```bash
# Instalar Nginx
sudo apt install -y nginx

# Criar configuração
sudo nano /etc/nginx/sites-available/estetica-pro

# Adicionar:
server {
    listen 80;
    server_name seu-dominio.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Ativar site
sudo ln -s /etc/nginx/sites-available/estetica-pro /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 📝 **Script de Deploy Automatizado**

Crie um arquivo `deploy.sh` no servidor:

```bash
#!/bin/bash

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 Iniciando processo de atualização...${NC}"

# Diretório do projeto
PROJECT_DIR="/root/versao/ElegantInterface-main"
cd $PROJECT_DIR

# 1. Backup do banco
echo -e "${YELLOW}📦 Fazendo backup do banco de dados...${NC}"
pg_dump -U postgres estetica_pro > backup_$(date +%Y%m%d_%H%M%S).sql
echo -e "${GREEN}✅ Backup criado${NC}"

# 2. Parar aplicação
echo -e "${YELLOW}⏸️  Parando aplicação...${NC}"
pm2 stop estetica-pro || true
echo -e "${GREEN}✅ Aplicação parada${NC}"

# 3. Atualizar dependências
echo -e "${YELLOW}📥 Atualizando dependências...${NC}"
npm install
echo -e "${GREEN}✅ Dependências atualizadas${NC}"

# 4. Atualizar banco (se necessário)
echo -e "${YELLOW}🗄️  Sincronizando banco de dados...${NC}"
npm run db:push || echo -e "${YELLOW}⚠️  db:push falhou, continuando...${NC}"

# 5. Build
echo -e "${YELLOW}🔨 Fazendo build...${NC}"
npm run build
echo -e "${GREEN}✅ Build concluído${NC}"

# 6. Reiniciar aplicação
echo -e "${YELLOW}▶️  Reiniciando aplicação...${NC}"
pm2 restart estetica-pro || pm2 start npm --name "estetica-pro" -- start
echo -e "${GREEN}✅ Aplicação reiniciada${NC}"

# 7. Verificar status
echo -e "${YELLOW}📊 Verificando status...${NC}"
sleep 3
pm2 status
pm2 logs estetica-pro --lines 20

echo -e "${GREEN}🎉 Deploy concluído com sucesso!${NC}"
```

**Tornar executável:**
```bash
chmod +x deploy.sh
```

**Executar:**
```bash
./deploy.sh
```

---

## 🔍 **Comandos Úteis para Gerenciamento**

### **PM2 - Gerenciamento de Processos**

```bash
# Ver status
pm2 status

# Ver logs
pm2 logs estetica-pro

# Ver logs em tempo real
pm2 logs estetica-pro --lines 100

# Reiniciar
pm2 restart estetica-pro

# Parar
pm2 stop estetica-pro

# Deletar
pm2 delete estetica-pro

# Monitorar recursos
pm2 monit

# Salvar configuração atual
pm2 save
```

### **Banco de Dados**

```bash
# Conectar ao banco
psql -U postgres -d estetica_pro

# Fazer backup
pg_dump -U postgres estetica_pro > backup.sql

# Restaurar backup
psql -U postgres -d estetica_pro < backup.sql

# Verificar conexão
psql -U postgres -d estetica_pro -c "SELECT version();"
```

### **Sistema**

```bash
# Verificar porta em uso
netstat -tulpn | grep :5000
# ou
lsof -i :5000

# Verificar processos Node
ps aux | grep node

# Verificar espaço em disco
df -h

# Verificar memória
free -h

# Ver logs do sistema
journalctl -u nginx -f
```

---

## ⚠️ **Checklist de Atualização**

Antes de fazer deploy, verifique:

- [ ] Backup do banco de dados feito
- [ ] Backup dos arquivos feito (opcional)
- [ ] `.env` configurado corretamente
- [ ] Dependências atualizadas (`npm install`)
- [ ] Schema do banco sincronizado (`npm run db:push`)
- [ ] Build feito com sucesso (`npm run build`)
- [ ] Aplicação testada localmente (se possível)
- [ ] Logs verificados após deploy
- [ ] Sistema acessível e funcionando

---

## 🐛 **Solução de Problemas**

### **Erro: Porta já em uso**

```bash
# Encontrar processo usando a porta
lsof -i :5000

# Matar processo
kill -9 <PID>

# Ou mudar porta no .env
PORT=5001
```

### **Erro: Dependências não instaladas**

```bash
# Limpar e reinstalar
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### **Erro: Build falhou**

```bash
# Verificar erros de TypeScript
npm run check

# Limpar dist e rebuild
rm -rf dist client/dist
npm run build
```

### **Erro: Banco de dados não conecta**

```bash
# Verificar se PostgreSQL está rodando
sudo systemctl status postgresql

# Verificar conexão
psql -U postgres -d estetica_pro

# Verificar .env
cat .env | grep DATABASE_URL
```

### **Aplicação não inicia**

```bash
# Ver logs detalhados
pm2 logs estetica-pro --lines 100

# Verificar se build existe
ls -la dist/

# Testar manualmente
NODE_ENV=production node dist/index.js
```

---

## 📞 **Suporte**

Se encontrar problemas:

1. Verifique os logs: `pm2 logs estetica-pro`
2. Verifique o status: `pm2 status`
3. Verifique o banco: `psql -U postgres -d estetica_pro`
4. Verifique o .env: `cat .env`
5. Verifique o build: `ls -la dist/`

---

**Última atualização:** Dezembro 2025

