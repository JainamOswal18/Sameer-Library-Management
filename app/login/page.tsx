"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password");
    } else {
      router.push("/");
      router.refresh();
    }
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
          <div className="flex items-center gap-3">
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
          </div>
        </div>

        <div className="relative">
          <p
            className="font-serif text-6xl font-bold leading-tight mb-6"
            style={{ color: "#F7F2E8" }}
          >
            Knowledge<br />
            <span style={{ color: "#C8922A" }}>organized,</span><br />
            access<br />simplified.
          </p>
          <p className="text-base leading-relaxed" style={{ color: "#9B8B7A" }}>
            A modern library management system built for administrators,
            librarians, and students alike.
          </p>
        </div>

        <div className="relative flex items-center gap-8">
          {[
            { label: "Books catalogued", value: "∞" },
            { label: "Roles supported", value: "3" },
            { label: "Built with", value: "Next.js" },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="font-serif text-2xl font-bold" style={{ color: "#C8922A" }}>
                {stat.value}
              </p>
              <p className="text-xs uppercase tracking-widest mt-1" style={{ color: "#6B5D4E" }}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div
        className="w-full lg:w-1/2 flex items-center justify-center p-8"
        style={{ background: "#F7F2E8" }}
      >
        <div className="w-full max-w-sm animate-fade-in">
          {/* Mobile logo */}
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
            Sign in
          </h1>
          <p className="text-sm mb-8" style={{ color: "#9B8B7A" }}>
            Enter your credentials to access the library
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-medium uppercase tracking-wider mb-2"
                style={{ color: "#6B5D4E" }}
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full px-4 py-3 text-sm border transition-colors"
                style={{
                  background: "#FDFBF6",
                  borderColor: "#E3D9C8",
                  color: "#1A1208",
                  outline: "none",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#C8922A")}
                onBlur={(e) => (e.target.style.borderColor = "#E3D9C8")}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-medium uppercase tracking-wider mb-2"
                style={{ color: "#6B5D4E" }}
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-4 py-3 text-sm border transition-colors"
                style={{
                  background: "#FDFBF6",
                  borderColor: "#E3D9C8",
                  color: "#1A1208",
                  outline: "none",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#C8922A")}
                onBlur={(e) => (e.target.style.borderColor = "#E3D9C8")}
              />
            </div>

            {error && (
              <p
                className="text-sm px-4 py-3 border"
                style={{
                  color: "#9B4040",
                  background: "#FDF6F6",
                  borderColor: "#E8C8C8",
                }}
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
              onMouseEnter={(e) => {
                if (!loading) (e.target as HTMLButtonElement).style.background = "#9B6F1F";
              }}
              onMouseLeave={(e) => {
                if (!loading) (e.target as HTMLButtonElement).style.background = "#C8922A";
              }}
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <p className="mt-8 pt-6 border-t text-sm text-center" style={{ borderColor: "#E3D9C8", color: "#6B5D4E" }}>
            New to Meridian?{" "}
            <Link
              href="/signup"
              className="font-medium"
              style={{ color: "#C8922A", textDecoration: "underline", textUnderlineOffset: "3px" }}
            >
              Create an account
            </Link>
          </p>

          <div className="mt-4 text-xs text-center" style={{ color: "#9B8B7A" }}>
            Default admin: <span style={{ color: "#6B5D4E" }}>admin@library.com</span> /{" "}
            <span style={{ color: "#6B5D4E" }}>admin123</span>
          </div>
        </div>
      </div>
    </div>
  );
}
