-- Court Data Fetcher Database Schema
-- This file contains the SQL schema for the Supabase PostgreSQL database

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create custom types
CREATE TYPE query_status AS ENUM ('initiated', 'completed', 'failed', 'retrying');
CREATE TYPE case_type AS ENUM ('Civil', 'Criminal', 'Writ Petition', 'Company Petition', 'Arbitration Petition', 'Execution Petition', 'Contempt Petition', 'Miscellaneous');

-- Create case_queries table
CREATE TABLE IF NOT EXISTS case_queries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    case_type case_type NOT NULL,
    case_number TEXT NOT NULL,
    filing_year INTEGER NOT NULL CHECK (filing_year >= 2000 AND filing_year <= 2025),
    query_timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    status query_status DEFAULT 'initiated' NOT NULL,
    raw_response TEXT,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_case_queries_user_id ON case_queries(user_id);
CREATE INDEX IF NOT EXISTS idx_case_queries_status ON case_queries(status);
CREATE INDEX IF NOT EXISTS idx_case_queries_case_type ON case_queries(case_type);
CREATE INDEX IF NOT EXISTS idx_case_queries_filing_year ON case_queries(filing_year);
CREATE INDEX IF NOT EXISTS idx_case_queries_timestamp ON case_queries(query_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_case_queries_user_timestamp ON case_queries(user_id, query_timestamp DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_case_queries_updated_at 
    BEFORE UPDATE ON case_queries 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE case_queries ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see their own queries
CREATE POLICY "Users can view their own queries" ON case_queries
    FOR SELECT USING (auth.uid() = user_id);

-- Users can only insert their own queries
CREATE POLICY "Users can insert their own queries" ON case_queries
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only update their own queries
CREATE POLICY "Users can update their own queries" ON case_queries
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can only delete their own queries
CREATE POLICY "Users can delete their own queries" ON case_queries
    FOR DELETE USING (auth.uid() = user_id);

-- Create user_profiles table for additional user information
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    first_name TEXT,
    last_name TEXT,
    organization TEXT,
    phone TEXT,
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS for user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_profiles
CREATE POLICY "Users can view their own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Create trigger for user_profiles updated_at
CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, first_name, last_name)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'first_name',
        NEW.raw_user_meta_data->>'last_name'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create user profile
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create analytics view for query statistics
CREATE OR REPLACE VIEW query_analytics AS
SELECT 
    DATE_TRUNC('day', query_timestamp) as query_date,
    case_type,
    status,
    COUNT(*) as query_count,
    COUNT(DISTINCT user_id) as unique_users
FROM case_queries
GROUP BY DATE_TRUNC('day', query_timestamp), case_type, status
ORDER BY query_date DESC;

-- Create function to get user query statistics
CREATE OR REPLACE FUNCTION get_user_query_stats(user_uuid UUID)
RETURNS TABLE (
    total_queries BIGINT,
    successful_queries BIGINT,
    failed_queries BIGINT,
    success_rate NUMERIC,
    most_searched_case_type TEXT,
    most_searched_year INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_queries,
        COUNT(*) FILTER (WHERE status = 'completed') as successful_queries,
        COUNT(*) FILTER (WHERE status = 'failed') as failed_queries,
        ROUND(
            (COUNT(*) FILTER (WHERE status = 'completed')::NUMERIC / 
             NULLIF(COUNT(*), 0) * 100), 2
        ) as success_rate,
        (
            SELECT case_type::TEXT
            FROM case_queries 
            WHERE user_id = user_uuid 
            GROUP BY case_type 
            ORDER BY COUNT(*) DESC 
            LIMIT 1
        ) as most_searched_case_type,
        (
            SELECT filing_year
            FROM case_queries 
            WHERE user_id = user_uuid 
            GROUP BY filing_year 
            ORDER BY COUNT(*) DESC 
            LIMIT 1
        ) as most_searched_year
    FROM case_queries
    WHERE user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to clean up old failed queries (older than 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_failed_queries()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM case_queries 
    WHERE status = 'failed' 
    AND query_timestamp < NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_case_queries_composite ON case_queries(user_id, status, query_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_case_queries_search ON case_queries(case_type, filing_year, case_number);

-- Add comments for documentation
COMMENT ON TABLE case_queries IS 'Stores all court case queries made by users';
COMMENT ON COLUMN case_queries.raw_response IS 'JSON response from court website scraping';
COMMENT ON COLUMN case_queries.error_message IS 'Error message if query failed';
COMMENT ON TABLE user_profiles IS 'Extended user profile information';
COMMENT ON FUNCTION get_user_query_stats IS 'Returns comprehensive statistics for a user''s queries';
COMMENT ON FUNCTION cleanup_old_failed_queries IS 'Removes failed queries older than 30 days';

-- Insert sample case types for reference (optional)
-- This can be used for dropdown population in the frontend
CREATE TABLE IF NOT EXISTS case_type_reference (
    id SERIAL PRIMARY KEY,
    case_type TEXT UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0
);

INSERT INTO case_type_reference (case_type, description, sort_order) VALUES
('Civil', 'Civil cases including suits, appeals, and revisions', 1),
('Criminal', 'Criminal cases including appeals and revisions', 2),
('Writ Petition', 'Constitutional writ petitions', 3),
('Company Petition', 'Company law related petitions', 4),
('Arbitration Petition', 'Arbitration and conciliation matters', 5),
('Execution Petition', 'Execution of decrees and orders', 6),
('Contempt Petition', 'Contempt of court proceedings', 7),
('Miscellaneous', 'Other miscellaneous matters', 8)
ON CONFLICT (case_type) DO NOTHING;
