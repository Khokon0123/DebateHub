import { MongoClient, type Db } from "mongodb";

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

function extractDbNameFromUri(uri: string): string | null {
  // Examples:
  // - mongodb+srv://user:pass@host:27017/mydb?retryWrites=true&w=majority
  // - mongodb://user:pass@host:27017/mydb
  // Only capture a real path segment like `/mydb` (not host pieces like `mongodb.net`).
  const m = uri.match(/\/([^/?#]+)(\?|#|$)/);
  const candidate = m?.[1] ?? null;
  if (!candidate) return null;

  // MongoDB database names cannot contain '.'; treat anything like that as invalid.
  if (candidate.includes(".")) return null;

  return candidate;
}

export async function getMongoDb(): Promise<Db> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("Missing env `MONGODB_URI` for MongoDB.");
  }

  if (cachedDb && cachedClient) return cachedDb;

  const client = new MongoClient(uri);
  cachedClient = cachedClient ?? client;

  if (!cachedDb) {
    const dbFromUri = extractDbNameFromUri(uri);
    const dbName = process.env.MONGODB_DB ?? dbFromUri ?? "debatehub";
    cachedDb = cachedClient.db(dbName);
  }

  // Ensure the connection is established (Mongo is lazy by default).
  await cachedClient.connect();

  return cachedDb!;
}

