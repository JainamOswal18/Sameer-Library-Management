import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Book from "@/models/Book";
import { NextRequest } from "next/server";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const { id } = await params;
  const book = await Book.findById(id).lean();
  if (!book) return Response.json({ error: "Not found" }, { status: 404 });

  return Response.json({ book });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role === "student") return Response.json({ error: "Forbidden" }, { status: 403 });

  await connectDB();
  const { id } = await params;
  const body = await req.json();
  const { title, author, genre, isbn, totalCopies, availableCopies } = body;

  const book = await Book.findById(id);
  if (!book) return Response.json({ error: "Not found" }, { status: 404 });

  if (title) book.title = title;
  if (author) book.author = author;
  if (genre) book.genre = genre;
  if (isbn) book.isbn = isbn;
  if (totalCopies !== undefined) book.totalCopies = Number(totalCopies);
  if (availableCopies !== undefined) book.availableCopies = Number(availableCopies);

  await book.save();
  return Response.json({ book });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role === "student") return Response.json({ error: "Forbidden" }, { status: 403 });

  await connectDB();
  const { id } = await params;
  const book = await Book.findByIdAndDelete(id);
  if (!book) return Response.json({ error: "Not found" }, { status: 404 });

  return Response.json({ message: "Deleted" });
}
