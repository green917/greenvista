const express = require('express');
const authMiddleware = require('../middleware/auth');
const { isAdmin } = require('../middleware/roles');
const Notice = require('../models/Notice');

const router = express.Router();

router.post('/', authMiddleware, isAdmin, async (req, res) => {
  try {
    const { title, body, visibleTo } = req.body;
    if (!title || !body) {
      return res.status(400).json({ error: 'Title and body required' });
    }

    const notice = new Notice({
      title,
      body,
      visibleTo: visibleTo || 'all'
    });
    await notice.save();
    res.status(201).json(notice);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/', async (req, res) => {
  try {
    const notices = await Notice.find()
      .sort({ createdAt: -1 });

    res.json({ notices });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', authMiddleware, isAdmin, async (req, res) => {
  try {
    const notice = await Notice.findByIdAndDelete(req.params.id);
    if (!notice) {
      return res.status(404).json({ error: 'Notice not found' });
    }
    res.json({ message: 'Notice deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
