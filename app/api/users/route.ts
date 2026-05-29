import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });

  await connectDB();

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const role = searchParams.get("role") || "";

  const query: Record<string, unknown> = {};
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }
  if (role) query.role = role;

  const users = await User.find(query).select("-password").sort({ createdAt: -1 }).lean();

  return Response.json({ users });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });

  await connectDB();

  const body = await req.json();
  const { name, email, password, role } = body;

  if (!name || !email || !password || !role) {
    return Response.json({ error: "All fields are required" }, { status: 400 });
  }

  const existing = await User.findOne({ email });
  if (existing) return Response.json({ error: "Email already in use" }, { status: 409 });

  const hashed = await bcrypt.hash(password, 12);
  const user = await User.create({ name, email, password: hashed, role });

  const { password: _pw, ...safeUser } = user.toObject();
  return Response.json({ user: safeUser }, { status: 201 });
}
