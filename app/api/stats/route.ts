import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Book from "@/models/Book";
import Issue from "@/models/Issue";
import User from "@/models/User";

export async function GET() {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  await connectDB();

  if (session.user.role === "student") {
    const [active, total, overdue] = await Promise.all([
      Issue.countDocuments({ student: session.user.id, status: "active" }),
      Issue.countDocuments({ student: session.user.id }),
      Issue.countDocuments({ student: session.user.id, status: "active", dueDate: { $lt: new Date() } }),
    ]);
    return Response.json({ active, total, overdue });
  }

  const [totalBooks, availableBooks, activeIssues, totalIssues, totalUsers] = await Promise.all([
    Book.countDocuments(),
    Book.aggregate([{ $group: { _id: null, total: { $sum: "$availableCopies" } } }]),
    Issue.countDocuments({ status: "active" }),
    Issue.countDocuments(),
    session.user.role === "admin" ? User.countDocuments() : Promise.resolve(null),
  ]);

  const stats: Record<string, unknown> = {
    totalBooks,
    availableCopies: availableBooks[0]?.total ?? 0,
    activeIssues,
    totalIssues,
  };

  if (session.user.role === "admin") {
    stats.totalUsers = totalUsers;
    const [students, librarians] = await Promise.all([
      User.countDocuments({ role: "student" }),
      User.countDocuments({ role: "librarian" }),
    ]);
    stats.students = students;
    stats.librarians = librarians;
  }

  return Response.json(stats);
}
