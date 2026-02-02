const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '.env') });

const Report = require('./models/Report');

function mapLegacyToReason(value) {
  const v = String(value || '').trim().toLowerCase();
  if (!v) return null;
  if (v.includes('spam')) return 'SPAM';
  if (v.includes('acoso') || v.includes('harass')) return 'HARASSMENT';
  if (v.includes('odio') || v.includes('hate')) return 'HATE_SPEECH';
  if (v.includes('viol')) return 'VIOLENCE';
  if (v.includes('sex')) return 'SEXUAL_CONTENT';
  if (v.includes('fals') || v.includes('fake') || v.includes('info')) return 'FALSE_INFO';
  if (v.includes('copy') || v.includes('autor') || v.includes('copyright')) return 'COPYRIGHT';
  if (v === 'other') return 'OTHER';
  return null;
}

async function run() {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI no está definido en backend/.env');
  }

  await mongoose.connect(process.env.MONGO_URI);

  const cursor = Report.find({
    $or: [
      { reason: 'OTHER' },
      { reason: { $exists: false } },
      { reason: null }
    ]
  }).cursor();

  let scanned = 0;
  let updated = 0;

  for await (const report of cursor) {
    scanned++;

    const inferred = mapLegacyToReason(report.type) || mapLegacyToReason(report.description);
    if (!inferred) continue;

    if (report.reason !== inferred) {
      report.reason = inferred;
      await report.save();
      updated++;
    }
  }

  console.log(`Done. Scanned ${scanned}. Updated ${updated}.`);
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
