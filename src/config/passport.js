const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const User = require('../models/User');
require('dotenv').config();

// Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL,
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ email: profile.emails[0].value });
    if (!user) {
      user = await User.create({
        firstName: profile.name.givenName,
        lastName: profile.name.familyName,
        email: profile.emails[0].value,
        role: 'user',
        authProvider: 'google',
        acceptedTerms: true, // You may want to handle this in the UI
      });
    }
    return done(null, user);
  } catch (err) {
    return done(err, null);
  }
}));

// LinkedIn OAuth Strategy
passport.use(new LinkedInStrategy({
  clientID: process.env.LINKEDIN_CLIENT_ID,
  clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
  callbackURL: process.env.LINKEDIN_CALLBACK_URL,
  scope: ["profile", "email", "openid"],
}, async (accessToken, refreshToken, profile, done) => {
  try {
    console.log(profile,"profile");
    let user = await User.findOne({ email: profile.email});
    if (!user) {
      user = await User.create({
        firstName: profile.givenName,
        lastName: profile.familyName,
        email: profile.email,
        role: 'user',
        authProvider: 'linkedin',
        acceptedTerms: true, // You may want to handle this in the UI
      });
    }
    return done(null, user);
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