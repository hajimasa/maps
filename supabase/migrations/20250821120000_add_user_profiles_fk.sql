-- Migration: Add foreign key constraint from reviews to user_profiles
-- This creates a direct relationship between reviews and user_profiles

-- Add foreign key constraint to reviews.user_id referencing user_profiles.id
-- Note: This will ensure that a user_profile record must exist before creating a review
ALTER TABLE reviews 
ADD CONSTRAINT fk_reviews_user_profiles 
FOREIGN KEY (user_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

-- Create index for the new foreign key for better query performance
CREATE INDEX idx_reviews_user_profiles ON reviews(user_id);