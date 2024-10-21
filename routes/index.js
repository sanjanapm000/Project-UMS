// routes/index.js
const express = require('express');
const User = require('../models/User');
const adminRouter = require('./admin');
const authMiddleware = require('../middleware/auth');
const router = express.Router();




router.get('/', (req, res) => {
  // Redirect to home if the user is already logged in
  if (req.session.userId) {
    return res.redirect('/home');
  }
  res.render('signup');
});

// Sign Up
router.get('/signup', (req, res) => {
  if (req.session.userId) {
    return res.redirect('/home'); // Redirect if already logged in
  }
  res.render('signup');
});

router.post('/signup', async (req, res) => {
  const { name, email, password, confirm_password } = req.body;

  // Simple validation for empty fields
  if (!name || !email || !password || !confirm_password) {
      return res.json({ success: false, error: 'All fields are required.' });
  }

  // Name validation (basic example)
  if (name.length < 2 || name.length > 50) {
      return res.json({ success: false, error: 'Name must be between 2 and 50 characters.' });
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
      return res.json({ success: false, error: 'Invalid email format.' });
  }

  // Password validation
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,20}$/;
  if (!passwordRegex.test(password)) {
      return res.json({
          success: false,
          error: 'Password must be 8-20 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character.',
      });
  }

  if (password !== confirm_password) {
      return res.json({ success: false, error: 'Passwords do not match.' });
  }

  // Check for existing user
  const existingUser = await User.findOne({ email });
  if (existingUser) {
      return res.json({ success: false, error: 'User already exists.' });
  }

  // Create user
  const user = new User({ name, email, password });
  await user.save();
  return res.json({ success: true });
});


router.get('/login', (req, res) => {
  if (req.session.userId) {
    return res.redirect('/home'); // Redirect if already logged in
  }
  res.render('login');
});



// Login route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  // Simple validation
  if (!email || !password) {
    return res.json({ success: false, error: 'All fields are required.' });
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.json({ success: false, error: 'Invalid email format.' });
  }

  const user = await User.findOne({ email });

  if (user && await user.comparePassword(password)) {
    req.session.userId = user._id;
    return res.json({ success: true });
  }
  return res.json({ success: false, error: 'Invalid credentials.' });
});


// Home
router.get('/home', authMiddleware, (req, res) => {
  res.render('home'); // Now protected by the auth middleware
});

// Logout
router.get('/logout', (req, res) => {
  console.log("Logging out user:", req.session.userId);
  req.session.destroy(err => {
    if (err) {
      console.error("Error destroying session:", err);
      return res.redirect('/home'); // Redirect to home on error
    }
    res.clearCookie('connect.sid',{
      path:'/',
      secure: false // Set to true if using HTTPS
    }); // Clear the session cookie
    console.log("Session destroyed and cookie cleared");
    res.redirect('/login'); // Redirect to login page after successful logout
  });
});

router.use('/admin', adminRouter);
module.exports = router;
