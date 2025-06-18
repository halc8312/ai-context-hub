# Supabase Authentication API

Supabase Auth provides a complete authentication solution with support for email/password, magic links, social providers, and more.

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

const supabase = createClient(supabaseUrl, supabaseAnonKey)

const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'secure-password',
  options: {
    data: {
      first_name: 'John',
      last_name: 'Doe'
    }
  }
})
```

### Response

```json
{
  "user": {
    "id": "uuid-here",
    "email": "user@example.com",
    "created_at": "2023-12-01T10:00:00Z",
    "app_metadata": {},
    "user_metadata": {
      "first_name": "John",
      "last_name": "Doe"
    }
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
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'secure-password'
})

if (data.session) {
  console.log('User logged in:', data.user)
}
```

### Response

```json
{
  "user": {
    "id": "uuid-here",
    "email": "user@example.com"
  },
  "session": {
    "access_token": "jwt-token-here",
    "refresh_token": "refresh-token-here",
    "expires_in": 3600
  }
}
```

