const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

const isValidEmail = (email) => {
  const at = email.indexOf('@');
  const dot = email.lastIndexOf('.');
  return at > 0 && dot > at + 1 && dot < email.length - 1;
};

router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const normalizedUsername = typeof username === 'string' ? username.trim() : '';
    if (!normalizedUsername || !normalizedEmail || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({ message: 'Invalid email format' });
    }

    const exists = await User.findOne({ $or: [{ email: normalizedEmail }, { username: normalizedUsername }] });
    if (exists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ username: normalizedUsername, email: normalizedEmail, password: hashedPassword });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({
      token,
      user: { id: user._id, username: user.username, email: user.email, bio: user.bio }
    });
  } catch (error) {
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    if (!normalizedEmail || !password || !isValidEmail(normalizedEmail)) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({
      token,
      user: { id: user._id, username: user.username, email: user.email, bio: user.bio }
    });
  } catch (error) {
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
});

module.exports = router;
