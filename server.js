require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const PORT = 3000;

// Enable CORS
app.use(cors());
app.use(express.json());

// Serve static files from the root directory
app.use(express.static(__dirname));

// API Config endpoint
app.get('/api/config', (req, res) => {
  res.json({
    geminiApiKey: process.env.GEMINI_API_KEY || 'YOUR_API_KEY_HERE'
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Mock API server running on:`);
  console.log(`  - Local:   http://localhost:${PORT}`);
  console.log(`  - Network: http://192.168.4.76:${PORT}`);
  console.log(`\nConfig endpoint: http://localhost:${PORT}/api/config`);
  console.log(`Hotels data: http://localhost:${PORT}/hotels%20(1).json`);
  console.log(`\nTo set your Gemini API key, use:`);
  console.log(`GEMINI_API_KEY=your_key_here node server.js`);
});
