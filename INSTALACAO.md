# Guia de Instalação - Estética Pro

## Pré-requisitos

### 1. Instalar Node.js
- Baixe o Node.js versão 18 ou superior: https://nodejs.org/
- Durante a instalação, marque a opção "Add to PATH"
- Verifique se instalou corretamente:
```bash
node --version
npm --version
```

### 2. Instalar PostgreSQL
- Baixe o PostgreSQL: https://www.postgresql.org/download/
- Durante a instalação, anote a senha do usuário `postgres`
- Crie um banco de dados para o sistema:
```sql
CREATE DATABASE estetica_pro;
```

## Instalação do Sistema

### Passo 1: Baixar o código
- Extraia todos os arquivos do projeto em uma pasta (ex: `C:\estetica-pro`)

### Passo 2: Instalar dependências
Abra o terminal/prompt na pasta do projeto e execute:
```bash
npm install
```

### Passo 3: Configurar banco de dados
1. Renomeie o arquivo `.env.example` para `.env` (se existir)
2. Crie um arquivo `.env` na raiz do projeto com:
```
DATABASE_URL=postgresql://postgres:SUA_SENHA@localhost:5432/estetica_pro
SESSION_SECRET=sua_chave_secreta_aqui_qualquer_string_longa
NODE_ENV=production
PORT=3000
```

### Passo 4: Importar banco de dados
No terminal, execute:
```bash
# Importar estrutura e dados
psql -U postgres -d estetica_pro -f backup_estetica_pro.sql
```

### Passo 5: Sincronizar schema (opcional)
```bash
npm run db:push
```

### Passo 6: Executar o sistema
```bash
# Para desenvolvimento
npm run dev

# Para produção
npm run build
npm start
```

## Acessar o Sistema

1. Abra o navegador em: http://localhost:3000
2. Use as credenciais:
   - **Usuário**: admin
   - **Senha**: admin

## Estrutura de Pastas

```
estetica-pro/
├── client/          # Frontend React
├── server/          # Backend Node.js
├── shared/          # Tipos compartilhados
├── backup_estetica_pro.sql  # Backup do banco
├── package.json     # Dependências
└── .env            # Configurações
```

## Problemas Comuns

### Erro de conexão com banco
- Verifique se o PostgreSQL está rodando
- Confirme usuário, senha e nome do banco no `.env`
- Teste a conexão: `psql -U postgres -d estetica_pro`

### Porta em uso
- Mude a PORT no arquivo `.env`
- Ou pare o processo que está usando a porta 3000

### Dependências não instaladas
```bash
# Limpar cache e reinstalar
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

## Deployment em Servidor

### Para VPS/Servidor dedicado:
1. Instale Node.js e PostgreSQL no servidor
2. Copie os arquivos do projeto
3. Configure o `.env` com dados do servidor
4. Execute `npm install` e `npm run build`
5. Use um process manager como PM2:
```bash
npm install -g pm2
pm2 start npm --name "estetica-pro" -- start
pm2 startup
pm2 save
```

### Para hospedar com domínio:
1. Configure um reverse proxy (Nginx)
2. Adicione SSL com Let's Encrypt
3. Configure o domínio para apontar para o servidor

## Suporte

O sistema está configurado para funcionar de forma independente, sem necessidade de serviços externos do Replit.

Credenciais padrão:
- **Admin**: admin/admin
- **Database**: Estrutura completa importada do backup