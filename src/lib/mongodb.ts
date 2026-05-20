import { MongoClient, MongoClientOptions } from 'mongodb';

const uri = process.env.MONGODB_URL || process.env.DATABASE_URL;
if (!uri) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URL" or "DATABASE_URL"');
}

const isLocal = uri.includes('localhost') || uri.includes('127.0.0.1');

// 🛡️ ENVIRONMENT-AWARE TLS OPTIONS
// Local MongoDB does NOT support TLS — only enforce it for Atlas cloud connections
const options: MongoClientOptions = {
  ...(isLocal ? {} : {
    ssl: true,
    tls: true,
    tlsAllowInvalidCertificates: false, // Always strict in production
  }),
  serverSelectionTimeoutMS: 10000,
  connectTimeoutMS: 10000,
  socketTimeoutMS: 45000,
  maxPoolSize: 10,
};

// 🛡️ GLOBAL SINGLETON CACHE — works for BOTH dev (HMR) and production (Vercel serverless)
// This prevents connection pool exhaustion on Vercel cold starts.
declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

let clientPromise: Promise<MongoClient>;

if (!global._mongoClientPromise) {
  const client = new MongoClient(uri, options);
  global._mongoClientPromise = client.connect()
    .then((c) => {
      console.log('✅ [MongoDB] Connection pool established');
      return c;
    })
    .catch((err) => {
      console.error('❌ [MongoDB] Connection failed:', err.message);
      global._mongoClientPromise = undefined; // Allow retry on next request
      throw err;
    });
}

clientPromise = global._mongoClientPromise;

export default clientPromise;
