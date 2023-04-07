import { MongoClient, ObjectId } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

let cachedClient = null;
let cachedDb = null;

const LOCAL_DEBUG = false;
const DB_OPTIONS = {
  useNewUrlParser: true,
  useUnifiedTopology: true
};

export const oid = ObjectId;

export function isValidObecjtId(str) {
  return ObjectId.isValid(str);
}

async function listDatabases(client) {
  const databasesList = await client.db().admin().listDatabases();
  if (LOCAL_DEBUG) {
    console.log('Databases:');
    databasesList.databases.forEach((db) => console.log(`- ${db.name}`));
  }
}

export async function connectToDatabase(dbName) {
  if (!process.env.MONGODB_URI) {
    throw new Error('Please add your Mongo URI to .env.local');
  }

  const mongoURL = process.env.MONGODB_URI ? process.env.MONGODB_URI : `mongodb://localhost:27017/${dbName}`;

  if (LOCAL_DEBUG) {
    console.log('dbname: ', dbName);
    console.log('node_env: ', process.env.NODE_ENV);
    console.log('mongoURL: ', mongoURL);
  }

  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  if (process.env.NODE_ENV === 'development') {
    if (!global._mongoCachedClient) {
      let client;
      if (LOCAL_DEBUG) console.log(`Setting global for _mongoCachedClient.`);
      client = new MongoClient(mongoURL, DB_OPTIONS);
      global._mongoCachedClient = client.connect();
      global._cachedDb = client.db(dbName);
    }
    cachedClient = global._mongoCachedClient;
    cachedDb = global._cachedDb;
    if (LOCAL_DEBUG) console.log('Using global instances.');
  } else {
    // Use fresh connections in PROD.
    let client, db;
    client = new MongoClient(mongoURL, DB_OPTIONS);
    await client.connect();
    await listDatabases(client);
    db = client.db(dbName);
    // set module cache
    cachedClient = client;
    cachedDb = db;
    if (LOCAL_DEBUG) console.log('Using module instances.');
  }

  cachedClient.customShutdown = () => {
    if (process.env.NODE_ENV !== 'development') {
      if (cachedClient && cachedClient.topology && cachedClient.topology.isConnected()) cachedClient.close((err) => {});
    } else {
      if (LOCAL_DEBUG) console.log('Refusing shutdown in development environment.');
    }
  };

  return {
    client: cachedClient,
    db: cachedDb
  };
}

const db = {
  oid,
  isValidObecjtId,
  connectToDatabase
};

export default db;