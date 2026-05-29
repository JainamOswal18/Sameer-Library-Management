import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Book from "@/models/Book";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const genre = searchParams.get("genre") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

  const query: Record<string, unknown> = {};
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { author: { $regex: search, $options: "i" } },
      { isbn: { $regex: search, $options: "i" } },
    ];
  }
  if (genre) query.genre = { $regex: genre, $options: "i" };

  const total = await Book.countDocuments(query);
  const books = await Book.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  return Response.json({ books, total, page, totalPages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role === "student") return Response.json({ error: "Forbidden" }, { status: 403 });

  await connectDB();

  const body = await req.json();
  const { title, author, genre, isbn, totalCopies } = body;

  if (!title || !author || !genre || !isbn || totalCopies === undefined) {
    return Response.json({ error: "All fields are required" }, { status: 400 });
  }

  const existing = await Book.findOne({ isbn });
  if (existing) return Response.json({ error: "ISBN already exists" }, { status: 409 });

  const book = await Book.create({
    title,
    author,
    genre,
    isbn,
    totalCopies: Number(totalCopies),
    availableCopies: Number(totalCopies),
  });

  return Response.json({ book }, { status: 201 });
}
