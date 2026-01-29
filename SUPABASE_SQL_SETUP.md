# Supabase SQL Setup Guide

## Step-by-Step Instructions

### 1. Open Supabase SQL Editor

1. Go to https://supabase.com/dashboard
2. Select your project: **mqeenbberuxzqtngkygh**
3. Click on **SQL Editor** in the left sidebar
4. Click **New Query** button

### 2. Run the Schema SQL

1. Open the file `supabase-schema.sql` in this project
2. Copy the entire contents
3. Paste into the Supabase SQL Editor
4. Click **Run** button (or press Ctrl+Enter)

You should see a success message: "PrepTick database schema created successfully!"

### 3. Verify Tables Created

After running the SQL, verify the tables:

1. Go to **Table Editor** in the left sidebar
2. You should see all these tables:
   - User
   - SyllabusTopic
   - Question
   - Test
   - TestQuestion
   - TestSession
   - UserResponse
   - Evaluation
   - PerformanceReport
   - UserQuestion

### 4. What the SQL Does

The script creates:

✅ **10 tables** for the complete PrepTick application
✅ **All foreign key relationships** between tables
✅ **Indexes** for optimized queries
✅ **UUID extension** for generating unique IDs
✅ **Default values** for timestamps and status fields

### 5. Table Structure Overview

```
User (authentication & profiles)
  ↓
Test (mock tests)
  ↓
TestQuestion (questions in each test)
  ↓
TestSession (in-app exam sessions)
  ↓
UserResponse (user answers)
  ↓
Evaluation (test scores)
  ↓
PerformanceReport (feedback & suggestions)

SyllabusTopic (curriculum topics)
  ↓
Question (question bank)
  ↓
UserQuestion (tracks seen questions)
```

## Next Steps After SQL Setup

### Option A: Seed Data via Supabase Dashboard

You can manually add seed data through the Table Editor, or...

### Option B: Seed Data via Application

Once the schema is created, you can seed data from your application:

1. **Stop the dev servers** (both backend and frontend)
2. **Regenerate Prisma Client**:
   ```bash
   npx prisma generate
   ```
3. **Run the seed script**:
   ```bash
   npm run seed
   ```

This will populate:
- Syllabus topics for CBSE and Cambridge
- Sample questions for the question bank

### Option C: Manual SQL Seed (Quick Test)

Run this in SQL Editor to create a test user:

```sql
-- Create a test user
INSERT INTO "User" (id, email, "passwordHash", curriculum, grade, subjects)
VALUES (
  uuid_generate_v4()::TEXT,
  'test@preptick.com',
  '$2b$10$abcdefghijklmnopqrstuvwxyz123456',  -- hashed password
  'CBSE',
  5,
  '["Mathematics", "English"]'
);

-- Verify user created
SELECT * FROM "User";
```

## Troubleshooting

### Error: "uuid-ossp extension not found"

If you get an error about uuid-ossp:

1. Go to **Database** → **Extensions** in Supabase
2. Enable the **uuid-ossp** extension
3. Re-run the SQL script

### Error: "relation already exists"

If tables already exist:

1. The script includes `DROP TABLE IF EXISTS` commands
2. Re-run the entire script - it will drop and recreate all tables
3. **Warning**: This will delete all existing data!

### Error: "permission denied"

Make sure you're logged into the correct Supabase project and have admin access.

## Verify Connection from Application

After creating the schema, test the connection:

```bash
# This should now work
npx prisma db pull
```

This will verify that Prisma can connect to your Supabase database.

## Enable Row Level Security (Optional but Recommended)

For production, enable RLS policies:

1. Go to **Authentication** → **Policies**
2. Enable RLS for each table
3. Create policies for user access control

Example policy for User table:
```sql
-- Users can only read their own data
CREATE POLICY "Users can view own data" ON "User"
  FOR SELECT
  USING (auth.uid()::TEXT = id);
```

## Connection Strings Reference

Your Supabase connection strings:

**Direct Connection** (for migrations):
```
postgresql://postgres:Rahul_Harsha@db.mqeenbberuxzqtngkygh.supabase.co:5432/postgres
```

**Connection Pooler** (for application):
```
postgresql://postgres.mqeenbberuxzqtngkygh:Rahul_Harsha@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

## Success Checklist

- [ ] SQL script executed successfully
- [ ] All 10 tables visible in Table Editor
- [ ] UUID extension enabled
- [ ] Prisma can connect (`npx prisma db pull` works)
- [ ] Seed data populated (optional)
- [ ] Application can connect to database

## Support

If you encounter issues:

1. Check Supabase logs: **Logs** → **Postgres Logs**
2. Verify your IP is allowed: **Settings** → **Database** → **Connection Pooling**
3. Check the `.env` file has correct credentials
4. Ensure password is correct: `Rahul_Harsha`

---

**Ready to proceed?** Once the SQL runs successfully, your PrepTick application will be connected to Supabase! 🚀
