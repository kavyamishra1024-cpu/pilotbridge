# GovStartup Pilot Platform — Starter Code

Core loop: Post Challenge → Apply → Shortlist → Pilot → Scorecard → Scale

## Run the backend
```
cd backend
pip install fastapi uvicorn --break-system-packages
python3 main.py          # initializes the database (run once)
python3 -m uvicorn main:app --reload --port 8000
```
Visit http://127.0.0.1:8000 — you should see a health check message.

## Run the frontend
This App.jsx expects a Vite + React project. If you don't have one yet:
```
npm create vite@latest frontend -- --template react
cd frontend
npm install
# replace src/App.jsx with the one provided here
npm run dev
```

## What's already tested and working
- Creating a challenge (auto-assigns risk tier from budget)
- Startup applying to a challenge
- Starting a pilot with custom KPIs
- Updating KPI actual values
- Computing a weighted overall score + auto-recommendation (scale / extend_pilot / reject)

## What's NOT built yet (be honest about this to judges)
- User authentication / login (routes use hardcoded IDs for demo speed)
- Email notifications
- Admin approval workflow for shortlisting (currently just a status field you can PATCH)
- The "transparency layer" public status tracker (mentioned as roadmap, not built)

## Your differentiator to emphasize in the pitch
The Pilot Scorecard (`GET /pilots/{id}/scorecard`) is the core original feature:
KPIs are defined BEFORE the pilot starts, tracked during it, and the system
auto-computes a transparent, weighted score and recommendation — removing
subjective "did it work?" judgment calls from the process.
