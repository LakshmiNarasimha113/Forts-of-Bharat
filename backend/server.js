const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const { GoogleAuth } = require('google-auth-library');
const axios = require('axios');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/fortsDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB connected"))
.catch(err => console.error("❌ MongoDB connection error:", err));

// Serve Images
app.use('/images', express.static(path.join(__dirname, 'images')));

// Google Auth (for Gemini)
const auth = new GoogleAuth({
  keyFile: path.join(__dirname, 'vertex-service-account.json'),
  scopes: 'https://www.googleapis.com/auth/cloud-platform',
});

// Route Imports
const fortRoutes = require('./routes/forts');
const reviewRoutes = require('./routes/reviews');

// API Routes
app.use('/api/forts', fortRoutes);
app.use('/api/reviews', reviewRoutes); // ✅ Must come *after* middleware and DB connection

// Gemini Chat Route
app.post('/chat', async (req, res) => {
  const userMessage = req.body.message;
  const API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyDu73XlqCOJRiwn9TvFstVOIlSTk1C_Lzg';

  const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;
  const payload = {
    contents: [
      {
        role: "user",
        parts: [{ text: userMessage }]
      }
    ]
  };

  try {
    const response = await axios.post(GEMINI_API_URL, payload, {
      headers: { "Content-Type": "application/json" }
    });

    const reply = response.data.candidates?.[0]?.content?.parts?.[0]?.text || "No response from Gemini.";
    res.json({ reply });

  } catch (error) {
    console.error("Gemini API error:", JSON.stringify(error.response?.data || error.message, null, 2));
    res.status(500).json({ reply: "Gemini AI error. Please try again." });
  }
});

// Start Server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
