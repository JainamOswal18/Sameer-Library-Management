"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { Search, Plus, Edit2, Trash2, X, ChevronLeft, ChevronRight, BookOpen, AlertCircle, CheckCircle } from "lucide-react";

interface Book {
  _id: string;
  title: string;
  author: string;
  genre: string;
  isbn: string;
  totalCopies: number;
  availableCopies: number;
}

function genreColor(genre: string): string {
  const map: Record<string, string> = {
    fiction: "#7B4F2E",
    "non-fiction": "#2F5A4A",
    science: "#2B4D8A",
    history: "#6B5A2E",
    biography: "#4A6B35",
    fantasy: "#5A3580",
    mystery: "#2B2B50",
    romance: "#8B3060",
    technology: "#1A3A5C",
  };
  return map[genre?.toLowerCase()] ?? "#C8922A";
}

const GENRES = ["fiction", "non-fiction", "science", "history", "biography", "fantasy", "mystery", "romance", "technology"];

interface BookFormData {
  title: string;
  author: string;
  genre: string;
  isbn: string;
  totalCopies: number;
}

const emptyForm: BookFormData = { title: "", author: "", genre: "", isbn: "", totalCopies: 1 };

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title: string;
}

function Modal({ open, onClose, children, title }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="modal-backdrop"
      style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="animate-scale-in"
        style={{
          background: "#FDFBF6",
          border: "1px solid #E3D9C8",
          borderRadius: 14,
          padding: "32px 28px",
          width: "100%",
          maxWidth: 480,
          boxShadow: "0 20px 60px rgba(13,17,23,0.3)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <h2 style={{ fontFamily: "var(--font-family-serif)", fontSize: 20, fontWeight: 700, color: "#1A1208", margin: 0 }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#9B8B7A", padding: 4, display: "flex" }}
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

interface FormFieldProps {
  label: string;
  value: string | number;
  onChange: (val: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  as?: "input" | "select";
  options?: string[];
}

function FormField({ label, value, onChange, type = "text", placeholder, required, as = "input", options }: FormFieldProps) {
  const commonStyle: React.CSSProperties = {
    width: "100%",
    background: "transparent",
    border: "none",
    borderBottom: "1.5px solid #C8B89A",
    padding: "6px 0",
    fontSize: 15,
    color: "#1A1208",
    fontFamily: "var(--font-family-sans)",
    outline: "none",
  };
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: "block", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "#9B8B7A", marginBottom: 6 }}>
        {label}{required && <span style={{ color: "#C8922A", marginLeft: 2 }}>*</span>}
      </label>
      {as === "select" ? (
        <select style={commonStyle} value={value} onChange={(e) => onChange(e.target.value)} required={required}>
          <option value="">Select genre…</option>
          {options?.map((o) => (
            <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>
          ))}
        </select>
      ) : (
        <input
          style={commonStyle}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          min={type === "number" ? 1 : undefined}
        />
      )}
    </div>
  );
}

export default function BooksPage() {
  const { data: session } = useSession();
  const role = session?.user?.role as string | undefined;
  const canManage = role === "admin" || role === "librarian";

  const [books, setBooks] = useState<Book[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [genreFilter, setGenreFilter] = useState("");
  const [page, setPage] = useState(1);
  const limit = 12;

  const [addOpen, setAddOpen] = useState(false);
  const [editBook, setEditBook] = useState<Book | null>(null);
  const [deleteBook, setDeleteBook] = useState<Book | null>(null);
  const [formData, setFormData] = useState<BookFormData>(emptyForm);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchBooks = useCallback(async (s: string, g: string, p: number) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ search: s, genre: g, page: String(p), limit: String(limit) });
      const res = await fetch(`/api/books?${params}`);
      if (!res.ok) throw new Error("Failed to load books");
      const data = await res.json();
      setBooks(data.books ?? []);
      setTotal(data.total ?? 0);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      fetchBooks(search, genreFilter, 1);
    }, 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search, genreFilter, fetchBooks]);

  useEffect(() => {
    fetchBooks(search, genreFilter, page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  function openAdd() {
    setFormData(emptyForm);
    setFormError("");
    setAddOpen(true);
  }

  function openEdit(b: Book) {
    setFormData({ title: b.title, author: b.author, genre: b.genre, isbn: b.isbn, totalCopies: b.totalCopies });
    setFormError("");
    setEditBook(b);
  }

  async function handleAddSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormLoading(true);
    setFormError("");
    try {
      const res = await fetch("/api/books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Failed to add book");
      }
      setAddOpen(false);
      setSuccessMsg("Book added successfully.");
      setTimeout(() => setSuccessMsg(""), 3000);
      fetchBooks(search, genreFilter, page);
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setFormLoading(false);
    }
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editBook) return;
    setFormLoading(true);
    setFormError("");
    try {
      const res = await fetch(`/api/books/${editBook._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Failed to update book");
      }
      setEditBook(null);
      setSuccessMsg("Book updated successfully.");
      setTimeout(() => setSuccessMsg(""), 3000);
      fetchBooks(search, genreFilter, page);
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleteBook) return;
    setFormLoading(true);
    try {
      const res = await fetch(`/api/books/${deleteBook._id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Failed to delete book");
      }
      setDeleteBook(null);
      setSuccessMsg("Book deleted.");
      setTimeout(() => setSuccessMsg(""), 3000);
      fetchBooks(search, genreFilter, page);
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setFormLoading(false);
    }
  }

  const totalPages = Math.ceil(total / limit);

  const bookForm = (onSubmit: (e: React.FormEvent) => Promise<void>, isEdit = false) => (
    <form onSubmit={onSubmit}>
      <FormField label="Title" value={formData.title} onChange={(v) => setFormData((p) => ({ ...p, title: v }))} placeholder="Book title" required />
      <FormField label="Author" value={formData.author} onChange={(v) => setFormData((p) => ({ ...p, author: v }))} placeholder="Author name" required />
      <FormField label="Genre" value={formData.genre} onChange={(v) => setFormData((p) => ({ ...p, genre: v }))} as="select" options={GENRES} required />
      <FormField label="ISBN" value={formData.isbn} onChange={(v) => setFormData((p) => ({ ...p, isbn: v }))} placeholder="978-..." />
      <FormField label="Total Copies" value={formData.totalCopies} onChange={(v) => setFormData((p) => ({ ...p, totalCopies: parseInt(v) || 1 }))} type="number" required />
      {formError && (
        <div style={{ background: "#9B404012", border: "1px solid #9B404033", borderRadius: 8, padding: "10px 14px", color: "#9B4040", fontSize: 13, marginBottom: 16, display: "flex", gap: 6, alignItems: "center" }}>
          <AlertCircle size={14} /> {formError}
        </div>
      )}
      <button
        type="submit"
        disabled={formLoading}
        style={{
          width: "100%",
          padding: "12px",
          background: formLoading ? "#C8B89A" : "#C8922A",
          color: "#fff",
          border: "none",
          borderRadius: 8,
          fontFamily: "var(--font-family-sans)",
          fontWeight: 600,
          fontSize: 15,
          cursor: formLoading ? "not-allowed" : "pointer",
          transition: "background 0.15s",
          marginTop: 4,
        }}
      >
        {formLoading ? "Saving…" : isEdit ? "Update Book" : "Add Book"}
      </button>
    </form>
  );

  return (
    <div style={{ padding: "40px 32px", maxWidth: 1200, margin: "0 auto" }}>
      {/* Header */}
      <div className="animate-fade-in" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-family-serif)", fontSize: 32, fontWeight: 700, color: "#1A1208", margin: 0 }}>
            Book Catalog
          </h1>
          <p style={{ color: "#9B8B7A", marginTop: 6, fontSize: 14 }}>{total} book{total !== 1 ? "s" : ""} in the collection</p>
        </div>
        {canManage && (
          <button
            onClick={openAdd}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 20px",
              background: "#C8922A",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
              fontFamily: "var(--font-family-sans)",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#9B6F1F"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#C8922A"; }}
          >
            <Plus size={16} /> Add Book
          </button>
        )}
      </div>

      {/* Success banner */}
      {successMsg && (
        <div
          className="animate-fade-in"
          style={{ background: "#3D7A5812", border: "1px solid #3D7A5833", borderRadius: 8, padding: "12px 16px", color: "#3D7A58", fontSize: 14, marginBottom: 20, display: "flex", gap: 8, alignItems: "center" }}
        >
          <CheckCircle size={16} /> {successMsg}
        </div>
      )}

      {/* Filters */}
      <div className="animate-fade-in stagger-1" style={{ display: "flex", gap: 12, marginBottom: 28, flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: "1 1 220px", minWidth: 180 }}>
          <Search size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#9B8B7A", pointerEvents: "none" }} />
          <input
            style={{
              width: "100%",
              paddingLeft: 36,
              paddingRight: 12,
              paddingTop: 10,
              paddingBottom: 10,
              background: "#FDFBF6",
              border: "1px solid #E3D9C8",
              borderRadius: 8,
              fontSize: 14,
              color: "#1A1208",
              fontFamily: "var(--font-family-sans)",
              outline: "none",
            }}
            placeholder="Search title, author, ISBN…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          style={{
            padding: "10px 14px",
            background: "#FDFBF6",
            border: "1px solid #E3D9C8",
            borderRadius: 8,
            fontSize: 14,
            color: genreFilter ? "#1A1208" : "#9B8B7A",
            fontFamily: "var(--font-family-sans)",
            outline: "none",
            minWidth: 150,
          }}
          value={genreFilter}
          onChange={(e) => { setGenreFilter(e.target.value); setPage(1); }}
        >
          <option value="">All genres</option>
          {GENRES.map((g) => <option key={g} value={g}>{g.charAt(0).toUpperCase() + g.slice(1)}</option>)}
        </select>
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: "#9B404012", border: "1px solid #9B404033", borderRadius: 8, padding: "12px 16px", color: "#9B4040", fontSize: 14, marginBottom: 20, display: "flex", gap: 8, alignItems: "center" }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Books grid */}
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{ background: "#FDFBF6", border: "1px solid #E3D9C8", borderRadius: 12, height: 160, opacity: 0.4 }} />
          ))}
        </div>
      ) : books.length === 0 ? (
        <div style={{ textAlign: "center", padding: "64px 0", color: "#9B8B7A" }}>
          <BookOpen size={40} style={{ margin: "0 auto 12px", opacity: 0.4 }} />
          <p style={{ fontSize: 16 }}>No books found.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
          {books.map((book, i) => {
            const available = book.availableCopies > 0;
            const staggerClass = `stagger-${Math.min(i + 1, 6)}`;
            return (
              <div
                key={book._id}
                className={`animate-fade-in ${staggerClass}`}
                style={{
                  background: "#FDFBF6",
                  border: "1px solid #E3D9C8",
                  borderRadius: 12,
                  overflow: "hidden",
                  display: "flex",
                  transition: "box-shadow 0.18s, transform 0.18s",
                  position: "relative",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = "0 4px 20px rgba(13,17,23,0.08)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                {/* Spine */}
                <div style={{ width: 5, background: genreColor(book.genre), flexShrink: 0 }} />
                <div style={{ padding: "18px 16px", flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
                    <h3
                      style={{
                        fontFamily: "var(--font-family-serif)",
                        fontWeight: 700,
                        fontSize: 15,
                        color: "#1A1208",
                        margin: 0,
                        lineHeight: 1.3,
                        overflow: "hidden",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {book.title}
                    </h3>
                    {canManage && (
                      <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                        <button
                          onClick={() => openEdit(book)}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "#9B8B7A", padding: 4, display: "flex", borderRadius: 6 }}
                          title="Edit book"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => { setFormError(""); setDeleteBook(book); }}
                          style={{ background: "none", border: "none", cursor: "pointer", color: "#9B4040", padding: 4, display: "flex", borderRadius: 6 }}
                          title="Delete book"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                  <div style={{ fontSize: 13, color: "#6B5D4E", marginBottom: 10 }}>{book.author}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        letterSpacing: "0.04em",
                        textTransform: "capitalize",
                        padding: "2px 8px",
                        borderRadius: 20,
                        background: `${genreColor(book.genre)}18`,
                        color: genreColor(book.genre),
                        border: `1px solid ${genreColor(book.genre)}33`,
                      }}
                    >
                      {book.genre}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        padding: "2px 8px",
                        borderRadius: 20,
                        background: available ? "#3D7A5818" : "#9B404018",
                        color: available ? "#3D7A58" : "#9B4040",
                        border: `1px solid ${available ? "#3D7A5833" : "#9B404033"}`,
                      }}
                    >
                      {book.availableCopies}/{book.totalCopies} avail.
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginTop: 32 }}>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "8px 14px",
              background: page === 1 ? "#F7F2E8" : "#FDFBF6",
              border: "1px solid #E3D9C8",
              borderRadius: 8,
              fontSize: 14,
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
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "8px 14px",
              background: page === totalPages ? "#F7F2E8" : "#FDFBF6",
              border: "1px solid #E3D9C8",
              borderRadius: 8,
              fontSize: 14,
              color: page === totalPages ? "#C8B89A" : "#1A1208",
              cursor: page === totalPages ? "not-allowed" : "pointer",
            }}
          >
            Next <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Add Book Modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add New Book">
        {bookForm(handleAddSubmit, false)}
      </Modal>

      {/* Edit Book Modal */}
      <Modal open={!!editBook} onClose={() => setEditBook(null)} title="Edit Book">
        {bookForm(handleEditSubmit, true)}
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal open={!!deleteBook} onClose={() => setDeleteBook(null)} title="Delete Book">
        <p style={{ color: "#6B5D4E", fontSize: 15, marginBottom: 24, lineHeight: 1.6 }}>
          Are you sure you want to delete <strong style={{ color: "#1A1208" }}>{deleteBook?.title}</strong>? This action cannot be undone.
        </p>
        {formError && (
          <div style={{ background: "#9B404012", border: "1px solid #9B404033", borderRadius: 8, padding: "10px 14px", color: "#9B4040", fontSize: 13, marginBottom: 16 }}>
            {formError}
          </div>
        )}
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => setDeleteBook(null)}
            style={{ flex: 1, padding: "10px", background: "#F7F2E8", border: "1px solid #E3D9C8", borderRadius: 8, fontSize: 14, cursor: "pointer", color: "#6B5D4E", fontFamily: "var(--font-family-sans)" }}
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={formLoading}
            style={{ flex: 1, padding: "10px", background: "#9B4040", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, cursor: "pointer", fontWeight: 600, fontFamily: "var(--font-family-sans)" }}
          >
            {formLoading ? "Deleting…" : "Delete"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
