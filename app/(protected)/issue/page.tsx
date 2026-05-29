"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Search, CheckCircle, AlertCircle, RotateCcw, Calendar, User, BookOpen, ChevronDown } from "lucide-react";

interface UserResult {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface BookResult {
  _id: string;
  title: string;
  author: string;
  isbn: string;
  availableCopies: number;
  totalCopies: number;
}

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

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function getDefaultDueDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return d.toISOString().split("T")[0];
}

function isOverdue(dueDate: string): boolean {
  return new Date(dueDate) < new Date();
}

interface BannerProps {
  type: "success" | "error";
  message: string;
  onClose: () => void;
}

function Banner({ type, message, onClose }: BannerProps) {
  const isSuccess = type === "success";
  return (
    <div
      className="animate-fade-in"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "12px 16px",
        borderRadius: 10,
        background: isSuccess ? "#3D7A5812" : "#9B404012",
        border: `1px solid ${isSuccess ? "#3D7A5833" : "#9B404033"}`,
        color: isSuccess ? "#3D7A58" : "#9B4040",
        fontSize: 14,
        marginBottom: 16,
      }}
    >
      {isSuccess ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
      <span style={{ flex: 1 }}>{message}</span>
      <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", opacity: 0.7, fontSize: 18, lineHeight: 1, padding: 0 }}>×</button>
    </div>
  );
}

interface DropdownItem {
  id: string;
  primary: string;
  secondary: string;
  meta?: React.ReactNode;
}

interface SearchDropdownProps {
  placeholder: string;
  value: string;
  onChange: (val: string) => void;
  results: DropdownItem[];
  onSelect: (item: DropdownItem) => void;
  icon: React.ReactNode;
  loading?: boolean;
  selectedLabel?: string;
}

function SearchDropdown({ placeholder, value, onChange, results, onSelect, icon, loading, selectedLabel }: SearchDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div style={{ position: "relative" }}>
        <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9B8B7A", display: "flex" }}>
          {icon}
        </span>
        <input
          style={{
            width: "100%",
            padding: "10px 12px 10px 38px",
            background: "#FDFBF6",
            border: "1px solid #E3D9C8",
            borderRadius: 8,
            fontSize: 14,
            color: "#1A1208",
            fontFamily: "var(--font-family-sans)",
            outline: "none",
          }}
          placeholder={placeholder}
          value={selectedLabel ?? value}
          onChange={(e) => {
            onChange(e.target.value);
            setOpen(true);
          }}
          onFocus={() => { if (results.length > 0 || value.length > 0) setOpen(true); }}
        />
        <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "#9B8B7A", display: "flex", pointerEvents: "none" }}>
          <ChevronDown size={14} />
        </span>
      </div>
      {open && (value.length >= 1 || results.length > 0) && (
        <div
          className="animate-fade-in"
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            background: "#FDFBF6",
            border: "1px solid #E3D9C8",
            borderRadius: 10,
            boxShadow: "0 8px 32px rgba(13,17,23,0.14)",
            zIndex: 40,
            maxHeight: 220,
            overflowY: "auto",
          }}
        >
          {loading ? (
            <div style={{ padding: "12px 16px", color: "#9B8B7A", fontSize: 13 }}>Searching…</div>
          ) : results.length === 0 ? (
            <div style={{ padding: "12px 16px", color: "#9B8B7A", fontSize: 13 }}>No results found.</div>
          ) : (
            results.map((item) => (
              <button
                key={item.id}
                onClick={() => { onSelect(item); setOpen(false); }}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "10px 16px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "var(--font-family-sans)",
                  borderBottom: "1px solid #F0E8D8",
                  transition: "background 0.1s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#F7F2E8"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
              >
                <div style={{ fontWeight: 600, fontSize: 14, color: "#1A1208" }}>{item.primary}</div>
                <div style={{ fontSize: 12, color: "#9B8B7A", marginTop: 2 }}>{item.secondary}</div>
                {item.meta && <div style={{ marginTop: 4 }}>{item.meta}</div>}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default function IssuePage() {
  const { data: session } = useSession();
  const role = session?.user?.role as string | undefined;

  // Issue section state
  const [studentSearch, setStudentSearch] = useState("");
  const [studentResults, setStudentResults] = useState<UserResult[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<UserResult | null>(null);
  const [studentLoading, setStudentLoading] = useState(false);

  const [bookSearch, setBookSearch] = useState("");
  const [bookResults, setBookResults] = useState<BookResult[]>([]);
  const [selectedBook, setSelectedBook] = useState<BookResult | null>(null);
  const [bookLoading, setBookLoading] = useState(false);

  const [dueDate, setDueDate] = useState(getDefaultDueDate());
  const [issueLoading, setIssueLoading] = useState(false);
  const [issueBanner, setIssueBanner] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Return section state
  const [issues, setIssues] = useState<Issue[]>([]);
  const [issuesLoading, setIssuesLoading] = useState(true);
  const [returnLoading, setReturnLoading] = useState<string | null>(null);
  const [returnBanner, setReturnBanner] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const studentDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bookDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchActiveIssues = useCallback(async () => {
    setIssuesLoading(true);
    try {
      const res = await fetch("/api/issues?status=active&limit=50");
      if (!res.ok) throw new Error("Failed to load issues");
      const data = await res.json();
      setIssues(data.issues ?? []);
    } catch {
      /* silent */
    } finally {
      setIssuesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActiveIssues();
  }, [fetchActiveIssues]);

  useEffect(() => {
    if (!studentSearch || studentSearch.length < 2) { setStudentResults([]); return; }
    if (studentDebounce.current) clearTimeout(studentDebounce.current);
    studentDebounce.current = setTimeout(async () => {
      setStudentLoading(true);
      try {
        const res = await fetch(`/api/users?search=${encodeURIComponent(studentSearch)}&role=student`);
        const data = await res.json();
        setStudentResults(data.users ?? []);
      } catch { setStudentResults([]); }
      finally { setStudentLoading(false); }
    }, 300);
  }, [studentSearch]);

  useEffect(() => {
    if (!bookSearch || bookSearch.length < 2) { setBookResults([]); return; }
    if (bookDebounce.current) clearTimeout(bookDebounce.current);
    bookDebounce.current = setTimeout(async () => {
      setBookLoading(true);
      try {
        const res = await fetch(`/api/books?search=${encodeURIComponent(bookSearch)}&limit=10`);
        const data = await res.json();
        setBookResults(data.books ?? []);
      } catch { setBookResults([]); }
      finally { setBookLoading(false); }
    }, 300);
  }, [bookSearch]);

  async function handleIssue(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedStudent || !selectedBook) {
      setIssueBanner({ type: "error", message: "Please select both a student and a book." });
      return;
    }
    if (selectedBook.availableCopies < 1) {
      setIssueBanner({ type: "error", message: "No copies available for this book." });
      return;
    }
    setIssueLoading(true);
    setIssueBanner(null);
    try {
      const res = await fetch("/api/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookId: selectedBook._id, studentId: selectedStudent._id, dueDate }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Failed to issue book");
      }
      setIssueBanner({ type: "success", message: `"${selectedBook.title}" issued to ${selectedStudent.name} successfully.` });
      setSelectedStudent(null);
      setSelectedBook(null);
      setStudentSearch("");
      setBookSearch("");
      setDueDate(getDefaultDueDate());
      fetchActiveIssues();
    } catch (e: unknown) {
      setIssueBanner({ type: "error", message: e instanceof Error ? e.message : "Unknown error" });
    } finally {
      setIssueLoading(false);
    }
  }

  async function handleReturn(issueId: string) {
    setReturnLoading(issueId);
    setReturnBanner(null);
    try {
      const res = await fetch(`/api/issues/${issueId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "return" }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Failed to return book");
      }
      setReturnBanner({ type: "success", message: "Book returned successfully." });
      fetchActiveIssues();
    } catch (e: unknown) {
      setReturnBanner({ type: "error", message: e instanceof Error ? e.message : "Unknown error" });
    } finally {
      setReturnLoading(null);
    }
  }

  if (role === "student") {
    return (
      <div style={{ padding: "80px 32px", textAlign: "center", color: "#9B8B7A" }}>
        <AlertCircle size={40} style={{ margin: "0 auto 12px", opacity: 0.4 }} />
        <p style={{ fontSize: 16 }}>You do not have permission to access this page.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "40px 32px", maxWidth: 1100, margin: "0 auto" }}>
      <div className="animate-fade-in" style={{ marginBottom: 36 }}>
        <h1 style={{ fontFamily: "var(--font-family-serif)", fontSize: 32, fontWeight: 700, color: "#1A1208", margin: 0 }}>
          Issue &amp; Return
        </h1>
        <p style={{ color: "#9B8B7A", marginTop: 6, fontSize: 14 }}>Manage book checkouts and returns.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 24, alignItems: "start" }}>
        {/* Issue a Book */}
        <div
          className="animate-fade-in stagger-1"
          style={{ background: "#FDFBF6", border: "1px solid #E3D9C8", borderRadius: 14, padding: "28px 24px" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: "#C8922A18", display: "flex", alignItems: "center", justifyContent: "center", color: "#C8922A" }}>
              <BookOpen size={18} />
            </div>
            <h2 style={{ fontFamily: "var(--font-family-serif)", fontSize: 18, fontWeight: 700, color: "#1A1208", margin: 0 }}>
              Issue a Book
            </h2>
          </div>

          {issueBanner && (
            <Banner type={issueBanner.type} message={issueBanner.message} onClose={() => setIssueBanner(null)} />
          )}

          <form onSubmit={handleIssue}>
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: "block", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "#9B8B7A", marginBottom: 8 }}>
                Student <span style={{ color: "#C8922A" }}>*</span>
              </label>
              {selectedStudent ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "#3D7A5810", border: "1px solid #3D7A5833", borderRadius: 8 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: "#1A1208" }}>{selectedStudent.name}</div>
                    <div style={{ fontSize: 12, color: "#9B8B7A" }}>{selectedStudent.email}</div>
                  </div>
                  <button type="button" onClick={() => { setSelectedStudent(null); setStudentSearch(""); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#9B8B7A", fontSize: 18, padding: 0 }}>×</button>
                </div>
              ) : (
                <SearchDropdown
                  placeholder="Search by name or email…"
                  value={studentSearch}
                  onChange={setStudentSearch}
                  results={studentResults.map((u) => ({ id: u._id, primary: u.name, secondary: u.email }))}
                  onSelect={(item) => {
                    const u = studentResults.find((x) => x._id === item.id);
                    if (u) setSelectedStudent(u);
                    setStudentSearch("");
                  }}
                  icon={<User size={15} />}
                  loading={studentLoading}
                />
              )}
            </div>

            <div style={{ marginBottom: 18 }}>
              <label style={{ display: "block", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "#9B8B7A", marginBottom: 8 }}>
                Book <span style={{ color: "#C8922A" }}>*</span>
              </label>
              {selectedBook ? (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", background: "#3D7A5810", border: "1px solid #3D7A5833", borderRadius: 8 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, color: "#1A1208" }}>{selectedBook.title}</div>
                    <div style={{ fontSize: 12, color: "#9B8B7A" }}>{selectedBook.author} · {selectedBook.availableCopies} avail.</div>
                  </div>
                  <button type="button" onClick={() => { setSelectedBook(null); setBookSearch(""); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#9B8B7A", fontSize: 18, padding: 0 }}>×</button>
                </div>
              ) : (
                <SearchDropdown
                  placeholder="Search by title or ISBN…"
                  value={bookSearch}
                  onChange={setBookSearch}
                  results={bookResults.map((b) => ({
                    id: b._id,
                    primary: b.title,
                    secondary: `${b.author} · ISBN: ${b.isbn || "N/A"}`,
                    meta: (
                      <span style={{ fontSize: 11, fontWeight: 600, padding: "1px 7px", borderRadius: 20, background: b.availableCopies > 0 ? "#3D7A5818" : "#9B404018", color: b.availableCopies > 0 ? "#3D7A58" : "#9B4040" }}>
                        {b.availableCopies}/{b.totalCopies} available
                      </span>
                    ),
                  }))}
                  onSelect={(item) => {
                    const b = bookResults.find((x) => x._id === item.id);
                    if (b) setSelectedBook(b);
                    setBookSearch("");
                  }}
                  icon={<Search size={15} />}
                  loading={bookLoading}
                />
              )}
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: "block", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "#9B8B7A", marginBottom: 8 }}>
                Due Date <span style={{ color: "#C8922A" }}>*</span>
              </label>
              <div style={{ position: "relative" }}>
                <Calendar size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9B8B7A", pointerEvents: "none" }} />
                <input
                  type="date"
                  value={dueDate}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setDueDate(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px 10px 38px",
                    background: "#FDFBF6",
                    border: "1px solid #E3D9C8",
                    borderRadius: 8,
                    fontSize: 14,
                    color: "#1A1208",
                    fontFamily: "var(--font-family-sans)",
                    outline: "none",
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={issueLoading || !selectedStudent || !selectedBook}
              style={{
                width: "100%",
                padding: "12px",
                background: issueLoading || !selectedStudent || !selectedBook ? "#C8B89A" : "#C8922A",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                fontFamily: "var(--font-family-sans)",
                fontWeight: 600,
                fontSize: 15,
                cursor: issueLoading || !selectedStudent || !selectedBook ? "not-allowed" : "pointer",
                transition: "background 0.15s",
              }}
            >
              {issueLoading ? "Issuing…" : "Issue Book"}
            </button>
          </form>
        </div>

        {/* Return a Book */}
        <div
          className="animate-fade-in stagger-2"
          style={{ background: "#FDFBF6", border: "1px solid #E3D9C8", borderRadius: 14, padding: "28px 24px" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: "#3D7A5818", display: "flex", alignItems: "center", justifyContent: "center", color: "#3D7A58" }}>
              <RotateCcw size={18} />
            </div>
            <h2 style={{ fontFamily: "var(--font-family-serif)", fontSize: 18, fontWeight: 700, color: "#1A1208", margin: 0 }}>
              Return a Book
            </h2>
          </div>

          {returnBanner && (
            <Banner type={returnBanner.type} message={returnBanner.message} onClose={() => setReturnBanner(null)} />
          )}

          {issuesLoading ? (
            <div style={{ textAlign: "center", padding: "32px 0", color: "#9B8B7A", fontSize: 14 }}>Loading active issues…</div>
          ) : issues.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#9B8B7A" }}>
              <CheckCircle size={32} style={{ margin: "0 auto 10px", opacity: 0.35 }} />
              <p style={{ fontSize: 14 }}>No active issues found.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 480, overflowY: "auto" }}>
              {issues.map((issue) => {
                const overdue = isOverdue(issue.dueDate);
                return (
                  <div
                    key={issue._id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px 14px",
                      background: overdue ? "#9B404008" : "#F7F2E8",
                      border: `1px solid ${overdue ? "#9B404033" : "#E3D9C8"}`,
                      borderRadius: 10,
                      gap: 10,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: "#1A1208", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {issue.book.title}
                      </div>
                      <div style={{ fontSize: 12, color: "#9B8B7A", marginTop: 2 }}>{issue.student.name}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                        <span style={{ fontSize: 11, color: "#9B8B7A" }}>Due: {formatDate(issue.dueDate)}</span>
                        {overdue && (
                          <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 20, background: "#9B4040", color: "#fff" }}>
                            OVERDUE
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleReturn(issue._id)}
                      disabled={returnLoading === issue._id}
                      style={{
                        padding: "7px 14px",
                        background: returnLoading === issue._id ? "#C8B89A" : "#3D7A58",
                        color: "#fff",
                        border: "none",
                        borderRadius: 7,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: returnLoading === issue._id ? "not-allowed" : "pointer",
                        fontFamily: "var(--font-family-sans)",
                        flexShrink: 0,
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={(e) => { if (returnLoading !== issue._id) e.currentTarget.style.background = "#2D5E42"; }}
                      onMouseLeave={(e) => { if (returnLoading !== issue._id) e.currentTarget.style.background = "#3D7A58"; }}
                    >
                      {returnLoading === issue._id ? "…" : "Return"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
