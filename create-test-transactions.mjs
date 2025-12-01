import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function createTestTransactions() {
  try {
    console.log('💰 Creating test transactions for October...\n');
    
    // Income transaction
    const incomeResult = await pool.query(`
      INSERT INTO transactions (user_id, type, description, amount, transaction_date, category, is_paid)
      VALUES (1, 'income', 'Product Sale - Hair Treatment', '150.00', CURRENT_DATE, 'Product Sales', true)
      RETURNING id, description, amount, transaction_date
    `);
    
    console.log('✅ Income transaction created:');
    console.log(`  [${incomeResult.rows[0].id}] ${incomeResult.rows[0].description}`);
    console.log(`  Amount: $${incomeResult.rows[0].amount}`);
    console.log(`  Date: ${incomeResult.rows[0].transaction_date}\n`);
    
    // Expense transaction
    const expenseResult = await pool.query(`
      INSERT INTO transactions (user_id, type, description, amount, transaction_date, category, is_paid)
      VALUES (1, 'expense', 'Supplies Purchase - Hair Products', '80.00', CURRENT_DATE, 'Supplies', true)
      RETURNING id, description, amount, transaction_date
    `);
    
    console.log('✅ Expense transaction created:');
    console.log(`  [${expenseResult.rows[0].id}] ${expenseResult.rows[0].description}`);
    console.log(`  Amount: $${expenseResult.rows[0].amount}`);
    console.log(`  Date: ${expenseResult.rows[0].transaction_date}\n`);
    
    // Calculate totals
    console.log('📊 October Financial Summary:\n');
    
    const summary = await pool.query(`
      SELECT 
        (SELECT COALESCE(SUM(CAST(amount AS DECIMAL)), 0) 
         FROM transactions 
         WHERE user_id = 1 AND type = 'income' 
         AND transaction_date >= DATE_TRUNC('month', CURRENT_DATE)
         AND transaction_date <= (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')
        ) as trans_income,
        (SELECT COALESCE(SUM(CAST(amount AS DECIMAL)), 0) 
         FROM transactions 
         WHERE user_id = 1 AND type = 'expense'
         AND transaction_date >= DATE_TRUNC('month', CURRENT_DATE)
         AND transaction_date <= (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')
        ) as trans_expense,
        (SELECT COALESCE(SUM(CAST(COALESCE(total_price, total_amount, '0') AS DECIMAL)), 0)
         FROM appointments
         WHERE user_id = 1 AND status = 'completed'
         AND appointment_date >= DATE_TRUNC('month', CURRENT_DATE)
         AND appointment_date <= (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month')
        ) as appt_revenue
    `);
    
    const stats = summary.rows[0];
    const totalIncome = parseFloat(stats.trans_income) + parseFloat(stats.appt_revenue);
    const netProfit = totalIncome - parseFloat(stats.trans_expense);
    
    console.log(`  Transactions Income:   $${parseFloat(stats.trans_income).toFixed(2)}`);
    console.log(`  Appointments Revenue:  $${parseFloat(stats.appt_revenue).toFixed(2)}`);
    console.log(`  ────────────────────────────────────`);
    console.log(`  TOTAL Income:          $${totalIncome.toFixed(2)}`);
    console.log(`  Expenses:              $${parseFloat(stats.trans_expense).toFixed(2)}`);
    console.log(`  ────────────────────────────────────`);
    console.log(`  NET PROFIT:            $${netProfit.toFixed(2)}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

createTestTransactions();

