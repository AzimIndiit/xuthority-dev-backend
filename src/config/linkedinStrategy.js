const passport = require('passport');
const OAuth2Strategy = require('passport-oauth2').Strategy;
const User = require('../models/User');

class LinkedInStrategy extends OAuth2Strategy {
  constructor(options, verify) {
    super(options, verify);
    this.name = 'linkedin';
  }

  userProfile(accessToken, done) {
    // Fetch user profile from LinkedIn API v2
    Promise.all([
      // Get basic profile
      fetch('https://api.linkedin.com/v2/me?projection=(id,firstName,lastName,profilePicture(displayImage~:playableStreams))', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0'
        }
      }),
      // Get email address
      fetch('https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0'
        }
      })
    ])
    .then(([profileResponse, emailResponse]) => {
      if (!profileResponse.ok) {
        throw new Error(`LinkedIn profile fetch failed: ${profileResponse.status}`);
      }
      if (!emailResponse.ok) {
        throw new Error(`LinkedIn email fetch failed: ${emailResponse.status}`);
      }
      
      return Promise.all([profileResponse.json(), emailResponse.json()]);
    })
    .then(([profileData, emailData]) => {
      const email = emailData.elements[0]['handle~'].emailAddress;
      
      const profile = {
        id: profileData.id,
        provider: 'linkedin',
        displayName: `${profileData.firstName.localized.en_US} ${profileData.lastName.localized.en_US}`,
        name: {
          familyName: profileData.lastName.localized.en_US,
          givenName: profileData.firstName.localized.en_US
        },
        emails: [{ value: email }],
        photos: profileData.profilePicture?.['displayImage~']?.elements?.[0]?.identifiers?.[0]?.identifier 
          ? [{ value: profileData.profilePicture['displayImage~'].elements[0].identifiers[0].identifier }] 
          : [],
        _json: profileData
      };
      
      done(null, profile);
    })
    .catch(err => {
      console.error('LinkedIn profile fetch error:', err);
      done(err);
    });
  }
}

module.exports = LinkedInStrategy; 