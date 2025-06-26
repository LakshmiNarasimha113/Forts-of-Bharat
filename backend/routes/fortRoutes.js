
const express = require("express");
const Fort = require("../models/fortModel");


const router = express.Router();
router.get('/state/:stateName', async (req, res) => {
  const forts = await Fort.find({ state: req.params.stateName });
  res.json(forts);
});
// GET forts by state name
router.get('/state/:state', async (req, res) => {
  try {
    const forts = await Fort.find({ state: req.params.state.toLowerCase() });
    res.json(forts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});



// GET a single fort by ID
router.get('/:id', async (req, res) => {
  const fort = await Fort.findById(req.params.id);
  if (!fort) {
    return res.status(404).json({ message: "Fort not found" });
  }
  res.json(fort);
});


// POST a new fort
router.post("/", async (req, res) => {
  const { name, state, description, images, established, history } = req.body;

  try {
    const newFort = new Fort({ name, state, description, images, established, history });
    await newFort.save();
    res.status(201).json(newFort);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
