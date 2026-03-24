# Migração para Estrutura Baseada em Empresas

## 📋 Resumo da Mudança

A aplicação está sendo migrada de uma estrutura baseada em `parentUserId` para uma estrutura baseada em **empresas (companies)**, onde:

- **Empresas**: Representam salões/empresas
- **Usuários Admin**: Pertencem a uma empresa e gerenciam ela
- **Usuários Staff**: Pertencem à mesma empresa do admin, mas com permissões limitadas

## 🗂️ Estrutura do Schema

### Tabela `companies`
```typescript
export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  cnpj: varchar("cnpj"),
  address: text("address"),
  phone: varchar("phone"),
  email: varchar("email"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

### Tabela `users` (atualizada)
- Adicionado campo `companyId` que referencia `companies.id`
- Mantido `parentUserId` para compatibilidade durante migração
- Admin: `role = 'admin'` e `companyId` definido
- Staff: `role = 'staff'` e `companyId` definido (mesmo da empresa)

## 🔄 Funções Atualizadas

### `isAdmin(req, res, next)`
- Verifica se usuário tem `role = 'admin'`
- Aceita tanto `companyId` (nova estrutura) quanto ausência de `parentUserId` (legacy)

### `isStaff(req, res, next)`
- Verifica se usuário tem `role = 'staff'`
- Aceita tanto `companyId` (nova estrutura) quanto `parentUserId` (legacy)

### `getEffectiveUserId(req)`
- Retorna o `userId` apropriado para filtros
- Com `companyId`: retorna `user.id` (filtros serão por `companyId`)
- Legacy: staff retorna `parentUserId`, admin retorna `user.id`

### `getEffectiveCompanyId(req)` (NOVA)
- Retorna o `companyId` para filtros baseados em empresa
- Prioriza `companyId` se existir
- Retorna `null` para estrutura legacy

## 📝 Próximos Passos

1. **Criar migração do banco de dados**
   ```sql
   -- Criar tabela companies
   CREATE TABLE companies (
     id SERIAL PRIMARY KEY,
     name VARCHAR NOT NULL,
     cnpj VARCHAR,
     address TEXT,
     phone VARCHAR,
     email VARCHAR,
     is_active BOOLEAN DEFAULT true,
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW()
   );

   -- Adicionar companyId na tabela users
   ALTER TABLE users ADD COLUMN company_id INTEGER REFERENCES companies(id);

   -- Migrar dados existentes
   -- Para cada admin, criar uma empresa e associar
   -- Para cada staff, associar à empresa do admin pai
   ```

2. **Atualizar rotas para usar `companyId`**
   - Atualizar todas as queries para filtrar por `companyId` quando disponível
   - Manter compatibilidade com `userId` para estrutura legacy

3. **Atualizar frontend**
   - Interface para criar/gerenciar empresas
   - Interface para associar usuários a empresas

4. **Testes**
   - Testar criação de empresa
   - Testar criação de admin associado à empresa
   - Testar criação de staff associado à empresa
   - Testar que staff vê apenas dados da empresa

## ⚠️ Notas Importantes

- `parentUserId` está sendo mantido para **compatibilidade durante a migração**
- Após migração completa, `parentUserId` pode ser removido
- Todas as tabelas que referenciam `userId` continuam funcionando
- Filtros serão feitos por `companyId` quando disponível, senão por `userId` (legacy)

