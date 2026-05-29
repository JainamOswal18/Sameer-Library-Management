"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Plus, Edit2, Trash2, X, Users, Search, AlertCircle, CheckCircle, ShieldAlert } from "lucide-react";

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

interface UserFormData {
  name: string;
  email: string;
  password: string;
  role: string;
}

const emptyForm: UserFormData = { name: "", email: "", password: "", role: "student" };

const ROLES = ["admin", "librarian", "student"];

const roleBadge: Record<string, React.CSSProperties> = {
  admin: { background: "#C8922A22", color: "#C8922A", border: "1px solid #C8922A55" },
  librarian: { background: "#3D7A5822", color: "#3D7A58", border: "1px solid #3D7A5855" },
  student: { background: "#2B4D8A22", color: "#2B4D8A", border: "1px solid #2B4D8A55" },
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

function Modal({ open, onClose, title, children }: ModalProps) {
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
          maxWidth: 460,
          boxShadow: "0 20px 60px rgba(13,17,23,0.3)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <h2 style={{ fontFamily: "var(--font-family-serif)", fontSize: 20, fontWeight: 700, color: "#1A1208", margin: 0 }}>
            {title}
          </h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9B8B7A", padding: 4, display: "flex" }}>
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
  value: string;
  onChange: (val: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  as?: "input" | "select";
  options?: string[];
  hint?: string;
}

function FormField({ label, value, onChange, type = "text", placeholder, required, as = "input", options, hint }: FormFieldProps) {
  const baseStyle: React.CSSProperties = {
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
        <select style={baseStyle} value={value} onChange={(e) => onChange(e.target.value)}>
          {options?.map((o) => (
            <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>
          ))}
        </select>
      ) : (
        <input
          style={baseStyle}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          autoComplete={type === "password" ? "new-password" : undefined}
        />
      )}
      {hint && <div style={{ fontSize: 11, color: "#9B8B7A", marginTop: 4 }}>{hint}</div>}
    </div>
  );
}

export default function UsersPage() {
  const { data: session } = useSession();
  const role = session?.user?.role as string | undefined;
  const currentUserId = session?.user?.id as string | undefined;

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [addOpen, setAddOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);

  const [formData, setFormData] = useState<UserFormData>(emptyForm);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const fetchUsers = useCallback(async (q: string) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ search: q });
      const res = await fetch(`/api/users?${params}`);
      if (!res.ok) throw new Error("Failed to load users");
      const data = await res.json();
      setUsers(data.users ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (role !== "admin") return;
    const t = setTimeout(() => fetchUsers(search), 300);
    return () => clearTimeout(t);
  }, [role, search, fetchUsers]);

  function openAdd() {
    setFormData(emptyForm);
    setFormError("");
    setAddOpen(true);
  }

  function openEdit(u: User) {
    setFormData({ name: u.name, email: u.email, password: "", role: u.role });
    setFormError("");
    setEditUser(u);
  }

  async function handleAddSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.password) { setFormError("Password is required for new users."); return; }
    setFormLoading(true);
    setFormError("");
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Failed to add user");
      }
      setAddOpen(false);
      setSuccessMsg("User created successfully.");
      setTimeout(() => setSuccessMsg(""), 3500);
      fetchUsers(search);
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setFormLoading(false);
    }
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editUser) return;
    setFormLoading(true);
    setFormError("");
    try {
      const payload: Partial<UserFormData> = { name: formData.name, email: formData.email, role: formData.role };
      if (formData.password) payload.password = formData.password;
      const res = await fetch(`/api/users/${editUser._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Failed to update user");
      }
      setEditUser(null);
      setSuccessMsg("User updated successfully.");
      setTimeout(() => setSuccessMsg(""), 3500);
      fetchUsers(search);
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setFormLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleteUser) return;
    if (deleteUser._id === currentUserId) {
      setFormError("You cannot delete your own account.");
      return;
    }
    setFormLoading(true);
    setFormError("");
    try {
      const res = await fetch(`/api/users/${deleteUser._id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? "Failed to delete user");
      }
      setDeleteUser(null);
      setSuccessMsg("User deleted.");
      setTimeout(() => setSuccessMsg(""), 3500);
      fetchUsers(search);
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setFormLoading(false);
    }
  }

  // Access denied
  if (role !== "admin") {
    return (
      <div
        style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: 16, color: "#9B8B7A", textAlign: "center", padding: 32 }}
      >
        <div style={{ width: 56, height: 56, borderRadius: 14, background: "#9B404012", display: "flex", alignItems: "center", justifyContent: "center", color: "#9B4040" }}>
          <ShieldAlert size={28} />
        </div>
        <h2 style={{ fontFamily: "var(--font-family-serif)", fontSize: 22, fontWeight: 700, color: "#1A1208", margin: 0 }}>
          Access denied
        </h2>
        <p style={{ fontSize: 15, maxWidth: 340 }}>
          This page is restricted to administrators only. Contact an admin if you need access.
        </p>
      </div>
    );
  }

  const userForm = (onSubmit: (e: React.FormEvent) => Promise<void>, isEdit = false) => (
    <form onSubmit={onSubmit}>
      <FormField label="Full Name" value={formData.name} onChange={(v) => setFormData((p) => ({ ...p, name: v }))} placeholder="Jane Doe" required />
      <FormField label="Email" value={formData.email} onChange={(v) => setFormData((p) => ({ ...p, email: v }))} type="email" placeholder="jane@example.com" required />
      <FormField
        label={isEdit ? "Password" : "Password"}
        value={formData.password}
        onChange={(v) => setFormData((p) => ({ ...p, password: v }))}
        type="password"
        placeholder={isEdit ? "Leave blank to keep current" : "Min. 8 characters"}
        required={!isEdit}
        hint={isEdit ? "Leave blank to keep the existing password." : undefined}
      />
      <FormField label="Role" value={formData.role} onChange={(v) => setFormData((p) => ({ ...p, role: v }))} as="select" options={ROLES} required />
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
          marginTop: 4,
        }}
      >
        {formLoading ? "Saving…" : isEdit ? "Update User" : "Create User"}
      </button>
    </form>
  );

  return (
    <div style={{ padding: "40px 32px", maxWidth: 1100, margin: "0 auto" }}>
      {/* Header */}
      <div className="animate-fade-in" style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-family-serif)", fontSize: 32, fontWeight: 700, color: "#1A1208", margin: 0 }}>
            User Management
          </h1>
          <p style={{ color: "#9B8B7A", marginTop: 6, fontSize: 14 }}>{users.length} user{users.length !== 1 ? "s" : ""} registered</p>
        </div>
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
          <Plus size={16} /> Add User
        </button>
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

      {/* Search */}
      <div className="animate-fade-in stagger-1" style={{ position: "relative", maxWidth: 380, marginBottom: 24 }}>
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
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
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
          <div style={{ padding: "48px", textAlign: "center", color: "#9B8B7A", fontSize: 14 }}>Loading users…</div>
        ) : users.length === 0 ? (
          <div style={{ padding: "64px", textAlign: "center", color: "#9B8B7A" }}>
            <Users size={36} style={{ margin: "0 auto 12px", opacity: 0.35 }} />
            <p style={{ fontSize: 15 }}>No users found.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid #E3D9C8" }}>
                  {["Name", "Email", "Role", "Created", "Actions"].map((col) => (
                    <th
                      key={col}
                      style={{
                        padding: "14px 16px",
                        textAlign: col === "Actions" ? "right" : "left",
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
                {users.map((user, i) => {
                  const staggerClass = `stagger-${Math.min(i + 1, 6)}`;
                  const isEven = i % 2 === 1;
                  const isSelf = user._id === currentUserId;
                  return (
                    <tr
                      key={user._id}
                      className={`animate-fade-in ${staggerClass}`}
                      style={{
                        background: isEven ? "#F7F2E8" : "#FDFBF6",
                        borderBottom: "1px solid #EDE5D4",
                        transition: "background 0.12s",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = "#F0E8D8"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = isEven ? "#F7F2E8" : "#FDFBF6"; }}
                    >
                      {/* Name */}
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ fontWeight: 600, color: "#1A1208", display: "flex", alignItems: "center", gap: 6 }}>
                          {user.name}
                          {isSelf && (
                            <span style={{ fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 20, background: "#C8922A22", color: "#C8922A", border: "1px solid #C8922A55" }}>
                              YOU
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Email */}
                      <td style={{ padding: "14px 16px", color: "#6B5D4E", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {user.email}
                      </td>

                      {/* Role badge */}
                      <td style={{ padding: "14px 16px" }}>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            letterSpacing: "0.05em",
                            textTransform: "capitalize",
                            padding: "3px 10px",
                            borderRadius: 20,
                            ...(roleBadge[user.role] ?? roleBadge.student),
                          }}
                        >
                          {user.role}
                        </span>
                      </td>

                      {/* Created */}
                      <td style={{ padding: "14px 16px", color: "#9B8B7A", whiteSpace: "nowrap" }}>
                        {formatDate(user.createdAt)}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: "14px 16px", textAlign: "right", whiteSpace: "nowrap" }}>
                        <button
                          onClick={() => openEdit(user)}
                          title="Edit user"
                          style={{ background: "none", border: "none", cursor: "pointer", color: "#9B8B7A", padding: "6px 8px", borderRadius: 6, display: "inline-flex", alignItems: "center", marginRight: 4, transition: "color 0.12s, background 0.12s" }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = "#1A1208"; e.currentTarget.style.background = "#E3D9C8"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = "#9B8B7A"; e.currentTarget.style.background = "none"; }}
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => { setFormError(""); setDeleteUser(user); }}
                          title={isSelf ? "Cannot delete yourself" : "Delete user"}
                          disabled={isSelf}
                          style={{ background: "none", border: "none", cursor: isSelf ? "not-allowed" : "pointer", color: isSelf ? "#C8B89A" : "#9B4040", padding: "6px 8px", borderRadius: 6, display: "inline-flex", alignItems: "center", opacity: isSelf ? 0.4 : 1, transition: "background 0.12s" }}
                          onMouseEnter={(e) => { if (!isSelf) e.currentTarget.style.background = "#9B404018"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.background = "none"; }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="Add New User">
        {userForm(handleAddSubmit, false)}
      </Modal>

      {/* Edit User Modal */}
      <Modal open={!!editUser} onClose={() => setEditUser(null)} title="Edit User">
        {userForm(handleEditSubmit, true)}
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal open={!!deleteUser} onClose={() => { setDeleteUser(null); setFormError(""); }} title="Delete User">
        <p style={{ color: "#6B5D4E", fontSize: 15, marginBottom: 20, lineHeight: 1.6 }}>
          Are you sure you want to permanently delete{" "}
          <strong style={{ color: "#1A1208" }}>{deleteUser?.name}</strong>? This action cannot be undone.
        </p>
        {deleteUser?.role === "admin" && (
          <div style={{ background: "#C8922A12", border: "1px solid #C8922A33", borderRadius: 8, padding: "10px 14px", color: "#9B6F1F", fontSize: 13, marginBottom: 16, display: "flex", gap: 6, alignItems: "center" }}>
            <AlertCircle size={14} /> You are about to delete an admin account.
          </div>
        )}
        {formError && (
          <div style={{ background: "#9B404012", border: "1px solid #9B404033", borderRadius: 8, padding: "10px 14px", color: "#9B4040", fontSize: 13, marginBottom: 16, display: "flex", gap: 6, alignItems: "center" }}>
            <AlertCircle size={14} /> {formError}
          </div>
        )}
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => { setDeleteUser(null); setFormError(""); }}
            style={{ flex: 1, padding: "10px", background: "#F7F2E8", border: "1px solid #E3D9C8", borderRadius: 8, fontSize: 14, cursor: "pointer", color: "#6B5D4E", fontFamily: "var(--font-family-sans)" }}
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={formLoading}
            style={{ flex: 1, padding: "10px", background: "#9B4040", color: "#fff", border: "none", borderRadius: 8, fontSize: 14, cursor: "pointer", fontWeight: 600, fontFamily: "var(--font-family-sans)" }}
          >
            {formLoading ? "Deleting…" : "Delete User"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
