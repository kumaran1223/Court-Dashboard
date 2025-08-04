-- Court Data Fetcher Database Schema for Supabase
-- Run this script in your Supabase SQL Editor

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

-- Create RLS policies for case_queries
CREATE POLICY "Users can view their own queries" ON case_queries
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own queries" ON case_queries
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own queries" ON case_queries
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own queries" ON case_queries
    FOR DELETE USING (auth.uid() = user_id);

-- Create user_profiles table
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

-- Create case_type_reference table for dropdown options
CREATE TABLE IF NOT EXISTS case_type_reference (
    id SERIAL PRIMARY KEY,
    case_type TEXT UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0
);

-- Insert case type reference data
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

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Create a view for public case types
CREATE OR REPLACE VIEW public_case_types AS
SELECT 
    case_type,
    description,
    sort_order
FROM case_type_reference
WHERE is_active = TRUE
ORDER BY sort_order;

-- Grant access to the view
GRANT SELECT ON public_case_types TO anon, authenticated;
