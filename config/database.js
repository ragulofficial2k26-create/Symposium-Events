const { MongoClient } = require('mongodb');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/symposium_event_system';
let dbClient;
let db;

async function initDb() {
  if (db) return db;
  dbClient = new MongoClient(uri);
  await dbClient.connect();
  db = dbClient.db();
  await db.collection('users').createIndex({ username: 1 }, { unique: true });
  await db.collection('registrations').createIndex({ registrationId: 1 }, { unique: true });
  return db;
}

function getDb() {
  if (!db) throw new Error('Database not initialized');
  return db;
}

function getClient() {
  if (!dbClient) throw new Error('Database client not initialized');
  return dbClient;
}

module.exports = { initDb, getDb, getClient };