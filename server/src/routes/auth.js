const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const Joi = require('joi');
const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Validation schemas
const signUpSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  firstName: Joi.string().min(2).max(50).optional(),
  lastName: Joi.string().min(2).max(50).optional()
});

const signInSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

// Sign up endpoint
router.post('/signup', async (req, res) => {
  try {
    const { error: validationError, value } = signUpSchema.validate(req.body);
    if (validationError) {
      return res.status(400).json({
        error: 'Validation Error',
        message: validationError.details[0].message
      });
    }

    const { email, password, firstName, lastName } = value;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName
        }
      }
    });

    if (error) {
      return res.status(400).json({
        error: 'Sign Up Error',
        message: error.message
      });
    }

    res.status(201).json({
      message: 'User created successfully. Please check your email for verification.',
      user: {
        id: data.user?.id,
        email: data.user?.email,
        emailConfirmed: data.user?.email_confirmed_at !== null
      }
    });
  } catch (error) {
    console.error('Sign up error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create user account'
    });
  }
});

// Sign in endpoint
router.post('/signin', async (req, res) => {
  try {
    const { error: validationError, value } = signInSchema.validate(req.body);
    if (validationError) {
      return res.status(400).json({
        error: 'Validation Error',
        message: validationError.details[0].message
      });
    }

    const { email, password } = value;

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return res.status(401).json({
        error: 'Authentication Error',
        message: error.message
      });
    }

    res.status(200).json({
      message: 'Sign in successful',
      user: {
        id: data.user.id,
        email: data.user.email,
        emailConfirmed: data.user.email_confirmed_at !== null
      },
      session: {
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
        expiresAt: data.session.expires_at
      }
    });
  } catch (error) {
    console.error('Sign in error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to sign in'
    });
  }
});

// Sign out endpoint
router.post('/signout', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing or invalid authorization header'
      });
    }

    const token = authHeader.substring(7);
    
    const { error } = await supabase.auth.signOut(token);

    if (error) {
      console.error('Sign out error:', error);
      return res.status(400).json({
        error: 'Sign Out Error',
        message: error.message
      });
    }

    res.status(200).json({
      message: 'Sign out successful'
    });
  } catch (error) {
    console.error('Sign out error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to sign out'
    });
  }
});

// Get current user endpoint
router.get('/user', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Missing or invalid authorization header'
      });
    }

    const token = authHeader.substring(7);
    
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid or expired token'
      });
    }

    res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        emailConfirmed: user.email_confirmed_at !== null,
        firstName: user.user_metadata?.first_name,
        lastName: user.user_metadata?.last_name,
        createdAt: user.created_at
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get user information'
    });
  }
});

module.exports = router;
