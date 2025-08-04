const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Authentication middleware to verify JWT tokens from Supabase
 */
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing or invalid authorization header'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify the token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired token'
      });
    }

    // Check if user's email is confirmed
    if (!user.email_confirmed_at) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Email not confirmed. Please check your email and confirm your account.'
      });
    }

    // Add user information to request object
    req.user = {
      id: user.id,
      email: user.email,
      emailConfirmed: user.email_confirmed_at !== null,
      firstName: user.user_metadata?.first_name,
      lastName: user.user_metadata?.last_name,
      createdAt: user.created_at
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: 'Authentication verification failed'
    });
  }
};

/**
 * Optional authentication middleware - doesn't fail if no token provided
 */
const optionalAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.user = null;
      return next();
    }

    const token = authHeader.substring(7);
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      req.user = null;
      return next();
    }

    req.user = {
      id: user.id,
      email: user.email,
      emailConfirmed: user.email_confirmed_at !== null,
      firstName: user.user_metadata?.first_name,
      lastName: user.user_metadata?.last_name,
      createdAt: user.created_at
    };

    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    req.user = null;
    next();
  }
};

module.exports = authMiddleware;
module.exports.optionalAuth = optionalAuthMiddleware;
