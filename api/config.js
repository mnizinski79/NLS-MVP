// Vercel serverless function to replace server.js
export default function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    res.status(200).json({
      geminiApiKey: process.env.GEMINI_API_KEY || 'YOUR_API_KEY_HERE',
      passwordProtected: process.env.PASSWORD_PROTECTED || 'false',
      appPassword: process.env.APP_PASSWORD || ''
    });
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}