# 📝 Guia: Como Criar e Testar Staff Users

## 🎯 Objetivo
Criar um usuário do tipo staff que pode acessar o sistema e visualizar apenas sua própria agenda.

## 📋 Passo a Passo

### 1. **Executar Migration (Já feito ✅)**
```bash
node run-migration-staff.js
```

### 2. **Criar Staff User via API**

#### Opção A: Via Console do Navegador (Recomendado)

1. Abra o navegador em `http://localhost:5000`
2. Faça login como admin (username: `admin`, password: `admin`)
3. Abra o Console do navegador (F12)
4. Execute o seguinte código:

```javascript
// Criar staff user
fetch('/api/staff-users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',
  body: JSON.stringify({
    username: 'staff1',
    email: 'staff1@test.com',
    password: 'staff123',
    firstName: 'Staff',
    lastName: 'Test'
  })
})
.then(res => res.json())
.then(data => {
  console.log('✅ Staff criado:', data);
  console.log('📝 Credenciais:');
  console.log('   Username: staff1');
  console.log('   Password: staff123');
})
.catch(err => console.error('❌ Erro:', err));
```

#### Opção B: Via Script Node.js

```bash
node create-staff-user.js
```

### 3. **Testar Login como Staff**

1. Faça logout do admin
2. Faça login com as credenciais do staff:
   - Username: `staff1`
   - Password: `staff123`

### 4. **Verificar Funcionalidades**

Como staff, você deve ver:
- ✅ Apenas o menu "Agendamentos"
- ✅ Apenas agendamentos onde o staff está vinculado
- ❌ NÃO ver: Dashboard, Clientes, Configurações, etc.

### 5. **Verificar Agendamentos**

1. Vá para a página de Agendamentos
2. Verifique que apenas os agendamentos do staff são exibidos
3. Tente acessar outras páginas (devem retornar 403 Forbidden)

## 🔍 Verificações Técnicas

### Verificar no Banco de Dados

```sql
-- Ver todos os staff users
SELECT id, username, email, role, parent_user_id, max_staff_count 
FROM users 
WHERE role = 'staff';

-- Ver agendamentos de um staff específico
SELECT a.*, ap.staff_id 
FROM appointments a
LEFT JOIN appointment_procedures ap ON ap.appointment_id = a.id
WHERE a.staff_id = [ID_DO_STAFF] OR ap.staff_id = [ID_DO_STAFF];
```

## 🐛 Troubleshooting

### Erro: "Maximum staff count reached"
- Aumente o `maxStaffCount` do admin:
```sql
UPDATE users SET max_staff_count = 20 WHERE id = 1;
```

### Staff não vê agendamentos
- Verifique se os agendamentos têm `staffId` correto
- Verifique se o staff está vinculado ao appointment_procedures

### Staff vê menu completo
- Verifique se o `role` está como 'staff' e `parentUserId` está preenchido
- Limpe o cache do navegador

## 📊 API Endpoints

- `GET /api/staff-users` - Listar staff users (admin only)
- `POST /api/staff-users` - Criar staff user (admin only)
- `PUT /api/staff-users/:id` - Atualizar staff user (admin only)
- `DELETE /api/staff-users/:id` - Deletar staff user (admin only)
- `PUT /api/user/max-staff-count` - Atualizar limite de staffs (admin only)

