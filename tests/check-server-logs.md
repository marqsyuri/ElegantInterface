# Como Ver os Logs do Servidor

## No Terminal do Servidor

Quando você tentar criar um usuário staff, verá logs como:

```
[isAdmin] ===== START =====
[isAdmin] isAuthenticated: true/false
[isAdmin] req.user type: object/number/undefined
[isAdmin] req.user: {...}
[isAdmin] Checking user: {...}
```

## Endpoint de Debug

Acesse: `http://localhost:5000/api/debug-auth`

Este endpoint:
- Requer autenticação (`isAuthenticated`)
- Requer admin (`isAdmin`)
- Retorna informações sobre o usuário

Se retornar 403, os logs mostrarão exatamente por quê.

## Teste com Playwright

Execute:
```bash
npx playwright test tests/debug-full-auth-flow.spec.ts --headed
```

Os logs aparecerão no terminal onde o servidor está rodando (`npm run dev`).

