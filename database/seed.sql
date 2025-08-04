-- Seed data for Court Data Fetcher application
-- This file contains sample data for development and testing

-- Insert sample case type references (if not already exists)
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

-- Note: User-specific data should not be seeded in production
-- The following is for development/testing purposes only

-- Sample user profiles (only for development)
-- In production, these will be created automatically via triggers

-- Sample case queries (only for development)
-- These would be created by actual user interactions in production

-- Create a function to generate sample data for development
CREATE OR REPLACE FUNCTION generate_sample_data(sample_user_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Only run in development environment
    IF current_setting('app.environment', true) = 'development' THEN
        -- Insert sample queries
        INSERT INTO case_queries (
            user_id, 
            case_type, 
            case_number, 
            filing_year, 
            status, 
            query_timestamp,
            raw_response
        ) VALUES
        (
            sample_user_id,
            'Civil',
            'CS(OS) 123/2023',
            2023,
            'completed',
            NOW() - INTERVAL '1 day',
            '{"success": true, "data": {"partiesNames": "ABC Corp vs XYZ Ltd", "filingDate": "15/03/2023", "nextHearingDate": "20/08/2025", "documents": [{"id": "doc_1", "title": "Order dated 15/07/2025", "downloadUrl": "https://example.com/order1.pdf", "type": "PDF"}]}}'
        ),
        (
            sample_user_id,
            'Writ Petition',
            'W.P.(C) 456/2024',
            2024,
            'completed',
            NOW() - INTERVAL '2 hours',
            '{"success": true, "data": {"partiesNames": "John Doe vs State of Delhi", "filingDate": "10/01/2024", "nextHearingDate": "25/08/2025", "documents": [{"id": "doc_1", "title": "Interim Order", "downloadUrl": "https://example.com/order2.pdf", "type": "PDF"}]}}'
        ),
        (
            sample_user_id,
            'Criminal',
            'Crl.A. 789/2022',
            2022,
            'failed',
            NOW() - INTERVAL '3 days',
            '{"success": false, "error": "Case not found with the provided details"}'
        );
        
        -- Insert sample user profile
        INSERT INTO user_profiles (
            id,
            first_name,
            last_name,
            organization,
            preferences
        ) VALUES (
            sample_user_id,
            'Sample',
            'User',
            'Test Law Firm',
            '{"theme": "light", "notifications": true, "defaultCaseType": "Civil"}'
        ) ON CONFLICT (id) DO NOTHING;
        
        RAISE NOTICE 'Sample data generated for user %', sample_user_id;
    ELSE
        RAISE NOTICE 'Sample data generation skipped - not in development environment';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Create a function to clean up sample data
CREATE OR REPLACE FUNCTION cleanup_sample_data()
RETURNS VOID AS $$
BEGIN
    -- Remove sample queries (be careful in production!)
    DELETE FROM case_queries 
    WHERE raw_response LIKE '%example.com%' 
    OR case_number IN ('CS(OS) 123/2023', 'W.P.(C) 456/2024', 'Crl.A. 789/2022');
    
    -- Remove sample user profiles with test data
    DELETE FROM user_profiles 
    WHERE organization = 'Test Law Firm';
    
    RAISE NOTICE 'Sample data cleaned up';
END;
$$ LANGUAGE plpgsql;

-- Create development configuration
CREATE TABLE IF NOT EXISTS app_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default configuration
INSERT INTO app_config (key, value, description) VALUES
('max_queries_per_day', '100', 'Maximum queries allowed per user per day'),
('captcha_retry_limit', '3', 'Maximum CAPTCHA retry attempts'),
('query_timeout_seconds', '30', 'Timeout for court website queries'),
('cleanup_failed_queries_days', '30', 'Days after which failed queries are cleaned up'),
('enable_2captcha', 'true', 'Whether to use 2Captcha service'),
('enable_query_caching', 'false', 'Whether to cache successful query results'),
('maintenance_mode', 'false', 'Whether the application is in maintenance mode')
ON CONFLICT (key) DO NOTHING;

-- Create trigger for app_config updated_at
CREATE TRIGGER update_app_config_updated_at 
    BEFORE UPDATE ON app_config 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to get app configuration
CREATE OR REPLACE FUNCTION get_app_config(config_key TEXT)
RETURNS TEXT AS $$
DECLARE
    config_value TEXT;
BEGIN
    SELECT value INTO config_value 
    FROM app_config 
    WHERE key = config_key;
    
    RETURN config_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to update app configuration (admin only)
CREATE OR REPLACE FUNCTION update_app_config(config_key TEXT, config_value TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- In a real application, you would check for admin privileges here
    -- For now, we'll just update the value
    
    UPDATE app_config 
    SET value = config_value, updated_at = NOW() 
    WHERE key = config_key;
    
    IF FOUND THEN
        RETURN TRUE;
    ELSE
        INSERT INTO app_config (key, value) VALUES (config_key, config_value);
        RETURN TRUE;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions for configuration functions
GRANT EXECUTE ON FUNCTION get_app_config TO authenticated;
-- Note: update_app_config should only be granted to admin users in production

COMMENT ON TABLE app_config IS 'Application configuration settings';
COMMENT ON FUNCTION generate_sample_data IS 'Generates sample data for development environment';
COMMENT ON FUNCTION cleanup_sample_data IS 'Removes sample data from development environment';
COMMENT ON FUNCTION get_app_config IS 'Retrieves application configuration value by key';
COMMENT ON FUNCTION update_app_config IS 'Updates application configuration (admin only)';

-- Create a view for public case type information
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
