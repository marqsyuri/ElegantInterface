# ⚡ Deploy Rápido - Linux

## 🚀 Processo Resumido de Atualização

### **1. Conectar ao Servidor**
```bash
ssh usuario@servidor-linux
cd /root/versao/ElegantInterface-main
```

### **2. Executar Script de Deploy**
```bash
# Tornar executável (primeira vez)
chmod +x deploy.sh

# Executar
./deploy.sh
```

### **3. Ou Fazer Manualmente (Passo a Passo)**
```bash
# 1. Backup
pg_dump -U postgres estetica_pro > backup_$(date +%Y%m%d).sql

# 2. Parar
pm2 stop estetica-pro

# 3. Atualizar arquivos (via SCP/Git/Upload)

# 4. Instalar dependências
npm install

# 5. Atualizar banco
npm run db:push

# 6. Build
npm run build

# 7. Reiniciar
pm2 restart estetica-pro

# 8. Verificar
pm2 logs estetica-pro
```

---

## 📤 **Do Windows para Linux**

### **Opção 1: WinSCP (Interface Gráfica)**
1. Abrir WinSCP
2. Conectar ao servidor Linux
3. Navegar para `/root/versao/ElegantInterface-main`
4. Fazer upload dos arquivos (exceto `node_modules`, `.env`, `dist`)

### **Opção 2: SCP (Linha de Comando)**
```powershell
# No PowerShell do Windows
scp -r C:\Projetos\replitSaloon\ElegantInterface-main\* usuario@servidor:/root/versao/ElegantInterface-main/
```

### **Opção 3: Git (Recomendado)**
```bash
# No servidor Linux
cd /root/versao/ElegantInterface-main
git pull origin main
```

---

## ✅ **Checklist Rápido**

- [ ] Backup do banco feito
- [ ] Arquivos atualizados no servidor
- [ ] `npm install` executado
- [ ] `npm run build` executado
- [ ] `.env` configurado
- [ ] PM2 reiniciado
- [ ] Sistema testado

---

## 🔧 **Comandos Essenciais**

```bash
# Status
pm2 status

# Logs
pm2 logs estetica-pro

# Reiniciar
pm2 restart estetica-pro

# Parar
pm2 stop estetica-pro
```

---

**📖 Documentação completa:** Ver `DEPLOY_LINUX.md`

