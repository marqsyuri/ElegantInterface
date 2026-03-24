# 🚀 Guia Rápido - Migration Master Ubuntu

## ⚡ Execução Rápida (3 Comandos)

```bash
# 1. Fazer backup
pg_dump -U postgres estetica_pro > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Parar aplicação
pm2 stop estetica-pro

# 3. Executar migration
node run-master-migration-ubuntu.js

# 4. Reiniciar aplicação
pm2 restart estetica-pro
```

## 📋 O Que Esta Migration Faz

✅ Cria/atualiza **38 tabelas** do sistema  
✅ Adiciona todas as colunas necessárias  
✅ Cria índices para performance  
✅ **Segura** - pode rodar múltiplas vezes sem problemas

### Tabelas Principais

- `users` - Usuários do sistema
- `companies` - Empresas/salões
- `clients` - Clientes (com campo `datahr`)
- `staff` - Funcionários (com login: `username`, `password`, `access_level`)
- `appointments` - Agendamentos (com campo `waitlist`)
- `procedures` - Procedimentos
- `products` - Produtos
- `sales` - Vendas
- E mais 30 tabelas...

## 🔧 Requisitos

- PostgreSQL instalado e rodando
- Arquivo `.env` com `DATABASE_URL` configurado
- Node.js instalado

## 📝 Verificar Configuração

```bash
# Verificar .env
cat .env | grep DATABASE_URL

# Deve mostrar:
# DATABASE_URL=postgresql://usuario:senha@localhost:5432/estetica_pro
```

## ✅ Verificação Pós-Migration

O script automaticamente verifica:

- ✓ Conexão com banco de dados
- ✓ Todas as 38 tabelas criadas
- ✓ Colunas críticas presentes:
  - `clients.datahr` - Data último agendamento
  - `appointments.waitlist` - Lista de espera
  - `staff.username` - Login do staff
  - `staff.password` - Senha do staff
  - `staff.access_level` - Nível de acesso
  - `staff.company_id` - ID da empresa

## 🐛 Solução Rápida de Problemas

### Erro: "DATABASE_URL não encontrado"

```bash
echo 'DATABASE_URL=postgresql://postgres:1234@localhost:5432/estetica_pro' >> .env
```

### Erro: "tsx: command not found"

```bash
npm install -g tsx
# ou use:
npx tsx run-master-migration-ubuntu.js
```

### Erro: "permission denied"

```bash
psql -U postgres
GRANT ALL PRIVILEGES ON DATABASE estetica_pro TO seu_usuario;
\q
```

## 📖 Documentação Completa

Para mais detalhes, consulte:

- [implementation_plan.md](file:///C:/Users/PC1/.gemini/antigravity/brain/998ed136-160d-42ae-89b8-a56b184eb0fa/implementation_plan.md) - Plano completo
- [GUIA_EXECUTAR_MIGRATIONS_VPS.md](file:///c:/Projetos/replitSaloon/ElegantInterface-main/GUIA_EXECUTAR_MIGRATIONS_VPS.md) - Guia detalhado

## 🎯 Arquivos da Migration

1. **migrate-master-ubuntu.sql** - Script SQL completo
2. **run-master-migration-ubuntu.js** - Executor automatizado com verificação

## 💡 Dicas

- ⚠️ **SEMPRE** faça backup antes de executar
- ✅ A migration é **idempotente** (pode rodar várias vezes)
- 🔍 Verifique os logs após reiniciar: `pm2 logs estetica-pro --lines 50`
- 🚀 Teste o sistema após a migration

---

**Criado em:** 2026-01-21  
**Versão:** 1.0 - Migration Master Completa
