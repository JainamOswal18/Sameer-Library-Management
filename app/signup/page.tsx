"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const ROLES = [
  {
    value: "student",
    label: "Student",
    description: "Browse the catalog and track your borrowed books.",
    accent: "#4169B8",
  },
  {
    value: "librarian",
    label: "Librarian",
    description: "Manage the catalog, issue and return books.",
    accent: "#3D7A58",
  },
  {
    value: "admin",
    label: "Administrator",
    description: "Full access including user management.",
    accent: "#C8922A",
  },
] as const;

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"student" | "librarian" | "admin">("student");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Sign up failed");
      setLoading(false);
      return;
    }

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Account created but sign in failed. Please log in.");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex" style={{ background: "#0D1117" }}>
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-16 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 60px, #C8922A 60px, #C8922A 61px), repeating-linear-gradient(90deg, transparent, transparent 60px, #C8922A 60px, #C8922A 61px)`,
          }}
        />
        <div className="relative">
          <Link href="/login" className="flex items-center gap-3">
            <div
              className="w-9 h-9 flex items-center justify-center"
              style={{ background: "#C8922A" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="#0D1117" strokeWidth="2" strokeLinecap="round"/>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke="#0D1117" strokeWidth="2"/>
              </svg>
            </div>
            <span className="font-serif text-lg font-bold" style={{ color: "#F7F2E8" }}>
              Meridian
            </span>
          </Link>
        </div>

        <div className="relative">
          <p
            className="font-serif text-6xl font-bold leading-tight mb-6"
            style={{ color: "#F7F2E8" }}
          >
            Begin your<br />
            <span style={{ color: "#C8922A" }}>chapter</span> with<br />
            us today.
          </p>
          <p className="text-base leading-relaxed max-w-md" style={{ color: "#9B8B7A" }}>
            Choose the role that fits how you&apos;ll use the library. You can be a student
            tracking borrows, a librarian managing the floor, or an administrator with full reach.
          </p>
        </div>

        <div className="relative">
          <p className="text-xs uppercase tracking-widest" style={{ color: "#4A5568" }}>
            — Three doors. One library.
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div
        className="w-full lg:w-1/2 flex items-center justify-center p-8 overflow-y-auto"
        style={{ background: "#F7F2E8" }}
      >
        <div className="w-full max-w-md animate-fade-in py-10">
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div
              className="w-9 h-9 flex items-center justify-center"
              style={{ background: "#C8922A" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="#F7F2E8" strokeWidth="2" strokeLinecap="round"/>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke="#F7F2E8" strokeWidth="2"/>
              </svg>
            </div>
            <span className="font-serif text-lg font-bold" style={{ color: "#1A1208" }}>
              Meridian
            </span>
          </div>

          <h1 className="font-serif text-3xl font-bold mb-1" style={{ color: "#1A1208" }}>
            Create an account
          </h1>
          <p className="text-sm mb-8" style={{ color: "#9B8B7A" }}>
            Pick a role and you&apos;ll be signed in automatically.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-medium uppercase tracking-wider mb-2" style={{ color: "#6B5D4E" }}>
                Full name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Ada Lovelace"
                className="w-full px-4 py-3 text-sm border transition-colors"
                style={{ background: "#FDFBF6", borderColor: "#E3D9C8", color: "#1A1208", outline: "none" }}
                onFocus={(e) => (e.target.style.borderColor = "#C8922A")}
                onBlur={(e) => (e.target.style.borderColor = "#E3D9C8")}
              />
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider mb-2" style={{ color: "#6B5D4E" }}>
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full px-4 py-3 text-sm border transition-colors"
                style={{ background: "#FDFBF6", borderColor: "#E3D9C8", color: "#1A1208", outline: "none" }}
                onFocus={(e) => (e.target.style.borderColor = "#C8922A")}
                onBlur={(e) => (e.target.style.borderColor = "#E3D9C8")}
              />
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider mb-2" style={{ color: "#6B5D4E" }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="At least 6 characters"
                className="w-full px-4 py-3 text-sm border transition-colors"
                style={{ background: "#FDFBF6", borderColor: "#E3D9C8", color: "#1A1208", outline: "none" }}
                onFocus={(e) => (e.target.style.borderColor = "#C8922A")}
                onBlur={(e) => (e.target.style.borderColor = "#E3D9C8")}
              />
            </div>

            <div>
              <label className="block text-xs font-medium uppercase tracking-wider mb-3" style={{ color: "#6B5D4E" }}>
                Choose your role
              </label>
              <div className="space-y-2">
                {ROLES.map((r) => {
                  const selected = role === r.value;
                  return (
                    <button
                      type="button"
                      key={r.value}
                      onClick={() => setRole(r.value)}
                      className="w-full text-left p-4 border transition-all"
                      style={{
                        background: selected ? "#FDFBF6" : "transparent",
                        borderColor: selected ? r.accent : "#E3D9C8",
                        boxShadow: selected ? `inset 3px 0 0 ${r.accent}` : "none",
                      }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className="font-serif font-bold text-base"
                          style={{ color: selected ? r.accent : "#1A1208" }}
                        >
                          {r.label}
                        </span>
                        <div
                          className="w-4 h-4 rounded-full border-2 flex items-center justify-center"
                          style={{ borderColor: selected ? r.accent : "#C8B89A" }}
                        >
                          {selected && (
                            <div className="w-2 h-2 rounded-full" style={{ background: r.accent }} />
                          )}
                        </div>
                      </div>
                      <p className="text-xs" style={{ color: "#6B5D4E" }}>
                        {r.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {error && (
              <p
                className="text-sm px-4 py-3 border"
                style={{ color: "#9B4040", background: "#FDF6F6", borderColor: "#E8C8C8" }}
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 text-sm font-semibold uppercase tracking-wider transition-all"
              style={{
                background: loading ? "#E8B86D" : "#C8922A",
                color: "#FDFBF6",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Creating account…" : "Create account & sign in"}
            </button>
          </form>

          <p className="mt-8 pt-6 border-t text-sm text-center" style={{ borderColor: "#E3D9C8", color: "#6B5D4E" }}>
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium"
              style={{ color: "#C8922A", textDecoration: "underline", textUnderlineOffset: "3px" }}
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
