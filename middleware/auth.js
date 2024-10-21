// middleware/auth.js
module.exports = function(req, res, next) {
    if (req.session.userId) {
      return next(); // User is authenticated, proceed to the next middleware/route
    }
    res.redirect('/login'); // User is not authenticated, redirect to login
  };
  