const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '.env') });

const Report = require('./models/Report');

async function run() {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI no está definido en backend/.env');
  await mongoose.connect(process.env.MONGO_URI);

  const distinctReason = await Report.distinct('reason');
  const distinctType = await Report.distinct('type');
  const distinctContentType = await Report.distinct('contentType');
  const distinctAction = await Report.distinct('moderationAction');

  const sample = await Report.find({}).select('reason type description contentType moderationAction moderatedAt').limit(10).lean();

  console.log('distinct reason:', distinctReason);
  console.log('distinct type:', distinctType);
  console.log('distinct contentType:', distinctContentType);
  console.log('distinct moderationAction:', distinctAction);
  console.log('sample:', JSON.stringify(sample, null, 2));
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
