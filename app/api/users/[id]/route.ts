import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { NextRequest } from "next/server";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });

  await connectDB();
  const { id } = await params;
  const user = await User.findById(id).select("-password").lean();
  if (!user) return Response.json({ error: "Not found" }, { status: 404 });

  return Response.json({ user });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });

  await connectDB();
  const { id } = await params;
  const body = await req.json();
  const { name, email, password, role } = body;

  const user = await User.findById(id);
  if (!user) return Response.json({ error: "Not found" }, { status: 404 });

  if (name) user.name = name;
  if (email) user.email = email;
  if (role) user.role = role;
  if (password) user.password = await bcrypt.hash(password, 12);

  await user.save();

  const { password: _pw, ...safeUser } = user.toObject();
  return Response.json({ user: safeUser });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });

  await connectDB();
  const { id } = await params;

  const session2 = await auth();
  if (id === session2?.user?.id) {
    return Response.json({ error: "Cannot delete your own account" }, { status: 400 });
  }

  const user = await User.findByIdAndDelete(id);
  if (!user) return Response.json({ error: "Not found" }, { status: 404 });

  return Response.json({ message: "Deleted" });
}
