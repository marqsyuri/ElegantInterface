# Scripts do Package.json

## Scripts disponíveis:

### Desenvolvimento
```bash
npm run dev          # Inicia servidor desenvolvimento (hot reload)
npm run build        # Compila para produção
npm start           # Inicia servidor produção
```

### Banco de dados
```bash
npm run db:generate  # Gera migrações
npm run db:push     # Aplica mudanças no schema
npm run db:studio   # Interface visual do banco (Drizzle Studio)
```

### Comandos rápidos para instalação:

1. **Instalar dependências:**
```bash
npm install
```

2. **Configurar banco (após criar .env):**
```bash
npm run db:push
```

3. **Rodar em desenvolvimento:**
```bash
npm run dev
```

4. **Rodar em produção:**
```bash
npm run build
npm start
```

## Arquivo .env necessário:
```
DATABASE_URL=postgresql://usuario:senha@localhost:5432/estetica_pro
SESSION_SECRET=uma_string_secreta_qualquer_bem_longa
NODE_ENV=production
PORT=3000
```