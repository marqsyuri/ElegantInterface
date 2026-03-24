# Guia de Senhas dos Staff

## Por que não consigo ver a senha?

As senhas são armazenadas como **hash MD5** no banco de dados por segurança. Isso significa que:
- ✅ A senha original é transformada em um código único (hash)
- ❌ Não é possível ver a senha original (é uma via de mão única)
- 🔒 Isso é uma prática de segurança padrão

## Como gerenciar senhas de staff

### 1. Listar todos os staff e verificar se têm senha

```bash
node check-staff-passwords.js list
```

Isso mostra:
- ID do staff
- Username
- Nome
- Email
- Se tem senha definida (✅ Sim ou ❌ Não)
- Admin associado
- Se está ativo

### 2. Definir senha para um staff existente

Se você criou um staff pela interface mas ele não tem senha, ou quer mudar a senha:

```bash
node check-staff-passwords.js set-password <staff_id> <senha>
```

**Exemplo:**
```bash
node check-staff-passwords.js set-password 1 senha123
```

### 3. Criar novo staff com senha diretamente

Criar um staff completo com senha pelo terminal:

```bash
node check-staff-passwords.js create <username> <senha> <nome> <admin_id> [email]
```

**Exemplo:**
```bash
node check-staff-passwords.js create joao senha123 "João Silva" 1 joao@email.com
```

Onde:
- `joao` = username para login
- `senha123` = senha (será hasheada automaticamente)
- `João Silva` = nome completo
- `1` = ID do admin (empresa) que possui este staff
- `joao@email.com` = email (opcional)

## Como descobrir o ID do admin

Para descobrir o ID do admin (usuário que criou o staff), você pode:

1. **Pela interface:** Faça login como admin e veja seu ID na URL ou no código
2. **Pelo banco:** Execute:
   ```sql
   SELECT id, username, email FROM users WHERE role = 'admin';
   ```

## Fluxo recomendado

1. **Criar staff pela interface admin:**
   - Vá em "Staff" → "Adicionar Funcionário"
   - Preencha: username, password, name, etc.
   - A senha será hasheada automaticamente

2. **Se esqueceu a senha ou precisa resetar:**
   ```bash
   node check-staff-passwords.js set-password <staff_id> <nova_senha>
   ```

3. **Verificar se staff tem senha:**
   ```bash
   node check-staff-passwords.js list
   ```

## Importante

- ⚠️ **Nunca compartilhe senhas em texto plano**
- 🔒 As senhas são hasheadas (MD5) antes de serem salvas
- 📝 Anote as senhas em local seguro quando criar staff
- 🔄 Use o script para resetar senhas quando necessário

