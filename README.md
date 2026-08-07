# recipe-app-evals

Recipe generation app with an LLM-eval pipeline in the backend — two models generate recipes for the same prompts, a third model judges them pairwise, and results are validated against human labels.

## Structure

- `frontend/` — React + TypeScript + Vite + Tailwind CSS + React Router
- `backend/` — Express + TypeScript + Mongoose (MongoDB), Zod-validated env config

## Getting started

### Backend

```bash
cd backend
cp .env.example .env   # fill in MONGODB_URI
npm install
npm run dev
```

API health check: `GET http://localhost:3000/api/health`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App: `http://localhost:5173`
