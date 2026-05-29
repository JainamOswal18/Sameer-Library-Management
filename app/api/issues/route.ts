import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Issue from "@/models/Issue";
import Book from "@/models/Book";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

  const query: Record<string, unknown> = {};

  if (session.user.role === "student") {
    query.student = session.user.id;
  }

  if (status) query.status = status;

  const total = await Issue.countDocuments(query);
  const issues = await Issue.find(query)
    .populate("book", "title author genre isbn")
    .populate("student", "name email")
    .populate("issuedBy", "name email")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  return Response.json({ issues, total, page, totalPages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role === "student") return Response.json({ error: "Forbidden" }, { status: 403 });

  await connectDB();

  const body = await req.json();
  const { bookId, studentId, dueDate } = body;

  if (!bookId || !studentId || !dueDate) {
    return Response.json({ error: "bookId, studentId, and dueDate are required" }, { status: 400 });
  }

  const book = await Book.findById(bookId);
  if (!book) return Response.json({ error: "Book not found" }, { status: 404 });
  if (book.availableCopies < 1) return Response.json({ error: "No copies available" }, { status: 409 });

  const activeIssue = await Issue.findOne({ book: bookId, student: studentId, status: "active" });
  if (activeIssue) return Response.json({ error: "Student already has this book" }, { status: 409 });

  book.availableCopies -= 1;
  await book.save();

  const issue = await Issue.create({
    book: bookId,
    student: studentId,
    issuedBy: session.user.id,
    dueDate: new Date(dueDate),
  });

  const populated = await issue.populate([
    { path: "book", select: "title author genre isbn" },
    { path: "student", select: "name email" },
    { path: "issuedBy", select: "name email" },
  ]);

  return Response.json({ issue: populated }, { status: 201 });
}
