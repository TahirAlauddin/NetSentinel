-- Initial schema for db-server (host-db-server container)
-- Used by fault injection and AI agent remediation tests.

CREATE TABLE IF NOT EXISTS load_test (
    id    SERIAL PRIMARY KEY,
    data  TEXT,
    ts    TIMESTAMP DEFAULT NOW()
);

-- Seed a bit of data so queries have something to scan
INSERT INTO load_test (data)
SELECT md5(generate_series::text)
FROM generate_series(1, 1000);

-- A view the Zabbix agent can query to gauge active connections
CREATE VIEW active_connections AS
SELECT count(*) AS n
FROM pg_stat_activity
WHERE state != 'idle';
