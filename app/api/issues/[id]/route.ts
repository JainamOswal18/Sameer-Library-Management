import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Issue from "@/models/Issue";
import Book from "@/models/Book";
import { NextRequest } from "next/server";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();
  const { id } = await params;

  const issue = await Issue.findById(id)
    .populate("book", "title author genre isbn")
    .populate("student", "name email")
    .populate("issuedBy", "name email")
    .lean();

  if (!issue) return Response.json({ error: "Not found" }, { status: 404 });

  return Response.json({ issue });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role === "student") return Response.json({ error: "Forbidden" }, { status: 403 });

  await connectDB();
  const { id } = await params;
  const body = await req.json();

  const issue = await Issue.findById(id);
  if (!issue) return Response.json({ error: "Not found" }, { status: 404 });
  if (issue.status === "returned") return Response.json({ error: "Already returned" }, { status: 409 });

  if (body.action === "return") {
    issue.status = "returned";
    issue.returnedAt = new Date();
    await issue.save();

    await Book.findByIdAndUpdate(issue.book, { $inc: { availableCopies: 1 } });
  }

  const populated = await issue.populate([
    { path: "book", select: "title author genre isbn" },
    { path: "student", select: "name email" },
    { path: "issuedBy", select: "name email" },
  ]);

  return Response.json({ issue: populated });
}
