import { MongoClient, MongoClientOptions } from 'mongodb';

if (!process.env.MONGODB_URL) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URL"');
}

const uri = process.env.MONGODB_URL;

const isLocal = uri.includes('localhost') || uri.includes('127.0.0.1');

// 🛡️ STABILIZED CLOUD TRANSPORT OPTIONS
const options: MongoClientOptions = {
  ...(isLocal ? {} : {
    ssl: true,
    tls: true,
    tlsAllowInvalidCertificates: process.env.NODE_ENV === 'development',
  }),
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 10000,
  maxPoolSize: 10,
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

// 🛡️ GRACEFUL HANDSHAKE FALLBACK ERROR BOUNDARY
async function connectWithRetry(clientInstance: MongoClient, retries = 3): Promise<MongoClient> {
  for (let i = 0; i < retries; i++) {
    try {
      await clientInstance.connect();
      // Optional Ping to verify active secure channel
      await clientInstance.db('admin').command({ ping: 1 });
      console.log('✅ Secure MongoDB Transport Established');
      return clientInstance;
    } catch (error: any) {
      console.warn(`[MONGO_CONNECT_RETRY] Attempt ${i + 1} failed:`, error.message);
      
      // Specifically catch TLS/SSL alert warnings to inform the developer
      if (error.message?.includes('ssl3_read_bytes') || error.message?.includes('tlsv1 alert')) {
        console.error('⚠️ TLS/SSL Handshake Failure Detected. Falling back to retry queue. Ensure your .env string contains `&tlsAllowInvalidCertificates=true` if this persists.');
      }
      
      if (i === retries - 1) {
        console.error('❌ MongoDB Transport Exhausted: Unable to establish secure connection.');
        throw error;
      }
      
      // Wait 2 seconds before retrying
      await new Promise(res => setTimeout(res, 2000));
    }
  }
  return clientInstance;
}

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = connectWithRetry(client);
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options);
  clientPromise = connectWithRetry(client);
}

export default clientPromise;
