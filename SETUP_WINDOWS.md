# 🚀 Setup Rápido - Windows

## ✅ Status Atual

- ✅ Node.js instalado
- ✅ Dependências npm instaladas (782 packages)
- ✅ Docker instalado (mas Desktop não está rodando)
- ✅ Scripts corrigidos para Windows
- ✅ Arquivo `.env` criado
- ❌ **PostgreSQL não configurado** (necessário para rodar)

---

## 🎯 Próximos Passos - Escolha UMA opção:

### OPÇÃO 1: Docker PostgreSQL (Recomendado) 🐳

**Pré-requisito:** Inicie o Docker Desktop

```powershell
# 1. Abra o Docker Desktop e aguarde iniciar

# 2. Execute este comando:
docker run --name estetica-postgres `
  -e POSTGRES_PASSWORD=admin123 `
  -e POSTGRES_DB=estetica_pro `
  -p 5432:5432 `
  -d postgres:16

# 3. Atualize o .env:
# DATABASE_URL=postgresql://postgres:admin123@localhost:5432/estetica_pro

# 4. Rode o projeto:
npm run dev
```

**Para parar o banco:**
```powershell
docker stop estetica-postgres
```

**Para iniciar novamente:**
```powershell
docker start estetica-postgres
```

**Para remover:**
```powershell
docker rm -f estetica-postgres
```

---

### OPÇÃO 2: Neon PostgreSQL (Cloud - Grátis) ☁️

**Mais rápido se Docker Desktop não estiver disponível**

1. Acesse: https://neon.tech
2. Crie uma conta grátis (GitHub/Google)
3. Crie um novo projeto
4. Copie a **Connection String** (formato: `postgresql://user:pass@host/dbname`)
5. Cole no arquivo `.env`:
   ```
   DATABASE_URL=sua_connection_string_aqui
   ```
6. Rode: `npm run dev`

**Vantagens:**
- ✅ Sem instalação local
- ✅ Grátis até 512MB
- ✅ Funciona de qualquer lugar
- ✅ Backups automáticos

---

### OPÇÃO 3: PostgreSQL Local 💻

1. Download: https://www.postgresql.org/download/windows/
2. Instale (versão 16 recomendada)
3. Durante instalação, defina senha (ex: `admin123`)
4. Após instalar, abra `pgAdmin` ou `psql` e execute:
   ```sql
   CREATE DATABASE estetica_pro;
   ```
5. Atualize `.env`:
   ```
   DATABASE_URL=postgresql://postgres:admin123@localhost:5432/estetica_pro
   ```
6. Rode: `npm run dev`

---

## 🏃 Rodando o Projeto

### Desenvolvimento (Windows):
```powershell
npm run dev
```

### Acessar:
- Frontend: http://localhost:5000
- API: http://localhost:5000/api

### Credenciais padrão:
- **Usuário:** admin
- **Senha:** admin

---

## 📦 Importar Dados de Exemplo

Após configurar o banco, você pode importar dados de exemplo:

**Com Docker:**
```powershell
# Copiar backup para container
docker cp backup_estetica_pro.sql estetica-postgres:/backup.sql

# Importar
docker exec -it estetica-postgres psql -U postgres -d estetica_pro -f /backup.sql
```

**Com PostgreSQL Local:**
```powershell
psql -U postgres -d estetica_pro -f backup_estetica_pro.sql
```

**Com Neon:**
1. Use o Neon SQL Editor no dashboard
2. Cole o conteúdo de `backup_estetica_pro.sql`
3. Execute

Ou use:
```powershell
psql "sua_connection_string_neon" -f backup_estetica_pro.sql
```

---

## 🔧 Scripts Disponíveis

```powershell
npm run dev          # Desenvolvimento (cross-platform)
npm run dev:win      # Desenvolvimento (Windows específico)
npm run build        # Build para produção
npm run start        # Rodar produção
npm run check        # Verificar tipos TypeScript
npm run db:push      # Sincronizar schema com banco
npm run db:seed      # Popular banco com dados de teste
```

---

## 🐛 Troubleshooting

### Porta 5000 em uso
```powershell
# Encontrar processo usando porta 5000
netstat -ano | findstr :5000

# Matar processo (substitua PID)
taskkill /PID <PID> /F
```

### Docker não inicia
- Verifique se Docker Desktop está rodando
- Reinicie o Docker Desktop
- Verifique se WSL 2 está habilitado (Windows 10/11)

### Erro de conexão com banco
- Verifique se PostgreSQL está rodando
- Confirme credenciais no `.env`
- Teste conexão:
  ```powershell
  psql -U postgres -d estetica_pro
  ```

---

## 📝 Estrutura do Projeto

```
ElegantInterface/
├── client/              # Frontend React + Vite
│   ├── src/
│   │   ├── components/  # Componentes UI
│   │   ├── pages/       # Páginas
│   │   └── hooks/       # Custom hooks
├── server/              # Backend Express
│   ├── index.ts         # Entry point
│   ├── routes.ts        # API routes
│   └── db.ts            # Database connection
├── shared/              # Código compartilhado
│   └── schema.ts        # Schema Drizzle ORM
├── .env                 # Variáveis de ambiente
└── package.json         # Dependências
```

---

## 🎯 Próximos Passos Após Setup

1. ✅ Configurar banco de dados
2. ✅ Rodar `npm run dev`
3. ✅ Acessar http://localhost:5000
4. ✅ Login: admin / admin
5. 🎨 Explorar o sistema!

---

## 💡 Dicas

- Use **Neon** se quer testar rápido sem instalações
- Use **Docker** se quer ambiente isolado e facilmente resetável
- Use **PostgreSQL Local** se quer controle total e trabalhar offline

**Escolha a opção que preferir e me avise que eu te ajudo a configurar!** 🚀

