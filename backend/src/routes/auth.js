const authController = require('../controllers/auth');

module.exports = async function (fastify, opts) {
  // Route schemas
  const loginSchema = {
    body: {
      type: 'object',
      required: ['username', 'password'],
      properties: {
        username: { type: 'string' },
        password: { type: 'string' }
      }
    },
    response: {
      200: {
        type: 'object',
        properties: {
          token: { type: 'string' },
          user: {
            type: 'object',
            properties: {
              id: { type: 'integer' },
              username: { type: 'string' },
              email: { type: 'string' },
              is_admin: { type: 'boolean' }
            }
          }
        }
      },
      401: {
        type: 'object',
        properties: {
          message: { type: 'string' }
        }
      }
    }
  };

  const currentUserSchema = {
    response: {
      200: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          username: { type: 'string' },
          email: { type: 'string' },
          is_admin: { type: 'boolean' }
        }
      }
    }
  };

  // Routes
  fastify.post('/login', { schema: loginSchema }, authController.login);
  fastify.get('/me', { 
    preHandler: fastify.authenticate,
    schema: currentUserSchema 
  }, authController.getCurrentUser);
};
