# 🔄 Instruções: Reiniciar Servidor e Testar Staff Login

## ❌ Problema Identificado

O `parentUserId` está `undefined` no frontend porque:
1. O servidor não foi reiniciado após as mudanças no código (`server/auth.ts`)
2. O usuário já estava logado antes das correções

## ✅ Solução

### **1. Reiniciar o Servidor**

O servidor precisa ser reiniciado para aplicar as mudanças no código do backend.

**No Windows (PowerShell):**
```powershell
# Parar o servidor atual (Ctrl+C no terminal onde está rodando)
# Depois iniciar novamente:
npm run dev:win
```

**Ou se estiver usando `start:all`:**
```powershell
# Parar o servidor atual (Ctrl+C)
# Depois iniciar novamente:
npm run start:all
```

### **2. Fazer Logout e Login Novamente**

Após reiniciar o servidor, você precisa fazer logout e login novamente para carregar os dados atualizados.

**Opção A: Via Interface**
1. Clique no botão de logout no header (ícone de saída)
2. Faça login novamente com:
   - Username: `staff1`
   - Password: `staff123`

**Opção B: Via Console do Navegador (F12)**
```javascript
// 1. Fazer logout
await fetch('/api/logout', { method: 'POST', credentials: 'include' });

// 2. Aguardar um pouco
await new Promise(r => setTimeout(r, 1000));

// 3. Fazer login como staff
const loginRes = await fetch('/api/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({ username: 'staff1', password: 'staff123' })
});

const loginData = await loginRes.json();
console.log('Login realizado:', {
  id: loginData.id,
  role: loginData.role,
  parentUserId: loginData.parentUserId
});

// 4. Recarregar página
window.location.reload();
```

### **3. Verificar se Funcionou**

Após logout/login, verifique:
- ✅ Menu deve mostrar apenas "Agendamentos"
- ❌ NÃO deve mostrar: Dashboard, Registro, Clínico, Gestão, Análises, Configurações
- ✅ Console do navegador deve mostrar: `parentUserId: 21` (ou outro número, não `undefined`)

## 🔍 Debug

Se ainda não funcionar após reiniciar o servidor e fazer logout/login:

1. **Verificar logs do servidor:**
   - Procurar por: `✅ Login successful:` no terminal do servidor
   - Verificar se `parentUserId` está sendo retornado

2. **Verificar resposta da API:**
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

3. **Verificar banco de dados:**
   ```sql
   SELECT id, username, role, parent_user_id FROM users WHERE username = 'staff1';
   ```
   - Deve retornar `parent_user_id = 21` (ou outro número)

## 📝 Mudanças Aplicadas

1. ✅ `server/auth.ts` - Login route agora busca dados frescos do banco
2. ✅ `server/auth.ts` - User info route garante que `parentUserId` seja retornado
3. ✅ `client/src/components/Sidebar.tsx` - Verifica `parentUserId` corretamente
4. ✅ `client/src/components/Sidebar.tsx` - Oculta grupos de navegação para staff

**IMPORTANTE:** O servidor DEVE ser reiniciado para essas mudanças funcionarem!

