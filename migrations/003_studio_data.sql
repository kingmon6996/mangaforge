CREATE TABLE IF NOT EXISTS studio_projects (
    id VARCHAR(80) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    payload JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_studio_projects_user_id ON studio_projects(user_id);

CREATE TABLE IF NOT EXISTS studio_characters (
    id VARCHAR(80) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    payload JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_studio_characters_user_id ON studio_characters(user_id);

CREATE TABLE IF NOT EXISTS studio_stories (
    id VARCHAR(80) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    payload JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_studio_stories_user_id ON studio_stories(user_id);

CREATE TABLE IF NOT EXISTS studio_assets (
    id VARCHAR(80) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(40) NOT NULL DEFAULT 'Uploaded',
    media_type VARCHAR(100) NOT NULL,
    storage_path VARCHAR(512) NOT NULL UNIQUE,
    payload JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_studio_assets_user_id ON studio_assets(user_id);

CREATE TABLE IF NOT EXISTS studio_exports (
    id VARCHAR(80) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id VARCHAR(80) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Queued',
    progress INTEGER NOT NULL DEFAULT 0,
    artifact_path VARCHAR(512),
    payload JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ix_studio_exports_user_id ON studio_exports(user_id);
CREATE INDEX IF NOT EXISTS ix_studio_exports_project_id ON studio_exports(project_id);
