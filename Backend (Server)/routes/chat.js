// routes/chat.js
const router = require('express').Router();
const jwt = require('jsonwebtoken');
const Message = require('../models/Message');

require('dotenv').config();

function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.sendStatus(401);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch {
    res.sendStatus(403);
  }
}

// GET conversation messages between req.userId and :id
router.get('/:id/messages', authMiddleware, async (req, res) => {
  try {
    const other = req.params.id;
    const msgs = await Message.find({
      $or: [
        { from: req.userId, to: other },
        { from: other, to: req.userId },
      ],
    }).sort({ createdAt: 1 }).populate('from to', 'name email');
    res.json(msgs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// POST new message in conversation (server-side save)
router.post('/:id/messages', authMiddleware, async (req, res) => {
  try {
    const to = req.params.id;
    const from = req.userId;
    const { content } = req.body;
    const m = await Message.create({ from, to, content, delivered: false, read: false });
    const populated = await m.populate('from to', 'name email');
    res.status(201).json(populated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save message' });
  }
});

module.exports = router;
