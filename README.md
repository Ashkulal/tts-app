# TextToSpeech App

Convert text, URLs, and PDFs to natural-sounding audio.

## Quick Start

### Local Development

1. Start PostgreSQL:
```bash
docker-compose up -d db
```

2. Setup backend:
```bash
cd backend
cp .env.example .env  # Edit with your OpenAI API key
npm install
npm run dev
```

3. Setup frontend:
```bash
cd frontend
npm install
npm run dev
```

4. Open http://localhost:3000

### Docker (full stack)
```bash
docker-compose up --build
```

### Deploy to Render

1. Push to GitHub
2. Connect repo to Render
3. Render auto-detects `render.yaml`
4. Add your OpenAI API key in environment variables

## Features

- Text to speech conversion
- URL content extraction
- PDF text extraction
- JWT authentication
- Free/Pro tiers
- Conversion history dashboard

## Tech Stack

- Backend: Node.js, TypeScript, Express, PostgreSQL
- Frontend: React, Vite
- TTS: OpenAI TTS API
- Auth: JWT + bcrypt
