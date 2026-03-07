#!/bin/bash

echo "Setting up API configuration..."
echo ""

# Install dependencies
echo "Installing required dependencies..."
npm install express cors concurrently --save-dev

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo ""
    echo "Creating .env file..."
    cp .env.example .env
    echo "✓ .env file created"
    echo ""
    echo "⚠️  IMPORTANT: Edit .env and add your Gemini API key"
    echo "   Get your key from: https://makersuite.google.com/app/apikey"
else
    echo ""
    echo "✓ .env file already exists"
fi

echo ""
echo "Setup complete!"
echo ""
echo "Next steps:"
echo "1. Get your Gemini API key from: https://makersuite.google.com/app/apikey"
echo "2. Edit .env and add your API key"
echo "3. Run: npm run start:dev"
echo ""
