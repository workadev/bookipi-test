const db = require('../db');

async function createPurchase(request, reply) {
  const { product_id, flash_sale_id, quantity = 1 } = request.body;
  const user_id = request.user.id;
  
  // Get a client for transaction
  const client = await db.getClient();
  
  try {
    await client.query('BEGIN');
    
    // Check if the product exists and has enough stock
    const productResult = await client.query(
      'SELECT id, price, quantity FROM products WHERE id = $1 FOR UPDATE', // Lock the row
      [product_id]
    );

    if (productResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return reply.code(404).send({
        message: 'Product not found'
      });
    }

    const product = productResult.rows[0];
    
    // Check if product has enough stock
    if (product.quantity < quantity) {
      await client.query('ROLLBACK');
      return reply.code(400).send({
        message: 'Not enough stock available'
      });
    }

    let flash_sale = null;
    let purchase_price = parseFloat(product.price);

    // If this is a flash sale purchase
    if (flash_sale_id) {
      // Check if the flash sale exists and is active
      const now = new Date();
      const flashSaleResult = await client.query(
        'SELECT fs.id, fs.start_time, fs.end_time, fsp.discount_percentage, fsp.max_quantity_per_user FROM flash_sales fs JOIN flash_sale_products fsp ON fs.id = fsp.flash_sale_id WHERE fs.id = $1 AND fsp.product_id = $2 AND fs.is_active = true',
        [flash_sale_id, product_id]
      );

      if (flashSaleResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return reply.code(404).send({
          message: 'Flash sale not found or product is not part of this flash sale'
        });
      }

      flash_sale = flashSaleResult.rows[0];
      
      // Check if flash sale is active (within start and end time)
      if (now < new Date(flash_sale.start_time) || now > new Date(flash_sale.end_time)) {
        await client.query('ROLLBACK');
        return reply.code(400).send({
          message: 'Flash sale is not active at this time'
        });
      }

      // Check if user already purchased this product in this flash sale
      const existingPurchaseResult = await client.query(
        'SELECT id FROM purchases WHERE user_id = $1 AND product_id = $2 AND flash_sale_id = $3',
        [user_id, product_id, flash_sale_id]
      );

      if (existingPurchaseResult.rows.length > 0) {
        await client.query('ROLLBACK');
        return reply.code(400).send({
          message: 'You have already purchased this product in this flash sale'
        });
      }

      // Check if quantity exceeds max allowed per user
      if (quantity > flash_sale.max_quantity_per_user) {
        await client.query('ROLLBACK');
        return reply.code(400).send({
          message: `You can only purchase up to ${flash_sale.max_quantity_per_user} of this product in this flash sale`
        });
      }

      // Apply discount to price
      purchase_price = parseFloat((product.price * (1 - flash_sale.discount_percentage / 100)).toFixed(2));
    } else {
      // For non-flash-sale purchases, check if user already has this product in a non-flash-sale purchase
      // Uncomment this if you want to prevent multiple regular purchases of the same product
      /*
      const existingPurchaseResult = await client.query(
        'SELECT id FROM purchases WHERE user_id = $1 AND product_id = $2 AND flash_sale_id IS NULL',
        [user_id, product_id]
      );

      if (existingPurchaseResult.rows.length > 0) {
        await client.query('ROLLBACK');
        return reply.code(400).send({
          message: 'You have already purchased this product'
        });
      }
      */
    }

    // Create purchase record
    const purchaseResult = await client.query(
      'INSERT INTO purchases (user_id, product_id, flash_sale_id, quantity, purchase_price) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [user_id, product_id, flash_sale_id, quantity, purchase_price]
    );

    // Update product stock
    await client.query(
      'UPDATE products SET quantity = quantity - $1 WHERE id = $2',
      [quantity, product_id]
    );

    await client.query('COMMIT');

    return {
      message: 'Purchase successful',
      purchase: purchaseResult.rows[0]
    };
  } catch (error) {
    await client.query('ROLLBACK');
    request.log.error(error);
    return reply.code(500).send({
      message: 'Error creating purchase',
      error: error.message
    });
  } finally {
    client.release();
  }
}

async function getUserPurchaseHistory(request, reply) {
  const user_id = request.user.id;
  
  try {
    const result = await db.query(`
      SELECT 
        p.id,
        p.product_id,
        prod.name as product_name,
        p.flash_sale_id,
        fs.name as flash_sale_name,
        p.quantity,
        p.purchase_price,
        p.purchase_date,
        p.status
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
    `, [user_id]);

    return result.rows;
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({
      message: 'Error fetching purchase history',
      error: error.message
    });
  }
}

// Check if user has purchased a specific product
async function checkUserPurchasedProduct(request, reply) {
  const { productId } = request.params;
  const user_id = request.user.id;
  
  try {
    const result = await db.query(
      'SELECT id, purchase_date FROM purchases WHERE user_id = $1 AND product_id = $2 LIMIT 1',
      [user_id, productId]
    );

    const hasPurchased = result.rows.length > 0;
    
    return { 
      has_purchased: hasPurchased,
      purchase_id: hasPurchased ? result.rows[0].id : null,
      purchase_date: hasPurchased ? result.rows[0].purchase_date : null
    };
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({
      message: 'Error checking purchase status',
      error: error.message
    });
  }
}

module.exports = {
  createPurchase,
  getUserPurchaseHistory,
  checkUserPurchasedProduct
};
