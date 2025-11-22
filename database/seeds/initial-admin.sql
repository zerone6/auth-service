-- Initial Admin User Seed Data
--
-- IMPORTANT: This script should be run after the initial admin logs in via Google OAuth
-- Or you can manually insert your Google user info here after first login

-- Example: Insert initial admin (replace with your actual Google ID and email)
-- This is a template - the actual admin creation happens automatically
-- when INITIAL_ADMIN_EMAIL matches a newly registered user

-- Manual insertion example (if needed):
/*
INSERT INTO users (
    google_id,
    email,
    name,
    picture_url,
    role,
    status,
    approved_at,
    approved_by
) VALUES (
    'your_google_id_here',          -- Get this from first login
    'your_email@gmail.com',          -- Your Google email
    'Admin Name',                     -- Your name
    'https://lh3.googleusercontent.com/...', -- Your Google profile picture
    'admin',                          -- Role: admin
    'approved',                       -- Status: approved
    NOW(),                            -- Approved immediately
    NULL                              -- Self-approved (first admin)
) ON CONFLICT (email) DO UPDATE
SET
    role = 'admin',
    status = 'approved',
    approved_at = NOW();
*/

-- Note: The application will automatically promote the user with INITIAL_ADMIN_EMAIL
-- to admin role on first login. This file is kept for reference.
