const productController = require('../controllers/products');

module.exports = async function (fastify, opts) {
  // Route schemas
  const productSchema = {
    type: 'object',
    properties: {
      id: { type: 'integer' },
      name: { type: 'string' },
      description: { type: 'string' },
      price: { type: 'number' },
      quantity: { type: 'integer' },
      is_active: { type: 'boolean' },
      is_flash: { type: 'boolean' },
      created_at: { type: 'string', format: 'date-time' },
      updated_at: { type: 'string', format: 'date-time' },
      flash_sale: {
        type: ['object', 'null'],
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' },
          start_time: { type: 'string', format: 'date-time' },
          end_time: { type: 'string', format: 'date-time' },
          discount_percentage: { type: 'integer' },
          discounted_price: { type: 'number' }
        }
      }
    }
  };

  // Get all products - public
  fastify.get('/', {
    schema: {
      response: {
        200: {
          type: 'array',
          items: productSchema
        }
      }
    }
  }, productController.getAllProducts);

  // Get single product by ID - public
  fastify.get('/:id', {
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'integer' }
        }
      },
      response: {
        200: productSchema
      }
    }
  }, productController.getProductById);

  // Create product - admin only
  fastify.post('/', {
    preHandler: fastify.authenticateAdmin,
    schema: {
      body: {
        type: 'object',
        required: ['name', 'price'],
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          price: { type: 'number' },
          quantity: { type: 'integer' },
          is_active: { type: 'boolean' },
          is_flash: { type: 'boolean' }
        }
      },
      response: {
        200: productSchema
      }
    }
  }, productController.createProduct);

  // Update product - admin only
  fastify.put('/:id', {
    preHandler: fastify.authenticateAdmin,
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'integer' }
        }
      },
      body: {
        type: 'object',
        required: ['name', 'price'],
        properties: {
          name: { type: 'string' },
          description: { type: 'string' },
          price: { type: 'number' },
          quantity: { type: 'integer' },
          is_active: { type: 'boolean' },
          is_flash: { type: 'boolean' }
        }
      },
      response: {
        200: productSchema
      }
    }
  }, productController.updateProduct);

  // Delete product - admin only
  fastify.delete('/:id', {
    preHandler: fastify.authenticateAdmin,
    schema: {
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'integer' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        }
      }
    }
  }, productController.deleteProduct);
};
