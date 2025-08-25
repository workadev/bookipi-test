require('dotenv').config();
const fastify = require('fastify')({ 
  logger: true,
  trustProxy: true
});
const cors = require('@fastify/cors');
const jwt = require('@fastify/jwt');
const swagger = require('@fastify/swagger');

// Import routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const flashSaleRoutes = require('./routes/flash-sales');
const userRoutes = require('./routes/users');
const purchaseRoutes = require('./routes/purchases');

// Define the port
const PORT = process.env.PORT || 3001;

// Register plugins
fastify.register(cors, {
  origin: true, // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
});

// JWT for authentication
fastify.register(jwt, {
  secret: process.env.JWT_SECRET || 'very_secret_key_for_development',
  sign: {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d'
  }
});

// Swagger documentation
fastify.register(swagger, {
  routePrefix: '/docs',
  swagger: {
    info: {
      title: 'BookiPi Flash Sale API',
      description: 'API for e-commerce flash sale platform',
      version: '1.0.0'
    },
    host: 'localhost:3001',
    schemes: ['http'],
    consumes: ['application/json'],
    produces: ['application/json']
  },
  exposeRoute: true
});

// Authentication decorator
fastify.decorate('authenticate', async (request, reply) => {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.code(401).send({ message: 'Unauthorized' });
  }
});

// Admin authentication decorator
fastify.decorate('authenticateAdmin', async (request, reply) => {
  try {
    await request.jwtVerify();
    
    if (!request.user.is_admin) {
      reply.code(403).send({ message: 'Forbidden - Admin access required' });
    }
  } catch (err) {
    reply.code(401).send({ message: 'Unauthorized' });
  }
});

// Register routes
fastify.register(authRoutes, { prefix: '/auth' });
fastify.register(productRoutes, { prefix: '/products' });
fastify.register(flashSaleRoutes, { prefix: '/flash-sales' });
fastify.register(userRoutes, { prefix: '/users' });
fastify.register(purchaseRoutes, { prefix: '/purchases' });

// Health check route
fastify.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Start the server
const start = async () => {
  try {
    await fastify.listen({ port: PORT, host: '0.0.0.0' });
    console.log(`Server is running on port ${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
