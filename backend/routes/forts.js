const express = require('express');
const router = express.Router();
const Fort = require('../models/fortModel'); // Adjust path if needed

// GET fort by slug
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const fort = await Fort.findOne({ slug });

    if (!fort) return res.status(404).json({ message: 'Fort not found' });

    res.json(fort);
  } catch (err) {
    console.error('Error fetching fort by slug:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
