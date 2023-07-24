import { MongoClient, Db } from 'mongodb';

let mongoConnection: MongoClient | undefined = undefined;
let mongoDb: Db | undefined = undefined;
async function mongo(): Promise<Db> {
  if (!mongoDb) {
    const mongoUrl = process.env.MONGO_URL ? process.env.MONGO_URL : 'mongodb://localhost:27017/test';
    const client = new MongoClient(mongoUrl);
    mongoConnection = await new Promise<MongoClient>((resolve, reject) =>
      client.connect((err, db) => (err ? reject(err) : db ? resolve(db) : reject(`Cannot connect to database`))),
    );
    mongoDb = mongoConnection.db();
  }
  return mongoDb;
}

export async function DB() {
  return mongo();
}
