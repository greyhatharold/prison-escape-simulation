require('dotenv').config();
const express = require('express');
const cors = require('cors');
const claudeRouter = require('./api/claudeEndpoint');

const app = express();
const port = process.env.SERVER_PORT || 3001;

// Enable CORS for the React app
app.use(cors({
  origin: 'http://localhost:3000', // Your React app's URL
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-api-key', 'anthropic-version'],
  credentials: true
}));

// Parse JSON request bodies
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Mount the Claude router at /api
app.use('/api', claudeRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Health check available at http://localhost:${port}/health`);
});