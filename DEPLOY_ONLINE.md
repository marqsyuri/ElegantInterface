# 🚀 Deploy Online - Estética Pro

## 📋 Opções de Deploy

### **Opção 1: Railway (Recomendado - Mais Fácil)** ⭐

Railway é a forma mais rápida de colocar o projeto online.

#### Passo a Passo:

1. **Criar conta no Railway:**
   - Acesse: https://railway.app
   - Faça login com GitHub/Google

2. **Criar novo projeto:**
   - Clique em "New Project"
   - Selecione "Deploy from GitHub repo" (ou "Empty Project")

3. **Configurar PostgreSQL:**
   - No projeto, clique em "+ New"
   - Selecione "Database" → "Add PostgreSQL"
   - Railway criará automaticamente um banco PostgreSQL

4. **Configurar variáveis de ambiente:**
   - No projeto, vá em "Variables"
   - Adicione:
     ```
     DATABASE_URL=${{Postgres.DATABASE_URL}}
     SESSION_SECRET=gerar_string_aleatoria_longa_e_segura_aqui
     NODE_ENV=production
     PORT=5000
     ```
   - Railway já fornece `DATABASE_URL` automaticamente se você usar `${{Postgres.DATABASE_URL}}`

5. **Fazer deploy:**
   - Se conectou via GitHub: Railway faz deploy automático
   - Se não: Faça upload dos arquivos ou conecte via Git

6. **Configurar build:**
   - Railway detecta automaticamente Node.js
   - Build command: `npm run build`
   - Start command: `npm start`

7. **Acessar:**
   - Railway fornece uma URL automática (ex: `seu-projeto.up.railway.app`)
   - Acesse a URL e faça login com: `admin` / `admin`

---

### **Opção 2: Render** 🎨

1. **Criar conta:** https://render.com
2. **Criar novo Web Service**
3. **Conectar repositório GitHub**
4. **Configurações:**
   - Build Command: `npm run build`
   - Start Command: `npm start`
   - Environment: `Node`
5. **Adicionar PostgreSQL:**
   - Criar novo PostgreSQL Database
   - Copiar `Internal Database URL`
6. **Variáveis de ambiente:**
   ```
   DATABASE_URL=<sua_database_url_do_render>
   SESSION_SECRET=gerar_string_aleatoria_longa_e_segura
   NODE_ENV=production
   PORT=5000
   ```

---

### **Opção 3: Replit** 🔄

O projeto já tem configuração para Replit!

1. **Acesse:** https://replit.com
2. **Importar projeto:**
   - Clique em "Create Repl"
   - Selecione "Import from GitHub"
   - Cole a URL do seu repositório
3. **Configurar Secrets:**
   - Vá em "Secrets" (ícone de cadeado)
   - Adicione:
     ```
     DATABASE_URL=postgresql://...
     SESSION_SECRET=...
     NODE_ENV=production
     PORT=5000
     ```
4. **Criar PostgreSQL:**
   - No Replit, vá em "Database" → "Create Database"
   - Selecione PostgreSQL
   - Copie a connection string
5. **Rodar:**
   - Clique em "Run"
   - Replit faz deploy automático

---

### **Opção 4: Vercel + Neon (Frontend + Backend separados)** ⚡

Para projetos maiores:

1. **Backend (Railway/Render):**
   - Deploy do servidor Node.js
   - PostgreSQL configurado

2. **Frontend (Vercel):**
   - Deploy do client React
   - Configurar variável `VITE_API_URL` apontando para backend

---

## 🔧 Preparação do Projeto

### 1. Verificar se está tudo pronto:

```bash
# Instalar dependências
npm install

# Verificar build
npm run build

# Testar localmente
npm start
```

### 2. Criar arquivo `.env.example` (se não existir):

```env
DATABASE_URL=postgresql://usuario:senha@host:5432/estetica_pro
SESSION_SECRET=chave_secreta_aleatoria_longa
NODE_ENV=production
PORT=5000
```

### 3. Garantir que o build funciona:

```bash
npm run build
```

Se der erro, corrija antes de fazer deploy.

---

## 📝 Checklist Antes do Deploy

- [ ] `npm install` executado com sucesso
- [ ] `npm run build` funciona sem erros
- [ ] Arquivo `.env` configurado (ou variáveis no serviço)
- [ ] PostgreSQL criado e configurado
- [ ] `DATABASE_URL` apontando para o banco correto
- [ ] `SESSION_SECRET` definido (string aleatória longa)
- [ ] `NODE_ENV=production` configurado

---

## 🚀 Deploy Rápido - Railway (Recomendado)

### Método mais rápido:

1. **Instalar Railway CLI:**
   ```bash
   npm i -g @railway/cli
   ```

2. **Login:**
   ```bash
   railway login
   ```

3. **Inicializar projeto:**
   ```bash
   railway init
   ```

4. **Adicionar PostgreSQL:**
   ```bash
   railway add postgresql
   ```

5. **Configurar variáveis:**
   ```bash
   railway variables set SESSION_SECRET=sua_chave_secreta_aqui
   railway variables set NODE_ENV=production
   railway variables set PORT=5000
   ```

6. **Fazer deploy:**
   ```bash
   railway up
   ```

7. **Abrir URL:**
   ```bash
   railway open
   ```

---

## 🔍 Verificar se Deploy Funcionou

Após o deploy:

1. **Acessar a URL fornecida**
2. **Verificar se carrega a página de login**
3. **Fazer login com:**
   - Usuário: `admin`
   - Senha: `admin`
4. **Verificar se o dashboard carrega**

---

## 🐛 Problemas Comuns

### Erro: "Cannot connect to database"
- Verifique se `DATABASE_URL` está correto
- Verifique se o PostgreSQL está rodando
- Teste a conexão localmente primeiro

### Erro: "Build failed"
- Verifique os logs do build
- Execute `npm run build` localmente para ver erros
- Verifique se todas as dependências estão no `package.json`

### Erro: "Port already in use"
- Mude a `PORT` nas variáveis de ambiente
- Ou deixe o serviço escolher automaticamente

### Aplicação não inicia
- Verifique os logs do serviço
- Verifique se `NODE_ENV=production`
- Verifique se o build foi criado (`dist/` existe)

---

## 📞 Suporte

Se encontrar problemas:

1. Verifique os logs do serviço de deploy
2. Teste localmente primeiro (`npm run build && npm start`)
3. Verifique as variáveis de ambiente
4. Verifique se o PostgreSQL está acessível

---

## ✅ Após Deploy Bem-Sucedido

1. **Mudar senha do admin** (importante para segurança!)
2. **Configurar domínio personalizado** (opcional)
3. **Configurar SSL/HTTPS** (recomendado)
4. **Fazer backup do banco** regularmente
5. **Monitorar logs** para erros

---

**Última atualização:** Dezembro 2025

