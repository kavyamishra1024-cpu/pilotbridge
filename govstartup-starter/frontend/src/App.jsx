import { useState, useEffect } from "react";

const API = "http://127.0.0.1:8000";

// ============================================================
// SCREEN 1: Post a Challenge (Government view)
// ============================================================
function PostChallenge({ onPosted }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sector, setSector] = useState("");
  const [budget, setBudget] = useState("");

  const submit = async () => {
    const res = await fetch(`${API}/challenges`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        posted_by: 1,
        title,
        description,
        sector,
        budget_ceiling: parseFloat(budget),
      }),
    });
    const data = await res.json();
    alert(`Challenge posted! Risk tier: ${data.risk_tier}`);
    onPosted();
  };

  return (
    <div className="card">
      <h2>Post a Challenge</h2>
      <input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
      <textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
      <input placeholder="Sector (e.g. CleanTech)" value={sector} onChange={(e) => setSector(e.target.value)} />
      <input placeholder="Budget ceiling (₹)" type="number" value={budget} onChange={(e) => setBudget(e.target.value)} />
      <button onClick={submit}>Post Challenge</button>
      <p className="hint">Risk tier (low/medium/high) is calculated automatically from your budget.</p>
    </div>
  );
}

// ============================================================
// SCREEN 2: Browse & Apply (Startup view)
// ============================================================
function BrowseChallenges() {
  const [challenges, setChallenges] = useState([]);
  const [applyingTo, setApplyingTo] = useState(null);
  const [pitch, setPitch] = useState("");
  const [cost, setCost] = useState("");

  const load = async () => {
    const res = await fetch(`${API}/challenges?status=open`);
    setChallenges(await res.json());
  };

  useEffect(() => { load(); }, []);

  const apply = async (challengeId) => {
    await fetch(`${API}/applications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        challenge_id: challengeId,
        startup_id: 2,
        pitch_summary: pitch,
        proposed_cost: parseFloat(cost),
      }),
    });
    alert("Application submitted!");
    setApplyingTo(null);
    setPitch("");
    setCost("");
  };

  return (
    <div className="card">
      <h2>Open Challenges</h2>
      {challenges.map((c) => (
        <div key={c.id} className="challenge-item">
          <h3>{c.title} <span className={`tier tier-${c.risk_tier}`}>{c.risk_tier}</span></h3>
          <p>{c.description}</p>
          <p className="hint">Sector: {c.sector} | Budget: ₹{c.budget_ceiling}</p>
          {applyingTo === c.id ? (
            <div>
              <textarea placeholder="Your pitch" value={pitch} onChange={(e) => setPitch(e.target.value)} />
              <input placeholder="Proposed cost" type="number" value={cost} onChange={(e) => setCost(e.target.value)} />
              <button onClick={() => apply(c.id)}>Submit Application</button>
            </div>
          ) : (
            <button onClick={() => setApplyingTo(c.id)}>Apply</button>
          )}
        </div>
      ))}
    </div>
  );
}

// ============================================================
// SCREEN 3: Pilot Scorecard Dashboard (the differentiator)
// ============================================================
function ScorecardDashboard({ pilotId }) {
  const [scorecard, setScorecard] = useState(null);

  const load = async () => {
    const res = await fetch(`${API}/pilots/${pilotId}/scorecard`);
    setScorecard(await res.json());
  };

  useEffect(() => { if (pilotId) load(); }, [pilotId]);

  if (!scorecard) return <div className="card">Loading scorecard...</div>;

  const recColor = {
    scale: "#2ea043",
    extend_pilot: "#d9822b",
    reject: "#c0392b",
    pending: "#888",
  }[scorecard.recommendation];

  return (
    <div className="card">
      <h2>Pilot Scorecard — Pilot #{scorecard.pilot_id}</h2>
      {scorecard.kpis.map((k, i) => (
        <div key={i} className="kpi-row">
          <span>{k.kpi_name}</span>
          <span>Target: {k.target_value} | Actual: {k.actual_value ?? "—"}</span>
          <div className="bar-bg">
            <div className="bar-fill" style={{ width: `${k.pct_achieved || 0}%` }} />
          </div>
          <span>{k.pct_achieved !== null ? `${k.pct_achieved}%` : "pending"}</span>
        </div>
      ))}
      <h3>Overall Score: {scorecard.overall_score ?? "—"}</h3>
      <div className="recommendation" style={{ background: recColor }}>
        Recommendation: {scorecard.recommendation.toUpperCase().replace("_", " ")}
      </div>
    </div>
  );
}

// ============================================================
// MAIN APP — simple tab switcher between the three screens
// ============================================================
export default function App() {
  const [tab, setTab] = useState("post");

  return (
    <div className="app">
      <h1>GovStartup Pilot Platform</h1>
      <nav>
        <button onClick={() => setTab("post")}>Post Challenge (Govt)</button>
        <button onClick={() => setTab("browse")}>Browse & Apply (Startup)</button>
        <button onClick={() => setTab("scorecard")}>Pilot Scorecard</button>
      </nav>

      {tab === "post" && <PostChallenge onPosted={() => setTab("browse")} />}
      {tab === "browse" && <BrowseChallenges />}
      {tab === "scorecard" && <ScorecardDashboard pilotId={1} />}

      <style>{`
        .app { max-width: 800px; margin: 0 auto; padding: 20px; font-family: sans-serif; }
        nav { display: flex; gap: 10px; margin-bottom: 20px; }
        nav button { padding: 10px; cursor: pointer; }
        .card { border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-bottom: 15px; }
        input, textarea { display: block; width: 100%; margin: 8px 0; padding: 8px; box-sizing: border-box; }
        .hint { color: #666; font-size: 0.85em; }
        .challenge-item { border-top: 1px solid #eee; padding: 12px 0; }
        .tier { padding: 2px 8px; border-radius: 10px; font-size: 0.75em; color: white; }
        .tier-low { background: #2ea043; }
        .tier-medium { background: #d9822b; }
        .tier-high { background: #c0392b; }
        .kpi-row { display: grid; grid-template-columns: 1fr 1fr 2fr 60px; gap: 10px; align-items: center; margin: 8px 0; }
        .bar-bg { background: #eee; border-radius: 4px; height: 10px; overflow: hidden; }
        .bar-fill { background: #0b3d91; height: 100%; }
        .recommendation { color: white; padding: 12px; border-radius: 6px; text-align: center; font-weight: bold; }
      `}</style>
    </div>
  );
}