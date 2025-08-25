const db = require('../db');

async function getAllProducts(request, reply) {
  try {
    // Get all products with their flash sale info if available
    const result = await db.query(`
      SELECT 
        p.id, 
        p.name, 
        p.description, 
        p.price, 
        p.quantity, 
        p.is_active, 
        p.is_flash,
        p.created_at,
        p.updated_at,
        fs.id as flash_sale_id,
        fs.name as flash_sale_name,
        fs.start_time as flash_sale_start,
        fs.end_time as flash_sale_end,
        fsp.discount_percentage
      FROM 
        products p
      LEFT JOIN 
        flash_sale_products fsp ON p.id = fsp.product_id
      LEFT JOIN 
        flash_sales fs ON fsp.flash_sale_id = fs.id AND fs.is_active = true
      WHERE 
        p.is_active = true
      ORDER BY 
        p.id ASC
    `);
    
    // Process results to format them nicely
    const products = result.rows.map(product => {
      const hasFlashSale = product.flash_sale_id !== null;
      
      return {
        id: product.id,
        name: product.name,
        description: product.description,
        price: parseFloat(product.price),
        quantity: product.quantity,
        is_active: product.is_active,
        is_flash: product.is_flash,
        created_at: product.created_at,
        updated_at: product.updated_at,
        flash_sale: hasFlashSale ? {
          id: product.flash_sale_id,
          name: product.flash_sale_name,
          start_time: product.flash_sale_start,
          end_time: product.flash_sale_end,
          discount_percentage: product.discount_percentage,
          discounted_price: parseFloat((product.price * (1 - product.discount_percentage / 100)).toFixed(2))
        } : null
      };
    });

    return products;
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({
      message: 'Error fetching products',
      error: error.message
    });
  }
}

async function getProductById(request, reply) {
  const { id } = request.params;
  
  try {
    // Get product with flash sale info if available
    const result = await db.query(`
      SELECT 
        p.id, 
        p.name, 
        p.description, 
        p.price, 
        p.quantity, 
        p.is_active, 
        p.is_flash,
        p.created_at,
        p.updated_at,
        fs.id as flash_sale_id,
        fs.name as flash_sale_name,
        fs.start_time as flash_sale_start,
        fs.end_time as flash_sale_end,
        fsp.discount_percentage
      FROM 
        products p
      LEFT JOIN 
        flash_sale_products fsp ON p.id = fsp.product_id
      LEFT JOIN 
        flash_sales fs ON fsp.flash_sale_id = fs.id AND fs.is_active = true
      WHERE 
        p.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return reply.code(404).send({
        message: 'Product not found'
      });
    }

    const product = result.rows[0];
    const hasFlashSale = product.flash_sale_id !== null;
    
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: parseFloat(product.price),
      quantity: product.quantity,
      is_active: product.is_active,
      is_flash: product.is_flash,
      created_at: product.created_at,
      updated_at: product.updated_at,
      flash_sale: hasFlashSale ? {
        id: product.flash_sale_id,
        name: product.flash_sale_name,
        start_time: product.flash_sale_start,
        end_time: product.flash_sale_end,
        discount_percentage: product.discount_percentage,
        discounted_price: parseFloat((product.price * (1 - product.discount_percentage / 100)).toFixed(2))
      } : null
    };
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({
      message: 'Error fetching product',
      error: error.message
    });
  }
}

async function createProduct(request, reply) {
  const { name, description, price, quantity, is_active, is_flash } = request.body;
  
  try {
    const result = await db.query(
      'INSERT INTO products (name, description, price, quantity, is_active, is_flash) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [name, description, price, quantity, is_active, is_flash]
    );

    return result.rows[0];
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({
      message: 'Error creating product',
      error: error.message
    });
  }
}

async function updateProduct(request, reply) {
  const { id } = request.params;
  const { name, description, price, quantity, is_active, is_flash } = request.body;
  
  try {
    const result = await db.query(
      'UPDATE products SET name = $1, description = $2, price = $3, quantity = $4, is_active = $5, is_flash = $6, updated_at = CURRENT_TIMESTAMP WHERE id = $7 RETURNING *',
      [name, description, price, quantity, is_active, is_flash, id]
    );

    if (result.rows.length === 0) {
      return reply.code(404).send({
        message: 'Product not found'
      });
    }

    return result.rows[0];
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({
      message: 'Error updating product',
      error: error.message
    });
  }
}

async function deleteProduct(request, reply) {
  const { id } = request.params;
  
  try {
    const result = await db.query(
      'DELETE FROM products WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return reply.code(404).send({
        message: 'Product not found'
      });
    }

    return { message: 'Product deleted successfully' };
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({
      message: 'Error deleting product',
      error: error.message
    });
  }
}

module.exports = {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};
