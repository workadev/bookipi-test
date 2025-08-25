const purchaseController = require('../controllers/purchases');

module.exports = async function (fastify, opts) {
  // Create purchase - authenticated user
  fastify.post('/', {
    preHandler: fastify.authenticate,
    schema: {
      body: {
        type: 'object',
        required: ['product_id'],
        properties: {
          product_id: { type: 'integer' },
          flash_sale_id: { type: ['integer', 'null'] },
          quantity: { type: 'integer' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' },
            purchase: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                user_id: { type: 'integer' },
                product_id: { type: 'integer' },
                flash_sale_id: { type: ['integer', 'null'] },
                quantity: { type: 'integer' },
                purchase_price: { type: 'number' },
                purchase_date: { type: 'string', format: 'date-time' },
                status: { type: 'string' }
              }
            }
          }
        }
      }
    }
  }, purchaseController.createPurchase);

  // Get user purchase history - authenticated user
  fastify.get('/my-purchases', {
    preHandler: fastify.authenticate,
    schema: {
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'integer' },
              product_id: { type: 'integer' },
              product_name: { type: 'string' },
              flash_sale_id: { type: ['integer', 'null'] },
              flash_sale_name: { type: ['string', 'null'] },
              quantity: { type: 'integer' },
              purchase_price: { type: 'number' },
              purchase_date: { type: 'string', format: 'date-time' },
              status: { type: 'string' }
            }
          }
        }
      }
    }
  }, purchaseController.getUserPurchaseHistory);

  // Check if user has purchased a specific product - authenticated user
  fastify.get('/check-product/:productId', {
    preHandler: fastify.authenticate,
    schema: {
      params: {
        type: 'object',
        required: ['productId'],
        properties: {
          productId: { type: 'integer' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            has_purchased: { type: 'boolean' },
            purchase_id: { type: ['integer', 'null'] },
            purchase_date: { type: ['string', 'null'], format: 'date-time' }
          }
        }
      }
    }
  }, purchaseController.checkUserPurchasedProduct);
};
