const db = require('./index');
const bcrypt = require('bcryptjs');

async function seed() {
  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    // Seed users
    const hashedPassword = await bcrypt.hash('Satu123', 10);
    await client.query(`
      INSERT INTO users (username, email, password, is_admin) 
      VALUES 
        ('admin', 'admin@bkp.com', $1, true),
        ('user1', 'user1@bkp.com', $1, false),
        ('user2', 'user2@bkp.com', $1, false)
      ON CONFLICT (username) DO NOTHING;
    `, [hashedPassword]);

    // Seed products
    await client.query(`
      INSERT INTO products (name, description, price, quantity, is_active, is_flash) 
      VALUES 
        ('Smartphone X', 'Latest model with advanced features', 899.99, 50, true, true)
      ON CONFLICT DO NOTHING;
    `);

    // Create a flash sale starting now and ending in 24 hours
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    await client.query(`
      INSERT INTO flash_sales (name, start_time, end_time, is_active) 
      VALUES ('Flash Sale', $1, $2, true)
      ON CONFLICT DO NOTHING;
    `, [now, tomorrow]);

    // Get the flash sale id
    const flashSaleResult = await client.query('SELECT id FROM flash_sales LIMIT 1');
    const flashSaleId = flashSaleResult.rows[0].id;

    // Add flash sale products
    await client.query(`
      INSERT INTO flash_sale_products (flash_sale_id, product_id, discount_percentage, max_quantity_per_user)
      SELECT $1, id, 
        CASE 
          WHEN name = 'Smartphone X' THEN 20
        END, 1
      FROM products 
      WHERE is_flash = true
      ON CONFLICT DO NOTHING;
    `, [flashSaleId]);

    await client.query('COMMIT');
    console.log('Database seeded successfully');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Seed failed', e);
    throw e;
  } finally {
    client.release();
  }
}

// Direct execution
if (require.main === module) {
  seed().catch(console.error);
}

module.exports = {
  seed
};
