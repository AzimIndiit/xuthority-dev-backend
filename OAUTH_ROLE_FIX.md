# OAuth Role Assignment Fix

## Issue Description

The Google and LinkedIn OAuth authentication was not properly assigning the "vendor" role when users registered through the vendor registration form. Instead, it was defaulting to the "user" role.

## Root Cause

The issue was with the session configuration in the backend. The sessions were not being properly persisted during the OAuth flow, causing the role information to be lost between the initial OAuth request and the callback.

## Solution Implemented

### 1. Enhanced Session Configuration

Added a proper session store using the `memorystore` package to ensure sessions are persisted correctly:

```javascript
// In app.js
const MemoryStore = require('memorystore')(session);

app.use(session({
  store: new MemoryStore({
    checkPeriod: 86400000 // prune expired entries every 24h
  }),
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

### 2. Role Storage in Session

The OAuth routes properly store the role in the session:

```javascript
// Google OAuth
router.get('/google', (req, res, next) => {
  if (req.query.role && ['user', 'vendor'].includes(req.query.role)) {
    req.session.oauthRole = req.query.role;
  } else {
    req.session.oauthRole = 'user'; // default to user
  }
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

// LinkedIn OAuth
router.get('/linkedin', (req, res, next) => {
  if (req.query.role && ['user', 'vendor'].includes(req.query.role)) {
    req.session.oauthRole = req.query.role;
  } else {
    req.session.oauthRole = 'user'; // default to user
  }
  passport.authenticate('linkedin')(req, res, next);
});
```

### 3. Role Usage in Passport Strategies

Both Google and LinkedIn passport strategies use the role from session when creating new users:

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

## Frontend Integration

The frontend correctly passes the role parameter:

```typescript
// In VendorSignupForm.tsx
const handleGoogleLogin = () => {
  googleLogin('vendor');
};

const handleLinkedInLogin = () => {
  linkedInLogin('vendor');
};

// In useAuth.ts
export const useSocialLogin = () => {
  const googleLogin = (role: 'user' | 'vendor' = 'user') => {
    window.location.href = AuthService.getGoogleLoginUrl(role);
  };

  const linkedInLogin = (role: 'user' | 'vendor' = 'user') => {
    window.location.href = AuthService.getLinkedInLoginUrl(role);
  };

  return { googleLogin, linkedInLogin };
};
```

## Testing Results

The fix has been tested and confirmed working:

1. **Google OAuth**: Users registering through vendor signup form now get the "vendor" role
2. **LinkedIn OAuth**: Users registering through vendor signup form now get the "vendor" role
3. **User OAuth**: Users registering through user signup form still get the "user" role (default behavior)

## Dependencies Added

- `memorystore`: For proper session storage during OAuth flow

## Security Considerations

1. **Role Validation**: Only 'user' and 'vendor' roles are accepted
2. **Session Cleanup**: The role is cleared from session after user creation
3. **Default Fallback**: If no role is specified, defaults to 'user'
4. **Session Security**: Sessions are configured with proper security settings

## Files Modified

1. `app.js` - Added memorystore session configuration
2. `src/config/passport.js` - Role assignment in OAuth strategies
3. `src/routes/auth.js` - Role storage in OAuth routes
4. `package.json` - Added memorystore dependency

The OAuth role assignment is now working correctly for both Google and LinkedIn authentication when users register through the vendor signup form. 