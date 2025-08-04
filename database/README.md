# Database Setup Guide

This directory contains the database schema and configuration for the Court Data Fetcher application using Supabase PostgreSQL.

## Files

- `schema.sql` - Main database schema with tables, indexes, and Row Level Security policies
- `seed.sql` - Sample data and configuration for development
- `README.md` - This file

## Supabase Setup Instructions

### 1. Create a Supabase Project

1. Go to [Supabase](https://supabase.com) and create a new account if you don't have one
2. Create a new project
3. Choose a database password and region
4. Wait for the project to be set up

### 2. Configure Environment Variables

Copy the project URL and API keys from your Supabase dashboard:

```bash
# In your .env file
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Run Database Schema

1. Open the Supabase dashboard
2. Go to the SQL Editor
3. Copy and paste the contents of `schema.sql`
4. Run the SQL to create tables, functions, and policies

### 4. Configure Authentication

1. In Supabase dashboard, go to Authentication > Settings
2. Enable email authentication
3. Configure email templates if needed
4. Optionally enable Google OAuth:
   - Go to Authentication > Providers
   - Enable Google provider
   - Add your Google OAuth credentials

### 5. Set up Row Level Security

The schema automatically enables RLS and creates policies. Verify in the dashboard:

1. Go to Database > Tables
2. Check that RLS is enabled for `case_queries` and `user_profiles`
3. Review the policies in the Policies tab

### 6. Load Seed Data (Development Only)

For development environment:

1. Copy and paste the contents of `seed.sql` in the SQL Editor
2. Run the SQL to create sample data and configuration

## Database Schema Overview

### Tables

#### `case_queries`
- Stores all court case search queries
- Links to authenticated users via `user_id`
- Includes query parameters, status, and raw responses
- Protected by Row Level Security

#### `user_profiles`
- Extended user information beyond Supabase auth
- Automatically created when users sign up
- Stores preferences and additional metadata

#### `case_type_reference`
- Reference data for case types
- Used for dropdown population in frontend

#### `app_config`
- Application configuration settings
- Allows runtime configuration changes

### Key Features

#### Row Level Security (RLS)
- Users can only access their own data
- Automatic enforcement at database level
- No additional authorization logic needed in application

#### Automatic Timestamps
- `created_at` and `updated_at` fields
- Automatically maintained via triggers

#### User Profile Creation
- Automatic profile creation on user signup
- Triggered by Supabase auth events

#### Query Analytics
- Built-in analytics views and functions
- User statistics and query trends

## Functions

### `get_user_query_stats(user_uuid)`
Returns comprehensive statistics for a user's queries including success rate and most searched categories.

### `cleanup_old_failed_queries()`
Removes failed queries older than 30 days to keep the database clean.

### `generate_sample_data(user_id)`
Creates sample data for development (only works in development environment).

## Indexes

Optimized indexes for:
- User-specific queries
- Query status filtering
- Date-based sorting
- Case type and year filtering

## Security Considerations

1. **Row Level Security**: All user data is protected by RLS policies
2. **Service Role Key**: Keep the service role key secure and only use server-side
3. **Anon Key**: Safe to use in frontend applications
4. **Function Security**: Functions are marked as `SECURITY DEFINER` where appropriate

## Backup and Maintenance

1. **Automatic Backups**: Supabase provides automatic daily backups
2. **Point-in-time Recovery**: Available for paid plans
3. **Cleanup**: Use the `cleanup_old_failed_queries()` function regularly
4. **Monitoring**: Monitor query performance in Supabase dashboard

## Development vs Production

### Development
- Use seed data for testing
- Enable sample data generation
- More permissive logging

### Production
- Disable sample data functions
- Enable query cleanup automation
- Monitor performance and usage
- Set up proper backup schedules

## Troubleshooting

### Common Issues

1. **RLS Blocking Queries**: Ensure user is authenticated and policies are correct
2. **Function Permissions**: Grant execute permissions to appropriate roles
3. **Migration Errors**: Run schema in correct order (tables, then functions, then triggers)

### Useful Queries

```sql
-- Check RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- View user query statistics
SELECT * FROM get_user_query_stats('user-uuid-here');

-- Check recent queries
SELECT * FROM case_queries 
WHERE query_timestamp > NOW() - INTERVAL '1 day'
ORDER BY query_timestamp DESC;
```

## Support

For issues with:
- Supabase setup: Check [Supabase Documentation](https://supabase.com/docs)
- Database schema: Review the SQL files and comments
- Application integration: Check the backend API documentation
