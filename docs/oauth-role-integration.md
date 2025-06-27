# Role-Based OAuth Integration

This document explains how the role-based OAuth integration works for both Google and LinkedIn authentication.

## Overview

The system now supports creating users with different roles (user/vendor) during OAuth signup. This is achieved by passing a `role` query parameter during OAuth initiation and storing it in the session for use during user creation.

## How It Works

### 1. Frontend OAuth Initiation

When a user clicks on OAuth buttons, the frontend passes the appropriate role:

```typescript
// For user signup
googleLogin('user');
linkedInLogin('user');

// For vendor signup  
googleLogin('vendor');
linkedInLogin('vendor');
```

### 2. Backend Route Handling

The OAuth routes store the role in the session before initiating OAuth:

```javascript
// Google OAuth
router.get('/google', (req, res, next) => {
  if (req.query.role && ['user', 'vendor'].includes(req.query.role)) {
    req.session.oauthRole = req.query.role;
  } else {
    req.session.oauthRole = 'user'; // default
  }
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

// LinkedIn OAuth
router.get('/linkedin', (req, res, next) => {
  if (req.query.role && ['user', 'vendor'].includes(req.query.role)) {
    req.session.oauthRole = req.query.role;
  } else {
    req.session.oauthRole = 'user'; // default
  }
  passport.authenticate('linkedin')(req, res, next);
});
```

### 3. Passport Strategy Integration

The passport strategies use the role from session when creating new users:

```javascript
// Google Strategy
passport.use(new GoogleStrategy({
  // ... config
  passReqToCallback: true, // Enable access to req object
}, async (req, accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ email: profile.emails[0].value });
    if (!user) {
      // Get role from session, default to 'user'
      const role = req.session?.oauthRole || 'user';
      
      user = await User.create({
        firstName: profile.name.givenName,
        lastName: profile.name.familyName,
        email: profile.emails[0].value,
        role: role, // Use the role from session
        authProvider: 'google',
        acceptedTerms: true,
      });
      
      // Clear the session role after user creation
      if (req.session) {
        req.session.oauthRole = undefined;
      }
    }
    return done(null, user);
  } catch (err) {
    return done(err, null);
  }
}));
```

## Implementation Details

### Session Configuration

The app uses `express-session` to store the role temporarily:

```javascript
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 10 * 60 * 1000, // 10 minutes
  }
}));
```

### Security Considerations

1. **Role Validation**: Only 'user' and 'vendor' roles are accepted
2. **Session Cleanup**: The role is cleared from session after user creation
3. **Default Fallback**: If no role is specified, defaults to 'user'
4. **Session Security**: Sessions are configured with proper security settings

### Frontend Integration

The frontend components are updated to pass the appropriate role:

- **LoginForm**: Uses `'user'` role for OAuth login
- **UserSignupForm**: Uses `'user'` role for OAuth signup
- **VendorSignupForm**: Uses `'vendor'` role for OAuth signup

## API Endpoints

### OAuth Initiation

- `GET /api/v1/auth/google?role=user` - Google OAuth for user signup
- `GET /api/v1/auth/google?role=vendor` - Google OAuth for vendor signup
- `GET /api/v1/auth/linkedin?role=user` - LinkedIn OAuth for user signup
- `GET /api/v1/auth/linkedin?role=vendor` - LinkedIn OAuth for vendor signup

### Query Parameters

- `role` (optional): Either 'user' or 'vendor'. Defaults to 'user' if not provided.

## Testing

The implementation has been tested with the existing test suite. All authentication tests pass, confirming that:

1. OAuth flows work correctly
2. Role assignment works as expected
3. Session management is secure
4. Default fallbacks work properly

## Environment Variables

Make sure to set the following environment variables:

```env
SESSION_SECRET=your-secure-session-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
LINKEDIN_CLIENT_ID=your-linkedin-client-id
LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret
FRONTEND_URL=http://localhost:5173
```

## Dependencies

The implementation requires the following additional dependency:

```bash
npm install express-session
```

## Migration Notes

This implementation is backward compatible. Existing OAuth flows will continue to work and will default to creating users with the 'user' role if no role is specified. 