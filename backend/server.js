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
  const language = req.body.language || 'en-IN';
  const API_KEY = process.env.GEMINI_API_KEY;

  const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;

  const languageInstructions = {
    'en-IN': 'Respond in clear and simple English.',
    'hi-IN': 'उत्तर स्पष्ट और सरल हिंदी में दें।',
    'te-IN': 'తెలుగులో స్పష్టంగా సమాధానం ఇవ్వండి.',
    'ta-IN': 'தெளிவான தமிழில் பதிலளிக்கவும்.',
    'kn-IN': 'ಕನ್ನಡದಲ್ಲಿ ಸ್ಪಷ್ಟವಾಗಿ ಉತ್ತರಿಸಿ.',
    'ml-IN': 'മലയാളത്തിൽ വ്യക്തമായി മറുപടി നൽകുക.',
    'mr-IN': 'स्पष्ट मराठीत उत्तर द्या.',
    'gu-IN': 'સાધી અને સ્પષ્ટ ગુજરાતીમાં જવાબ આપો.',
    'bn-IN': 'স্পষ্ট এবং সহজ বাংলায় উত্তর দিন।'
  };

  const systemPrompt = `
You are a helpful expert on Indian forts for the website "Forts of Bharath".
Respond to all user queries about fort history, architecture, and especially travel planning:
- Best time to visit
- Entry fee & timings
- How to reach
- Travel tips
- Nearby attractions

${languageInstructions[language] || 'Respond in English.'}
Do not use markdown (* or **) in your reply. Respond only in text.
  `.trim();

  const payload = {
    contents: [
      {
        role: "user",
        parts: [{ text: `${systemPrompt}\n\nUser: ${userMessage}` }]
      }
    ]
  };

  try {
    const response = await axios.post(GEMINI_API_URL, payload, {
      headers: { "Content-Type": "application/json" }
    });

    const reply = response.data.candidates?.[0]?.content?.parts?.[0]?.text || "No response from Gemini.";
    res.json({ reply: reply.replace(/\*+/g, '').trim() });
  } catch (error) {
    console.error("Gemini API error:", error.message);
    res.status(500).json({ reply: "Gemini AI error. Please try again." });
  }
});

// TTS Route
app.post('/tts', async (req, res) => {
  const { text, languageCode } = req.body;

  const request = {
    input: { text },
    voice: {
      languageCode: languageCode || 'en-IN',
      ssmlGender: 'NEUTRAL',
    },
    audioConfig: { audioEncoding: 'MP3' },
  };

  try {
    const [response] = await ttsClient.synthesizeSpeech(request);
    res.set('Content-Type', 'audio/mpeg');
    res.send(response.audioContent);
  } catch (err) {
    console.error('TTS Error:', err.message);
    res.status(500).json({ error: 'Failed to synthesize speech' });
  }
});



// Start Server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
