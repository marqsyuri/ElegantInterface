# 🚀 Guia para Executar Migrations na VPS

## 📋 Visão Geral

Este guia explica como executar as migrations do banco de dados na sua VPS após atualizar o sistema com a versão mais recente.

## ⚠️ IMPORTANTE: Antes de Começar

1. **Faça backup do banco de dados** antes de executar qualquer migration
2. **Pare a aplicação** antes de executar as migrations
3. **Verifique o arquivo `.env`** está configurado corretamente

---

## 🔧 Método 1: Usando o Script Automatizado (Recomendado)

### Passo 1: Conectar na VPS

```bash
ssh usuario@seu-servidor
cd /root/versao/ElegantInterface-main  # ou o caminho do seu projeto
```

### Passo 2: Fazer Backup do Banco

```bash
# Backup do banco de dados
pg_dump -U postgres estetica_pro > backup_antes_migrations_$(date +%Y%m%d_%H%M%S).sql

# Verificar se o backup foi criado
ls -lh backup_antes_migrations_*.sql
```

### Passo 3: Parar a Aplicação

```bash
# Parar o PM2
pm2 stop estetica-pro
# ou
pm2 stop all

# Verificar se parou
pm2 status
```

### Passo 4: Verificar o .env

```bash
# Verificar se DATABASE_URL está configurado
cat .env | grep DATABASE_URL

# Deve mostrar algo como:
# DATABASE_URL=postgresql://usuario:senha@localhost:5432/estetica_pro
```

### Passo 5: Executar o Script de Migrations

```bash
# Executar o script que roda todas as migrations
tsx run-all-migrations.js

# OU se não tiver tsx instalado globalmente:
npx tsx run-all-migrations.js
```

O script irá:
- Verificar a conexão com o banco
- Executar todas as migrations na ordem correta
- Mostrar o progresso de cada migration
- Verificar se cada migration foi aplicada com sucesso

### Passo 6: Reiniciar a Aplicação

```bash
# Reiniciar o PM2
pm2 restart estetica-pro
# ou
pm2 start npm --name "estetica-pro" -- start

# Verificar logs
pm2 logs estetica-pro --lines 50
```

---

## 🔧 Método 2: Executar Migrations Individualmente

Se preferir executar cada migration manualmente ou se alguma falhar:

### Lista de Migrations (Ordem Recomendada)

1. **migrate-tables.sql** - Tabelas base (se necessário)
2. **migrate-add-staff-fields.sql** - Campos de staff
3. **migrate-staff-login-fields.sql** - Campos de login do staff
4. **migrate-staff-access-level.sql** - Níveis de acesso do staff
5. **migrate-add-datahr-to-clients.sql** - Campo datahr em clients
6. **migrate-appointment-staff-table.sql** - Tabela de staff em appointments
7. **migrate-appointment-procedures-staff.sql** - Procedures e staff
8. **migrate-add-waitlist-to-appointments.sql** - Campo waitlist

### Executar Cada Migration

#### Opção A: Usando os Scripts JavaScript

```bash
# 1. Staff fields
tsx run-migration-staff.js

# 2. Staff login fields
tsx run-migration-staff-login.js

# 3. Staff access level
tsx run-migration-staff-access-level.js

# 4. Datahr em clients
tsx run-migration-datahr-direct.js

# 5. Waitlist
tsx run-migration-waitlist.js
```

#### Opção B: Usando psql diretamente

```bash
# Conectar ao banco
psql -U postgres -d estetica_pro

# Dentro do psql, executar:
\i migrate-add-staff-fields.sql
\i migrate-staff-login-fields.sql
\i migrate-staff-access-level.sql
\i migrate-add-datahr-to-clients.sql
\i migrate-add-waitlist-to-appointments.sql

# Sair
\q
```

#### Opção C: Usando psql via linha de comando

```bash
# Executar cada migration
psql -U postgres -d estetica_pro -f migrate-add-staff-fields.sql
psql -U postgres -d estetica_pro -f migrate-staff-login-fields.sql
psql -U postgres -d estetica_pro -f migrate-staff-access-level.sql
psql -U postgres -d estetica_pro -f migrate-add-datahr-to-clients.sql
psql -U postgres -d estetica_pro -f migrate-add-waitlist-to-appointments.sql
```

---

## 🔍 Verificar se as Migrations Foram Aplicadas

### Verificar Colunas em Tabelas Específicas

```bash
# Conectar ao banco
psql -U postgres -d estetica_pro

# Verificar colunas da tabela staff
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'staff' 
ORDER BY column_name;

# Verificar colunas da tabela appointments
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'appointments' 
ORDER BY column_name;

# Verificar colunas da tabela clients
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'clients' 
ORDER BY column_name;

# Sair
\q
```

---

## 🐛 Solução de Problemas

### Erro: "DATABASE_URL não encontrado"

```bash
# Verificar se o .env existe
ls -la .env

# Verificar conteúdo
cat .env

# Se não existir, criar:
nano .env
# Adicionar:
# DATABASE_URL=postgresql://usuario:senha@localhost:5432/estetica_pro
```

### Erro: "relation already exists" ou "column already exists"

Isso significa que a migration já foi aplicada. Você pode:
- Ignorar o erro e continuar
- Ou verificar se realmente precisa executar essa migration

### Erro: "permission denied"

```bash
# Verificar permissões do usuário do banco
psql -U postgres -d estetica_pro -c "\du"

# Se necessário, dar permissões:
psql -U postgres
GRANT ALL PRIVILEGES ON DATABASE estetica_pro TO seu_usuario;
\q
```

### Erro: "tsx: command not found"

```bash
# Instalar tsx globalmente
npm install -g tsx

# OU usar npx
npx tsx run-all-migrations.js
```

### Verificar se PostgreSQL está rodando

```bash
# Verificar status
sudo systemctl status postgresql

# Se não estiver rodando, iniciar:
sudo systemctl start postgresql
```

---

## ✅ Checklist Pós-Migration

Após executar as migrations, verifique:

- [ ] Todas as migrations foram executadas sem erros
- [ ] Aplicação reiniciou corretamente
- [ ] Logs não mostram erros de banco de dados
- [ ] Sistema está acessível e funcionando
- [ ] Funcionalidades que dependem das novas colunas estão funcionando

---

## 📞 Comandos Úteis

```bash
# Ver logs do PM2
pm2 logs estetica-pro --lines 100

# Ver status do PM2
pm2 status

# Reiniciar aplicação
pm2 restart estetica-pro

# Verificar conexão com banco
psql -U postgres -d estetica_pro -c "SELECT version();"

# Listar todas as tabelas
psql -U postgres -d estetica_pro -c "\dt"

# Ver estrutura de uma tabela
psql -U postgres -d estetica_pro -c "\d staff"
psql -U postgres -d estetica_pro -c "\d appointments"
psql -U postgres -d estetica_pro -c "\d clients"
```

---

## 🔄 Rollback (Reverter Migrations)

Se algo der errado e precisar reverter:

```bash
# Restaurar backup
psql -U postgres -d estetica_pro < backup_antes_migrations_YYYYMMDD_HHMMSS.sql

# Verificar se restaurou
psql -U postgres -d estetica_pro -c "\dt"
```

---

**Última atualização:** Dezembro 2025
