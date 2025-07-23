const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const User = require('../models/User');
const { isUserBlocked } = require('../utils/authHelpers');
require('dotenv').config();

// Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL,
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
        role: role,
        authProvider: 'google',
        acceptedTerms: true, // You may want to handle this in the UI
      });

      // Create default free plan subscription for new vendors
      // if (role === 'vendor') {
      //   try {
      //     const subscriptionService = require('../services/subscriptionService');
      //     await subscriptionService.createDefaultFreeSubscription(user._id);
      //   } catch (subscriptionError) {
      //     console.error('Failed to create default free subscription for Google OAuth vendor:', subscriptionError);
      //     // Don't throw error here as registration was successful
      //   }
      // }
      
      // Clear the session role after user creation
      if (req.session) {
        req.session.oauthRole = undefined;
      }
    } else {
      // Check if existing user is blocked
      if (isUserBlocked(user)) {
        const { generateBlockedUserError } = require('../utils/authHelpers');
        const errorDetails = generateBlockedUserError();
        // Store error message in session for failure handler
        if (req.session) {
          req.session.authError = errorDetails.message;
        }
        const error = new Error(errorDetails.message);
        error.code = errorDetails.code;
        return done(error, null);
      }
    }
    return done(null, user);
  } catch (err) {
    return done(err, null);
  }
}));

// LinkedIn OAuth Strategy
passport.use('linkedin', new LinkedInStrategy({
  clientID: process.env.LINKEDIN_CLIENT_ID,
  clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
  callbackURL: process.env.LINKEDIN_CALLBACK_URL,
  scope: ["profile", "email", "openid"],
  passReqToCallback: true, // Enable access to req object
}, async (req, accessToken, refreshToken, profile, done) => {
  try {
    console.log(profile,"LinkedIn profile");
    
    // Store additional LinkedIn profile data for verification flow
    const linkedInData = {
      linkedInId: profile.id,
      firstName: profile.givenName,
      lastName: profile.familyName,
      email: profile.email,
      profileUrl: profile.publicProfileUrl || `https://linkedin.com/in/${profile.id}`,
      profilePicture: profile.pictureUrl || profile.displayPictureUrl,
      headline: profile.headline,
      industry: profile.industry
    };
    
    let user = await User.findOne({ email: profile.email});
    if (!user) {
      // Get role from session, default to 'user'
      const role = req.session?.oauthRole || 'user';
      
      user = await User.create({
        firstName: profile.givenName,
        lastName: profile.familyName,
        email: profile.email,
        role: role,
        authProvider: 'linkedin',
        acceptedTerms: true, // You may want to handle this in the UI
      });

      // Create default free plan subscription for new vendors
      // if (role === 'vendor') {
      //   try {
      //     const subscriptionService = require('../services/subscriptionService');
      //     await subscriptionService.createDefaultFreeSubscription(user._id);
      //   } catch (subscriptionError) {
      //     console.error('Failed to create default free subscription for LinkedIn OAuth vendor:', subscriptionError);
      //     // Don't throw error here as registration was successful
      //   }
      // }
      
      // Clear the session role after user creation
      if (req.session) {
        req.session.oauthRole = undefined;
      }
    } else {
      // Check if existing user is blocked
      if (isUserBlocked(user)) {
        const { generateBlockedUserError } = require('../utils/authHelpers');
        const errorDetails = generateBlockedUserError();
        // Store error message in session for failure handler
        if (req.session) {
          req.session.authError = errorDetails.message;
        }
        const error = new Error(errorDetails.message);
        error.code = errorDetails.code;
        return done(error, null);
      }
    }
    
    // Attach LinkedIn data to user object for verification flow
    user.linkedInData = linkedInData;
    
    return done(null, user);
  } catch (err) {
    return done(err, null);
  }
}));

// LinkedIn Verification Strategy (separate for review verification)
passport.use('linkedin-verify', new LinkedInStrategy({
  clientID: process.env.LINKEDIN_CLIENT_ID,
  clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
  callbackURL: process.env.LINKEDIN_VERIFY_CALLBACK_URL || 'http://localhost:8081/api/v1/auth/linkedin/verify/callback',
  scope: ["profile", "email", "openid"],
  passReqToCallback: true, // Enable access to req object
}, async (req, accessToken, refreshToken, profile, done) => {
  try {
    console.log(profile,"LinkedIn verification profile");
    
    // Store additional LinkedIn profile data for verification flow
    const linkedInData = {
      linkedInId: profile.id,
      firstName: profile.givenName,
      lastName: profile.familyName,
      email: profile.email,
      profileUrl: profile.publicProfileUrl || `https://linkedin.com/in/${profile.id}`,
      profilePicture: profile.pictureUrl || profile.displayPictureUrl,
      headline: profile.headline,
      industry: profile.industry
    };
    
    // For verification flow, we don't need to create/find user, just return LinkedIn data
    const verificationUser = {
      linkedInData,
      isVerification: true
    };
    
    return done(null, verificationUser);
  } catch (err) {
    return done(err, null);
  }
}));

// JWT Strategy
passport.use(new JwtStrategy({
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET,
}, async (jwtPayload, done) => {
  try {
    const user = await User.findById(jwtPayload.userId || jwtPayload.id);
    if (user) {
      return done(null, user);
    } else {
      return done(null, false);
    }
  } catch (err) {
    return done(err, false);
  }
}));

// Serialize user for the session
passport.serializeUser((user, done) => {
  done(null, user);
});

// Deserialize user from the session
passport.deserializeUser((user, done) => {
  done(null, user);
});

module.exports = passport; 