const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');

function getArg(name) {
  const idx = process.argv.indexOf(name);
  if (idx === -1) return null;
  return process.argv[idx + 1] || null;
}

async function run() {
  const email = getArg('--email');
  const username = getArg('--username');
  const apply = process.argv.includes('--apply');

  if (!process.env.MONGO_URI) throw new Error('MONGO_URI no está definido en backend/.env');
  if (!email && !username) {
    throw new Error('Debes especificar --email <admin_email> o --username <admin_username>');
  }

  await mongoose.connect(process.env.MONGO_URI);

  const query = {};
  if (email) query.email = String(email).toLowerCase();
  if (username) query.username = String(username);

  const adminUser = await User.findOne(query).select('_id username email role').lean();
  if (!adminUser) {
    throw new Error('No se encontró el usuario admin con los criterios dados.');
  }

  const users = await User.find({}).select('_id username email role').lean();

  const toDelete = users.filter(u => String(u._id) !== String(adminUser._id));

  console.log('Admin to keep:', adminUser);
  console.log('Total users:', users.length);
  console.log('Users to delete:', toDelete.length);
  console.log('Preview delete list:', toDelete.map(u => ({ id: u._id, username: u.username, email: u.email, role: u.role })));

  if (!apply) {
    console.log('Dry-run only. Re-run with --apply to actually delete users.');
    return;
  }

  const res = await User.deleteMany({ _id: { $ne: adminUser._id } });
  console.log('Deleted:', res.deletedCount);
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
