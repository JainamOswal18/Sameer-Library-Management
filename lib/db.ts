import mongoose from "mongoose";

declare global {
  // eslint-disable-next-line no-var
  var _mongooseCache: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
}

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error("Please define MONGODB_URI in .env.local");
}

if (!global._mongooseCache) {
  global._mongooseCache = { conn: null, promise: null };
}

const cache = global._mongooseCache;

export async function connectDB() {
  if (cache.conn) return cache.conn;

  if (!cache.promise) {
    cache.promise = mongoose.connect(MONGODB_URI, { bufferCommands: false }).then((m) => m);
  }

  try {
    cache.conn = await cache.promise;
  } catch (e) {
    cache.promise = null;
    throw e;
  }

  await seedAdmin();

  return cache.conn;
}

let adminSeeded = false;

async function seedAdmin() {
  if (adminSeeded) return;
  adminSeeded = true;

  const User = (await import("@/models/User")).default;
  const bcrypt = await import("bcryptjs");

  const existing = await User.findOne({ role: "admin" });
  if (existing) return;

  const password = await bcrypt.hash("admin123", 12);
  await User.create({
    name: "Admin",
    email: "admin@library.com",
    password,
    role: "admin",
  });

  console.log("✓ Admin seeded — admin@library.com / admin123");
}
