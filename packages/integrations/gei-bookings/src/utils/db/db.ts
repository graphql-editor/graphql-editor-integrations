import { MongoClient, Db } from "mongodb";

let mongoConnection: { db: Db; client: MongoClient } | undefined = undefined;

async function mongo(): Promise<Db> {
  if (!mongoConnection) {
    const mongoUrl = process.env.MONGO_URL
      ? process.env.MONGO_URL
      : "mongodb://localhost:27017";
      console.log(mongoUrl)
    const client = new MongoClient(mongoUrl);
    const c = await client.connect();
    const db = c.db();
    mongoConnection = {
      client,
      db,
    };
  }
  return mongoConnection.db;
}

export async function DB() {
  return mongo();
}

