import { createHash } from "node:crypto";
import { MongoClient, type Collection } from "mongodb";

interface RateLimitDocument {
  _id: string;
  count: number;
  expiresAt: Date;
}

const globalForMongo = globalThis as unknown as {
  rateLimitClient?: MongoClient;
  rateLimitCollection?: Promise<Collection<RateLimitDocument>>;
};

function getRateLimitCollection(): Promise<Collection<RateLimitDocument>> {
  if (!globalForMongo.rateLimitCollection) {
    const uri = process.env.DATABASE_URL;
    if (!uri) throw new Error("DATABASE_URL is not configured.");

    const client = globalForMongo.rateLimitClient ?? new MongoClient(uri);
    globalForMongo.rateLimitClient = client;
    globalForMongo.rateLimitCollection = client.connect().then(async () => {
      const collection = client.db().collection<RateLimitDocument>("auth_rate_limits");
      await collection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
      return collection;
    });
  }
  return globalForMongo.rateLimitCollection;
}

export function getClientIp(forwardedFor: string | string[] | undefined): string {
  const value = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
  const ip = value?.split(",", 1)[0]?.trim();
  return ip && ip.length <= 64 ? ip : "unknown";
}

function makeKey(scope: string, identity: string, windowMs: number, now: number): string {
  const bucket = Math.floor(now / windowMs);
  return createHash("sha256").update(`${scope}:${identity}`).digest("hex") + `:${bucket}`;
}

export async function consumeRateLimit(
  scope: string,
  identity: string,
  limit: number,
  windowMs: number
): Promise<boolean> {
  const now = Date.now();
  const key = makeKey(scope, identity, windowMs, now);
  const collection = await getRateLimitCollection();
  await collection.updateOne(
    { _id: key },
    {
      $inc: { count: 1 },
      $setOnInsert: { expiresAt: new Date((Math.floor(now / windowMs) + 2) * windowMs) },
    },
    { upsert: true }
  );
  const record = await collection.findOne({ _id: key }, { projection: { count: 1 } });
  return (record?.count ?? 0) <= limit;
}

export async function clearRateLimit(
  scope: string,
  identity: string,
  windowMs: number
): Promise<void> {
  const key = makeKey(scope, identity, windowMs, Date.now());
  const collection = await getRateLimitCollection();
  await collection.deleteOne({ _id: key });
}