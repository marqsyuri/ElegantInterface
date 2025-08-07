# 📋 CHECKLIST DE TESTES - ESTÉTICA PRO
*Sistema pronto para uso semanal - Janeiro 2025*

## 🔐 1. AUTENTICAÇÃO E ACESSO
- [ ] **Login funciona corretamente**
  - Acesse o sistema e faça login
  - Verifique se o dashboard carrega após login
  - Teste logout e login novamente

- [ ] **Perfil da empresa está completo**
  - Vá em Settings → Profile
  - Verifique se todos os dados estão preenchidos:
    - Nome da clínica
    - Endereço completo
    - Telefone e WhatsApp
    - Email
    - Foto do perfil (opcional)

## 👥 2. GESTÃO DE CLIENTES
- [ ] **Cadastro de clientes funciona**
  - Vá em Clients → Add New Client
  - Cadastre 2-3 clientes de teste
  - Verifique se os dados são salvos corretamente
  
- [ ] **Upload de fotos dos clientes**
  - Edite um cliente existente
  - Teste upload de foto de perfil
  - Verifique se a foto aparece na lista

- [ ] **Busca e filtros de clientes**
  - Use a barra de pesquisa
  - Teste filtros por status

## 🛍️ 3. SERVIÇOS E PREÇOS
- [ ] **Cadastro de serviços**
  - Vá em Services (dentro de Clients)
  - Cadastre pelo menos 5 serviços principais
  - Inclua: nome, descrição, duração, preço, categoria
  
- [ ] **Categorias de serviços**
  - Organize serviços por categorias
  - Verifique se aparecem corretamente no sistema público

## ⏰ 4. HORÁRIOS DE FUNCIONAMENTO
- [ ] **Configurar horários**
  - Vá em Settings → Operating Hours
  - Configure todos os dias da semana
  - Defina horário de almoço onde aplicável
  - Marque dias fechados (se houver)

## 📅 5. AGENDAMENTOS
- [ ] **Criar agendamentos internos**
  - Vá em Appointments → Add Appointment
  - Crie 3-5 agendamentos de teste
  - Use diferentes clientes e serviços
  
- [ ] **Visualização do calendário**
  - Teste a visualização semanal
  - Teste a visualização diária
  - Verifique se horários estão no fuso da Nova Zelândia

- [ ] **Upload de fotos nos agendamentos**
  - Edite um agendamento
  - Teste upload de "antes" e "depois"
  - Verifique compressão automática

## 🌐 6. LINK PÚBLICO PARA CLIENTES
- [ ] **Gerar link único**
  - Vá em Settings → Client Access
  - Gere ou copie seu link único
  
- [ ] **Testar página pública**
  - Abra o link em aba anônima/incógnito
  - Verifique se informações aparecem:
    - Nome da clínica
    - Endereço e telefone
    - Horários de funcionamento
    - Lista de serviços com preços
    - Botão WhatsApp funciona

- [ ] **Sistema de agendamento público**
  - No link público, clique "Book Appointment"
  - Preencha formulário completo
  - Submeta agendamento
  - Verifique se aparece notificação no sistema interno

## 💰 7. GESTÃO FINANCEIRA
- [ ] **Registrar transações**
  - Vá em Financial
  - Adicione receitas (pagamentos recebidos)
  - Adicione despesas (produtos comprados)
  
- [ ] **Relatórios financeiros**
  - Verifique gráficos do dashboard
  - Teste filtros por período

## 🏥 8. REGISTROS CLÍNICOS
- [ ] **Criar registros**
  - Vá em Clinical
  - Adicione registros para clientes existentes
  - Teste diferentes tipos de procedimentos

## 📦 9. ESTOQUE/MATERIAIS
- [ ] **Cadastrar produtos**
  - Vá em Materials
  - Adicione materiais que você usa
  - Configure quantidades mínimas

## 💬 10. COMUNICAÇÃO E WHATSAPP
- [ ] **Testar WhatsApp do link público**
  - No link público, clique "Contact via WhatsApp"
  - Verifique se abre WhatsApp com mensagem automática
  
- [ ] **Mensagens internas**
  - Vá em Communication
  - Teste envio de mensagem

## 📊 11. RELATÓRIOS E ANALYTICS
- [ ] **Dashboard principal**
  - Verifique estatísticas do dia
  - Confirme se números estão corretos
  
- [ ] **Analytics detalhado**
  - Vá em Analytics
  - Teste relatório dos últimos 30 dias
  - Verifique gráficos

## 📱 12. RESPONSIVIDADE MÓVEL
- [ ] **Testar no celular**
  - Acesse sistema pelo celular
  - Teste navegação com menu hamburguer
  - Verifique se todas as funções funcionam
  
- [ ] **Link público no móvel**
  - Teste link público no celular
  - Verifique formulário de agendamento móvel

## 🔄 13. INTEGRAÇÃO N8N (OPCIONAL)
- [ ] **Conexão banco de dados**
  - Teste conexão com credenciais fornecidas
  - Verifique se consegue consultar tabelas
  
## ⚠️ 14. TESTES DE ESTRESSE
- [ ] **Volume de dados**
  - Crie pelo menos 10 clientes
  - Crie pelo menos 15 agendamentos
  - Teste performance do sistema
  
- [ ] **Múltiplos agendamentos públicos**
  - Simule 3-5 agendamentos pelo link público
  - Verifique se todos chegam no sistema

---

## 🚨 PROBLEMAS CRÍTICOS - REPORTE IMEDIATAMENTE:
- [ ] Sistema não carrega
- [ ] Login não funciona
- [ ] Link público não abre
- [ ] Agendamentos públicos não chegam
- [ ] WhatsApp não funciona
- [ ] Fotos não fazem upload
- [ ] Dados não salvam

## ✅ TUDO FUNCIONANDO? 
**Parabéns! Seu sistema está pronto para uso profissional esta semana!**

---
*Checklist criado em: Janeiro 2025*
*Sistema: Estética Pro v2.0*