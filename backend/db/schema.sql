-- NEXUS Database Schema
-- PostgreSQL materialized view of onchain events

CREATE TABLE IF NOT EXISTS agents (
    id                  BIGINT PRIMARY KEY,
    owner_address       VARCHAR(42) NOT NULL,
    name                VARCHAR(100) NOT NULL,
    description         TEXT,
    ipfs_metadata_hash  VARCHAR(100),
    role                VARCHAR(20),
    pricing_model       SMALLINT,
    base_price_wei      NUMERIC(78, 0),
    staked_amount_wei   NUMERIC(78, 0),
    reputation_score    INTEGER DEFAULT 5000,
    completed_jobs      INTEGER DEFAULT 0,
    failed_jobs         INTEGER DEFAULT 0,
    total_earned_wei    NUMERIC(78, 0) DEFAULT 0,
    total_spent_wei     NUMERIC(78, 0) DEFAULT 0,
    is_active           BOOLEAN DEFAULT TRUE,
    parent_agent_id     BIGINT REFERENCES agents(id),
    registered_at       TIMESTAMPTZ,
    last_active_at      TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_agents_owner ON agents(owner_address);
CREATE INDEX idx_agents_active ON agents(is_active);
CREATE INDEX idx_agents_reputation ON agents(reputation_score DESC);

CREATE TABLE IF NOT EXISTS agent_capabilities (
    agent_id        BIGINT REFERENCES agents(id) ON DELETE CASCADE,
    capability_hash VARCHAR(66) NOT NULL,
    capability_name VARCHAR(50) NOT NULL,
    PRIMARY KEY (agent_id, capability_hash)
);

CREATE INDEX idx_caps_name ON agent_capabilities(capability_name);

CREATE TABLE IF NOT EXISTS jobs (
    id                  BIGINT PRIMARY KEY,
    poster_address      VARCHAR(42) NOT NULL,
    poster_agent_id     BIGINT REFERENCES agents(id),
    required_capability VARCHAR(66) NOT NULL,
    capability_name     VARCHAR(50),
    task_payload_ipfs   VARCHAR(100),
    budget_wei          NUMERIC(78, 0) NOT NULL,
    quality_threshold   SMALLINT NOT NULL,
    deadline_timestamp  TIMESTAMPTZ NOT NULL,
    status              VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    winning_agent_id    BIGINT REFERENCES agents(id),
    winning_bid_wei     NUMERIC(78, 0),
    result_ipfs         VARCHAR(100),
    audit_score         SMALLINT,
    audit_request_id    NUMERIC(78, 0),
    cycle_time_ms       INTEGER,
    posted_at           TIMESTAMPTZ NOT NULL,
    assigned_at         TIMESTAMPTZ,
    result_at           TIMESTAMPTZ,
    completed_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_capability ON jobs(required_capability);
CREATE INDEX idx_jobs_poster ON jobs(poster_agent_id);
CREATE INDEX idx_jobs_winner ON jobs(winning_agent_id);
CREATE INDEX idx_jobs_posted_at ON jobs(posted_at DESC);

CREATE TABLE IF NOT EXISTS bids (
    id              SERIAL PRIMARY KEY,
    job_id          BIGINT REFERENCES jobs(id),
    agent_id        BIGINT REFERENCES agents(id),
    price_wei       NUMERIC(78, 0) NOT NULL,
    is_winner       BOOLEAN DEFAULT FALSE,
    submitted_at    TIMESTAMPTZ NOT NULL,
    block_number    BIGINT,
    tx_hash         VARCHAR(66)
);

CREATE INDEX idx_bids_job ON bids(job_id);
CREATE INDEX idx_bids_agent ON bids(agent_id);

CREATE TABLE IF NOT EXISTS audit_records (
    id                  SERIAL PRIMARY KEY,
    job_id              BIGINT REFERENCES jobs(id) UNIQUE,
    agent_request_id    NUMERIC(78, 0),
    auditor_agent_id    BIGINT,
    validator_count     SMALLINT,
    validators_responded SMALLINT,
    quality_score       SMALLINT,
    consensus_type      VARCHAR(20),
    status              VARCHAR(20),
    original_spec_hash  VARCHAR(66),
    result_hash         VARCHAR(66),
    passed              BOOLEAN,
    requested_at        TIMESTAMPTZ,
    completed_at        TIMESTAMPTZ,
    tx_hash             VARCHAR(66)
);

CREATE TABLE IF NOT EXISTS vault_transactions (
    id              SERIAL PRIMARY KEY,
    agent_id        BIGINT REFERENCES agents(id),
    tx_type         VARCHAR(20) NOT NULL,
    amount_wei      NUMERIC(78, 0) NOT NULL,
    counterpart     VARCHAR(42),
    job_id          BIGINT REFERENCES jobs(id),
    balance_after   NUMERIC(78, 0),
    block_number    BIGINT,
    tx_hash         VARCHAR(66),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vault_agent ON vault_transactions(agent_id);
CREATE INDEX idx_vault_type ON vault_transactions(tx_type);

CREATE TABLE IF NOT EXISTS reputation_history (
    id              SERIAL PRIMARY KEY,
    agent_id        BIGINT REFERENCES agents(id),
    previous_score  INTEGER,
    new_score       INTEGER,
    delta           INTEGER,
    reason          VARCHAR(50),
    job_id          BIGINT REFERENCES jobs(id),
    recorded_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rep_agent ON reputation_history(agent_id);

CREATE TABLE IF NOT EXISTS agent_lineage (
    parent_agent_id     BIGINT REFERENCES agents(id),
    child_agent_id      BIGINT REFERENCES agents(id) UNIQUE,
    royalty_bps         SMALLINT DEFAULT 1000,
    total_royalties_wei NUMERIC(78, 0) DEFAULT 0,
    spawned_at          TIMESTAMPTZ,
    PRIMARY KEY (parent_agent_id, child_agent_id)
);

CREATE TABLE IF NOT EXISTS system_metrics (
    recorded_at         TIMESTAMPTZ NOT NULL,
    active_agents       INTEGER,
    open_jobs           INTEGER,
    jobs_per_minute     NUMERIC(10, 2),
    total_volume_wei    NUMERIC(78, 0),
    avg_cycle_time_ms   NUMERIC(10, 2),
    avg_audit_score     NUMERIC(5, 2),
    success_rate        NUMERIC(5, 4),
    PRIMARY KEY (recorded_at)
);
