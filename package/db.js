import { MongoClient, ObjectId } from 'mongodb';

const DB_OPTIONS = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
};

let cachedClient = null;
let cachedDb = null;

export const oid = ObjectId;

export const isValidObecjtId = (str) => {
  return ObjectId.isValid(str);
};

export const connectToDatabase = async (dbName) => {
  // cache client and db instance
  if (cachedClient && cachedDb) {
    console.log(`Using cached client and db: ${dbName}`);
    // load from cache
    return {
      client: cachedClient,
      db: cachedDb,
    };
  }
  // Connect to cluster
  let client = new MongoClient(process.env.MONGODB_URI, DB_OPTIONS);
  await client.connect();
  let db = client.db(dbName);
  // set cache
  cachedClient = client;
  cachedDb = db;

  console.log(`Instantiating client and db: ${dbName}`);
  cachedClient.customShutdown = () => {
    if (process.env.NODE_ENV !== 'development') {
      if (
        cachedClient &&
        cachedClient.topology &&
        cachedClient.topology.isConnected()
      ) {
        // cachedClient.close((err) => {});
      }
    } else {
      console.log('Refusing shutdown in development environment.');
    }
  };

  return {
    client: cachedClient,
    db: cachedDb,
  };
};

const db = {
  oid,
  isValidObecjtId,
  connectToDatabase,
};

export default db;
