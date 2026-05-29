"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { BookOpen, BookMarked, Users, AlertCircle, Library, TrendingUp, ArrowRight } from "lucide-react";

interface AdminStats {
  totalBooks: number;
  availableCopies: number;
  activeIssues: number;
  totalIssues: number;
  totalUsers: number;
  students: number;
  librarians: number;
}

interface StudentStats {
  active: number;
  total: number;
  overdue: number;
}

type Stats = AdminStats | StudentStats;

function isAdminStats(s: Stats): s is AdminStats {
  return "totalBooks" in s;
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

const roleBadgeStyle: Record<string, React.CSSProperties> = {
  admin: { background: "#C8922A22", color: "#C8922A", border: "1px solid #C8922A55" },
  librarian: { background: "#3D7A5822", color: "#3D7A58", border: "1px solid #3D7A5855" },
  student: { background: "#2B4D8A22", color: "#2B4D8A", border: "1px solid #2B4D8A55" },
};

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  stagger: number;
  accent?: boolean;
  danger?: boolean;
}

function StatCard({ label, value, icon, stagger, accent, danger }: StatCardProps) {
  const valueColor = danger ? "#9B4040" : "#C8922A";
  return (
    <div
      className={`animate-fade-in stagger-${stagger}`}
      style={{
        background: "#FDFBF6",
        border: "1px solid #E3D9C8",
        borderRadius: 12,
        padding: "28px 24px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: 80,
          height: 80,
          background: accent ? "#C8922A08" : "#1A120805",
          borderRadius: "0 12px 0 80px",
        }}
      />
      <div style={{ color: "#9B8B7A", display: "flex", alignItems: "center", gap: 8 }}>
        {icon}
        <span style={{ fontSize: 13, fontFamily: "var(--font-family-sans)", letterSpacing: "0.04em", textTransform: "uppercase" }}>
          {label}
        </span>
      </div>
      <div
        style={{
          fontSize: 42,
          fontFamily: "var(--font-family-serif)",
          fontWeight: 700,
          color: valueColor,
          lineHeight: 1,
        }}
      >
        {value}
      </div>
    </div>
  );
}

interface QuickAction {
  href: string;
  label: string;
  description: string;
  icon: React.ReactNode;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const role = session?.user?.role as string | undefined;
  const name = session?.user?.name ?? "there";

  useEffect(() => {
    if (!session) return;
    setLoading(true);
    fetch("/api/stats")
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load stats");
        return r.json();
      })
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, [session]);

  const adminQuickActions: QuickAction[] = [
    { href: "/books", label: "Browse Catalog", description: "Search and manage the book collection", icon: <BookOpen size={18} /> },
    { href: "/issue", label: "Issue a Book", description: "Check out books to students", icon: <BookMarked size={18} /> },
    { href: "/records", label: "View Records", description: "Browse all borrowing history", icon: <TrendingUp size={18} /> },
    { href: "/admin/users", label: "Manage Users", description: "Add or edit user accounts", icon: <Users size={18} /> },
  ];

  const librarianQuickActions: QuickAction[] = [
    { href: "/books", label: "Browse Catalog", description: "Search and manage the book collection", icon: <BookOpen size={18} /> },
    { href: "/issue", label: "Issue / Return", description: "Check out or return books", icon: <BookMarked size={18} /> },
    { href: "/records", label: "View Records", description: "Browse all borrowing history", icon: <TrendingUp size={18} /> },
  ];

  const studentQuickActions: QuickAction[] = [
    { href: "/books", label: "Browse Books", description: "Explore the library catalog", icon: <BookOpen size={18} /> },
    { href: "/records", label: "My Borrows", description: "View your borrowing history", icon: <TrendingUp size={18} /> },
  ];

  const quickActions =
    role === "admin" ? adminQuickActions : role === "librarian" ? librarianQuickActions : studentQuickActions;

  return (
    <div style={{ padding: "40px 32px", maxWidth: 1100, margin: "0 auto" }}>
      {/* Welcome header */}
      <div className="animate-fade-in" style={{ marginBottom: 40 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <span
            style={{
              fontSize: 12,
              fontFamily: "var(--font-family-sans)",
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              padding: "3px 10px",
              borderRadius: 20,
              ...(roleBadgeStyle[role ?? "student"] ?? roleBadgeStyle.student),
            }}
          >
            {role ?? "student"}
          </span>
        </div>
        <h1
          style={{
            fontFamily: "var(--font-family-serif)",
            fontSize: "clamp(28px, 4vw, 40px)",
            fontWeight: 700,
            color: "#1A1208",
            margin: 0,
            lineHeight: 1.2,
          }}
        >
          {getGreeting()}, {name}.
        </h1>
        <p style={{ color: "#9B8B7A", marginTop: 8, fontSize: 15 }}>
          Here&apos;s what&apos;s happening in your library today.
        </p>
      </div>

      {/* Stats grid */}
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16, marginBottom: 40 }}>
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                background: "#FDFBF6",
                border: "1px solid #E3D9C8",
                borderRadius: 12,
                padding: 28,
                height: 110,
                opacity: 0.5,
              }}
            />
          ))}
        </div>
      ) : error ? (
        <div
          style={{
            background: "#9B404012",
            border: "1px solid #9B404033",
            borderRadius: 10,
            padding: "14px 18px",
            color: "#9B4040",
            marginBottom: 32,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <AlertCircle size={16} />
          {error}
        </div>
      ) : stats ? (
        isAdminStats(stats) ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: 16,
              marginBottom: 40,
            }}
          >
            <StatCard label="Total Books" value={stats.totalBooks} icon={<Library size={15} />} stagger={1} accent />
            <StatCard label="Available Copies" value={stats.availableCopies} icon={<BookOpen size={15} />} stagger={2} accent />
            <StatCard label="Active Issues" value={stats.activeIssues} icon={<BookMarked size={15} />} stagger={3} />
            <StatCard label="Total Issues" value={stats.totalIssues} icon={<TrendingUp size={15} />} stagger={4} />
            {role === "admin" && (
              <StatCard label="Total Users" value={stats.totalUsers} icon={<Users size={15} />} stagger={5} />
            )}
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: 16,
              marginBottom: 40,
            }}
          >
            <StatCard label="Active Borrows" value={(stats as StudentStats).active} icon={<BookMarked size={15} />} stagger={1} accent />
            <StatCard label="Total Borrowed" value={(stats as StudentStats).total} icon={<BookOpen size={15} />} stagger={2} />
            <StatCard label="Overdue" value={(stats as StudentStats).overdue} icon={<AlertCircle size={15} />} stagger={3} danger />
          </div>
        )
      ) : null}

      {/* Divider */}
      <div style={{ height: 1, background: "#E3D9C8", marginBottom: 32 }} />

      {/* Quick actions */}
      <div>
        <h2
          style={{
            fontFamily: "var(--font-family-serif)",
            fontSize: 20,
            fontWeight: 600,
            color: "#1A1208",
            marginBottom: 16,
            marginTop: 0,
          }}
        >
          Quick actions
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
          {quickActions.map((action, i) => (
            <Link
              key={action.href}
              href={action.href}
              className={`animate-fade-in stagger-${i + 1}`}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: "#FDFBF6",
                border: "1px solid #E3D9C8",
                borderRadius: 10,
                padding: "18px 20px",
                textDecoration: "none",
                color: "#1A1208",
                transition: "border-color 0.18s, box-shadow 0.18s, transform 0.18s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#C8922A";
                e.currentTarget.style.boxShadow = "0 2px 12px rgba(200,146,42,0.12)";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#E3D9C8";
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, color: "#C8922A" }}>
                  {action.icon}
                  <span style={{ fontFamily: "var(--font-family-serif)", fontWeight: 600, fontSize: 15, color: "#1A1208" }}>
                    {action.label}
                  </span>
                </div>
                <div style={{ fontSize: 13, color: "#9B8B7A", paddingLeft: 26 }}>{action.description}</div>
              </div>
              <ArrowRight size={16} style={{ color: "#C8B89A", flexShrink: 0, marginLeft: 8 }} />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
