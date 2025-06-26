const express = require('express');
const router = express.Router();
const Review = require('../models/Review');

// GET all reviews for a fort
router.get('/:fortSlug', async (req, res) => {
  try {
    const reviews = await Review.find({ fortSlug: req.params.fortSlug });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST a review
router.post('/', async (req, res) => {
  try {
    const { fortSlug, name, rating, comment } = req.body;
    const newReview = new Review({ fortSlug, name, rating, comment });
    await newReview.save();
    res.status(201).json(newReview);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
