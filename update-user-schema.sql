-- Add new profile fields to User table
ALTER TABLE "User" 
ADD COLUMN IF NOT EXISTS "name" TEXT,
ADD COLUMN IF NOT EXISTS "gender" TEXT,
ADD COLUMN IF NOT EXISTS "schoolName" TEXT,
ADD COLUMN IF NOT EXISTS "city" TEXT,
ADD COLUMN IF NOT EXISTS "country" TEXT,
ADD COLUMN IF NOT EXISTS "profilePicture" TEXT;

-- Update existing users with default values if needed
UPDATE "User" 
SET "name" = COALESCE("name", 'Student')
WHERE "name" IS NULL;

COMMENT ON COLUMN "User"."name" IS 'Student full name';
COMMENT ON COLUMN "User"."gender" IS 'Gender: Male, Female, Other, PreferNotToSay';
COMMENT ON COLUMN "User"."schoolName" IS 'Optional school name';
COMMENT ON COLUMN "User"."city" IS 'City of residence';
COMMENT ON COLUMN "User"."country" IS 'Country of residence';
COMMENT ON COLUMN "User"."profilePicture" IS 'URL to profile picture';
