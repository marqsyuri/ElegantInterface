# 🪟 Comandos para Rodar a Aplicação no Windows

## 🚀 Comando Principal

### Iniciar o Servidor (Desenvolvimento)
```powershell
npm run dev
```

Este comando:
- Inicia o servidor Node.js na porta 5000
- Inicia o Vite dev server para o frontend
- Habilita hot reload (recarrega automaticamente ao salvar arquivos)

---

## 📋 Outros Comandos Úteis

### Build para Produção
```powershell
npm run build
```

### Rodar em Produção (após build)
```powershell
a```

### Verificar se Servidor Está Rodando
```powershell
netstat -ano | findstr :5000
```

### Parar Todos os Processos Node
```powershell
Get-Process node | Stop-Process -Force
```

### Verificar se Servidor Está Respondendo
```powershell
curl http://localhost:5000 -UseBasicParsing
```

Ou usando Invoke-WebRequest:
```powershell
Invoke-WebRequest -Uri "http://localhost:5000" -UseBasicParsing
```

---

## 🔧 Comandos de Desenvolvimento

### Verificar Tipos TypeScript
```powershell
npm run check
```

### Sincronizar Schema do Banco
```powershell
npm run db:push
```

### Popular Banco com Dados de Teste
```powershell
npm run db:seed
```

---

## 🐛 Troubleshooting

### Se a Porta 5000 Estiver em Uso
```powershell
# Encontrar processo usando a porta
netstat -ano | findstr :5000

# Matar processo específico (substitua PID pelo número do processo)
taskkill /PID <PID> /F
```

### Limpar e Reinstalar Dependências
```powershell
# Limpar cache
npm cache clean --force

# Remover node_modules
Remove-Item -Recurse -Force node_modules

# Reinstalar
npm install
```

### Ver Logs do Servidor
O servidor mostra os logs diretamente no terminal onde você executou `npm run dev`.

---

## 📝 Scripts Disponíveis no package.json

```json
{
  "dev": "cross-env NODE_ENV=development tsx --tsconfig tsconfig.json server/index.ts",
  "dev:win": "set NODE_ENV=development && tsx --tsconfig tsconfig.json server/index.ts",
  "build": "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
  "start": "cross-env NODE_ENV=production node dist/index.js",
  "start:win": "set NODE_ENV=production && node dist/index.js"
}
```

---

## ✅ Checklist Rápido

Antes de rodar, verifique:
- [ ] PostgreSQL está rodando
- [ ] Arquivo `.env` está configurado
- [ ] Dependências instaladas (`npm install`)
- [ ] Banco de dados existe e está acessível

---

## 🎯 Comando Mais Simples

**Para desenvolvimento (recomendado):**
```powershell
npm run dev
```

**Para produção:**
```powershell
npm run build
npm start
```

---

**Última atualização:** Dezembro 2025

