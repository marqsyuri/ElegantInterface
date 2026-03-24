# Webapp Staff - Equipes

Webapp para equipes (staffs) acessarem o sistema utilizando as rotas de API existentes.

## Acesso

Após iniciar o servidor, acesse:

```
http://localhost:5000/staff
```

## Funcionalidades

- ✅ Tela de login seguindo a identidade visual do sistema principal
- ✅ Integração com a rota `/api/login` existente
- ✅ Validação de credenciais de staff
- ✅ Subtítulo "Equipes" na página de login
- ✅ Dashboard com calendário de agendamentos
- ✅ Visualização de agendamentos do staff logado
- ✅ Detalhes dos agendamentos em modal
- ✅ Navegação mensal no calendário
- ✅ Integração com rota `/api/appointments/all`

## Estrutura

- `index.html` - Página de login
- `dashboard.html` - Página principal com calendário de agendamentos
- `app.js` - Lógica de autenticação
- `dashboard.js` - Lógica do calendário e agendamentos
- `styles.css` - Estilos gerais
- `dashboard.css` - Estilos do dashboard e calendário

## Fluxo

1. Usuário acessa `/staff`
2. Faz login com credenciais de staff
3. É redirecionado para `/staff/dashboard.html`
4. Visualiza seus agendamentos no calendário mensal
5. Pode clicar em um agendamento para ver detalhes

