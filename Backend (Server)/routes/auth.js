// routes/auth.js
const router = require('express').Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');

require('dotenv').config();

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'All fields required' });
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ error: 'Email already in use' });

    const u = new User({ name, email, password });
    await u.save();
    const token = jwt.sign({ id: u._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { _id: u._id, name: u.name, email: u.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const u = await User.findOne({ email });
    if (!u || !(await u.comparePassword(password))) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: u._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { _id: u._id, name: u.name, email: u.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// me
router.get('/me', async (req, res) => {
  try {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ error: 'No token' });
    const token = auth.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const u = await User.findById(decoded.id).select('-password');
    if (!u) return res.status(404).json({ error: 'User not found' });
    res.json({ user: u });
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// GET users + last message with current user (if authenticated)
router.get('/users', async (req, res) => {
  try {
    const auth = req.headers.authorization;
    let currentId = null;
    if (auth) {
      try {
        const token = auth.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        currentId = decoded.id;
      } catch {}
    }

    const users = await User.find({}, 'name email').lean();

    if (!currentId) {
      return res.json(users.map(u => ({ user: u })));
    }

    const results = await Promise.all(users.map(async (u) => {
      if (u._id.toString() === currentId.toString()) return null;
      const last = await Message.findOne({
        $or: [
          { from: currentId, to: u._id },
          { from: u._id, to: currentId },
        ],
      }).sort({ createdAt: -1 }).lean();
      return { user: u, lastMessage: last ? { content: last.content, createdAt: last.createdAt, from: last.from } : null };
    }));

    res.json(results.filter(Boolean));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
