# WC-PREDICTIONS

## Supabase setup

This app now uses Supabase for shared profiles, predictions, and the leaderboard.

Add these environment variables locally and in your deployment settings:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` for the `/api/save-results` endpoint

Run the SQL in [supabase_schema.sql](supabase_schema.sql) before using the app.
