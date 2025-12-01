# ✅ Checklist de Inicialização - Estética Pro

## 🚀 Verificação Rápida Antes de Rodar o Projeto

### 📋 Pré-requisitos Básicos

- [ ] **Node.js v18+** instalado
  ```bash
  node --version  # Deve mostrar v18.x.x ou superior
  ```

- [ ] **npm** instalado
  ```bash
  npm --version  # Deve mostrar versão recente
  ```

- [ ] **PostgreSQL** instalado e rodando
  ```bash
  # Windows
  net start postgresql-x64-16
  
  # Linux
  sudo systemctl start postgresql
  ```

### 🗄️ Configuração do Banco de Dados

- [ ] **PostgreSQL rodando** na porta 5432
- [ ] **Usuário 'postgres'** com senha **'1234'**
- [ ] **Banco 'estetica_pro'** criado
  ```sql
  -- Conectar como postgres e executar:
  CREATE DATABASE estetica_pro;
  ```

- [ ] **Arquivo .env** configurado corretamente
  ```env
  DATABASE_URL=postgresql://postgres:1234@localhost:5432/estetica_pro
  SESSION_SECRET=estetica_pro_session_secret_key_2024_very_long_and_secure_string
  NODE_ENV=development
  PORT=5000
  ```

### 📦 Dependências do Projeto

- [ ] **Dependências instaladas**
  ```bash
  npm install
  ```

- [ ] **node_modules** existe na pasta do projeto

### 🔌 Verificação de Portas

- [ ] **Porta 5000** livre (backend)
- [ ] **Porta 5173** livre (frontend Vite)
- [ ] **Porta 5432** livre (PostgreSQL)

### 🧪 Teste de Conexão

- [ ] **Conexão com PostgreSQL** funcionando
  ```bash
  # Windows
  psql -U postgres -d estetica_pro
  
  # Linux
  sudo -u postgres psql -d estetica_pro
  ```

- [ ] **Script de setup** executado (opcional)
  ```bash
  npm run setup:db
  ```

---

## 🎯 Inicialização do Projeto

### Windows
```powershell
# Opção 1: Script automatizado (recomendado)
.\start-dev.ps1

# Opção 2: Manual
npm run start:client
# Em outro terminal:
npm run start:server
```

### Linux
```bash
# Opção 1: Script automatizado (recomendado)
./start-dev.sh

# Opção 2: Manual
npm run start:client &
npm run start:server
```

---

## 🌐 Verificação Final

Após inicializar, verifique:

- [ ] **Frontend** acessível em: http://localhost:5173
- [ ] **Backend** acessível em: http://localhost:5000
- [ ] **Login** funcionando com: admin / admin
- [ ] **Console** sem erros críticos

---

## 🚨 Troubleshooting Rápido

### ❌ Erro: "Porta 5000 em uso"
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux
lsof -i :5000
kill -9 <PID>
```

### ❌ Erro: "PostgreSQL não conecta"
```bash
# Verificar se está rodando
# Windows
net start postgresql-x64-16

# Linux
sudo systemctl start postgresql
sudo systemctl status postgresql
```

### ❌ Erro: "Banco não existe"
```sql
-- Conectar como postgres
psql -U postgres

-- Criar banco
CREATE DATABASE estetica_pro;

-- Sair
\q
```

### ❌ Erro: "Dependências não instaladas"
```bash
# Limpar e reinstalar
rm -rf node_modules package-lock.json
npm install
```

### ❌ Erro: "Arquivo .env não encontrado"
```bash
# O script de setup criará automaticamente
npm run setup:db
```

---

## 📞 Suporte

Se todos os itens do checklist estão marcados e ainda há problemas:

1. **Verifique os logs** no console
2. **Execute o script de setup**: `npm run setup:db`
3. **Consulte a documentação completa**: `WINDOWS_LINUX_SETUP.md`
4. **Verifique se todas as portas estão livres**

---

## 🎉 Sucesso!

Se tudo está funcionando:
- ✅ Frontend: http://localhost:5173
- ✅ Backend: http://localhost:5000  
- ✅ Login: admin / admin

**O projeto está rodando corretamente!** 🚀




