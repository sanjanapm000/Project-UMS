// routes/admin.js
const express = require('express');
const User = require('../models/User');
const cacheControl = require('../middleware/cacheControl')
const router = express.Router();
require('dotenv').config();


router.use(cacheControl);


// Middleware to check if user is admin
function isAdmin(req, res, next) {
  if (req.session.userId && req.session.isAdmin) {
    return next();
  }
  res.redirect('/admin/login');
}

// Middleware to redirect if already logged in
function redirectIfLoggedIn(req, res, next) {
  if (req.session.userId && req.session.isAdmin) {
    return res.redirect('/admin/users'); // Redirect to users page if logged in
  }
  next();
}



// Admin Login
router.get('/login',redirectIfLoggedIn, (req, res) => {
  res.render('admin/login'); // Create admin/login.ejs
});

// Admin Login (POST)
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // Check credentials
  if (email === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) {
    req.session.userId = email;
    req.session.isAdmin = true;
    return res.redirect('/admin/users');
  }

  res.render('admin/login', { error: 'Invalid email or password.' });
});

// Admin User Management
router.get('/users', isAdmin, async (req, res) => {
  res.set('Cache-Control', 'no-store');
  const query = req.query.query || ''; // Get the query parameter
  let users;

  try {
    if (query) {
      // Search for users based on the query
      users = await User.find({ email: new RegExp(query, 'i') });
    } else {
      // Get all users if no query is provided
      users = await User.find();
    }
    // Pass both users and query to the template
    res.render('admin/users', { users, query, searchPerformed: !!query });
  } catch (error) {
    res.status(500).send('Server Error');
  }
});




// Create User
router.post('/users', isAdmin, async (req, res) => {
  const { name, email, password, isAdmin } = req.body;

  try {
    const user = new User({ name, email, password, isAdmin });
    await user.save();
    res.redirect('/admin/users'); // Redirect to the users page after creation
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).send('Server Error'); // Handle error
  }
});



// Edit User (GET)
router.get('/users/edit/:id', isAdmin, async (req, res) => {
  const user = await User.findById(req.params.id);
  res.render('admin/editUser', { user }); // Create admin/editUser.ejs
});

// Edit User (POST)
router.post('/users/edit/:id', isAdmin, async (req, res) => {
  const { email, password, isAdmin } = req.body;
  const user = await User.findById(req.params.id);
  
  user.email = email;
  if (password) {
    user.password = password; // Ensure to hash it if you modify it
  }
  user.isAdmin = isAdmin === 'on'; // Convert string to boolean
  await user.save();
  
  res.redirect('/admin/users');
});

// Delete User
router.post('/users/delete/:id', isAdmin, async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.redirect('/admin/users');
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error("Error destroying session:", err);
      return res.status(500).send('Could not log out.');
    }
    res.clearCookie('connect.sid',{
      secure:false
    }); // Clear the session cookie
    res.redirect('/admin/login'); // Redirect to login after logout
  });
});
module.exports = router;
