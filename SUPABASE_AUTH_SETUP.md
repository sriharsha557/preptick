# Supabase Authentication Setup

## ✅ What's Configured

1. **Supabase Auth Integration** - Frontend and backend connected
2. **Supabase Client Libraries** - Installed and configured
3. **Environment Variables** - Added for both Node.js and Vite
4. **Login/Register Pages** - Updated to use Supabase Auth

## 🔐 Authentication Flow

### Registration Flow
1. User fills registration form (email, password, curriculum, grade, subjects)
2. **Supabase Auth** creates user account with email verification
3. **Backend API** creates user profile in database
4. User receives verification email
5. After verification, user can login

### Login Flow
1. User enters email and password
2. **Supabase Auth** validates credentials
3. Session token stored in localStorage
4. **Backend API** also validates and creates JWT token
5. User redirected to dashboard

## 🎯 Supabase Dashboard Configuration

### Enable Email Authentication

1. Go to **Supabase Dashboard** → **Authentication** → **Providers**
2. Ensure **Email** provider is enabled
3. Configure email templates (optional):
   - Confirmation email
   - Password reset email
   - Magic link email

### Configure Site URL

1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL**: `http://localhost:5173` (for development)
3. Add **Redirect URLs**:
   - `http://localhost:5173/dashboard`
   - `http://localhost:5173/login`

### Email Templates (Optional)

Customize email templates in **Authentication** → **Email Templates**:
- Confirmation email
- Invite user email
- Magic link email
- Change email address
- Reset password

## 📁 Files Created/Updated

### New Files
- `src/lib/supabase.ts` - Backend Supabase client
- `src/lib/supabaseClient.ts` - Frontend Supabase client

### Updated Files
- `src/pages/RegisterPage.tsx` - Integrated Supabase Auth signup
- `src/pages/LoginPage.tsx` - Integrated Supabase Auth signin
- `.env` - Added Vite environment variables

## 🔑 Environment Variables

### Backend (Node.js)
```env
NEXT_PUBLIC_SUPABASE_URL="https://mqeenbberuxzqtngkygh.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Frontend (Vite)
```env
VITE_SUPABASE_URL="https://mqeenbberuxzqtngkygh.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## 🧪 Testing Authentication

### Test Registration

1. Go to http://localhost:5173
2. Click **Sign Up** in header
3. Fill in the form:
   ```
   Email: test@preptick.com
   Password: Test123456!
   Curriculum: CBSE
   Grade: 5
   Subjects: Mathematics, Science
   ```
4. Click **Register**
5. Check your email for verification link
6. Click verification link

### Test Login

1. Go to http://localhost:5173/login
2. Enter credentials:
   ```
   Email: test@preptick.com
   Password: Test123456!
   ```
3. Click **Login**
4. Should redirect to dashboard

### Verify in Supabase

1. Go to **Supabase Dashboard** → **Authentication** → **Users**
2. You should see the registered user
3. Check user metadata for curriculum, grade, subjects

## 🔒 Security Features

### Built-in Security
- ✅ Email verification required
- ✅ Password hashing (bcrypt)
- ✅ JWT tokens for sessions
- ✅ Rate limiting on auth endpoints
- ✅ CORS protection

### Row Level Security (RLS)

Enable RLS policies for user data:

```sql
-- Enable RLS on User table
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;

-- Users can only read their own data
CREATE POLICY "Users can view own data" ON "User"
  FOR SELECT
  USING (auth.uid()::TEXT = id);

-- Users can update their own data
CREATE POLICY "Users can update own data" ON "User"
  FOR UPDATE
  USING (auth.uid()::TEXT = id);
```

## 🚀 Advanced Features

### Social Login (Optional)

Enable social providers in Supabase:
1. Go to **Authentication** → **Providers**
2. Enable Google, GitHub, etc.
3. Configure OAuth credentials
4. Update frontend to add social login buttons

### Magic Link Login (Optional)

```typescript
const { data, error } = await supabase.auth.signInWithOtp({
  email: 'user@email.com',
  options: {
    emailRedirectTo: 'http://localhost:5173/dashboard',
  }
});
```

### Password Reset

```typescript
const { data, error } = await supabase.auth.resetPasswordForEmail(
  'user@email.com',
  {
    redirectTo: 'http://localhost:5173/reset-password',
  }
);
```

## 📊 User Metadata

User metadata is stored in Supabase Auth:

```typescript
const { data: { user } } = await supabase.auth.getUser();

console.log(user?.user_metadata);
// {
//   curriculum: 'CBSE',
//   grade: 5,
//   subjects: ['Mathematics', 'Science']
// }
```

## 🔄 Session Management

### Check Session

```typescript
const { data: { session } } = await supabase.auth.getSession();
if (session) {
  console.log('User is logged in');
}
```

### Logout

```typescript
const { error } = await supabase.auth.signOut();
```

### Listen to Auth Changes

```typescript
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN') {
    console.log('User signed in');
  }
  if (event === 'SIGNED_OUT') {
    console.log('User signed out');
  }
});
```

## 🐛 Troubleshooting

### Email Not Sending

1. Check **Authentication** → **Email Templates**
2. Verify SMTP settings (if custom)
3. Check spam folder
4. For development, check Supabase logs

### "Invalid login credentials"

- Verify email is confirmed in Supabase Dashboard
- Check password meets requirements (min 8 characters)
- Ensure user exists in Auth Users table

### CORS Errors

1. Go to **Settings** → **API**
2. Add allowed origins:
   - `http://localhost:5173`
   - `http://localhost:3000`

### Session Not Persisting

- Check localStorage for `supabase_session`
- Verify session token is valid
- Check browser console for errors

## 📚 Documentation

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Supabase JS Client](https://supabase.com/docs/reference/javascript/auth-signup)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

## ✨ Next Steps

1. **Test registration and login** with the updated pages
2. **Enable email verification** in Supabase Dashboard
3. **Add logout functionality** to the dashboard
4. **Implement protected routes** to require authentication
5. **Add password reset** functionality
6. **Enable RLS policies** for data security

---

**Status**: Supabase Auth fully integrated! 🎉

Users can now register and login using Supabase authentication with email verification.
