-- Failed Login Attempts Table
-- Tracks failed login attempts per user for account lockout functionality
CREATE TABLE IF NOT EXISTS failed_login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  ip_address VARCHAR(45) NOT NULL, -- Support both IPv4 and IPv6
  attempt_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_failed_login_user_id ON failed_login_attempts(user_id);

-- Create index on email for faster lookups when user doesn't exist yet
CREATE INDEX IF NOT EXISTS idx_failed_login_email ON failed_login_attempts(email);

-- Create index on ip_address for IP-based tracking
CREATE INDEX IF NOT EXISTS idx_failed_login_ip ON failed_login_attempts(ip_address);

-- Create index on attempt_time for time-based queries
CREATE INDEX IF NOT EXISTS idx_failed_login_attempt_time ON failed_login_attempts(attempt_time DESC);

-- Account Lockouts Table
-- Tracks temporarily locked accounts due to excessive failed attempts
CREATE TABLE IF NOT EXISTS account_lockouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  locked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  unlock_at TIMESTAMP WITH TIME ZONE NOT NULL,
  reason VARCHAR(255) DEFAULT 'Too many failed login attempts',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_lockout_user_id ON account_lockouts(user_id);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_lockout_email ON account_lockouts(email);

-- Create index on unlock_at for time-based queries
CREATE INDEX IF NOT EXISTS idx_lockout_unlock_at ON account_lockouts(unlock_at);

-- Create index on is_active for active lockout queries
CREATE INDEX IF NOT EXISTS idx_lockout_is_active ON account_lockouts(is_active);

-- Rate Limit Log Table (optional - for monitoring and analytics)
-- Tracks rate limit hits for security monitoring
CREATE TABLE IF NOT EXISTS rate_limit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint VARCHAR(255) NOT NULL,
  ip_address VARCHAR(45) NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  hit_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  limit_type VARCHAR(50) NOT NULL, -- 'login', 'register', 'password_reset', etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index on endpoint for faster lookups
CREATE INDEX IF NOT EXISTS idx_rate_limit_endpoint ON rate_limit_logs(endpoint);

-- Create index on ip_address for IP-based tracking
CREATE INDEX IF NOT EXISTS idx_rate_limit_ip ON rate_limit_logs(ip_address);

-- Create index on hit_time for time-based queries
CREATE INDEX IF NOT EXISTS idx_rate_limit_hit_time ON rate_limit_logs(hit_time DESC);

-- Create index on limit_type for analytics
CREATE INDEX IF NOT EXISTS idx_rate_limit_type ON rate_limit_logs(limit_type);

-- Function to clean up old failed login attempts (older than 24 hours)
CREATE OR REPLACE FUNCTION cleanup_old_failed_attempts()
RETURNS void AS $$
BEGIN
  DELETE FROM failed_login_attempts
  WHERE attempt_time < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired account lockouts
CREATE OR REPLACE FUNCTION cleanup_expired_lockouts()
RETURNS void AS $$
BEGIN
  UPDATE account_lockouts
  SET is_active = FALSE
  WHERE unlock_at < NOW() AND is_active = TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old rate limit logs (older than 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_rate_limit_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM rate_limit_logs
  WHERE hit_time < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Optional: Create a scheduled job to run cleanup functions periodically
-- Note: This requires pg_cron extension or external cron job
-- Example with pg_cron:
-- SELECT cron.schedule('cleanup-failed-attempts', '0 */6 * * *', 'SELECT cleanup_old_failed_attempts()');
-- SELECT cron.schedule('cleanup-expired-lockouts', '*/15 * * * *', 'SELECT cleanup_expired_lockouts()');
-- SELECT cron.schedule('cleanup-rate-logs', '0 2 * * *', 'SELECT cleanup_old_rate_limit_logs()');
