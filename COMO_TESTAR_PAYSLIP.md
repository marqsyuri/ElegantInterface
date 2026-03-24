# 🧪 Como Testar o Relatório de Payslip

## 📝 Passo a Passo Rápido

### 1. Iniciar o Servidor

```bash
npm run dev
```

Aguarde o servidor iniciar (geralmente em `http://localhost:5000`)

### 2. Fazer Login

- Acesse: `http://localhost:5000`
- **Usuário**: `admin`
- **Senha**: `admin`

### 3. Preparar Dados para Teste

#### 3.1. Cadastrar um Profissional (Staff)

1. No menu lateral, clique em **"Staff"**
2. Clique em **"Adicionar Profissional"** ou botão "+"
3. Preencha:
   - Nome: `Maria Silva`
   - Email: `maria@exemplo.com`
   - Telefone: `(11) 99999-9999`
   - Role: `therapist`
4. Clique em **"Salvar"**

#### 3.2. Cadastrar um Cliente

1. No menu lateral, clique em **"Clients"**
2. Clique em **"Adicionar Cliente"** ou botão "+"
3. Preencha:
   - Nome: `João Santos`
   - Email: `joao@exemplo.com`
   - Telefone: `(11) 88888-8888`
4. Clique em **"Salvar"**

#### 3.3. Cadastrar um Procedimento

1. No menu lateral, clique em **"Procedures"**
2. Clique em **"Adicionar Procedimento"** ou botão "+"
3. Preencha:
   - Nome: `Corte de Cabelo`
   - Categoria: `Corte`
   - Duração: `60` (minutos)
   - Preço: `50.00`
4. Clique em **"Salvar"**

#### 3.4. Criar um Agendamento Completo

1. No menu lateral, clique em **"Appointments"**
2. Clique em **"Novo Agendamento"** ou botão "+"
3. Preencha:
   - **Cliente**: Selecione `João Santos`
   - **Profissional**: Selecione `Maria Silva`
   - **Data**: Hoje ou qualquer data
   - **Hora**: Qualquer hora disponível
   - **Procedimentos**: Selecione `Corte de Cabelo`
   - **Status**: **IMPORTANTE** - Mude para `completed` (concluído)
4. Clique em **"Salvar"**

**⚠️ IMPORTANTE**: 
- O agendamento DEVE ter status `completed` (concluído)
- O agendamento DEVE ter um profissional atribuído
- O agendamento DEVE ter pelo menos um procedimento

### 4. Testar o Relatório de Payslip

#### 4.1. Acessar a Página

1. No menu lateral, clique em **"Payslip"** (no grupo "Management")
2. Ou acesse diretamente: `http://localhost:5000/payslip`

#### 4.2. Verificar Dados

Você deve ver:
- ✅ Um card com o nome do profissional (`Maria Silva`)
- ✅ Total de atendimentos: `1`
- ✅ Total de horas trabalhadas: `60min` ou `1h 0min`
- ✅ Tabela de procedimentos com `Corte de Cabelo`
- ✅ Tabela de atendimentos com o agendamento criado

#### 4.3. Testar Filtros

**Teste 1: Filtrar por Profissional**
1. No filtro "Profissional", selecione `Maria Silva`
2. Os dados devem mostrar apenas esse profissional

**Teste 2: Filtrar por Período**
1. Defina uma data inicial (ex: primeiro dia do mês)
2. Defina uma data final (ex: hoje)
3. Os dados devem mostrar apenas atendimentos do período

**Teste 3: Todos os Profissionais**
1. No filtro "Profissional", selecione "Todos os profissionais"
2. Deve mostrar todos os profissionais com atendimentos

#### 4.4. Gerar PDF

1. Clique no botão **"Baixar PDF"** (canto superior direito)
2. O PDF deve ser baixado automaticamente
3. Abra o PDF e verifique:
   - ✅ Cabeçalho com período
   - ✅ Nome do profissional
   - ✅ Estatísticas (total de atendimentos, horas)
   - ✅ Tabela de procedimentos
   - ✅ Tabela de atendimentos
   - ✅ Formatação correta

### 5. Testar Cenários Especiais

#### Teste com Múltiplos Procedimentos

1. Crie um novo agendamento
2. Adicione **2 ou mais procedimentos** no mesmo agendamento
3. Marque como `completed`
4. Verifique no relatório:
   - ✅ A duração total deve ser a soma das durações
   - ✅ Todos os procedimentos devem aparecer na tabela

#### Teste com Múltiplos Profissionais

1. Cadastre outro profissional (ex: `Pedro Costa`)
2. Crie um agendamento para esse profissional
3. Marque como `completed`
4. No relatório, selecione "Todos os profissionais"
5. Verifique:
   - ✅ Deve aparecer 2 cards (um para cada profissional)
   - ✅ Cada card mostra os dados do respectivo profissional

#### Teste sem Dados

1. Selecione um período sem atendimentos (ex: mês passado)
2. Ou selecione um profissional sem atendimentos
3. Verifique:
   - ✅ Deve mostrar mensagem: "Nenhum dado encontrado para o período selecionado"

### 6. Verificar no Banco de Dados (Opcional)

Se quiser verificar diretamente no banco:

```sql
-- Ver agendamentos completos com profissionais
SELECT 
  a.id,
  a.appointment_date,
  a.status,
  s.name as staff_name,
  c.name as client_name,
  a.total_duration
FROM appointments a
INNER JOIN staff s ON a.staff_id = s.id
INNER JOIN clients c ON a.client_id = c.id
WHERE a.status = 'completed'
  AND a.staff_id IS NOT NULL
ORDER BY a.appointment_date DESC;
```

### 7. Troubleshooting

#### Problema: "Nenhum dado encontrado"

**Solução:**
1. Verifique se o agendamento está com status `completed`
2. Verifique se o agendamento tem um profissional atribuído
3. Verifique se o período selecionado contém o agendamento
4. Verifique se o agendamento tem procedimentos

#### Problema: PDF não gera

**Solução:**
1. Abra o console do navegador (F12)
2. Verifique se há erros
3. Certifique-se de que há dados exibidos antes de clicar em "Baixar PDF"

#### Problema: Dados não aparecem

**Solução:**
1. Verifique o console do navegador (F12)
2. Verifique os logs do servidor
3. Verifique se o banco de dados está conectado
4. Verifique se há erros na API (aba Network do DevTools)

### 8. Checklist de Teste

- [ ] Servidor iniciado
- [ ] Login realizado
- [ ] Profissional cadastrado
- [ ] Cliente cadastrado
- [ ] Procedimento cadastrado
- [ ] Agendamento criado com status `completed`
- [ ] Agendamento tem profissional atribuído
- [ ] Agendamento tem procedimentos
- [ ] Página de Payslip acessível
- [ ] Dados exibidos corretamente
- [ ] Filtro por profissional funciona
- [ ] Filtro por período funciona
- [ ] PDF gerado com sucesso
- [ ] PDF contém todas as informações
- [ ] Teste com múltiplos procedimentos funciona
- [ ] Teste com múltiplos profissionais funciona

## ✅ Pronto para Testar!

Agora você tem tudo o que precisa para testar o relatório de payslip. Siga os passos acima e verifique se tudo está funcionando corretamente!

Se encontrar algum problema, verifique a seção "Troubleshooting" ou consulte os logs do servidor.

