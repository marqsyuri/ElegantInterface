# 🔧 Correção: Permissionamento de Staff

## ❌ Problema Identificado

O staff user está logado, mas o menu ainda mostra todos os itens (Dashboard, Registro, Clínico, Gestão, Análises, Configurações) em vez de mostrar apenas "Agendamentos".

**Causa raiz:** O campo `parentUserId` está `undefined` no frontend, mesmo existindo no banco de dados (`parentUserId: 21`).

## ✅ Correções Aplicadas

### 1. **Login Route** (`server/auth.ts`)
- ✅ Modificado para buscar dados frescos do banco após autenticação
- ✅ Agora retorna `freshUser` com todos os campos, incluindo `parentUserId`

### 2. **User Info Route** (`server/auth.ts`)
- ✅ Adicionado log detalhado para debug
- ✅ Garantido que `parentUserId` seja explicitamente incluído na resposta

### 3. **Sidebar Component** (`client/src/components/Sidebar.tsx`)
- ✅ Adicionado `useEffect` para debug
- ✅ Verificação de `isStaff` baseada em `user?.role === 'staff' && user?.parentUserId`
- ✅ Grupos de navegação ocultos para staff (`!isStaff && ...`)
- ✅ Settings oculto para staff

### 4. **AdminOnlyRoute Component** (`client/src/components/AdminOnlyRoute.tsx`)
- ✅ Criado componente para proteger rotas admin-only
- ✅ Redireciona staff para `/appointments`

### 5. **App Routes** (`client/src/App.tsx`)
- ✅ Todas as rotas admin-only protegidas com `AdminOnlyRoute`
- ✅ Dashboard redireciona staff automaticamente

## 🧪 Como Testar

### **IMPORTANTE:** O usuário precisa fazer **logout e login novamente** para carregar os dados atualizados!

1. **Fazer Logout:**
   - Clique no botão de logout no header (ícone de saída)
   - Ou execute no console do navegador:
   ```javascript
   fetch('/api/logout', { method: 'POST', credentials: 'include' }).then(() => window.location.reload());
   ```

2. **Fazer Login como Staff:**
   - Username: `staff1`
   - Password: `staff123`

3. **Verificar Menu:**
   - ✅ Deve mostrar apenas "Agendamentos"
   - ❌ NÃO deve mostrar: Dashboard, Registro, Clínico, Gestão, Análises, Configurações

4. **Verificar Agendamentos:**
   - ✅ Deve mostrar apenas agendamentos onde o staff está vinculado
   - ✅ Agendamento ID 46 deve aparecer (vinculado via `appointment_procedures`)

5. **Testar Acesso Restrito:**
   - Tentar acessar `/clients` - deve redirecionar para `/appointments`
   - Tentar acessar `/settings` - deve redirecionar para `/appointments`
   - Tentar acessar `/` (Dashboard) - deve redirecionar para `/appointments`

## 🔍 Debug

Se o problema persistir após logout/login:

1. **Verificar Console do Navegador:**
   ```javascript
   // No console do navegador (F12)
   fetch('/api/user').then(r => r.json()).then(u => {
     console.log('User data:', {
       id: u.id,
       role: u.role,
       parentUserId: u.parentUserId,
       allKeys: Object.keys(u).filter(k => k.includes('parent'))
     });
   });
   ```

2. **Verificar Logs do Servidor:**
   - Procurar por: `📊 GET /api/user - Returning fresh data:`
   - Verificar se `parentUserId` está sendo retornado

3. **Verificar Banco de Dados:**
   ```sql
   SELECT id, username, role, parent_user_id FROM users WHERE username = 'staff1';
   ```
   - Deve retornar `parent_user_id = 21`

## 📝 Status

- ✅ Migration executada
- ✅ Campo `parentUserId` existe no banco
- ✅ Login route corrigido
- ✅ User info route corrigido
- ✅ Sidebar corrigido
- ✅ Rotas protegidas
- ⏳ **Aguardando logout/login para testar**

**Próximo passo:** Fazer logout e login novamente como staff para carregar os dados atualizados!

