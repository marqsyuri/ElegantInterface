require('dotenv').config({ path: '/root/versao/ElegantInterface-main/.env' });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Simula exatamente o que o frontend envia
const body = {
  name: "Produto Teste",
  code: "",
  description: "",
  price: 25.90,
  costPrice: null,
  currentStock: 10,
  minStock: 0,
  maxStock: 0,
  unit: "un",
  isActive: true,
  categoryId: null,
  supplierId: null,
};

pool.query(
  `INSERT INTO products (user_id, name, code, price, unit, is_active, current_stock, min_stock, max_stock)
   VALUES (1, $1, $2, $3, $4, $5, $6, $7, $8)
   RETURNING id`,
  [body.name, body.code || '', body.price, body.unit, body.isActive, body.currentStock, body.minStock, body.maxStock]
).then(r => {
  console.log('INSERT OK, id:', r.rows[0].id);
  return pool.query('DELETE FROM products WHERE id = $1', [r.rows[0].id]);
}).then(() => { console.log('CLEANUP OK'); pool.end(); })
  .catch(e => { console.error('ERRO:', e.message, '\ndetail:', e.detail); pool.end(); });
