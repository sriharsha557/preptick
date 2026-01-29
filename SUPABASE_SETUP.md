# Supabase Database Setup

## Configuration

Your Supabase PostgreSQL database has been configured with the following credentials:

- **Database URL**: `postgresql://postgres:Rahul_Harsha@db.mqeenbberuxzqtngkygh.supabase.co:5432/postgres`
- **Supabase URL**: `https://mqeenbberuxzqtngkygh.supabase.co`
- **Publishable Key**: `sb_publishable_55K9KcF86zAm6kqJFjpirA_-kNIujxc`
- **Anon Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

## Setup Steps

### 1. Install PostgreSQL Dependencies

The project already has Prisma installed, but ensure you have the PostgreSQL client:

```bash
npm install
```

### 2. Generate Prisma Client

Generate the Prisma client for PostgreSQL:

```bash
npx prisma generate
```

### 3. Push Schema to Supabase

Push your Prisma schema to the Supabase database:

```bash
npx prisma db push
```

This will create all the tables in your Supabase PostgreSQL database.

### 4. Seed the Database

Run the seed script to populate initial data:

```bash
npm run seed
```

This will:
- Create syllabus topics for CBSE and Cambridge curricula
- Generate sample questions for the question bank
- Index questions in the vector store

### 5. Verify Database

You can verify the database setup by:

1. **Using Prisma Studio**:
   ```bash
   npx prisma studio
   ```
   This opens a GUI to browse your database.

2. **Using Supabase Dashboard**:
   - Go to https://supabase.com/dashboard
   - Navigate to your project
   - Check the Table Editor to see all created tables

## Environment Variables

All environment variables have been updated in `.env`:

```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.xxxxx.supabase.co:5432/postgres"
NEXT_PUBLIC_SUPABASE_URL="https://xxxxx.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="your_publishable_key"
SUPABASE_ANON_KEY="your_anon_key"
GROQ_API_KEY="your_groq_api_key"
```

## Migration from SQLite

The project has been migrated from SQLite to PostgreSQL. Key changes:

1. **Prisma Schema**: Updated `provider` from `"sqlite"` to `"postgresql"`
2. **Database URL**: Changed from local file to Supabase connection string
3. **Constraints**: Removed SQLite-specific constraints for PostgreSQL compatibility

## Testing the Connection

Test the database connection:

```bash
npx prisma db pull
```

This should successfully connect to your Supabase database and show the schema.

## Troubleshooting

### Connection Issues

If you encounter connection issues:

1. Check that your IP is allowed in Supabase (Settings > Database > Connection Pooling)
2. Verify the password is correct: `Rahul_Harsha`
3. Ensure you're using the correct connection string

### SSL Issues

If you get SSL errors, you can disable SSL verification (not recommended for production):

```env
DATABASE_URL="postgresql://postgres:Rahul_Harsha@db.mqeenbberuxzqtngkygh.supabase.co:5432/postgres?sslmode=require"
```

### Schema Sync Issues

If tables already exist, you can reset the database:

```bash
npx prisma migrate reset
```

**Warning**: This will delete all data!

## Next Steps

1. Run `npx prisma db push` to create tables
2. Run `npm run seed` to populate data
3. Start the backend server: `npm run dev`
4. Start the frontend: `npm run dev:frontend`
5. Test the application at http://localhost:5173

## Supabase Features

You can now leverage Supabase features:

- **Real-time subscriptions**: Listen to database changes
- **Row Level Security (RLS)**: Add security policies
- **Storage**: Store PDFs and other files
- **Auth**: Use Supabase Auth instead of custom JWT
- **Edge Functions**: Deploy serverless functions

## Security Notes

⚠️ **Important**: The credentials in `.env` should be kept secure:

- Never commit `.env` to version control
- Use environment variables in production
- Consider using Supabase's connection pooler for production
- Enable Row Level Security (RLS) policies in Supabase dashboard
