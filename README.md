# L'Oréal Claims Intelligence Engine — local demo

Covers the full flow: business team submits a claim → claim manager approves/rejects →
scientist attaches a formula → evaluator submits evidence → AI assesses the claim →
result is saved and shown in the UI.

Backend: NestJS + Prisma (SQLite, zero setup). Frontend: React (Vite), served by
the same NestJS server so the whole thing runs as one app on one port.

## Overview

This project is a local demo of a claims intelligence workflow for L'Oréal-style product
claims evaluation. It includes:

- claim submission by the business team
- approval or rejection by a claim manager
- formula attachment by a scientist
- evidence submission by an evaluator
- AI-based assessment with verdict, confidence score, and reasoning
- persistence using Prisma + SQLite
- a single frontend/dashboard that renders the entire pipeline

## Prerequisites

Before you run the app, make sure you have:

- Node.js 18+ installed
- npm installed
- a local terminal (PowerShell, Bash, Git Bash, etc.)
- normal internet access for the first Prisma setup on a standard machine

## Environment setup

The backend expects a `.env` file in the `backend` folder. If it does not already exist,
create it with:

```env
DATABASE_URL="file:./dev.db"
OPENAI_API_KEY=""
PORT=3000
```

If `OPENAI_API_KEY` is empty, the app will still run end-to-end using a deterministic mock
model. The reasoning output is clearly labeled with `[MOCK]`, so you can demo the workflow
without a live OpenAI key.

To use the real API, set:

```env
OPENAI_API_KEY="sk-..."
```

## Setup (run once)

From the project root:

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev --name init   # creates dev.db and applies the schema
npm run seed                          # optional: adds one example claim
```

> Note: In some sandboxed or restricted environments, Prisma may fail to download its native
> engine binary. On a normal local machine with internet access, `npm install` +
> `npx prisma generate` fetches it automatically and the app runs normally.

## Run the app in production-style mode

This builds the React frontend and serves it through the NestJS backend on a single port.

### macOS / Linux

```bash
cd frontend && npm install && npm run build
cp -r dist ../backend/public

cd ../backend
npm run build
npm run start
```

### Windows PowerShell

```powershell
cd frontend
npm install
npm run build
Copy-Item -Recurse -Force dist\* ..\backend\public\

cd ..\backend
npm run build
npm run start
```

Then open:

- http://localhost:3000

You will see the full dashboard: submit a claim, approve it as the claim manager, attach a
formula as the scientist, then submit evidence as the evaluator to trigger the AI assessment
and see the verdict, confidence score, and reasoning appear.

## Run it in dev mode instead

This starts the backend and frontend separately for hot reload.

### Terminal 1

```bash
cd backend
npm run start:dev
```

### Terminal 2

```bash
cd frontend
npm run dev
```

Open the Vite URL printed in the terminal (usually http://localhost:5173). The frontend
proxies `/api` requests to the NestJS server running on port 3000.

## Project structure

```text
backend/
  prisma/schema.prisma      # Claim + Assessment tables
  prisma/seed.ts            # demo seed data
  src/claims/               # controller, service, DTOs, claim lifecycle logic
  src/openai/               # OpenAI wrapper with mock fallback
  src/app.module.ts         # wires the claims module and serves the frontend build
  src/main.ts               # starts the NestJS server
frontend/
  src/App.jsx               # dashboard: create -> review -> formulate -> assess
  vite.config.js            # Vite config with API proxy
```

## Typical demo flow

1. Create a new claim from the business dashboard.
2. Open the claim and approve or reject it as the claim manager.
3. Attach a scientific formula as the scientist.
4. Add evaluator evidence and submit the assessment.
5. The AI engine evaluates the claim and saves the verdict/result.
6. The final result is displayed in the UI.

## Notes

- This is designed for local demos and quick validation.
- SQLite is used for zero-setup local storage.
- The app is intentionally simple and deterministic for interview/demo use.
- The frontend and backend are designed to work together as a single app experience.


<img width="2880" height="1620" alt="image" src="https://github.com/user-attachments/assets/b9b866c5-f9e6-441f-9430-3ed4729180b1" />
