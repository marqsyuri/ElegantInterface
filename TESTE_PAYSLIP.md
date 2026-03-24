# 📋 Guia de Teste - Relatório de Payslip

## 🚀 Como Testar

### 1. Iniciar o Servidor

```bash
npm run dev
```

O servidor iniciará em: `http://localhost:5000`

### 2. Pré-requisitos para Teste

Para o relatório de payslip funcionar, você precisa ter:

#### ✅ Dados Necessários:

1. **Profissionais (Staff) cadastrados**
   - Acesse: `/staff`
   - Cadastre pelo menos 1 profissional

2. **Clientes cadastrados**
   - Acesse: `/clients`
   - Cadastre pelo menos 1 cliente

3. **Procedimentos cadastrados**
   - Acesse: `/procedures`
   - Cadastre pelo menos 1 procedimento com duração

4. **Agendamentos COMPLETADOS com profissional atribuído**
   - Acesse: `/appointments`
   - Crie um agendamento
   - **IMPORTANTE**: 
     - Atribua um profissional (staff)
     - Marque o status como "completed" (concluído)
     - O agendamento deve ter procedimentos associados

### 3. Testar a Página de Payslip

#### Acessar a Página:
1. No menu lateral, clique em **"Payslip"** (no grupo "Management")
2. Ou acesse diretamente: `http://localhost:5000/payslip`

#### Testar Filtros:

**Teste 1: Ver todos os profissionais**
- Deixe o filtro "Profissional" como "Todos os profissionais"
- Selecione um período (ex: mês atual)
- Clique para carregar os dados
- ✅ Deve mostrar todos os profissionais com atendimentos completos

**Teste 2: Filtrar por profissional específico**
- Selecione um profissional no dropdown
- Selecione um período
- ✅ Deve mostrar apenas os dados do profissional selecionado

**Teste 3: Filtrar por período**
- Selecione uma data inicial (ex: primeiro dia do mês)
- Selecione uma data final (ex: hoje)
- ✅ Deve mostrar apenas atendimentos do período selecionado

**Teste 4: Combinar filtros**
- Selecione um profissional específico
- Selecione um período específico
- ✅ Deve mostrar dados filtrados por ambos os critérios

### 4. Verificar Dados Exibidos

Para cada profissional, você deve ver:

#### Resumo de Procedimentos:
- Tabela com:
  - Nome do procedimento
  - Categoria
  - Quantidade de vezes realizado
  - Duração total (soma de todas as durações)

#### Detalhes dos Atendimentos:
- Tabela com:
  - Data/Hora do atendimento
  - Nome do cliente
  - Procedimentos realizados
  - Duração do atendimento

#### Estatísticas:
- Total de atendimentos
- Total de horas trabalhadas

### 5. Testar Geração de PDF

1. Certifique-se de que há dados exibidos na tela
2. Clique no botão **"Baixar PDF"** (canto superior direito)
3. ✅ O PDF deve ser baixado automaticamente
4. Abra o PDF e verifique:
   - Cabeçalho com período
   - Seção para cada profissional
   - Tabelas de procedimentos
   - Tabelas de atendimentos
   - Formatação correta

### 6. Casos de Teste Especiais

#### Teste sem dados:
- Selecione um período sem atendimentos completos
- ✅ Deve mostrar mensagem: "Nenhum dado encontrado para o período selecionado"

#### Teste com múltiplos profissionais:
- Crie atendimentos completos para diferentes profissionais
- ✅ Deve mostrar um card para cada profissional

#### Teste com múltiplos procedimentos:
- Crie um agendamento com vários procedimentos
- ✅ Deve somar corretamente as durações
- ✅ Deve listar todos os procedimentos no detalhe

### 7. Verificar API Diretamente

Você pode testar a API diretamente:

```bash
# Todos os profissionais
curl http://localhost:5000/api/payslip?startDate=2024-01-01&endDate=2024-12-31

# Profissional específico
curl http://localhost:5000/api/payslip?staffId=1&startDate=2024-01-01&endDate=2024-12-31

# Com período específico
curl http://localhost:5000/api/payslip?startDate=2024-12-01&endDate=2024-12-31
```

**Nota**: Você precisa estar autenticado. No navegador, após fazer login, abra o DevTools (F12) e use a aba Network para ver as requisições.

## 🐛 Troubleshooting

### Problema: "Nenhum dado encontrado"

**Possíveis causas:**
1. Não há agendamentos com status "completed"
2. Os agendamentos não têm profissional atribuído (staffId)
3. O período selecionado não contém atendimentos

**Solução:**
- Verifique se os agendamentos estão marcados como "completed"
- Verifique se os agendamentos têm um profissional atribuído
- Aumente o período de busca

### Problema: PDF não gera

**Possíveis causas:**
1. Não há dados para gerar o PDF
2. Erro no navegador (verifique o console)

**Solução:**
- Verifique o console do navegador (F12)
- Certifique-se de que há dados exibidos antes de clicar em "Baixar PDF"

### Problema: Dados não aparecem

**Possíveis causas:**
1. Erro na API
2. Problema de autenticação
3. Erro no banco de dados

**Solução:**
- Verifique o console do navegador (F12)
- Verifique os logs do servidor
- Verifique se o banco de dados está conectado

## ✅ Checklist de Teste

- [ ] Servidor iniciado corretamente
- [ ] Página de Payslip acessível
- [ ] Filtro por profissional funciona
- [ ] Filtro por período funciona
- [ ] Dados são exibidos corretamente
- [ ] Tabela de procedimentos mostra dados corretos
- [ ] Tabela de atendimentos mostra dados corretos
- [ ] Estatísticas estão corretas (total de atendimentos, horas)
- [ ] PDF é gerado com sucesso
- [ ] PDF contém todas as informações
- [ ] Formatação do PDF está correta
- [ ] Teste sem dados mostra mensagem apropriada
- [ ] Teste com múltiplos profissionais funciona
- [ ] Teste com múltiplos procedimentos funciona

## 📝 Notas Importantes

1. **Apenas agendamentos COMPLETADOS são considerados**
   - Agendamentos com status "pending", "scheduled", "confirmed" não aparecem
   - Apenas "completed" são contabilizados

2. **Profissional é obrigatório**
   - Agendamentos sem profissional atribuído (staffId) não aparecem no relatório

3. **Duração é calculada automaticamente**
   - Se o agendamento tem `totalDuration`, usa esse valor
   - Se não, soma as durações dos procedimentos
   - Se não há procedimentos, usa a duração do agendamento

4. **Período padrão**
   - Ao abrir a página, o período padrão é o mês atual (do dia 1 até hoje)

