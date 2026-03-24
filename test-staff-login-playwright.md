# 🧪 Teste Completo: Login de Staff com Playwright

## ✅ Status: Staff User Criado

**Credenciais:**
- Username: `staff1`
- Password: `staff123`
- ID: 22
- Parent User ID: 21 (admin)

## 📋 Passos para Testar

### 1. **Fazer Logout do Admin**

No console do navegador (F12), execute:
```javascript
fetch('/api/logout', { 
  method: 'POST', 
  credentials: 'include' 
}).then(() => {
  console.log('✅ Logout realizado');
  window.location.reload();
});
```

### 2. **Fazer Login como Staff**

Na página de login, use:
- **Username:** `staff1`
- **Password:** `staff123`

Ou via console (após logout):
```javascript
fetch('/api/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({ username: 'staff1', password: 'staff123' })
}).then(r => r.json()).then(d => {
  console.log('✅ Login:', d);
  window.location.reload();
});
```

### 3. **Verificar Menu (Deve mostrar apenas "Agendamentos")**

Após login como staff, verifique:
- ✅ Menu lateral mostra apenas "Agendamentos"
- ❌ NÃO mostra: Dashboard, Clientes, Configurações, etc.

### 4. **Verificar Agendamentos**

1. Clique em "Agendamentos"
2. Verifique que apenas agendamentos do staff são exibidos
3. Tente acessar `/clients` diretamente (deve retornar 403)

### 5. **Verificar Acesso Restrito**

Tente acessar:
- `/clients` - Deve retornar 403 Forbidden
- `/settings` - Deve retornar 403 Forbidden
- `/` (Dashboard) - Deve redirecionar ou retornar 403

## 🔍 Verificações Técnicas

### Verificar no Console do Navegador

```javascript
// Verificar dados do usuário
fetch('/api/user', { credentials: 'include' })
  .then(r => r.json())
  .then(u => {
    console.log('User:', u);
    console.log('Role:', u.role);
    console.log('Parent ID:', u.parentUserId);
    console.log('Is Staff:', u.role === 'staff' && u.parentUserId);
  });

// Verificar agendamentos (deve retornar apenas do staff)
fetch('/api/appointments', { credentials: 'include' })
  .then(r => r.json())
  .then(apts => {
    console.log('Appointments:', apts);
    console.log('Count:', apts.length);
  });
```

## 📊 Resultado Esperado

Como staff, você deve:
- ✅ Ver apenas menu "Agendamentos"
- ✅ Ver apenas seus próprios agendamentos
- ✅ NÃO conseguir acessar `/clients`
- ✅ NÃO conseguir acessar `/settings`
- ✅ NÃO ver Dashboard completo

