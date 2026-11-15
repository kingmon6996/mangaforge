ALTER TABLE otp_verifications
    ADD COLUMN IF NOT EXISTS pending_name VARCHAR(120),
    ADD COLUMN IF NOT EXISTS pending_password_hash VARCHAR(255),
    ADD COLUMN IF NOT EXISTS attempts INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS ix_otp_verifications_expires_at
    ON otp_verifications (expires_at);
