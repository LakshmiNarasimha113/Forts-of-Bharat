const mongoose = require('mongoose');
const slugify = require('slugify');
const Fort = require('./models/fortModel'); // Adjust the path if needed
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function updateSlugs() {
  const forts = await Fort.find();

  for (const fort of forts) {
    if (!fort.slug) {
      fort.slug = slugify(fort.name, { lower: true });
      await fort.save();
      console.log(`Updated: ${fort.name} -> ${fort.slug}`);
    }
  }

  console.log('✅ Slug update complete.');
  mongoose.disconnect();
}

updateSlugs();
