# LinkedIn OAuth Error Handling Implementation

## Overview

This document describes the implementation of comprehensive error handling for LinkedIn OAuth authentication and verification flows in the Xuthority application.

## Problem Statement

When users cancel LinkedIn OAuth authentication or when LinkedIn services experience errors, the application needs to handle these scenarios gracefully:

1. **Regular Login Cancellation**: User cancels during social login
2. **Verification Cancellation**: User cancels during identity verification for reviews
3. **Service Errors**: LinkedIn API returns error responses
4. **State Preservation**: Maintain user's review progress when verification fails

## Implementation Details

### Backend Changes

#### 1. LinkedIn OAuth Callback Route (`/auth/linkedin/callback`)

```javascript
router.get('/linkedin/callback', (req, res, next) => {
  // Check for LinkedIn error parameters
  const error = req.query.error;
  const errorDescription = req.query.error_description;
  
  if (error) {
    // Handle LinkedIn cancellation or error
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    let redirectUrl;
    
    if (error === 'user_cancelled_login' || error === 'user_cancelled_authorize') {
      redirectUrl = `${frontendUrl}/auth/callback?error=${encodeURIComponent('Login cancelled')}&provider=LinkedIn`;
    } else {
      const errorMsg = errorDescription || 'LinkedIn login failed';
      redirectUrl = `${frontendUrl}/auth/callback?error=${encodeURIComponent(errorMsg)}&provider=LinkedIn`;
    }
    
    return res.redirect(redirectUrl);
  }
  
  // Proceed with normal authentication
  passport.authenticate('linkedin', { 
    session: false, 
    failureRedirect: '/api/v1/auth/linkedin/failure' 
  })(req, res, next);
}, (req, res) => {
  authController.handleOAuthCallback(req, res, 'LinkedIn');
});
```

#### 2. LinkedIn Verification Callback Route (`/auth/linkedin/verify/callback`)

```javascript
router.get('/linkedin/verify/callback', (req, res, next) => {
  // Check for LinkedIn error parameters
  const error = req.query.error;
  const errorDescription = req.query.error_description;
  
  if (error) {
    // Handle LinkedIn cancellation or error for verification flow
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    let redirectUrl;
    
    if (error === 'user_cancelled_login' || error === 'user_cancelled_authorize') {
      // For verification flow, redirect back to write-review with current step preserved
      redirectUrl = `${frontendUrl}/write-review?linkedin_error=${encodeURIComponent('LinkedIn verification cancelled')}&preserve_state=true`;
    } else {
      const errorMsg = errorDescription || 'LinkedIn verification failed';
      redirectUrl = `${frontendUrl}/write-review?linkedin_error=${encodeURIComponent(errorMsg)}&preserve_state=true`;
    }
    
    return res.redirect(redirectUrl);
  }
  
  // Proceed with normal verification
  passport.authenticate('linkedin-verify', { 
    session: false, 
    failureRedirect: '/api/v1/auth/linkedin/verify/failure' 
  })(req, res, next);
}, (req, res) => {
  authController.handleLinkedInVerificationCallback(req, res);
});
```

#### 3. Environment-Based Configuration

Updated Passport LinkedIn verification strategy to use environment variables:

```javascript
passport.use('linkedin-verify', new LinkedInStrategy({
  clientID: process.env.LINKEDIN_CLIENT_ID,
  clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
  callbackURL: process.env.LINKEDIN_VERIFY_CALLBACK_URL || 'http://localhost:8081/api/v1/auth/linkedin/verify/callback',
  scope: ["profile", "email", "openid"],
  passReqToCallback: true,
}, async (req, accessToken, refreshToken, profile, done) => {
  // ... existing implementation
}));
```

### Frontend Changes

#### 1. Enhanced Error Handling in WriteReviewPage

```javascript
// Handle LinkedIn verification callback
useEffect(() => {
  const linkedinVerified = searchParams.get('linkedin_verified');
  const linkedinData = searchParams.get('linkedin_data');
  const linkedinError = searchParams.get('linkedin_error');
  const preserveState = searchParams.get('preserve_state');

  if (linkedinError) {
    // Show error message
    if (linkedinError.includes('cancelled')) {
      toast.verification.error('LinkedIn verification was cancelled. You can try again or choose a different verification method.');
    } else {
      toast.verification.error(`LinkedIn verification failed: ${linkedinError}`);
    }
    
    // If preserve_state is true, keep the user on step 2 with their selected software
    if (preserveState === 'true') {
      // Ensure user stays on step 2 (VerifyIdentity) if they have a selected software
      if (selectedSoftware && currentStep !== 2) {
        setCurrentStep(2);
      }
    }
    
    // Clear the error parameters
    searchParams.delete('linkedin_error');
    searchParams.delete('preserve_state');
    setSearchParams(searchParams);
    return;
  }

  // ... existing success handling
}, [searchParams, setSearchParams, setVerificationData, setCurrentStep, selectedSoftware, currentStep]);
```

## Error Scenarios Handled

### 1. User Cancellation During Login

**Trigger**: User clicks "Cancel" on LinkedIn OAuth consent page during social login

**Flow**:
1. LinkedIn redirects to `/auth/linkedin/callback?error=user_cancelled_login`
2. Backend detects error and redirects to `/auth/callback?error=Login cancelled&provider=LinkedIn`
3. Frontend shows error message and redirects to home page

### 2. User Cancellation During Verification

**Trigger**: User clicks "Cancel" on LinkedIn OAuth consent page during review verification

**Flow**:
1. LinkedIn redirects to `/auth/linkedin/verify/callback?error=user_cancelled_login`
2. Backend detects error and redirects to `/write-review?linkedin_error=LinkedIn verification cancelled&preserve_state=true`
3. Frontend shows error message but keeps user on step 2 with selected software intact

### 3. LinkedIn Service Errors

**Trigger**: LinkedIn API returns error responses (e.g., `temporarily_unavailable`, `access_denied`)

**Flow**:
1. LinkedIn redirects with error parameters
2. Backend processes error and redirects with appropriate error message
3. Frontend displays user-friendly error message

### 4. Network or Authentication Failures

**Trigger**: Passport authentication fails due to network issues or invalid responses

**Flow**:
1. Passport redirects to failure routes (`/auth/linkedin/failure` or `/auth/linkedin/verify/failure`)
2. Backend redirects to frontend with error message
3. Frontend handles error appropriately

## Environment Variables

### Development
```env
FRONTEND_URL=http://localhost:5173
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
LINKEDIN_CALLBACK_URL=http://localhost:8081/api/v1/auth/linkedin/callback
LINKEDIN_VERIFY_CALLBACK_URL=http://localhost:8081/api/v1/auth/linkedin/verify/callback
```

### Production
```env
FRONTEND_URL=https://xuthority-dev.indiitserver.in
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
LINKEDIN_CALLBACK_URL=https://your-backend-domain.com/api/v1/auth/linkedin/callback
LINKEDIN_VERIFY_CALLBACK_URL=https://your-backend-domain.com/api/v1/auth/linkedin/verify/callback
```

## Testing

### Manual Testing

1. **Test Login Cancellation**:
   - Go to login page
   - Click "Login with LinkedIn"
   - Click "Cancel" on LinkedIn consent page
   - Verify redirect to home with error message

2. **Test Verification Cancellation**:
   - Start writing a review
   - Select a software (step 1)
   - Go to verification step (step 2)
   - Click "Verify with LinkedIn"
   - Click "Cancel" on LinkedIn consent page
   - Verify user stays on step 2 with selected software

3. **Test Service Errors**:
   - Use the test script: `node test-linkedin-error-handling.js`
   - Visit `http://localhost:3001/test-linkedin-errors`
   - Test various error scenarios

### Automated Testing

Run existing auth tests to ensure no regression:
```bash
npm test -- --testPathPattern="auth"
```

## Security Considerations

1. **Error Message Sanitization**: All error messages are properly encoded to prevent XSS
2. **State Preservation**: Only review state is preserved, not sensitive authentication data
3. **Rate Limiting**: Existing rate limiting applies to error scenarios
4. **Logging**: All errors are logged for monitoring and debugging

## User Experience Improvements

1. **Clear Error Messages**: Users receive specific, actionable error messages
2. **State Preservation**: Review progress is maintained when verification fails
3. **Multiple Options**: Users can choose alternative verification methods
4. **Graceful Degradation**: Application continues to function even when LinkedIn is unavailable

## Future Enhancements

1. **Retry Mechanism**: Implement automatic retry for transient errors
2. **Error Analytics**: Track error patterns for improvement opportunities
3. **Progressive Enhancement**: Offer alternative verification methods based on error type
4. **User Feedback**: Collect user feedback on error scenarios for UX improvements

## Troubleshooting

### Common Issues

1. **Infinite Redirect Loop**: Check FRONTEND_URL environment variable
2. **CORS Errors**: Verify LinkedIn app configuration matches callback URLs
3. **State Not Preserved**: Ensure `preserve_state=true` parameter is passed
4. **Error Messages Not Showing**: Check toast notification implementation

### Debug Steps

1. Check browser network tab for redirect chain
2. Verify environment variables are set correctly
3. Check backend logs for error details
4. Test with different LinkedIn accounts
5. Verify LinkedIn app configuration in LinkedIn Developer Console

## Conclusion

This implementation provides robust error handling for LinkedIn OAuth flows while maintaining excellent user experience. The solution handles both authentication and verification scenarios appropriately, preserving user state when needed and providing clear feedback for all error conditions. 