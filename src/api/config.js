require('dotenv').config();

// Environment variables in Create React App must be prefixed with REACT_APP_
if (!process.env.REACT_APP_ANTHROPIC_API_KEY) {
  throw new Error('Missing required environment variable: REACT_APP_ANTHROPIC_API_KEY');
}

const config = {
  anthropic: {
    model: 'claude-3-7-sonnet-20250219',
    maxTokens: 1000,
    apiKey: process.env.REACT_APP_ANTHROPIC_API_KEY,
    timeout: 60000, // 60 second timeout for API requests
    retryDelay: 1000 // 1 second base delay between retries
  },
  api: {
    rateLimit: {
      windowMs: 60 * 1000, // 1 minute
      max: 20 // limit each IP to 20 requests per minute
    }
  }
};

module.exports = { config }; 