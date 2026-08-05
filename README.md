# L'Oréal Claims Intelligence Engine — local demo

Covers the full flow: business team submits a claim → claim manager approves/rejects →
scientist attaches a formula → evaluator submits evidence → AI assesses the claim →
result is saved and shown in the UI.

Backend: NestJS + Prisma (SQLite, zero setup). Frontend: React (Vite), served by
the same NestJS server so the whole thing runs as **one app on one port**.

## Note on this build

This project was built and verified in a sandboxed environment without open internet
access, so `npx prisma generate` could not download its native query-engine binary here
(it's blocked from reaching `binaries.prisma.sh`). The TypeScript compiles cleanly
(`tsc --noEmit` passes with zero errors) and the React frontend builds cleanly — only
the Prisma binary download was blocked. On your machine, with normal internet access,
`npm install` + `npx prisma generate` will fetch that binary automatically and everything
will run end-to-end.

## Setup (run once)

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev --name init   # creates dev.db (SQLite) and applies the schema
npm run seed                          # optional: adds one example claim so the UI isn't empty
```

By default there's no `OPENAI_API_KEY` set in `.env` — the app will still run end-to-end
using a small deterministic mock (clearly labeled `[MOCK]` in the reasoning text) so you
can demo the full pipeline without a live key. To use the real OpenAI API, put your key
in `backend/.env`:

```
OPENAI_API_KEY="sk-..."
```

## Run it (single command, single port)

```bash
cd frontend && npm install && npm run build
cp -r dist ../backend/public

cd ../backend
npm run build
npm run start
```

Open **http://localhost:3000** — you'll see the full dashboard: submit a claim, approve
it as the claim manager, attach a formula as the scientist, then submit evidence as the
evaluator to trigger the AI assessment and see the verdict, confidence score, and
reasoning appear.

## Run it in dev mode instead (hot reload, two terminals)

```bash
# terminal 1
cd backend && npm run start:dev

# terminal 2
cd frontend && npm run dev
```

Open the Vite dev URL it prints (usually http://localhost:5173) — it proxies `/api`
calls to the NestJS server on port 3000.

## Project structure

```
backend/
  prisma/schema.prisma      # Claim + Assessment tables
  prisma/seed.ts            # one example claim for the demo
  src/claims/               # controller, service, DTOs — the full claim lifecycle
  src/openai/               # OpenAI wrapper with mock fallback
  src/app.module.ts         # wires claims module + serves the built React app
frontend/
  src/App.jsx               # one dashboard: create -> review -> formulate -> assess
```
