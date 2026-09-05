import mongoose from 'mongoose';

// Cached connection across hot reloads / serverless invocations.
const globalWithMongoose = global as typeof globalThis & {
  _mongoose?: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
};

const cached = (globalWithMongoose._mongoose ??= { conn: null, promise: null });

export async function dbConnect(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI is not set');
    cached.promise = mongoose.connect(uri);
  }
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    // A warm process must not remember a failure forever: the next call
    // connects again instead of rethrowing the first outage (ROUND_6 Task 8).
    cached.promise = null;
    throw e;
  }
  return cached.conn;
}
