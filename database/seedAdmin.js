const { getDb } = require('../config/database');

async function createDefaultAdmin() {
  const db = getDb();
  const adminUser = await db.collection('users').findOne({ username: 'Ragul', role: 'admin' });
  if (!adminUser) {
    await db.collection('users').insertOne({
      username: 'Ragul',
      password: 'Ragul3512',
      role: 'admin',
      collegeId: 'ADMIN001',
      collegeName: 'System Administrator'
    });
    console.log('Default admin account created');
  }
}

module.exports = { createDefaultAdmin };