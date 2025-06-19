# Supabase Authentication API

**Version:** v2  
**Last Updated:** 2025-06-19  
**SDK Version:** @supabase/supabase-js v2.x or higher

Supabase Auth provides a complete authentication solution with support for email/password, magic links, social providers, and more.

## Rate Limiting
- Auth requests: 10 per second per IP
- Email sending: 4 emails per hour per email address
- SMS OTP: 10 per hour per phone number
- Use exponential backoff for retries

## Security Considerations
- Enable Row Level Security (RLS) on all tables
- Use secure password requirements
- Implement session management best practices
- Enable MFA for sensitive accounts
- Regularly rotate JWT secrets
- Monitor for suspicious login patterns

## Key Features
- Email & password authentication
- Magic link authentication
- Social OAuth providers (Google, GitHub, etc.)
- Multi-factor authentication
- Row Level Security integration

## Sign Up

Create a new user account with email and password.

**Endpoint:** `Function supabase.auth.signUp()`

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| email | string | Yes | User email address |
| password | string | Yes | User password (min 6 characters) |
| options | object | No | Additional options like email redirect URL, user metadata |

### Example

```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseAnonKey)

try {
  const { data, error } = await supabase.auth.signUp({
    email: 'user@example.com',
    password: 'secure-password-123!', // Min 6 chars by default
    options: {
      emailRedirectTo: 'https://example.com/welcome',
      data: {
        first_name: 'John',
        last_name: 'Doe',
        age: 25
      },
      captchaToken: 'captcha-token-here' // If captcha is enabled
    }
  })
  
  if (error) {
    if (error.message.includes('already registered')) {
      console.error('User already exists');
    } else if (error.message.includes('invalid email')) {
      console.error('Invalid email format');
    } else if (error.message.includes('weak password')) {
      console.error('Password too weak');
    } else {
      console.error('Signup error:', error.message);
    }
  } else {
    console.log('Signup successful!');
    console.log('User:', data.user);
    console.log('Session:', data.session);
    
    // Check if email confirmation is required
    if (data.user && !data.session) {
      console.log('Please check your email for confirmation link');
    }
  }
} catch (err) {
  console.error('Network error:', err);
}
```

### Response

```json
{
  "user": {
    "id": "d0f5b7c3-5555-4b6a-9b3d-2c1e3f4a5b6c",
    "aud": "authenticated",
    "role": "authenticated",
    "email": "user@example.com",
    "email_confirmed_at": null,
    "phone": "",
    "confirmation_sent_at": "2025-06-19T10:00:00Z",
    "confirmed_at": null,
    "last_sign_in_at": null,
    "app_metadata": {
      "provider": "email",
      "providers": ["email"]
    },
    "user_metadata": {
      "first_name": "John",
      "last_name": "Doe",
      "age": 25
    },
    "identities": [
      {
        "id": "d0f5b7c3-5555-4b6a-9b3d-2c1e3f4a5b6c",
        "user_id": "d0f5b7c3-5555-4b6a-9b3d-2c1e3f4a5b6c",
        "identity_data": {
          "email": "user@example.com",
          "sub": "d0f5b7c3-5555-4b6a-9b3d-2c1e3f4a5b6c"
        },
        "provider": "email",
        "last_sign_in_at": null,
        "created_at": "2025-06-19T10:00:00Z",
        "updated_at": "2025-06-19T10:00:00Z"
      }
    ],
    "created_at": "2025-06-19T10:00:00Z",
    "updated_at": "2025-06-19T10:00:00Z"
  },
  "session": null
}
```

## Sign In

Authenticate a user with email and password.

**Endpoint:** `Function supabase.auth.signInWithPassword()`

### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| email | string | Yes | User email address |
| password | string | Yes | User password |

### Example

```javascript
try {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'user@example.com',
    password: 'secure-password-123!',
    options: {
      captchaToken: 'captcha-token' // If captcha is enabled
    }
  })
  
  if (error) {
    if (error.message.includes('Invalid login credentials')) {
      console.error('Wrong email or password');
    } else if (error.message.includes('Email not confirmed')) {
      console.error('Please confirm your email first');
    } else if (error.message.includes('Too many requests')) {
      console.error('Too many login attempts. Please try again later.');
    } else {
      console.error('Login error:', error.message);
    }
  } else if (data.session) {
    console.log('Login successful!');
    console.log('User:', data.user);
    console.log('Access token:', data.session.access_token);
    console.log('Expires at:', new Date(data.session.expires_at * 1000));
    
    // Store session for future requests
    // The SDK handles this automatically
  }
} catch (err) {
  console.error('Network error:', err);
}
```

### Response

```json
{
  "user": {
    "id": "d0f5b7c3-5555-4b6a-9b3d-2c1e3f4a5b6c",
    "email": "user@example.com",
    "role": "authenticated",
    "email_confirmed_at": "2025-06-19T09:00:00Z",
    "last_sign_in_at": "2025-06-19T10:00:00Z"
  },
  "session": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "bearer",
    "expires_in": 3600,
    "expires_at": 1718791200,
    "refresh_token": "v1.refresh_token_here",
    "user": {
      "id": "d0f5b7c3-5555-4b6a-9b3d-2c1e3f4a5b6c",
      "email": "user@example.com"
    }
  }
}
```

## Magic Link Authentication

Send a passwordless login link.

**Endpoint:** `Function supabase.auth.signInWithOtp()`

### Example

```javascript
const { data, error } = await supabase.auth.signInWithOtp({
  email: 'user@example.com',
  options: {
    emailRedirectTo: 'https://example.com/dashboard',
    shouldCreateUser: false // Don't create user if doesn't exist
  }
})

if (!error) {
  console.log('Magic link sent to email');
}
```

## Social Authentication

Sign in with OAuth providers.

### Example

```javascript
// Sign in with Google
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: 'https://example.com/auth/callback',
    scopes: 'profile email',
    queryParams: {
      access_type: 'offline',
      prompt: 'consent'
    }
  }
})

// Other providers: github, gitlab, bitbucket, azure, facebook, twitter, discord, etc.
```

## Multi-Factor Authentication (MFA)

Enable two-factor authentication.

### Example

```javascript
// Enroll MFA
const { data: { id, totp, qr }, error } = await supabase.auth.mfa.enroll({
  factorType: 'totp',
  friendlyName: 'My Auth App'
})

if (!error) {
  console.log('Scan this QR code:', qr);
  console.log('Or enter this secret:', totp.secret);
  
  // Verify TOTP code
  const { data, error: verifyError } = await supabase.auth.mfa.verify({
    factorId: id,
    challengeId: id,
    code: '123456' // 6-digit code from authenticator app
  })
}

// Sign in with MFA
const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
})

if (signInData?.user?.factors?.length > 0) {
  // MFA required
  const { data: challengeData } = await supabase.auth.mfa.challenge({
    factorId: signInData.user.factors[0].id
  })
  
  const { data: verifyData, error: verifyError } = await supabase.auth.mfa.verify({
    factorId: signInData.user.factors[0].id,
    challengeId: challengeData.id,
    code: '123456'
  })
}
```

## Session Management

Manage user sessions and tokens.

### Example

```javascript
// Get current session
const { data: { session }, error } = await supabase.auth.getSession()

// Refresh session
const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()

// Sign out
const { error: signOutError } = await supabase.auth.signOut()

// Listen to auth changes
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Auth event:', event)
  if (event === 'SIGNED_IN') {
    console.log('User signed in:', session.user)
  } else if (event === 'SIGNED_OUT') {
    console.log('User signed out')
  } else if (event === 'TOKEN_REFRESHED') {
    console.log('Token refreshed')
  } else if (event === 'USER_UPDATED') {
    console.log('User data updated')
  }
})
```

## Update User Profile

Update user metadata and profile information.

### Example

```javascript
// Update user metadata
const { data, error } = await supabase.auth.updateUser({
  data: {
    first_name: 'Jane',
    last_name: 'Smith',
    avatar_url: 'https://example.com/avatar.jpg'
  }
})

// Update email
const { data: emailData, error: emailError } = await supabase.auth.updateUser({
  email: 'newemail@example.com'
})

// Update password
const { data: passwordData, error: passwordError } = await supabase.auth.updateUser({
  password: 'new-secure-password-456!'
})
```

## Reset Password

Send password reset email.

### Example

```javascript
// Request password reset
const { data, error } = await supabase.auth.resetPasswordForEmail(
  'user@example.com',
  {
    redirectTo: 'https://example.com/reset-password'
  }
)

// Update password after clicking reset link
const { data: updateData, error: updateError } = await supabase.auth.updateUser({
  password: 'new-password-789!'
})
```

## Admin User Management

Server-side user management (requires service role key).

### Example

```javascript
import { createClient } from '@supabase/supabase-js'

// Use service role key for admin operations
const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// Create user without email confirmation
const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
  email: 'admin@example.com',
  password: 'admin-password',
  email_confirm: true,
  user_metadata: { role: 'admin' }
})

// List all users with pagination
const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers({
  page: 1,
  perPage: 50
})

// Delete user
const { data: deleteData, error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(
  'user-id-to-delete'
)
```

