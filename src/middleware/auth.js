const passport = require('../config/passport');

module.exports = passport.authenticate('jwt', { session: false });
