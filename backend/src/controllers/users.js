const bcrypt = require('bcryptjs');
const db = require('../db');

async function getAllUsers(request, reply) {
  try {
    const result = await db.query(`
      SELECT 
        id, 
        username, 
        email, 
        is_admin, 
        created_at, 
        updated_at
      FROM 
        users
      ORDER BY 
        id ASC
    `);

    return result.rows;
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({
      message: 'Error fetching users',
      error: error.message
    });
  }
}

async function getUserById(request, reply) {
  const { id } = request.params;
  
  try {
    const result = await db.query(`
      SELECT 
        id, 
        username, 
        email, 
        is_admin, 
        created_at, 
        updated_at
      FROM 
        users
      WHERE 
        id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return reply.code(404).send({
        message: 'User not found'
      });
    }

    return result.rows[0];
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({
      message: 'Error fetching user',
      error: error.message
    });
  }
}

async function createUser(request, reply) {
  const { username, email, password, is_admin = false } = request.body;
  
  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await db.query(
      'INSERT INTO users (username, email, password, is_admin) VALUES ($1, $2, $3, $4) RETURNING id, username, email, is_admin, created_at, updated_at',
      [username, email, hashedPassword, is_admin]
    );

    return result.rows[0];
  } catch (error) {
    request.log.error(error);
    
    // Check for duplicate key error
    if (error.code === '23505') { // PostgreSQL unique constraint violation code
      return reply.code(400).send({
        message: 'Username or email already exists'
      });
    }
    
    return reply.code(500).send({
      message: 'Error creating user',
      error: error.message
    });
  }
}

async function updateUser(request, reply) {
  const { id } = request.params;
  const { username, email, password, is_admin } = request.body;
  
  try {
    let query, params;
    
    // If password is provided, update it as well
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      query = `
        UPDATE users 
        SET 
          username = $1, 
          email = $2, 
          password = $3, 
          is_admin = $4, 
          updated_at = CURRENT_TIMESTAMP 
        WHERE id = $5 
        RETURNING id, username, email, is_admin, created_at, updated_at
      `;
      params = [username, email, hashedPassword, is_admin, id];
    } else {
      query = `
        UPDATE users 
        SET 
          username = $1, 
          email = $2, 
          is_admin = $3, 
          updated_at = CURRENT_TIMESTAMP 
        WHERE id = $4 
        RETURNING id, username, email, is_admin, created_at, updated_at
      `;
      params = [username, email, is_admin, id];
    }

    const result = await db.query(query, params);

    if (result.rows.length === 0) {
      return reply.code(404).send({
        message: 'User not found'
      });
    }

    return result.rows[0];
  } catch (error) {
    request.log.error(error);
    
    // Check for duplicate key error
    if (error.code === '23505') { // PostgreSQL unique constraint violation code
      return reply.code(400).send({
        message: 'Username or email already exists'
      });
    }
    
    return reply.code(500).send({
      message: 'Error updating user',
      error: error.message
    });
  }
}

async function deleteUser(request, reply) {
  const { id } = request.params;
  
  try {
    const result = await db.query(
      'DELETE FROM users WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return reply.code(404).send({
        message: 'User not found'
      });
    }

    return { message: 'User deleted successfully' };
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({
      message: 'Error deleting user',
      error: error.message
    });
  }
}

// Get user purchase history
async function getUserPurchases(request, reply) {
  const { id } = request.params;
  
  try {
    // First check if user exists
    const userResult = await db.query(
      'SELECT id FROM users WHERE id = $1',
      [id]
    );

    if (userResult.rows.length === 0) {
      return reply.code(404).send({
        message: 'User not found'
      });
    }
    
    const result = await db.query(`
      SELECT 
        p.id as purchase_id,
        p.purchase_date,
        p.purchase_price,
        p.quantity,
        p.status,
        prod.id as product_id,
        prod.name as product_name,
        fs.id as flash_sale_id,
        fs.name as flash_sale_name
      FROM 
        purchases p
      JOIN 
        products prod ON p.product_id = prod.id
      LEFT JOIN 
        flash_sales fs ON p.flash_sale_id = fs.id
      WHERE 
        p.user_id = $1
      ORDER BY 
        p.purchase_date DESC
    `, [id]);

    return result.rows;
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({
      message: 'Error fetching user purchases',
      error: error.message
    });
  }
}

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUserPurchases
};
