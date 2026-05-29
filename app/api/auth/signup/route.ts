import { connectDB } from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  await connectDB();

  const body = await req.json();
  const { name, email, password, role } = body;

  if (!name || !email || !password || !role) {
    return Response.json({ error: "All fields are required" }, { status: 400 });
  }

  if (!["admin", "librarian", "student"].includes(role)) {
    return Response.json({ error: "Invalid role" }, { status: 400 });
  }

  if (password.length < 6) {
    return Response.json({ error: "Password must be at least 6 characters" }, { status: 400 });
  }

  const existing = await User.findOne({ email });
  if (existing) {
    return Response.json({ error: "Email already in use" }, { status: 409 });
  }

  const hashed = await bcrypt.hash(password, 12);
  const user = await User.create({ name, email, password: hashed, role });

  return Response.json(
    { user: { id: user._id.toString(), name: user.name, email: user.email, role: user.role } },
    { status: 201 }
  );
}
