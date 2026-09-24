"""
Startup-Friendly Government Procurement Platform — Backend
Core loop: Post Challenge -> Apply -> Shortlist -> Pilot -> Scorecard -> Scale
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import sqlite3
from datetime import date

app = FastAPI(title="GovStartup Pilot Platform")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = "govstartup.db"


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()
    with open("schema.sql") as f:
        conn.executescript(f.read())
    conn.commit()
    conn.close()


# ---------- Pydantic models (request bodies) ----------

class ChallengeCreate(BaseModel):
    posted_by: int
    title: str
    description: str
    sector: Optional[str] = None
    budget_ceiling: float
    deadline: Optional[str] = None


class ApplicationCreate(BaseModel):
    challenge_id: int
    startup_id: int
    pitch_summary: str
    proposed_cost: float


class PilotCreate(BaseModel):
    application_id: int
    start_date: str
    end_date: str
    kpis: List[dict]  # [{"kpi_name": "Cost savings %", "target_value": 20, "weight": 1.0}]


class KPIUpdate(BaseModel):
    kpi_id: int
    actual_value: float


class StartupProfileCreate(BaseModel):
    name: str
    sector: Optional[str] = None
    min_budget: Optional[float] = 0
    max_budget: Optional[float] = None
    tech_readiness_level: Optional[int] = 0   # 1-9 scale
    successful_pilots: Optional[int] = 0
    deployments: Optional[int] = 0


# ---------- Risk tiering logic (this is your differentiator) ----------

def calculate_risk_tier(budget_ceiling: float) -> str:
    """
    Fast-track logic: lower-budget pilots get simpler approval paths.
    Thresholds are illustrative — tune based on real procurement policy.
    """
    if budget_ceiling <= 500000:        # up to 5 lakh
        return "low"
    elif budget_ceiling <= 5000000:     # up to 50 lakh
        return "medium"
    else:
        return "high"


# ---------- Matching + explainability logic (new differentiator) ----------

def score_startup_against_challenge(startup: dict, challenge: dict) -> dict:
    """
    Scores one startup against one challenge and returns a human-readable
    breakdown of WHY it scored that way — required for procurement transparency.
    """
    criteria = []
    score = 0
    max_score = 5

    if startup.get("sector") and startup["sector"] == challenge.get("sector"):
        criteria.append({"label": "Strong technology/sector match", "status": "pass"})
        score += 1
    else:
        criteria.append({"label": "Sector does not match challenge", "status": "fail"})

    if startup.get("min_budget", 0) <= challenge["budget_ceiling"]:
        criteria.append({"label": "Budget compatible", "status": "pass"})
        score += 1
    else:
        criteria.append({"label": "Exceeds budget ceiling", "status": "fail"})

    if startup.get("successful_pilots", 0) > 0:
        criteria.append({"label": "Successful previous pilot", "status": "pass"})
        score += 1
    else:
        criteria.append({"label": "No prior pilot record", "status": "warning"})

    if startup.get("tech_readiness_level", 0) >= 5:
        criteria.append({"label": "Required infrastructure/readiness available", "status": "pass"})
        score += 1
    else:
        criteria.append({"label": "Technology readiness below recommended level", "status": "warning"})

    if startup.get("deployments", 0) >= 3:
        criteria.append({"label": "Established deployment history", "status": "pass"})
        score += 1
    else:
        criteria.append({"label": "Limited deployment history", "status": "warning"})

    return {
        "startup_id": startup["id"],
        "startup_name": startup["name"],
        "score": round((score / max_score) * 100),
        "criteria": criteria,
    }


# ---------- Routes: Startups (new — needed for matching) ----------

@app.post("/startups")
def create_startup(payload: StartupProfileCreate):
    conn = get_db()
    cur = conn.execute(
        """INSERT INTO startups (name, sector, min_budget, max_budget,
           tech_readiness_level, successful_pilots, deployments)
           VALUES (?, ?, ?, ?, ?, ?, ?)""",
        (payload.name, payload.sector, payload.min_budget, payload.max_budget,
         payload.tech_readiness_level, payload.successful_pilots, payload.deployments),
    )
    conn.commit()
    startup_id = cur.lastrowid
    conn.close()
    return {"id": startup_id, "status": "created"}


@app.get("/startups")
def list_startups():
    conn = get_db()
    rows = conn.execute("SELECT * FROM startups").fetchall()
    conn.close()
    return [dict(r) for r in rows]


# ---------- Routes: Challenges ----------

@app.post("/challenges")
def create_challenge(payload: ChallengeCreate):
    risk_tier = calculate_risk_tier(payload.budget_ceiling)
    conn = get_db()
    cur = conn.execute(
        """INSERT INTO challenges (posted_by, title, description, sector,
           budget_ceiling, risk_tier, deadline)
           VALUES (?, ?, ?, ?, ?, ?, ?)""",
        (payload.posted_by, payload.title, payload.description,
         payload.sector, payload.budget_ceiling, risk_tier, payload.deadline),
    )
    conn.commit()
    challenge_id = cur.lastrowid
    conn.close()
    return {"id": challenge_id, "risk_tier": risk_tier, "status": "open"}


@app.delete("/challenges/{challenge_id}")
def delete_challenge(challenge_id: int):
    conn = get_db()
    conn.execute("DELETE FROM challenges WHERE id = ?", (challenge_id,))
    conn.commit()
    conn.close()
    return {"deleted": challenge_id}


@app.get("/challenges")
def list_challenges(status: Optional[str] = None):
    conn = get_db()
    if status:
        rows = conn.execute("SELECT * FROM challenges WHERE status = ?", (status,)).fetchall()
    else:
        rows = conn.execute("SELECT * FROM challenges ORDER BY created_at DESC").fetchall()
    conn.close()
    return [dict(r) for r in rows]


@app.get("/challenges/{challenge_id}/matches")
def match_startups_to_challenge(challenge_id: int):
    """
    NEW FEATURE: Challenge -> Solution Matching + Explainable Evaluation.
    Reads the posted challenge, scores every startup against it, and
    returns a ranked shortlist with a transparent reason for each score.
    """
    conn = get_db()
    challenge = conn.execute("SELECT * FROM challenges WHERE id = ?", (challenge_id,)).fetchone()
    if not challenge:
        conn.close()
        raise HTTPException(404, "Challenge not found")

    startups = conn.execute("SELECT * FROM startups").fetchall()
    conn.close()

    results = [score_startup_against_challenge(dict(s), dict(challenge)) for s in startups]
    results.sort(key=lambda r: r["score"], reverse=True)

    return {"challenge": dict(challenge), "matches": results}


# ---------- Routes: Applications ----------

@app.post("/applications")
def apply_to_challenge(payload: ApplicationCreate):
    conn = get_db()
    cur = conn.execute(
        """INSERT INTO applications (challenge_id, startup_id, pitch_summary, proposed_cost)
           VALUES (?, ?, ?, ?)""",
        (payload.challenge_id, payload.startup_id, payload.pitch_summary, payload.proposed_cost),
    )
    conn.commit()
    app_id = cur.lastrowid
    conn.close()
    return {"id": app_id, "status": "submitted"}


@app.get("/challenges/{challenge_id}/applications")
def get_applications_for_challenge(challenge_id: int):
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM applications WHERE challenge_id = ? ORDER BY proposed_cost ASC",
        (challenge_id,),
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


@app.patch("/applications/{application_id}/status")
def update_application_status(application_id: int, status: str):
    valid = {"submitted", "shortlisted", "rejected", "selected_for_pilot"}
    if status not in valid:
        raise HTTPException(400, f"status must be one of {valid}")
    conn = get_db()
    conn.execute("UPDATE applications SET status = ? WHERE id = ?", (status, application_id))
    conn.commit()
    conn.close()
    return {"id": application_id, "status": status}


# ---------- Routes: Pilots + Scorecard (the differentiator) ----------

@app.post("/pilots")
def start_pilot(payload: PilotCreate):
    conn = get_db()
    cur = conn.execute(
        "INSERT INTO pilots (application_id, start_date, end_date) VALUES (?, ?, ?)",
        (payload.application_id, payload.start_date, payload.end_date),
    )
    pilot_id = cur.lastrowid

    for kpi in payload.kpis:
        conn.execute(
            """INSERT INTO pilot_kpis (pilot_id, kpi_name, target_value, weight)
               VALUES (?, ?, ?, ?)""",
            (pilot_id, kpi["kpi_name"], kpi["target_value"], kpi.get("weight", 1.0)),
        )

    conn.execute(
        "UPDATE applications SET status = 'selected_for_pilot' WHERE id = ?",
        (payload.application_id,),
    )
    conn.commit()
    conn.close()
    return {"pilot_id": pilot_id, "status": "active"}


@app.patch("/pilots/kpi")
def update_kpi_actual(payload: KPIUpdate):
    conn = get_db()
    conn.execute(
        "UPDATE pilot_kpis SET actual_value = ? WHERE id = ?",
        (payload.actual_value, payload.kpi_id),
    )
    conn.commit()
    conn.close()
    return {"kpi_id": payload.kpi_id, "actual_value": payload.actual_value}


@app.get("/pilots/{pilot_id}/scorecard")
def get_scorecard(pilot_id: int):
    """
    This IS the differentiator feature: a computed, weighted score
    showing exactly how close a pilot is to meeting its pre-defined targets.
    """
    conn = get_db()
    pilot = conn.execute("SELECT * FROM pilots WHERE id = ?", (pilot_id,)).fetchone()
    if not pilot:
        conn.close()
        raise HTTPException(404, "Pilot not found")

    kpis = conn.execute("SELECT * FROM pilot_kpis WHERE pilot_id = ?", (pilot_id,)).fetchall()
    conn.close()

    scored_kpis = []
    total_weighted_score = 0.0
    total_weight = 0.0

    for k in kpis:
        target = k["target_value"]
        actual = k["actual_value"]
        weight = k["weight"]
        pct_achieved = min(100.0, (actual / target) * 100) if (actual is not None and target) else None

        scored_kpis.append({
            "kpi_name": k["kpi_name"],
            "target_value": target,
            "actual_value": actual,
            "pct_achieved": round(pct_achieved, 1) if pct_achieved is not None else None,
        })

        if pct_achieved is not None:
            total_weighted_score += pct_achieved * weight
            total_weight += weight

    overall_score = round(total_weighted_score / total_weight, 1) if total_weight > 0 else None

    if overall_score is None:
        recommendation = "pending"
    elif overall_score >= 80:
        recommendation = "scale"
    elif overall_score >= 50:
        recommendation = "extend_pilot"
    else:
        recommendation = "reject"

    return {
        "pilot_id": pilot_id,
        "kpis": scored_kpis,
        "overall_score": overall_score,
        "recommendation": recommendation,
    }


# ---------- Routes: Dashboard stats (real values for the stat cards) ----------

@app.get("/stats")
def get_stats():
    conn = get_db()
    today = date.today().isoformat()

    open_challenges = conn.execute(
        "SELECT COUNT(*) FROM challenges WHERE status = 'open'"
    ).fetchone()[0]

    active_pilots = conn.execute(
        "SELECT COUNT(*) FROM pilots WHERE end_date >= ?", (today,)
    ).fetchone()[0]

    startups_applied = conn.execute(
        "SELECT COUNT(DISTINCT startup_id) FROM applications"
    ).fetchone()[0]

    pilot_ids = [r["id"] for r in conn.execute("SELECT id FROM pilots").fetchall()]
    conn.close()

    scored = 0
    scaled = 0
    for pid in pilot_ids:
        card = get_scorecard(pid)
        if card["overall_score"] is not None:
            scored += 1
            if card["recommendation"] == "scale":
                scaled += 1

    success_rate = round(scaled / scored * 100) if scored else 0

    return {
        "open_challenges": open_challenges,
        "active_pilots": active_pilots,
        "startups_applied": startups_applied,
        "success_rate": success_rate,
    }


@app.get("/")
def health():
    return {"message": "GovStartup Pilot Platform backend running"}


if __name__ == "__main__":
    init_db()
    print("Database initialized. Run with: uvicorn main:app --reload")