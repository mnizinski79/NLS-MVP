// Vercel serverless version of your Express server
const express = require('express');
const cors = require('cors');

const app = express();

// Enable CORS
app.use(cors());
app.use(express.json());

// API Config endpoint
app.get('/api/config', (req, res) => {
  res.json({
    geminiApiKey: process.env.GEMINI_API_KEY || 'YOUR_API_KEY_HERE'
  });
});

// Export for Vercel
module.exports = app;