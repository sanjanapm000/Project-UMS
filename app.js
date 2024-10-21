
// app.js
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const bodyParser = require('body-parser');
const User = require('./models/User');
const indexRouter = require('./routes/index');
const adminRouter = require('./routes/admin');
const nocache = require('nocache');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
app.use(nocache());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI);



app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(session({
  secret: process.env.SECRET_KEY,
  resave: false,
  saveUninitialized: true,
  cookie:{secure:false}
}));

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));


// Routes
app.use('/',indexRouter);
app.use('/admin', adminRouter);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
