-- Migration: Allow public access to user profiles for reviews
-- This enables reviews to display user information from user_profiles table

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;

-- Create new policies:
-- 1. Users can still view and manage their own profiles
CREATE POLICY "Users can view own profile" ON user_profiles 
    FOR SELECT USING (auth.uid() = id);

-- 2. Anyone can view basic profile info for users who have written reviews
CREATE POLICY "Anyone can view profiles of review authors" ON user_profiles 
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM reviews WHERE reviews.user_id = user_profiles.id
        )
    );