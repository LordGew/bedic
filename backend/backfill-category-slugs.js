const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const Category = require('./models/Category');

function slugify(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function run() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error('MONGO_URI no está definido. Verifica backend/.env');
  }

  await mongoose.connect(mongoUri);

  const categories = await Category.find({});
  let updated = 0;

  for (const c of categories) {
    const nextSlug = slugify(c.name);
    if (!c.slug || c.slug !== nextSlug) {
      c.slug = nextSlug;
      await c.save();
      updated++;
      console.log(`Updated: ${c.name} -> ${c.slug}`);
    }
  }

  console.log(`Done. Updated ${updated}/${categories.length}`);
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
