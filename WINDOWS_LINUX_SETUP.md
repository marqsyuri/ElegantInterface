# 🖥️ Configuração Cross-Platform - Estética Pro

## 📋 Visão Geral

Este documento fornece instruções completas para configurar e executar o projeto Estética Pro tanto no **Windows** quanto no **Linux**, garantindo compatibilidade total entre as plataformas.

---

## 🎯 Pré-requisitos por Plataforma

### Windows

#### Software Necessário
- **Node.js v18+**: [Download oficial](https://nodejs.org/)
- **PostgreSQL 16**: [Download oficial](https://www.postgresql.org/download/windows/)
- **PowerShell 5.1+** (já incluído no Windows 10/11)
- **Git** (opcional): [Download oficial](https://git-scm.com/)

#### Verificação de Instalação
```powershell
# Verificar Node.js
node --version
npm --version

# Verificar PostgreSQL
psql --version

# Verificar PowerShell
$PSVersionTable.PSVersion
```

### Linux (Ubuntu/Debian)

#### Software Necessário
```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js v18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar PostgreSQL
sudo apt install postgresql postgresql-contrib

# Instalar dependências adicionais
sudo apt install build-essential
```

#### Linux (CentOS/RHEL/Fedora)
```bash
# Instalar Node.js
sudo dnf install nodejs npm

# Instalar PostgreSQL
sudo dnf install postgresql postgresql-server postgresql-contrib

# Inicializar PostgreSQL
sudo postgresql-setup --initdb
```

#### Verificação de Instalação
```bash
# Verificar Node.js
node --version
npm --version

# Verificar PostgreSQL
psql --version
```

---

## 🗄️ Configuração do PostgreSQL

### Windows

#### 1. Instalação
1. Baixe o PostgreSQL do site oficial
2. Durante a instalação, **defina a senha do usuário 'postgres' como '1234'**
3. Mantenha a porta padrão **5432**
4. Complete a instalação

#### 2. Configuração do Serviço
```powershell
# Iniciar serviço PostgreSQL
net start postgresql-x64-16

# Verificar status
sc query postgresql-x64-16

# Parar serviço (se necessário)
net stop postgresql-x64-16
```

#### 3. Criar Banco de Dados
```powershell
# Conectar como postgres
psql -U postgres

# Criar banco de dados
CREATE DATABASE estetica_pro;

# Sair
\q
```

### Linux

#### 1. Inicialização do PostgreSQL
```bash
# Iniciar serviço
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verificar status
sudo systemctl status postgresql
```

#### 2. Configuração do Usuário
```bash
# Alterar senha do usuário postgres
sudo -u postgres psql
ALTER USER postgres PASSWORD '1234';
\q
```

#### 3. Criar Banco de Dados
```bash
# Criar banco
sudo -u postgres createdb estetica_pro

# Verificar se foi criado
sudo -u postgres psql -l
```

---

## 📁 Configuração do Projeto

### 1. Estrutura de Arquivos

```
ElegantInterface-main/
├── .env                    # Variáveis de ambiente
├── package.json           # Dependências e scripts
├── start-dev.ps1          # Script Windows
├── start-dev.sh           # Script Linux
├── setup-database.js      # Setup automatizado
├── client/                # Frontend React
├── server/                # Backend Express
└── shared/                # Código compartilhado
```

### 2. Arquivo .env

Criar arquivo `.env` na raiz do projeto:

```env
# Configuração do Banco de Dados
DATABASE_URL=postgresql://postgres:1234@localhost:5432/estetica_pro

# Configurações de Sessão
SESSION_SECRET=estetica_pro_session_secret_key_2024_very_long_and_secure_string

# Ambiente de Execução
NODE_ENV=development

# Porta do Servidor
PORT=5000

# Configurações Adicionais
MAX_FILE_SIZE=50mb
TZ=America/Sao_Paulo
```

### 3. Instalação de Dependências

```bash
# Instalar dependências
npm install

# Verificar instalação
npm list --depth=0
```

---

## 🚀 Execução do Projeto

### Windows

#### Opção 1: Script Automatizado (Recomendado)
```powershell
# Executar script PowerShell
.\start-dev.ps1
```

#### Opção 2: Manual
```powershell
# Terminal 1 - Frontend
npm run start:client

# Terminal 2 - Backend (aguardar 5 segundos)
npm run start:server
```

#### Opção 3: Usando npm scripts
```powershell
# Iniciar tudo de uma vez
npm run start:all
```

### Linux

#### Opção 1: Script Automatizado (Recomendado)
```bash
# Tornar executável
chmod +x start-dev.sh

# Executar
./start-dev.sh
```

#### Opção 2: Manual
```bash
# Iniciar em background
npm run start:client &
npm run start:server
```

#### Opção 3: Usando npm scripts
```bash
# Iniciar tudo de uma vez
npm run start:all:linux
```

---

## 🔧 Scripts Disponíveis

### Scripts NPM

```bash
# Desenvolvimento
npm run dev              # Backend apenas
npm run start:client     # Frontend apenas
npm run start:server     # Backend apenas
npm run start:all        # Ambos (Windows)
npm run start:all:linux  # Ambos (Linux)

# Produção
npm run build            # Build para produção
npm run start            # Executar produção

# Banco de Dados
npm run setup:db         # Setup automatizado do banco
npm run db:push          # Sincronizar schema
npm run db:seed          # Popular com dados iniciais

# Utilitários
npm run check            # Verificar tipos TypeScript
```

### Scripts de Sistema

#### Windows (PowerShell)
```powershell
.\start-dev.ps1          # Inicialização completa com verificações
```

#### Linux (Bash)
```bash
./start-dev.sh           # Inicialização completa com verificações
```

---

## 🌐 Acesso à Aplicação

Após inicializar com sucesso:

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:5000
- **API**: http://localhost:5000/api
- **Login**: admin / admin

---

## 🚨 Troubleshooting

### Problemas Comuns

#### 1. Erro: "Porta 5000 em uso"

**Windows:**
```powershell
# Encontrar processo
netstat -ano | findstr :5000

# Matar processo
taskkill /PID <PID> /F
```

**Linux:**
```bash
# Encontrar processo
lsof -i :5000

# Matar processo
kill -9 <PID>
```

#### 2. Erro: "PostgreSQL não conecta"

**Windows:**
```powershell
# Verificar serviço
sc query postgresql-x64-16

# Iniciar serviço
net start postgresql-x64-16
```

**Linux:**
```bash
# Verificar serviço
sudo systemctl status postgresql

# Iniciar serviço
sudo systemctl start postgresql
```

#### 3. Erro: "Banco não existe"

**Windows:**
```powershell
psql -U postgres -c "CREATE DATABASE estetica_pro;"
```

**Linux:**
```bash
sudo -u postgres createdb estetica_pro
```

#### 4. Erro: "Dependências não instaladas"

```bash
# Limpar cache e reinstalar
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

#### 5. Erro: "Arquivo .env não encontrado"

```bash
# Executar setup automatizado
npm run setup:db
```

### Logs e Debug

#### Verificar Logs do Servidor
```bash
# Logs em tempo real
tail -f server-output.log

# Logs de erro
tail -f server-error.log
```

#### Verificar Conexão com Banco
```bash
# Testar conexão
psql -U postgres -d estetica_pro -c "SELECT version();"
```

---

## 🔄 Diferenças entre Plataformas

### Caminhos de Arquivo
- **Windows**: `C:\Projetos\replitSaloon\ElegantInterface-main`
- **Linux**: `/home/user/projetos/replitSaloon/ElegantInterface-main`

### Comandos de Serviço
- **Windows**: `net start/stop postgresql-x64-16`
- **Linux**: `sudo systemctl start/stop postgresql`

### Scripts de Inicialização
- **Windows**: `start-dev.ps1` (PowerShell)
- **Linux**: `start-dev.sh` (Bash)

### Variáveis de Ambiente
- **Windows**: `set VAR=value`
- **Linux**: `export VAR=value`

---

## 📦 Deployment

### Windows (Produção)

```powershell
# Build
npm run build

# Executar produção
npm run start:win
```

### Linux (Produção)

```bash
# Build
npm run build

# Executar produção
npm start

# Com PM2 (recomendado)
npm install -g pm2
pm2 start npm --name "estetica-pro" -- start
pm2 startup
pm2 save
```

---

## 🎯 Checklist de Verificação

### Antes de Iniciar
- [ ] Node.js v18+ instalado
- [ ] PostgreSQL instalado e rodando
- [ ] Banco 'estetica_pro' criado
- [ ] Arquivo .env configurado
- [ ] Dependências instaladas (`npm install`)
- [ ] Portas 5000 e 5173 livres

### Após Iniciar
- [ ] Frontend acessível em http://localhost:5173
- [ ] Backend acessível em http://localhost:5000
- [ ] Login funcionando (admin/admin)
- [ ] Console sem erros críticos

---

## 📞 Suporte

### Documentação Adicional
- `STARTUP_CHECKLIST.md` - Checklist rápido
- `SETUP_WINDOWS.md` - Setup específico Windows
- `INSTALACAO.md` - Instalação básica

### Comandos de Emergência

```bash
# Reset completo (cuidado!)
rm -rf node_modules package-lock.json
npm install
npm run setup:db
```

### Logs Importantes
- `server-output.log` - Logs do servidor
- `server-error.log` - Erros do servidor
- Console do navegador - Erros do frontend

---

## 🎉 Conclusão

Com esta configuração, o projeto Estética Pro funcionará perfeitamente tanto no Windows quanto no Linux, mantendo total compatibilidade entre as plataformas.

**Para iniciar rapidamente:**
1. Execute `npm run setup:db` para configurar o banco
2. Execute `.\start-dev.ps1` (Windows) ou `./start-dev.sh` (Linux)
3. Acesse http://localhost:5000
4. Login: admin / admin

**Sucesso!** 🚀




