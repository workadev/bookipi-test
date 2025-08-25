const bcrypt = require('bcryptjs');
const db = require('../db');

async function login(request, reply) {
  const { username, password } = request.body;

  try {
    // Find user by username
    const result = await db.query(
      'SELECT id, username, email, password, is_admin FROM users WHERE username = $1',
      [username]
    );

    const user = result.rows[0];

    // Check if user exists
    if (!user) {
      return reply.code(401).send({
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return reply.code(401).send({
        message: 'Invalid credentials'
      });
    }

    // Create token payload (don't include password)
    const tokenPayload = {
      id: user.id,
      username: user.username,
      email: user.email,
      is_admin: user.is_admin
    };

    // Generate JWT token
    const token = await reply.jwtSign(tokenPayload);

    return {
      token,
      user: tokenPayload
    };
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({
      message: 'Error during authentication',
      error: error.message
    });
  }
}

async function getCurrentUser(request, reply) {
  try {
    const userId = request.user.id;
    
    const result = await db.query(
      'SELECT id, username, email, is_admin FROM users WHERE id = $1',
      [userId]
    );

    const user = result.rows[0];
    
    if (!user) {
      return reply.code(404).send({
        message: 'User not found'
      });
    }

    return user;
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({
      message: 'Error getting current user',
      error: error.message
    });
  }
}

module.exports = {
  login,
  getCurrentUser
};
