# Quick Start Guide

## Setup API Configuration (One-Time Setup)

### Automated Setup (Recommended)

Run the setup script:

```bash
./setup-api.sh
```

This will:
- Install required dependencies (express, cors, concurrently)
- Create a `.env` file from the template
- Display next steps

### Manual Setup

1. Install dependencies:
```bash
npm install express cors concurrently --save-dev
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Get your Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

4. Edit `.env` and add your key:
```
GEMINI_API_KEY=your_actual_api_key_here
```

## Running the Application

### Development Mode (with API server)

```bash
npm run start:dev
```

This starts both:
- API server on http://localhost:3000
- Angular app on http://localhost:4200

### Separate Terminals

Terminal 1:
```bash
npm run start:api
```

Terminal 2:
```bash
npm start
```

## What Was Created

- **server.js** - Express server providing `/api/config` endpoint
- **proxy.conf.json** - Angular proxy configuration
- **.env.example** - Template for environment variables
- **.env** - Your actual API key (gitignored)
- **API_SETUP.md** - Detailed setup documentation

## Testing

Run tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

## Important Security Notes

⚠️ **Never commit your `.env` file or API key to version control!**

The `.env` file is already in `.gitignore` to prevent accidental commits.
