const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

/**
 * JWT Authentication Middleware
 * Verifies the JWT token in the Authorization header
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Access denied. No token provided or invalid format.',
        hint: 'Include "Authorization: Bearer <token>" in your request headers'
      });
    }

    const token = authHeader.substring(7);

    if (!token) {
      return res.status(401).json({
        error: 'Access denied. Token is empty.'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'outlook-addin-api',
      audience: 'outlook-addin-client'
    });

    const db = req.app.locals.db;
    const userQuery = 'SELECT id, email FROM users WHERE id = $1';
    const userResult = await db.query(userQuery, [decoded.userId]);

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        error: 'Access denied. User no longer exists.'
      });
    }

    req.user = {
      id: decoded.userId,
      email: decoded.email,
      tokenData: decoded
    };

    req.dbUser = userResult.rows[0];

    next();

  } catch (error) {
    console.error('Authentication middleware error:', error);

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Access denied. Invalid token.'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Access denied. Token has expired.',
        hint: 'Please log in again to get a new token'
      });
    }

    if (error.name === 'NotBeforeError') {
      return res.status(401).json({
        error: 'Access denied. Token not active yet.'
      });
    }

    return res.status(500).json({
      error: 'Internal server error during authentication'
    });
  }
};

/**
 * Optional authentication middleware
 * Adds user info to request if token is valid, but doesn't block if no token
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.substring(7);

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'outlook-addin-api',
      audience: 'outlook-addin-client'
    });

    const db = req.app.locals.db;
    const userQuery = 'SELECT id, email FROM users WHERE id = $1';
    const userResult = await db.query(userQuery, [decoded.userId]);

    if (userResult.rows.length > 0) {
      req.user = {
        id: decoded.userId,
        email: decoded.email,
        tokenData: decoded
      };
      req.dbUser = userResult.rows[0];
    } else {
      req.user = null;
    }

    next();

  } catch (error) {

    console.warn('Optional auth failed:', error.message);
    req.user = null;
    next();
  }
};

module.exports = {
  authenticateToken,
  optionalAuth
}; 