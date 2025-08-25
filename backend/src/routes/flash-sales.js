const flashSaleController = require('../controllers/flash-sales');

module.exports = async function (fastify, opts) {
  // Flash sale schema
  const flashSaleSchema = {
    type: 'object',
    properties: {
      id: { type: 'integer' },
      name: { type: 'string' },
      start_time: { type: 'string', format: 'date-time' },
      end_time: { type: 'string', format: 'date-time' },
      is_active: { type: 'boolean' },
      created_at: { type: 'string', format: 'date-time' },
      updated_at: { type: 'string', format: 'date-time' },
      product_count: { type: 'integer' }
    }
  };

  const flashSaleWithProductsSchema = {
    type: 'object',
    properties: {
      id: { type: 'integer' },
      name: { type: 'string' },
      start_time: { type: 'string', format: 'date-time' },
      end_time: { type: 'string', format: 'date-time' },
      is_active: { type: 'boolean' },
      created_at: { type: 'string', format: 'date-time' },
      updated_at: { type: 'string', format: 'date-time' },
      products: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            name: { type: 'string' },
            description: { type: 'string' },
            price: { type: 'number' },
            quantity: { type: 'integer' },
            is_active: { type: 'boolean' },
            is_flash: { type: 'boolean' },
            discount_percentage: { type: 'integer' },
            max_quantity_per_user: { type: 'integer' },
            discounted_price: { type: 'number' }
          }
        }
      }
    }
  };

  // Get flash sale status - public
  fastify.get('/status', {
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['active', 'upcoming', 'ended', 'none'] },
            flash_sale: { 
              type: ['object', 'null'],
              properties: {
                id: { type: 'integer' },
                name: { type: 'string' },
                start_time: { type: 'string', format: 'date-time' },
                end_time: { type: 'string', format: 'date-time' },
                is_active: { type: 'boolean' },
                product_count: { type: 'integer' }
              }
            }
          }
        }
      }
    }
  }, flashSaleController.getFlashSaleStatus);

  // Get all flash sales - admin only
  fastify.get('/', {
    preHandler: fastify.authenticateAdmin,
    schema: {
      response: {
        200: {
          type: 'array',
          items: flashSaleSchema
        }
      }
    }
  }, flashSaleController.getAllFlashSales);

  // Get single flash sale with products - admin only
  fastify.get('/:id', {
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
        200: flashSaleWithProductsSchema
      }
    }
  }, flashSaleController.getFlashSaleById);

  // Create flash sale - admin only
  fastify.post('/', {
    preHandler: fastify.authenticateAdmin,
    schema: {
      body: {
        type: 'object',
        required: ['name', 'start_time', 'end_time'],
        properties: {
          name: { type: 'string' },
          start_time: { type: 'string', format: 'date-time' },
          end_time: { type: 'string', format: 'date-time' },
          is_active: { type: 'boolean' }
        }
      },
      response: {
        200: flashSaleSchema
      }
    }
  }, flashSaleController.createFlashSale);

  // Update flash sale - admin only
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
        required: ['name', 'start_time', 'end_time', 'is_active'],
        properties: {
          name: { type: 'string' },
          start_time: { type: 'string', format: 'date-time' },
          end_time: { type: 'string', format: 'date-time' },
          is_active: { type: 'boolean' }
        }
      },
      response: {
        200: flashSaleSchema
      }
    }
  }, flashSaleController.updateFlashSale);

  // Delete flash sale - admin only
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
  }, flashSaleController.deleteFlashSale);

  // Add product to flash sale - admin only
  fastify.post('/:flashSaleId/products', {
    preHandler: fastify.authenticateAdmin,
    schema: {
      params: {
        type: 'object',
        required: ['flashSaleId'],
        properties: {
          flashSaleId: { type: 'integer' }
        }
      },
      body: {
        type: 'object',
        required: ['product_id', 'discount_percentage'],
        properties: {
          product_id: { type: 'integer' },
          discount_percentage: { type: 'integer' },
          max_quantity_per_user: { type: 'integer' }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            flash_sale_id: { type: 'integer' },
            product_id: { type: 'integer' },
            discount_percentage: { type: 'integer' },
            max_quantity_per_user: { type: 'integer' }
          }
        }
      }
    }
  }, flashSaleController.addProductToFlashSale);

  // Remove product from flash sale - admin only
  fastify.delete('/:flashSaleId/products/:productId', {
    preHandler: fastify.authenticateAdmin,
    schema: {
      params: {
        type: 'object',
        required: ['flashSaleId', 'productId'],
        properties: {
          flashSaleId: { type: 'integer' },
          productId: { type: 'integer' }
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
  }, flashSaleController.removeProductFromFlashSale);
};
