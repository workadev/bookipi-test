const userController = require('../controllers/users');

module.exports = async function (fastify, opts) {
  // User schema
  const userSchema = {
    type: 'object',
    properties: {
      id: { type: 'integer' },
      username: { type: 'string' },
      email: { type: 'string' },
      is_admin: { type: 'boolean' },
      created_at: { type: 'string', format: 'date-time' },
      updated_at: { type: 'string', format: 'date-time' }
    }
  };

  // Get all users - admin only
  fastify.get('/', {
    preHandler: fastify.authenticateAdmin,
    schema: {
      response: {
        200: {
          type: 'array',
          items: userSchema
        }
      }
    }
  }, userController.getAllUsers);

  // Get user by ID - admin only
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
        200: userSchema
      }
    }
  }, userController.getUserById);

  // Create user - admin only
  fastify.post('/', {
    preHandler: fastify.authenticateAdmin,
    schema: {
      body: {
        type: 'object',
        required: ['username', 'email', 'password'],
        properties: {
          username: { type: 'string' },
          email: { type: 'string' },
          password: { type: 'string' },
          is_admin: { type: 'boolean' }
        }
      },
      response: {
        200: userSchema
      }
    }
  }, userController.createUser);

  // Update user - admin only
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
        required: ['username', 'email', 'is_admin'],
        properties: {
          username: { type: 'string' },
          email: { type: 'string' },
          password: { type: 'string' },
          is_admin: { type: 'boolean' }
        }
      },
      response: {
        200: userSchema
      }
    }
  }, userController.updateUser);

  // Delete user - admin only
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
  }, userController.deleteUser);

  // Get user purchase history - admin only
  fastify.get('/:id/purchases', {
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
          type: 'array',
          items: {
            type: 'object',
            properties: {
              purchase_id: { type: 'integer' },
              purchase_date: { type: 'string', format: 'date-time' },
              purchase_price: { type: 'number' },
              quantity: { type: 'integer' },
              status: { type: 'string' },
              product_id: { type: 'integer' },
              product_name: { type: 'string' },
              flash_sale_id: { type: ['integer', 'null'] },
              flash_sale_name: { type: ['string', 'null'] }
            }
          }
        }
      }
    }
  }, userController.getUserPurchases);
};
