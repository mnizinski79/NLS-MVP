# API Configuration Setup

This document explains how to set up the `/api/config` endpoint for the Gemini API key.

## Quick Start

### 1. Get Your Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy your API key

### 2. Install Dependencies

```bash
npm install express cors --save-dev
npm install concurrently --save-dev
```

### 3. Set Up Your API Key

Create a `.env` file in the root directory (copy from `.env.example`):

```bash
cp .env.example .env
```

Edit `.env` and add your API key:

```
GEMINI_API_KEY=your_actual_api_key_here
```

**Important:** The `.env` file is gitignored and should never be committed to version control.

### 4. Run the Application

#### Option A: Run Both API Server and Angular App Together (Recommended)

```bash
npm run start:dev
```

This will start:
- Mock API server on `http://localhost:3000`
- Angular app on `http://localhost:4200`

#### Option B: Run Separately

Terminal 1 - Start the API server:
```bash
npm run start:api
```

Terminal 2 - Start the Angular app:
```bash
npm start
```

## How It Works

1. **server.js**: A simple Express server that provides the `/api/config` endpoint
2. **proxy.conf.json**: Angular proxy configuration that forwards `/api/*` requests to `http://localhost:3000`
3. **ConfigService**: Angular service that fetches the API key from `/api/config` on startup

## API Endpoint

### GET /api/config

Returns the application configuration including the Gemini API key.

**Response:**
```json
{
  "geminiApiKey": "your_api_key_here"
}
```

## Security Notes

- **Never commit your API key** to version control
- The `.env` file is already in `.gitignore`
- In production, use environment variables or a secure secrets management system
- The API key should be served from a backend server, not exposed in client code

## Troubleshooting

### API key not loading

1. Check that the API server is running on port 3000
2. Verify your `.env` file has the correct API key
3. Check browser console for CORS errors
4. Ensure proxy.conf.json is being used (check Angular CLI output)

### Port 3000 already in use

Change the PORT in `server.js`:
```javascript
const PORT = 3001; // or any available port
```

And update `proxy.conf.json`:
```json
{
  "/api": {
    "target": "http://localhost:3001",
    ...
  }
}
```

## Alternative: Using Environment Files (Development Only)

For quick local testing without a backend server, you can modify `ConfigService` to use Angular environment files:

1. Add to `src/environments/environment.ts`:
```typescript
export const environment = {
  production: false,
  geminiApiKey: 'your_api_key_here'
};
```

2. Modify `ConfigService.loadConfig()` to return the environment value

**Note:** This approach is only suitable for local development and should never be used in production.
