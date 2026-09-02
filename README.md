# UGC Forge AI Content Factory

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/ugc-forge)

An AI-powered content factory for generating UGC (User-Generated Content) ad variants. Features an editorial-style interface with a Vite+React frontend and FastAPI backend for script generation, voice synthesis, and avatar rendering.

![UGC Forge Interface](https://via.placeholder.com/800x400?text=UGC+Forge+AI+Content+Factory)

## 🎯 Features

- **Campaign Management**: Create and manage UGC ad campaigns with product details, target audience, and claims
- **AI Script Generation**: Generate multiple script variations (hook, body, CTA) for each campaign
- **Render Pipeline**: Video rendering with avatar, voice synthesis, and multiple aspect ratios
- **Viral Scoring**: Score predictions for each script variant
- **Export & Analytics**: Batch export and performance tracking
- **Demo Mode**: Full-featured demo mode with mock data when backend is unavailable

## 🏗️ Architecture

- **Frontend**: Vite + React + TypeScript + Tailwind CSS
- **Backend**: FastAPI + PostgreSQL + Redis + Celery
- **Providers**: Anthropic (scripts), ElevenLabs (TTS), HeyGen (avatars)
- **Storage**: Local or Cloudflare R2

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.11+ (for backend)
- **Docker** and Docker Compose (optional, for backend services)

### Frontend Only (Demo Mode)

The easiest way to try UGC Forge is to run the frontend in demo mode:

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Or build for production
npm run build
npm run preview
```

The app will automatically run in demo mode with mock data when the backend is unavailable.

### Full Stack (With Backend)

#### 1. Start Backend Services

```bash
cd backend

# Copy environment configuration
cp .env.example .env

# Start services with Docker Compose
docker-compose up -d

# Run database migrations
docker-compose exec api alembic upgrade head

# View logs
docker-compose logs -f
```

The backend API will be available at `http://localhost:8000`

#### 2. Start Frontend

```bash
# In the project root directory
npm install
npm run dev
```

Visit `http://localhost:3000` to see the app.

### Configuration with AI Providers

To use real AI providers instead of stubs, update `backend/.env`:

```bash
# Script generation with Anthropic Claude
SCRIPT_PROVIDER=anthropic
ANTHROPIC_API_KEY=your_key_here

# Voice synthesis with ElevenLabs
TTS_PROVIDER=elevenlabs
ELEVENLABS_API_KEY=your_key_here
ELEVENLABS_VOICE_ID=21m00Tcm4TlvDq8ikWAM

# Avatar rendering with HeyGen
AVATAR_PROVIDER=heygen
HEYGEN_API_KEY=your_key_here

# Storage with Cloudflare R2
STORAGE_BACKEND=r2
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_key_id
R2_SECRET_ACCESS_KEY=your_secret
R2_BUCKET_NAME=ugcforge-renders
R2_PUBLIC_URL=https://your-bucket.r2.dev
```

## 📦 Deployment

### Deploy Frontend to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/ugc-forge)

#### Manual Deployment

1. **Fork/clone this repository**
2. **Sign up for [Vercel](https://vercel.com)**
3. **Import your repository** in Vercel
4. **Configure environment variables** (optional):
   - `VITE_API_URL`: Your backend API URL (e.g., `https://api.yourapp.com/api/v1`)
   - `VITE_DEMO_MODE`: Set to `true` to force demo mode, or leave unset to auto-detect

5. **Deploy!** Vercel will automatically build and deploy your frontend

#### Demo Mode vs. Live Backend

**Demo Mode** (default for frontend-only deploys):
- No backend required
- Uses realistic mock data
- Perfect for portfolio/showcase
- All features functional except actual AI generation

**Live Backend Mode**:
- Requires deployed FastAPI backend
- Set `VITE_API_URL` environment variable in Vercel
- Real AI generation with provider API keys

### Deploy Backend (Optional)

The backend requires:
- PostgreSQL database
- Redis instance
- Celery worker for async tasks
- API keys for AI providers

Recommended platforms:
- **Railway**: Easy deployment with PostgreSQL + Redis
- **Fly.io**: Good for FastAPI + workers
- **Render**: Supports Docker Compose
- **AWS/GCP/Azure**: Full control

## 🛠️ Development

### Project Structure

```
ugc-forge/
├── src/                      # Frontend source
│   ├── components/
│   │   ├── editorial/       # Editorial layout components
│   │   ├── layout/          # Page layout components
│   │   └── ui/              # UI primitives
│   ├── pages/               # Route pages
│   ├── lib/
│   │   ├── api.ts           # API client with demo fallback
│   │   ├── demo-api.ts      # Mock API implementation
│   │   ├── mock-data.ts     # Mock data generators
│   │   └── types.ts         # TypeScript types
│   └── styles/              # CSS styles
├── backend/                  # FastAPI backend
│   ├── app/
│   │   ├── api/             # API routes
│   │   ├── models/          # Database models
│   │   ├── providers/       # AI provider integrations
│   │   └── workers/         # Celery tasks
│   └── tests/               # Backend tests
├── public/                   # Static assets
└── vercel.json              # Vercel configuration
```

### Frontend Scripts

```bash
npm run dev          # Start dev server (http://localhost:3000)
npm run build        # Build for production
npm run preview      # Preview production build
npm run test         # Run tests
npm run test:ui      # Run tests with UI
```

### Backend Scripts

```bash
# From backend/ directory
docker-compose up -d              # Start all services
docker-compose exec api pytest    # Run tests
docker-compose logs -f api        # View API logs
docker-compose down               # Stop all services
```

## 🎨 Design Philosophy

UGC Forge features an **editorial/magazine aesthetic** with:

- **Bold Typography**: Refined serif headlines, crisp sans-serif body
- **High Contrast**: Pure black backgrounds, white content, racing red accents
- **Asymmetric Layouts**: Intentional grid breaks, balanced tension
- **Purposeful Motion**: Orchestrated animations, staggered reveals
- **Editorial Components**: Stat cards, content grids, refined forms

## 🔒 Security Notes

- **No secrets in repository**: All API keys and credentials belong in environment variables
- **Demo mode is safe**: Frontend can be deployed publicly in demo mode
- **Backend requires authentication**: Add auth before public backend deployment
- **Environment variables**: Never commit `.env` files

## 📝 Environment Variables

### Frontend Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `VITE_API_URL` | Backend API endpoint | `http://localhost:8000/api/v1` | No |
| `VITE_DEMO_MODE` | Force demo mode (true/false) | Auto-detect | No |

### Backend Variables

See `backend/.env.example` for full backend configuration including:
- Database connection (PostgreSQL)
- Redis connection
- Storage backend (local/R2)
- AI provider keys (Anthropic, ElevenLabs, HeyGen)
- Meta Ads API credentials

## 🤝 Contributing

Contributions welcome! This is a portfolio/educational project.

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

ISC License - see LICENSE file for details

## 🙋 Support

For questions or issues:
- Open an issue on GitHub
- Check existing issues for solutions
- Review the documentation above

---

**Built with**: React, TypeScript, Vite, Tailwind CSS, FastAPI, PostgreSQL, Celery, and modern AI APIs.

**Portfolio Demo**: [Your Vercel URL here]
