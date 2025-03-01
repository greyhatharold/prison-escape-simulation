const express = require('express');
const rateLimit = require('express-rate-limit');
const axios = require('axios');
const { config } = require('./config');
const { 
  getClaudeDecision, 
  getClaudeReflection, 
  getCacheStats, 
  clearCaches 
} = require('./claude.backend');

const router = express.Router();

// Enhanced rate limiting with sliding window
const apiLimiter = rateLimit({
  windowMs: config.api.rateLimit.windowMs || 60 * 1000, // 1 minute default
  max: config.api.rateLimit.max || 20, // 20 requests per window default
  message: 'Too many requests from this IP, please try again after a minute',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  keyGenerator: (req) => {
    // Use a combination of IP and endpoint for more granular control
    return `${req.ip}-${req.path}`;
  },
  handler: (req, res) => {
    res.status(429).json({
      error: 'Rate limit exceeded',
      message: 'Too many requests, please try again later',
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  }
});

// Separate rate limits for different endpoints
const decisionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 decisions per minute
  message: 'Decision rate limit exceeded'
});

const reflectionLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 reflections per minute
  message: 'Reflection rate limit exceeded'
});

router.use(apiLimiter);

// Add request validation middleware
const validateRequest = (req, res, next) => {
  const { state } = req.body;
  
  if (!state) {
    return res.status(400).json({ 
      error: 'State object is required',
      message: 'Please provide a valid state object'
    });
  }

  const requiredFields = [
    'currentLocation',
    'guardPosition',
    'inventory',
    'selfAwareness',
    'guardAlertness',
    'escapeAttempts'
  ];

  const missingFields = requiredFields.filter(field => !state.hasOwnProperty(field));
  
  if (missingFields.length > 0) {
    return res.status(400).json({
      error: 'Invalid state object',
      message: `Missing required fields: ${missingFields.join(', ')}`
    });
  }

  next();
};

// Add response compression middleware
router.use(require('compression')());

// Proxy endpoint for Anthropic API requests
router.post('/v1/messages', async (req, res) => {
  try {
    console.log('Proxying request to Anthropic API:', {
      url: 'https://api.anthropic.com/v1/messages',
      headers: {
        'x-api-key': '[REDACTED]',
        'anthropic-version': '2023-06-01'
      }
    });

    const response = await axios({
      method: 'post',
      url: 'https://api.anthropic.com/v1/messages',
      headers: {
        'x-api-key': config.anthropic.apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      },
      data: req.body,
      validateStatus: status => status >= 200 && status < 300
    });

    console.log('Received response from Anthropic:', {
      status: response.status,
      statusText: response.statusText
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error proxying request to Anthropic:', {
      error: error.message,
      response: error.response?.data,
      status: error.response?.status
    });

    res.status(error.response?.status || 500).json({
      error: 'Anthropic API Error',
      message: error.response?.data?.error?.message || error.message,
      details: error.response?.data
    });
  }
});

// Enhanced decision endpoint with rate limiting and validation
router.post('/claude/decide', decisionLimiter, validateRequest, async (req, res) => {
  try {
    const { state } = req.body;
    const decision = await getClaudeDecision(state);
    
    // Add cache status to response headers
    const stats = getCacheStats();
    res.set('X-Cache-Stats', JSON.stringify(stats.decisions));
    
    res.json(decision);
  } catch (error) {
    console.error('Error in Claude decision endpoint:', error);
    res.status(500).json({ 
      error: 'Claude API Error',
      message: error.message,
      details: 'Failed to get a decision from Claude'
    });
  }
});

// Enhanced reflection endpoint with rate limiting and validation
router.post('/claude/reflect', reflectionLimiter, validateRequest, async (req, res) => {
  try {
    const { state } = req.body;
    const reflection = await getClaudeReflection(state);
    
    // Add cache status to response headers
    const stats = getCacheStats();
    res.set('X-Cache-Stats', JSON.stringify(stats.reflections));
    
    res.json(reflection);
  } catch (error) {
    console.error('Error in Claude reflection endpoint:', error);
    res.status(500).json({ 
      error: 'Claude API Error',
      message: error.message,
      details: 'Failed to get a reflection from Claude'
    });
  }
});

// Add cache management endpoints
router.post('/cache/clear', (req, res) => {
  try {
    clearCaches();
    res.json({ message: 'Caches cleared successfully' });
  } catch (error) {
    res.status(500).json({ 
      error: 'Cache Error',
      message: 'Failed to clear caches'
    });
  }
});

router.get('/cache/stats', (req, res) => {
  try {
    const stats = getCacheStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ 
      error: 'Cache Error',
      message: 'Failed to get cache stats'
    });
  }
});

module.exports = router; 