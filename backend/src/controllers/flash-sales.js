const db = require('../db');

async function getAllFlashSales(request, reply) {
  try {
    const result = await db.query(`
      SELECT 
        fs.id, 
        fs.name, 
        fs.start_time, 
        fs.end_time, 
        fs.is_active,
        fs.created_at,
        fs.updated_at,
        COUNT(fsp.product_id) as product_count
      FROM 
        flash_sales fs
      LEFT JOIN 
        flash_sale_products fsp ON fs.id = fsp.flash_sale_id
      GROUP BY 
        fs.id
      ORDER BY 
        fs.id DESC
    `);

    return result.rows;
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({
      message: 'Error fetching flash sales',
      error: error.message
    });
  }
}

async function getFlashSaleById(request, reply) {
  const { id } = request.params;
  
  try {
    // Get flash sale details
    const flashSaleResult = await db.query('SELECT * FROM flash_sales WHERE id = $1', [id]);

    if (flashSaleResult.rows.length === 0) {
      return reply.code(404).send({
        message: 'Flash sale not found'
      });
    }

    const flashSale = flashSaleResult.rows[0];

    // Get products in this flash sale
    const productsResult = await db.query(`
      SELECT 
        p.id, 
        p.name, 
        p.description, 
        p.price, 
        p.quantity,
        p.is_active,
        p.is_flash,
        fsp.discount_percentage,
        fsp.max_quantity_per_user
      FROM 
        flash_sale_products fsp
      JOIN 
        products p ON fsp.product_id = p.id
      WHERE 
        fsp.flash_sale_id = $1
    `, [id]);

    // Format the products with discount info
    const products = productsResult.rows.map(product => ({
      id: product.id,
      name: product.name,
      description: product.description,
      price: parseFloat(product.price),
      quantity: product.quantity,
      is_active: product.is_active,
      is_flash: product.is_flash,
      discount_percentage: product.discount_percentage,
      max_quantity_per_user: product.max_quantity_per_user,
      discounted_price: parseFloat((product.price * (1 - product.discount_percentage / 100)).toFixed(2))
    }));

    // Return combined result
    return {
      ...flashSale,
      products
    };
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({
      message: 'Error fetching flash sale',
      error: error.message
    });
  }
}

async function createFlashSale(request, reply) {
  const { name, start_time, end_time, is_active = true } = request.body;
  
  try {
    const result = await db.query(
      'INSERT INTO flash_sales (name, start_time, end_time, is_active) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, start_time, end_time, is_active]
    );

    return result.rows[0];
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({
      message: 'Error creating flash sale',
      error: error.message
    });
  }
}

async function updateFlashSale(request, reply) {
  const { id } = request.params;
  const { name, start_time, end_time, is_active } = request.body;
  
  try {
    const result = await db.query(
      'UPDATE flash_sales SET name = $1, start_time = $2, end_time = $3, is_active = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *',
      [name, start_time, end_time, is_active, id]
    );

    if (result.rows.length === 0) {
      return reply.code(404).send({
        message: 'Flash sale not found'
      });
    }

    return result.rows[0];
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({
      message: 'Error updating flash sale',
      error: error.message
    });
  }
}

async function deleteFlashSale(request, reply) {
  const { id } = request.params;
  
  try {
    const result = await db.query(
      'DELETE FROM flash_sales WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return reply.code(404).send({
        message: 'Flash sale not found'
      });
    }

    return { message: 'Flash sale deleted successfully' };
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({
      message: 'Error deleting flash sale',
      error: error.message
    });
  }
}

async function addProductToFlashSale(request, reply) {
  const { flashSaleId } = request.params;
  const { product_id, discount_percentage, max_quantity_per_user = 1 } = request.body;
  
  try {
    // Check if flash sale exists
    const flashSaleResult = await db.query(
      'SELECT * FROM flash_sales WHERE id = $1',
      [flashSaleId]
    );

    if (flashSaleResult.rows.length === 0) {
      return reply.code(404).send({
        message: 'Flash sale not found'
      });
    }

    // Check if product exists
    const productResult = await db.query(
      'SELECT * FROM products WHERE id = $1',
      [product_id]
    );

    if (productResult.rows.length === 0) {
      return reply.code(404).send({
        message: 'Product not found'
      });
    }

    // Add product to flash sale
    const result = await db.query(
      'INSERT INTO flash_sale_products (flash_sale_id, product_id, discount_percentage, max_quantity_per_user) VALUES ($1, $2, $3, $4) RETURNING *',
      [flashSaleId, product_id, discount_percentage, max_quantity_per_user]
    );

    // Update product to mark it as a flash sale product
    await db.query(
      'UPDATE products SET is_flash = true WHERE id = $1',
      [product_id]
    );

    return result.rows[0];
  } catch (error) {
    request.log.error(error);
    
    // Check for duplicate key error
    if (error.code === '23505') { // PostgreSQL unique constraint violation code
      return reply.code(400).send({
        message: 'This product is already part of this flash sale'
      });
    }
    
    return reply.code(500).send({
      message: 'Error adding product to flash sale',
      error: error.message
    });
  }
}

async function removeProductFromFlashSale(request, reply) {
  const { flashSaleId, productId } = request.params;
  
  try {
    // Remove product from flash sale
    const result = await db.query(
      'DELETE FROM flash_sale_products WHERE flash_sale_id = $1 AND product_id = $2 RETURNING *',
      [flashSaleId, productId]
    );

    if (result.rows.length === 0) {
      return reply.code(404).send({
        message: 'Product not found in this flash sale'
      });
    }

    // Check if product is in other flash sales
    const otherFlashSalesResult = await db.query(
      'SELECT * FROM flash_sale_products WHERE product_id = $1',
      [productId]
    );

    // If product is not in any other flash sales, update it to not be a flash sale product
    if (otherFlashSalesResult.rows.length === 0) {
      await db.query(
        'UPDATE products SET is_flash = false WHERE id = $1',
        [productId]
      );
    }

    return { message: 'Product removed from flash sale successfully' };
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({
      message: 'Error removing product from flash sale',
      error: error.message
    });
  }
}

// Get active flash sale status
async function getFlashSaleStatus(request, reply) {
  try {
    const now = new Date();
    
    const result = await db.query(`
      SELECT 
        fs.id, 
        fs.name, 
        fs.start_time, 
        fs.end_time, 
        fs.is_active,
        COUNT(fsp.product_id) as product_count
      FROM 
        flash_sales fs
      JOIN 
        flash_sale_products fsp ON fs.id = fsp.flash_sale_id
      WHERE 
        fs.is_active = true 
        AND fs.start_time <= $1 
        AND fs.end_time >= $1
      GROUP BY 
        fs.id
      LIMIT 1
    `, [now]);

    if (result.rows.length === 0) {
      // Check if there's an upcoming flash sale
      const upcomingResult = await db.query(`
        SELECT 
          fs.id, 
          fs.name, 
          fs.start_time, 
          fs.end_time, 
          fs.is_active,
          COUNT(fsp.product_id) as product_count
        FROM 
          flash_sales fs
        JOIN 
          flash_sale_products fsp ON fs.id = fsp.flash_sale_id
        WHERE 
          fs.is_active = true 
          AND fs.start_time > $1
        GROUP BY 
          fs.id
        ORDER BY 
          fs.start_time ASC
        LIMIT 1
      `, [now]);
      
      if (upcomingResult.rows.length > 0) {
        return {
          status: 'upcoming',
          flash_sale: upcomingResult.rows[0]
        };
      }
      
      // Check if there's a recently ended flash sale
      const endedResult = await db.query(`
        SELECT 
          fs.id, 
          fs.name, 
          fs.start_time, 
          fs.end_time, 
          fs.is_active,
          COUNT(fsp.product_id) as product_count
        FROM 
          flash_sales fs
        JOIN 
          flash_sale_products fsp ON fs.id = fsp.flash_sale_id
        WHERE 
          fs.is_active = true 
          AND fs.end_time < $1
        GROUP BY 
          fs.id
        ORDER BY 
          fs.end_time DESC
        LIMIT 1
      `, [now]);
      
      if (endedResult.rows.length > 0) {
        return {
          status: 'ended',
          flash_sale: endedResult.rows[0]
        };
      }
      
      return {
        status: 'none',
        flash_sale: null
      };
    }

    return {
      status: 'active',
      flash_sale: result.rows[0]
    };
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({
      message: 'Error fetching flash sale status',
      error: error.message
    });
  }
}

module.exports = {
  getAllFlashSales,
  getFlashSaleById,
  createFlashSale,
  updateFlashSale,
  deleteFlashSale,
  addProductToFlashSale,
  removeProductFromFlashSale,
  getFlashSaleStatus
};
