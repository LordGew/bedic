const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const Category = require('./models/Category');
const Place = require('./models/Place');

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
  if (!mongoUri) throw new Error('MONGO_URI no está definido. Verifica backend/.env');

  await mongoose.connect(mongoUri);

  const categories = await Category.find({});
  const bySlug = new Map(categories.map(c => [c.slug, c]));
  const byName = new Map(categories.map(c => [c.name, c]));

  // Legacy keys used by the app/admin previously
  const legacyMap = {
    restaurant: 'restaurantes',
    cafes: 'cafe',
    cafe: 'cafe',
    bar: 'bar',
    hotel: 'hoteles',
    attraction: 'parques',
    other: 'uncategorized',
    uncategorized: 'uncategorized'
  };

  const places = await Place.find({}, { category: 1 });
  let updated = 0;

  for (const p of places) {
    const current = p.category;
    if (!current) continue;

    let next = current;

    // 1) Direct match to existing category slug
    if (bySlug.has(current)) {
      continue;
    }

    // 2) Direct match to existing category name
    if (byName.has(current)) {
      next = byName.get(current).slug;
    }

    // 3) Legacy key mapping
    if (legacyMap[current]) {
      const mappedSlug = legacyMap[current];
      if (bySlug.has(mappedSlug)) next = mappedSlug;
    }

    // 4) Slugify current and try match
    if (next === current) {
      const s = slugify(current);
      if (bySlug.has(s)) next = s;
    }

    if (next !== current) {
      await Place.updateOne({ _id: p._id }, { $set: { category: next } });
      updated++;
      console.log(`Updated place ${p._id}: ${current} -> ${next}`);
    }
  }

  console.log(`Done. Updated ${updated}/${places.length} places.`);
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
