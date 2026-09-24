DROP TABLE IF EXISTS pilot_kpis;
DROP TABLE IF EXISTS pilots;
DROP TABLE IF EXISTS applications;
DROP TABLE IF EXISTS challenges;
DROP TABLE IF EXISTS startups;

CREATE TABLE startups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    sector TEXT,
    min_budget REAL DEFAULT 0,
    max_budget REAL,
    tech_readiness_level INTEGER DEFAULT 0,
    successful_pilots INTEGER DEFAULT 0,
    deployments INTEGER DEFAULT 0
);

CREATE TABLE challenges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    posted_by INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    sector TEXT,
    budget_ceiling REAL NOT NULL,
    risk_tier TEXT,
    deadline TEXT,
    status TEXT DEFAULT 'open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    challenge_id INTEGER NOT NULL,
    startup_id INTEGER NOT NULL,
    pitch_summary TEXT,
    proposed_cost REAL,
    status TEXT DEFAULT 'submitted',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (challenge_id) REFERENCES challenges(id),
    FOREIGN KEY (startup_id) REFERENCES startups(id)
);

CREATE TABLE pilots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    application_id INTEGER NOT NULL,
    start_date TEXT,
    end_date TEXT,
    FOREIGN KEY (application_id) REFERENCES applications(id)
);

CREATE TABLE pilot_kpis (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pilot_id INTEGER NOT NULL,
    kpi_name TEXT NOT NULL,
    target_value REAL NOT NULL,
    actual_value REAL,
    weight REAL DEFAULT 1.0,
    FOREIGN KEY (pilot_id) REFERENCES pilots(id)
);

-- ============ SEED DATA ============

INSERT INTO startups (name, sector, min_budget, max_budget, tech_readiness_level, successful_pilots, deployments) VALUES
('EcoRoute Analytics', 'CleanTech', 50000, 800000, 7, 3, 5),
('WasteWise Technologies', 'CleanTech', 100000, 1500000, 6, 2, 3),
('SmartCivic Solutions', 'Smart City', 200000, 5000000, 8, 5, 10),
('AgriSense Labs', 'AgriTech', 30000, 600000, 4, 0, 1),
('UrbanFlow Systems', 'Smart City', 150000, 2000000, 5, 1, 2),
('GreenGrid Innovations', 'CleanTech', 80000, 1000000, 6, 1, 4);

INSERT INTO challenges (posted_by, title, description, sector, budget_ceiling, risk_tier, status) VALUES
(1, 'AI-Based Smart Waste Collection & Route Optimization',
 'Develop a solution that helps the government optimize waste-collection routes, reduce fuel consumption, monitor collection status and improve timely waste management across the city.',
 'CleanTech', 500000, 'low', 'open'),
(1, 'Smart Traffic Signal Management System',
 'Design an AI-driven traffic signal system that adapts in real time to reduce congestion at major city intersections.',
 'Smart City', 2500000, 'medium', 'open'),
(1, 'Crop Health Monitoring Platform',
 'Build a satellite/IoT-based platform for early detection of crop disease and irrigation optimization for farmers.',
 'AgriTech', 400000, 'low', 'open');

INSERT INTO applications (challenge_id, startup_id, pitch_summary, proposed_cost, status) VALUES
(1, 1, 'Our route optimization engine has already reduced fuel costs by 22% in a pilot with Pune Municipal Corporation.', 450000, 'submitted'),
(1, 2, 'We specialize in waste sensor networks with real-time fill-level tracking.', 480000, 'submitted');

INSERT INTO pilots (application_id, start_date, end_date) VALUES
(1, '2026-01-01', '2026-04-01');

INSERT INTO pilot_kpis (pilot_id, kpi_name, target_value, actual_value, weight) VALUES
(1, 'Fuel cost reduction %', 20, 18, 1.0),
(1, 'Routes optimized per day', 50, 47, 1.0),
(1, 'Citizen complaint reduction %', 30, 35, 1.0);