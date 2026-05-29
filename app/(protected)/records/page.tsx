"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { ChevronLeft, ChevronRight, AlertCircle, FileText } from "lucide-react";

interface Issue {
  _id: string;
  book: { title: string; author: string; isbn: string };
  student: { name: string; email: string };
  issuedBy: { name: string; email: string };
  issuedAt: string;
  dueDate: string;
  returnedAt: string | null;
  status: string;
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function isOverdue(issue: Issue): boolean {
  return issue.status === "active" && new Date(issue.dueDate) < new Date();
}

type StatusFilter = "all" | "active" | "returned";

const STATUS_LABELS: Record<StatusFilter, string> = { all: "All Records", active: "Active", returned: "Returned" };

export default function RecordsPage() {
  const { data: session } = useSession();
  const role = session?.user?.role as string | undefined;
  const isStaff = role === "admin" || role === "librarian";

  const [issues, setIssues] = useState<Issue[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);
  const limit = 20;

  const fetchIssues = useCallback(async (status: StatusFilter, p: number) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page: String(p), limit: String(limit) });
      if (status !== "all") params.set("status", status);
      const res = await fetch(`/api/issues?${params}`);
      if (!res.ok) throw new Error("Failed to load records");
      const data = await res.json();
      setIssues(data.issues ?? []);
      setTotal(data.total ?? 0);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIssues(statusFilter, page);
  }, [fetchIssues, statusFilter, page]);

  const totalPages = Math.ceil(total / limit);

  const changeStatus = (s: StatusFilter) => {
    setStatusFilter(s);
    setPage(1);
  };

  return (
    <div style={{ padding: "40px 32px", maxWidth: 1200, margin: "0 auto" }}>
      {/* Header */}
      <div className="animate-fade-in" style={{ marginBottom: 32 }}>
        <h1 style={{ fontFamily: "var(--font-family-serif)", fontSize: 32, fontWeight: 700, color: "#1A1208", margin: 0 }}>
          {isStaff ? "Issue Records" : "My Borrowing History"}
        </h1>
        <p style={{ color: "#9B8B7A", marginTop: 6, fontSize: 14 }}>
          {total} record{total !== 1 ? "s" : ""} total
        </p>
      </div>

      {/* Filter tabs */}
      <div
        className="animate-fade-in stagger-1"
        style={{ display: "flex", gap: 4, marginBottom: 24, background: "#F0E8D8", borderRadius: 10, padding: 4, width: "fit-content" }}
      >
        {(["all", "active", "returned"] as StatusFilter[]).map((s) => (
          <button
            key={s}
            onClick={() => changeStatus(s)}
            style={{
              padding: "7px 18px",
              borderRadius: 7,
              border: "none",
              fontSize: 13,
              fontWeight: 600,
              fontFamily: "var(--font-family-sans)",
              cursor: "pointer",
              transition: "background 0.15s, color 0.15s",
              background: statusFilter === s ? "#FDFBF6" : "transparent",
              color: statusFilter === s ? "#1A1208" : "#9B8B7A",
              boxShadow: statusFilter === s ? "0 1px 4px rgba(13,17,23,0.08)" : "none",
            }}
          >
            {STATUS_LABELS[s]}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: "#9B404012", border: "1px solid #9B404033", borderRadius: 8, padding: "12px 16px", color: "#9B4040", fontSize: 14, marginBottom: 20, display: "flex", gap: 8, alignItems: "center" }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Table */}
      <div
        className="animate-fade-in stagger-2"
        style={{ background: "#FDFBF6", border: "1px solid #E3D9C8", borderRadius: 14, overflow: "hidden" }}
      >
        {loading ? (
          <div style={{ padding: "48px", textAlign: "center", color: "#9B8B7A", fontSize: 14 }}>Loading records…</div>
        ) : issues.length === 0 ? (
          <div style={{ padding: "64px", textAlign: "center", color: "#9B8B7A" }}>
            <FileText size={36} style={{ margin: "0 auto 12px", opacity: 0.35 }} />
            <p style={{ fontSize: 15 }}>No records found.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #E3D9C8" }}>
                  {(
                    [
                      "Book",
                      ...(isStaff ? ["Student", "Issued By"] : []),
                      "Issued Date",
                      "Due Date",
                      "Return Date",
                      "Status",
                    ] as string[]
                  ).map((col) => (
                    <th
                      key={col}
                      style={{
                        padding: "14px 16px",
                        textAlign: "left",
                        fontFamily: "var(--font-family-sans)",
                        fontWeight: 600,
                        fontSize: 11,
                        letterSpacing: "0.07em",
                        textTransform: "uppercase",
                        color: "#9B8B7A",
                        whiteSpace: "nowrap",
                        background: "#FDFBF6",
                      }}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {issues.map((issue, i) => {
                  const overdue = isOverdue(issue);
                  const staggerClass = `stagger-${Math.min(i + 1, 6)}`;
                  const isEven = i % 2 === 1;
                  return (
                    <tr
                      key={issue._id}
                      className={`animate-fade-in ${staggerClass}`}
                      style={{
                        background: isEven ? "#F7F2E8" : "#FDFBF6",
                        borderBottom: "1px solid #EDE5D4",
                        transition: "background 0.12s",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "#F0E8D8"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = isEven ? "#F7F2E8" : "#FDFBF6"; }}
                    >
                      {/* Book */}
                      <td style={{ padding: "14px 16px", maxWidth: 220 }}>
                        <div style={{ fontWeight: 600, color: "#1A1208", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {issue.book.title}
                        </div>
                        <div style={{ fontSize: 11, color: "#9B8B7A", marginTop: 2 }}>{issue.book.author}</div>
                      </td>

                      {/* Student (staff only) */}
                      {isStaff && (
                        <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                          <div style={{ fontWeight: 500, color: "#1A1208" }}>{issue.student?.name ?? "—"}</div>
                          <div style={{ fontSize: 11, color: "#9B8B7A", marginTop: 2 }}>{issue.student?.email ?? ""}</div>
                        </td>
                      )}

                      {/* Issued By (staff only) */}
                      {isStaff && (
                        <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                          <div style={{ color: "#6B5D4E" }}>{issue.issuedBy?.name ?? "—"}</div>
                        </td>
                      )}

                      {/* Issued Date */}
                      <td style={{ padding: "14px 16px", color: "#6B5D4E", whiteSpace: "nowrap" }}>
                        {formatDate(issue.issuedAt)}
                      </td>

                      {/* Due Date */}
                      <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                        <span style={{ color: overdue ? "#9B4040" : "#6B5D4E", fontWeight: overdue ? 600 : 400 }}>
                          {formatDate(issue.dueDate)}
                        </span>
                      </td>

                      {/* Return Date */}
                      <td style={{ padding: "14px 16px", color: "#9B8B7A", whiteSpace: "nowrap" }}>
                        {formatDate(issue.returnedAt)}
                      </td>

                      {/* Status badge */}
                      <td style={{ padding: "14px 16px", whiteSpace: "nowrap" }}>
                        {overdue ? (
                          <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: "#9B4040", color: "#fff", letterSpacing: "0.04em" }}>
                            OVERDUE
                          </span>
                        ) : issue.status === "active" ? (
                          <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: "#C8922A22", color: "#C8922A", border: "1px solid #C8922A55", letterSpacing: "0.04em" }}>
                            ACTIVE
                          </span>
                        ) : (
                          <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: "#3D7A5822", color: "#3D7A58", border: "1px solid #3D7A5855", letterSpacing: "0.04em" }}>
                            RETURNED
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginTop: 28 }}>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{
              display: "flex", alignItems: "center", gap: 4, padding: "8px 14px",
              background: page === 1 ? "#F7F2E8" : "#FDFBF6",
              border: "1px solid #E3D9C8", borderRadius: 8, fontSize: 14,
              color: page === 1 ? "#C8B89A" : "#1A1208",
              cursor: page === 1 ? "not-allowed" : "pointer",
            }}
          >
            <ChevronLeft size={16} /> Prev
          </button>
          <span style={{ fontSize: 14, color: "#9B8B7A" }}>Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={{
              display: "flex", alignItems: "center", gap: 4, padding: "8px 14px",
              background: page === totalPages ? "#F7F2E8" : "#FDFBF6",
              border: "1px solid #E3D9C8", borderRadius: 8, fontSize: 14,
              color: page === totalPages ? "#C8B89A" : "#1A1208",
              cursor: page === totalPages ? "not-allowed" : "pointer",
            }}
          >
            Next <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
