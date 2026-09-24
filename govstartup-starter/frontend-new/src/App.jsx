import { useState, useEffect } from "react";

const API = "http://127.0.0.1:8000";

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
      <div className="card-head">
        <div className="card-icon icon-navy">📝</div>
        <div>
          <h2>Post a Challenge</h2>
          <p className="card-desc">Publish a problem statement for startups to solve.</p>
        </div>
      </div>
      <label>Title</label>
      <input placeholder="e.g. Smart Waste Collection System" value={title} onChange={(e) => setTitle(e.target.value)} />
      <label>Description</label>
      <textarea placeholder="Describe the problem in detail..." value={description} onChange={(e) => setDescription(e.target.value)} />
      <div className="row-2">
        <div>
          <label>Sector</label>
          <input placeholder="e.g. CleanTech" value={sector} onChange={(e) => setSector(e.target.value)} />
        </div>
        <div>
          <label>Budget ceiling (₹)</label>
          <input placeholder="100000" type="number" value={budget} onChange={(e) => setBudget(e.target.value)} />
        </div>
      </div>
      <button className="btn-primary" onClick={submit}>Post Challenge</button>
      <p className="hint">Risk tier (low / medium / high) is calculated automatically from your budget.</p>
    </div>
  );
}

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
      <div className="card-head">
        <div className="card-icon icon-teal">🔍</div>
        <div>
          <h2>Open Challenges</h2>
          <p className="card-desc">Browse live government problem statements and apply.</p>
        </div>
      </div>
      {challenges.length === 0 && <p className="hint">No open challenges yet.</p>}
      {challenges.map((c) => (
        <div key={c.id} className="item-box">
          <div className="item-top">
            <h3>{c.title}</h3>
            <span className={`tier tier-${c.risk_tier}`}>{c.risk_tier} risk</span>
          </div>
          <p className="item-desc">{c.description}</p>
          <div className="item-meta">
            <span>📁 {c.sector}</span>
            <span>💰 ₹{c.budget_ceiling}</span>
          </div>
          {applyingTo === c.id ? (
            <div className="apply-box">
              <textarea placeholder="Your pitch" value={pitch} onChange={(e) => setPitch(e.target.value)} />
              <input placeholder="Proposed cost" type="number" value={cost} onChange={(e) => setCost(e.target.value)} />
              <button className="btn-primary" onClick={() => apply(c.id)}>Submit Application</button>
            </div>
          ) : (
            <button className="btn-outline" onClick={() => setApplyingTo(c.id)}>Apply</button>
          )}
        </div>
      ))}
    </div>
  );
}

function ScorecardDashboard({ pilotId }) {
  const [scorecard, setScorecard] = useState(null);

  const load = async () => {
    const res = await fetch(`${API}/pilots/${pilotId}/scorecard`);
    setScorecard(await res.json());
  };

  useEffect(() => { if (pilotId) load(); }, [pilotId]);

  if (!scorecard) return <div className="card">Loading scorecard...</div>;

  const recColor = {
    scale: "#1a8f4c",
    extend_pilot: "#b6790e",
    reject: "#b3261e",
    pending: "#6b7280",
  }[scorecard.recommendation];

  return (
    <div className="card">
      <div className="card-head">
        <div className="card-icon icon-gold">📊</div>
        <div>
          <h2>Pilot Scorecard</h2>
          <p className="card-desc">Pilot #{scorecard.pilot_id} — KPI performance overview</p>
        </div>
      </div>
      {scorecard.kpis.map((k, i) => (
        <div key={i} className="kpi-row">
          <span className="kpi-name">{k.kpi_name}</span>
          <span className="kpi-vals">Target: {k.target_value} | Actual: {k.actual_value ?? "—"}</span>
          <div className="bar-bg">
            <div className="bar-fill" style={{ width: `${k.pct_achieved || 0}%` }} />
          </div>
          <span className="kpi-pct">{k.pct_achieved !== null ? `${k.pct_achieved}%` : "pending"}</span>
        </div>
      ))}
      <div className="score-summary">Overall Score: <strong>{scorecard.overall_score ?? "—"}</strong></div>
      <div className="recommendation" style={{ background: recColor }}>
        Recommendation: {scorecard.recommendation.toUpperCase().replace("_", " ")}
      </div>
    </div>
  );
}

function PublicFeed() {
  const [challenges, setChallenges] = useState([]);

  const load = async () => {
    const res = await fetch(`${API}/challenges`);
    setChallenges(await res.json());
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="card">
      <div className="card-head">
        <div className="card-icon icon-green">🌐</div>
        <div>
          <h2>Public Transparency Feed</h2>
          <p className="card-desc">Every challenge posted by government departments — visible to citizens.</p>
        </div>
      </div>
      {challenges.length === 0 && <p className="hint">Nothing posted yet.</p>}
      {challenges.map((c) => (
        <div key={c.id} className="item-box">
          <div className="item-top">
            <h3>{c.title}</h3>
            <span className={`tier tier-${c.risk_tier}`}>{c.risk_tier} risk</span>
          </div>
          <p className="item-desc">{c.description}</p>
          <div className="item-meta">
            <span>📁 {c.sector}</span>
            <span>💰 ₹{c.budget_ceiling}</span>
            <span className={`status status-${c.status}`}>{c.status}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function StatusIcon({ status }) {
  if (status === "pass") return <span style={{ color: "#1a8f4c" }}>✓</span>;
  if (status === "warning") return <span style={{ color: "#b6790e" }}>⚠</span>;
  return <span style={{ color: "#b3261e" }}>✗</span>;
}

function SmartMatches() {
  const [challenges, setChallenges] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [matchData, setMatchData] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadChallenges = async () => {
    const res = await fetch(`${API}/challenges`);
    setChallenges(await res.json());
  };

  useEffect(() => { loadChallenges(); }, []);

  const findMatches = async (id) => {
    if (!id) return;
    setLoading(true);
    setMatchData(null);
    const res = await fetch(`${API}/challenges/${id}/matches`);
    const data = await res.json();
    setMatchData(data);
    setLoading(false);
  };

  const onSelect = (e) => {
    const id = e.target.value;
    setSelectedId(id);
    findMatches(id);
  };

  return (
    <div className="card">
      <div className="card-head">
        <div className="card-icon icon-gold">🎯</div>
        <div>
          <h2>Smart Matches</h2>
          <p>Smart-matched startups for a posted challenge — every score is transparent and explainable.</p>
        </div>
      </div>

      <label>Select a Challenge</label>
      <select
        value={selectedId}
        onChange={onSelect}
        style={{
          display: "block", width: "100%", padding: "11px 13px",
          background: "#f8f9fb", border: "1.5px solid #dde1e8", borderRadius: "9px",
          color: "#1c2230", fontSize: "0.92em",
        }}
      >
        <option value="">-- Choose a challenge --</option>
        {challenges.map((c) => (
          <option key={c.id} value={c.id}>{c.title}</option>
        ))}
      </select>

      {loading && <p className="hint" style={{ marginTop: 16 }}>Finding matches...</p>}

      {matchData && !loading && (
        <div style={{ marginTop: 20 }}>
          {matchData.error && <p className="hint">{matchData.error}</p>}
          {matchData.matches && matchData.matches.length === 0 && (
            <p className="hint">No startups in the system yet to match against.</p>
          )}
          {matchData.matches && matchData.matches.map((m) => (
            <div key={m.startup_id} className="item-box">
              <div className="item-top">
                <h3>{m.startup_name}</h3>
                <span
                  className="tier"
                  style={{
                    background: m.score >= 80 ? "#1a8f4c" : m.score >= 50 ? "#b6790e" : "#b3261e",
                  }}
                >
                  {m.score}% match
                </span>
              </div>
              <p className="item-desc" style={{ fontWeight: 700, color: "#0f1c3f", marginTop: 10 }}>
                Why this startup was shortlisted:
              </p>
              <ul style={{ margin: "6px 0 0", paddingLeft: 20, fontSize: "0.88em", color: "#475467" }}>
                {m.criteria.map((c, i) => (
                  <li key={i} style={{ marginBottom: 4 }}>
                    <StatusIcon status={c.status} /> {c.label}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState("post");
  const [statsData, setStatsData] = useState(null);

useEffect(() => {
  fetch(`${API}/stats`)
    .then((res) => res.json())
    .then(setStatsData)
    .catch(() => {});
}, [tab]);

  const tabs = [
    { id: "post", label: "Post Challenge", icon: "📝" },
    { id: "browse", label: "Browse & Apply", icon: "🔍" },
    { id: "matches", label: "Smart Matches", icon: "🎯" },
    { id: "scorecard", label: "Pilot Scorecard", icon: "📊" },
    { id: "feed", label: "Public Feed", icon: "🌐" },
  ];

  const activeTabLabel = tabs.find((t) => t.id === tab)?.label;

  const stats = [
  { label: "Open Challenges", value: statsData ? statsData.open_challenges : "—", icon: "📋", cls: "icon-navy" },
  { label: "Active Pilots", value: statsData ? statsData.active_pilots : "—", icon: "🚀", cls: "icon-teal" },
  { label: "Startups Applied", value: statsData ? statsData.startups_applied : "—", icon: "🏢", cls: "icon-green" },
  { label: "Success Rate", value: statsData ? `${statsData.success_rate}%` : "—", icon: "🎯", cls: "icon-gold" },
];

  return (
    <div className="shell">
      <div className="dashboard">
        <aside className="sidebar">
          <div className="brand">
            <div className="brand-logo">🏛️</div>
            <span className="brand-name">PilotBridge</span>
          </div>
          <nav className="side-nav">
            {tabs.map((t) => (
              <button
                key={t.id}
                className={tab === t.id ? "side-item active" : "side-item"}
                onClick={() => setTab(t.id)}
              >
                <span className="side-icon">{t.icon}</span>
                {t.label}
              </button>
            ))}
          </nav>
          <div className="help-box">
            <div className="help-emoji">💬</div>
            <p className="help-title">Need help?</p>
            <p className="help-text">Have a question while using PilotBridge?</p>
          </div>
        </aside>

        <main className="main">
          <div className="topbar">
            <div className="search-box">🔍 <span>Search challenges...</span></div>
            <div className="date-box">{new Date().toDateString()}</div>
          </div>

          <div className="welcome-banner">
            <div className="welcome-text">
              <span className="eyebrow">GOVERNMENT × STARTUP INITIATIVE</span>
              <h1 style={{textAlign: "center"}}>PilotBridge ⭐</h1>
              <p style={{textAlign: "center", fontWeight: 600, marginBottom: 4}}>Connecting Government Challenges with Startup Innovation</p>
              <p style={{textAlign: "center"}}>Post problems, discover pilots, and track real impact — all in one place.</p>
              <button className="btn-gold" onClick={() => setTab("post")}>Get Started</button>
            </div>
            <div className="welcome-illustration">
              <div className="chart-icon">📈</div>
            </div>
          </div>

          <div className="stats-row">
            {stats.map((s, i) => (
              <div className="stat-card" key={i}>
                <div className={`stat-icon ${s.cls}`}>{s.icon}</div>
                <div>
                  <div className="stat-value">{s.value}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="section-label">{activeTabLabel}</div>
          {tab === "post" && <PostChallenge onPosted={() => setTab("browse")} />}
          {tab === "browse" && <BrowseChallenges />}
          {tab === "matches" && <SmartMatches />}
          {tab === "scorecard" && <ScorecardDashboard pilotId={1} />}
          {tab === "feed" && <PublicFeed />}
        </main>
      </div>

      <style>{`
        html, body, #root { margin: 0; padding: 0; width: 100%; min-height: 100%; }
        * { box-sizing: border-box; }
        .shell {
          width: 100vw; min-height: 100vh;
          background: #eef1f6;
          font-family: 'Segoe UI', system-ui, sans-serif;
          display: flex; align-items: flex-start; justify-content: center;
          padding: 30px 16px;
        }
        .dashboard {
          width: 100%; max-width: 1200px;
          display: flex;
          background: #fff;
          border-radius: 20px;
          box-shadow: 0 16px 48px rgba(15,23,42,0.10);
          overflow: hidden;
          min-height: 760px;
        }

        /* SIDEBAR */
        .sidebar {
          width: 230px; flex-shrink: 0;
          background: #0f1c3f;
          padding: 26px 18px;
          display: flex; flex-direction: column;
        }
        .brand { display: flex; align-items: center; gap: 10px; margin-bottom: 34px; padding-left: 4px; }
        .brand-logo {
          width: 36px; height: 36px; border-radius: 9px;
          background: #d4a017;
          display: flex; align-items: center; justify-content: center; font-size: 1.1em;
        }
        .brand-name { font-weight: 800; font-size: 1.05em; color: #fff; letter-spacing: 0.01em; }
        .side-nav { display: flex; flex-direction: column; gap: 4px; }
        .side-item {
          display: flex; align-items: center; gap: 10px;
          padding: 11px 12px; border-radius: 9px; border: none;
          background: transparent; color: #aeb8d4; font-size: 0.88em; font-weight: 600;
          cursor: pointer; text-align: left;
        }
        .side-icon { font-size: 1.05em; }
        .side-item:hover { background: rgba(255,255,255,0.06); color: #fff; }
        .side-item.active { background: #d4a017; color: #0f1c3f; }
        .help-box {
          margin-top: auto; background: rgba(255,255,255,0.06);
          border-radius: 12px; padding: 18px; text-align: center;
        }
        .help-emoji { font-size: 1.5em; margin-bottom: 6px; }
        .help-title { font-weight: 700; font-size: 0.88em; margin: 0 0 4px; color: #fff; }
        .help-text { font-size: 0.76em; color: #aeb8d4; margin: 0; }

        /* MAIN */
        .main { flex: 1; padding: 26px 34px 40px; min-width: 0; background: #fff; }
        .topbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 22px; }
        .search-box {
          background: #f2f4f8; border-radius: 9px; padding: 10px 16px;
          font-size: 0.85em; color: #8a93a6; display: flex; align-items: center; gap: 8px;
          min-width: 240px;
        }
        .date-box { font-size: 0.85em; color: #556; font-weight: 600; }

        .welcome-banner {
          background: #0f1c3f;
          border-radius: 16px; padding: 32px 36px;
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 24px; gap: 20px; flex-wrap: wrap;
          position: relative; overflow: hidden;
        }
        .welcome-banner::before {
          content: ""; position: absolute; top: -60px; right: -60px;
          width: 220px; height: 220px; border-radius: 50%;
          background: rgba(212,160,23,0.14);
        }
        .welcome-text { max-width: 480px; position: relative; z-index: 1; }
        .eyebrow {
          display: inline-block; color: #d4a017; font-size: 0.72em; font-weight: 800;
          letter-spacing: 0.08em; margin-bottom: 10px;
        }
        .welcome-text h1 { color: #fff; font-size: 1.55em; margin: 0 0 10px; line-height: 1.32; font-weight: 800; }
        .welcome-text p { color: #b6c0dd; font-size: 0.9em; margin: 0 0 18px; }
        .btn-gold {
          background: #d4a017; color: #0f1c3f; border: none;
          padding: 12px 24px; border-radius: 9px; cursor: pointer;
          font-weight: 800; font-size: 0.9em;
        }
        .btn-gold:hover { background: #e3b02a; }
        .welcome-illustration { text-align: center; position: relative; z-index: 1; }
        .chart-icon { font-size: 3.2em; opacity: 0.9; }

        .stats-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 28px; }
        .stat-card {
          background: #fff; border: 1px solid #e7eaf0; border-radius: 12px;
          padding: 16px; display: flex; align-items: center; gap: 12px;
        }
        .stat-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.15em; flex-shrink: 0; }
        .icon-navy { background: #e6eaf5; color: #0f1c3f; }
        .icon-teal { background: #e1f2f3; color: #147a8c; }
        .icon-gold { background: #faf1dc; color: #b6790e; }
        .icon-green { background: #e5f4ea; color: #1a8f4c; }
        .stat-value { font-size: 1.25em; font-weight: 800; line-height: 1; color: #101828; }
        .stat-label { font-size: 0.74em; color: #8a93a6; margin-top: 4px; }

        .section-label {
          font-size: 0.76em; font-weight: 800; color: #8a93a6;
          text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 12px;
        }

        .card {
          background: #fff; border: 1px solid #e7eaf0; border-radius: 16px;
          padding: 28px; box-shadow: 0 2px 10px rgba(15,23,42,0.04);
        }
        .card-head { display: flex; gap: 14px; align-items: flex-start; margin-bottom: 20px; }
        .card-icon {
          width: 44px; height: 44px; border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.25em; flex-shrink: 0;
        }
        .card-head h2 { margin: 0 0 4px; font-size: 1.25em; color: #101828; }
        .card-desc { color: #667085; font-size: 0.87em; margin: 0; }

        label { display: block; font-size: 0.78em; font-weight: 700; color: #0f1c3f; margin: 14px 0 4px; text-transform: uppercase; letter-spacing: 0.03em; }
        input, textarea {
          display: block; width: 100%; padding: 11px 13px;
          background: #f8f9fb; border: 1.5px solid #dde1e8; border-radius: 9px;
          color: #1c2230; font-size: 0.92em;
        }
        input:focus, textarea:focus { outline: none; border-color: #0f1c3f; background: #fff; box-shadow: 0 0 0 3px rgba(15,28,63,0.08); }
        .row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

        .btn-primary {
          background: #0f1c3f; color: #fff; border: none;
          padding: 12px 24px; border-radius: 9px; cursor: pointer;
          font-weight: 700; font-size: 0.9em; margin-top: 18px;
        }
        .btn-primary:hover { background: #17284f; }
        .btn-outline {
          background: transparent; border: 1.5px solid #0f1c3f; color: #0f1c3f;
          padding: 8px 16px; border-radius: 8px; cursor: pointer; font-weight: 700; font-size: 0.85em;
        }
        .btn-outline:hover { background: #f2f4f8; }
        .hint { color: #98a2b3; font-size: 0.82em; margin-top: 10px; }

        .item-box { border: 1px solid #edeff3; background: #fafbfc; border-radius: 12px; padding: 18px; margin-bottom: 14px; }
        .item-top { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
        .item-top h3 { margin: 0; font-size: 1.02em; color: #101828; }
        .item-desc { color: #667085; font-size: 0.87em; margin: 8px 0 0; }
        .item-meta { display: flex; gap: 16px; font-size: 0.8em; color: #667085; flex-wrap: wrap; }
        .apply-box { margin-top: 12px; }

        .tier { padding: 4px 12px; border-radius: 20px; font-size: 0.7em; color: #fff; font-weight: 700; white-space: nowrap; }
        .tier-low { background: #1a8f4c; }
        .tier-medium { background: #b6790e; }
        .tier-high { background: #b3261e; }
        .status { padding: 3px 10px; border-radius: 7px; font-weight: 700; font-size: 0.78em; }
        .status-open { background: #e5f4ea; color: #1a8f4c; }
        .status-closed { background: #fbe9e8; color: #b3261e; }

        .kpi-row { display: grid; grid-template-columns: 1.2fr 1.5fr 2fr 60px; gap: 12px; align-items: center; margin: 12px 0; font-size: 0.86em; }
        .kpi-name { font-weight: 700; color: #101828; }
        .kpi-vals { color: #667085; }
        .kpi-pct { text-align: right; font-weight: 700; color: #0f1c3f; }
        .bar-bg { background: #eef1f6; border-radius: 6px; height: 8px; overflow: hidden; }
        .bar-fill { background: #d4a017; height: 100%; }
        .score-summary { margin-top: 16px; font-size: 1em; color: #101828; }
        .recommendation { color: #fff; padding: 14px; border-radius: 10px; text-align: center; font-weight: 800; margin-top: 14px; letter-spacing: 0.03em; }

        @media (max-width: 900px) {
          .stats-row { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 800px) {
          .dashboard { flex-direction: column; }
          .sidebar { width: 100%; flex-direction: row; overflow-x: auto; padding: 14px; }
          .brand { margin-bottom: 0; margin-right: 14px; }
          .side-nav { flex-direction: row; }
          .help-box { display: none; }
          .main { padding: 20px; }
        }
      `}</style>
    </div>
  );
}