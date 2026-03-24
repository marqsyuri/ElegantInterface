# 🔧 Problemas Comuns no Deploy Linux

## ❌ **Problemas e Soluções**

### **1. Erro: "Permission denied" ao executar deploy.sh**

**Causa:** O arquivo não tem permissão de execução.

**Solução:**
```bash
chmod +x deploy.sh
./deploy.sh
```

---

### **2. Erro: "pm2: command not found"**

**Causa:** PM2 não está instalado globalmente.

**Solução:**
```bash
npm install -g pm2
```

---

### **3. Erro: "pg_dump: command not found"**

**Causa:** PostgreSQL não está instalado ou não está no PATH.

**Solução:**
```bash
# Verificar se PostgreSQL está instalado
which psql

# Se não estiver, instalar:
sudo apt update
sudo apt install postgresql postgresql-contrib
```

---

### **4. Erro: "npm: command not found"**

**Causa:** Node.js/npm não está instalado.

**Solução:**
```bash
# Instalar Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

---

### **5. Erro: "Cannot find module" durante npm install**

**Causa:** Problemas com cache ou node_modules corrompido.

**Solução:**
```bash
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

---

### **6. Erro: "Build failed"**

**Causa:** Erros de TypeScript ou dependências faltando.

**Solução:**
```bash
# Verificar erros TypeScript
npm run check

# Limpar e rebuild
rm -rf dist client/dist
npm run build
```

---

### **7. Erro: "Port 5000 already in use"**

**Causa:** Outro processo está usando a porta.

**Solução:**
```bash
# Encontrar processo
lsof -i :5000
# ou
netstat -tulpn | grep :5000

# Matar processo
kill -9 <PID>

# Ou mudar porta no .env
PORT=5001
```

---

### **8. Erro: "Database connection failed"**

**Causa:** PostgreSQL não está rodando ou credenciais incorretas.

**Solução:**
```bash
# Verificar se PostgreSQL está rodando
sudo systemctl status postgresql

# Iniciar PostgreSQL
sudo systemctl start postgresql

# Verificar .env
cat .env | grep DATABASE_URL

# Testar conexão
psql -U postgres -d estetica_pro
```

---

### **9. Erro: "ENOENT: no such file or directory"**

**Causa:** Diretório do projeto não existe ou caminho incorreto.

**Solução:**
```bash
# Verificar se o diretório existe
ls -la /root/versao/ElegantInterface-main

# Se não existir, criar ou ajustar caminho no script
```

---

### **10. Erro: "Cannot read property" ou erros JavaScript**

**Causa:** Versão do Node.js incompatível ou código com erro.

**Solução:**
```bash
# Verificar versão do Node.js (deve ser 18+)
node --version

# Ver logs detalhados
pm2 logs estetica-pro --lines 100

# Verificar se build foi feito corretamente
ls -la dist/
```

---

### **11. Script não executa no Windows**

**Causa:** Script é para Linux/bash, não funciona no Windows PowerShell.

**Solução:**
- Execute o script **no servidor Linux**, não no Windows
- Ou use WSL (Windows Subsystem for Linux) no Windows

---

### **12. Arquivo .env não encontrado**

**Causa:** Arquivo .env não existe no servidor.

**Solução:**
```bash
# Criar .env
nano .env

# Adicionar:
DATABASE_URL=postgresql://postgres:SENHA@localhost:5432/estetica_pro
SESSION_SECRET=chave_secreta_aqui
NODE_ENV=production
PORT=5000
```

---

## 🔍 **Como Diagnosticar Problemas**

### **1. Verificar Logs**
```bash
# Logs do PM2
pm2 logs estetica-pro --lines 100

# Logs do sistema
journalctl -u estetica-pro -f

# Logs do Nginx (se usar)
tail -f /var/log/nginx/error.log
```

### **2. Verificar Status**
```bash
# Status do PM2
pm2 status

# Status do PostgreSQL
sudo systemctl status postgresql

# Status do Nginx
sudo systemctl status nginx
```

### **3. Testar Manualmente**
```bash
# Testar conexão com banco
psql -U postgres -d estetica_pro

# Testar se aplicação responde
curl http://localhost:5000

# Testar build manualmente
npm run build
```

---

## 📞 **Se Nada Funcionar**

1. **Verifique os logs completos:**
   ```bash
   pm2 logs estetica-pro --lines 200
   ```

2. **Verifique se todos os pré-requisitos estão instalados:**
   ```bash
   node --version  # Deve ser 18+
   npm --version
   psql --version
   pm2 --version
   ```

3. **Execute o deploy passo a passo manualmente:**
   - Veja o arquivo `DEPLOY_LINUX.md` para instruções detalhadas

4. **Verifique permissões:**
   ```bash
   ls -la deploy.sh
   chmod +x deploy.sh
   ```

---

**Se você puder me dizer qual erro específico apareceu, posso ajudar melhor!** 🚀

