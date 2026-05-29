"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";

interface SidebarProps {
  userName: string;
  userEmail: string;
  userRole: "admin" | "librarian" | "student";
}

const ROLE_COLORS = {
  admin: "#C8922A",
  librarian: "#3D7A58",
  student: "#4169B8",
};

const ROLE_LABELS = {
  admin: "Administrator",
  librarian: "Librarian",
  student: "Student",
};

function BookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    </svg>
  );
}

function DashboardIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/>
      <rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/>
      <rect x="3" y="14" width="7" height="7"/>
    </svg>
  );
}

function IssueIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>
    </svg>
  );
}

function RecordsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
      <line x1="16" y1="17" x2="8" y2="17"/>
      <polyline points="10 9 9 9 8 9"/>
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6"/>
      <line x1="3" y1="12" x2="21" y2="12"/>
      <line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}

export default function Sidebar({ userName, userEmail, userRole }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: <DashboardIcon />, roles: ["admin", "librarian", "student"] },
    { href: "/books", label: "Books", icon: <BookIcon />, roles: ["admin", "librarian", "student"] },
    { href: "/issue", label: "Issue / Return", icon: <IssueIcon />, roles: ["admin", "librarian"] },
    { href: "/records", label: "Records", icon: <RecordsIcon />, roles: ["admin", "librarian", "student"] },
    { href: "/admin/users", label: "Users", icon: <UsersIcon />, roles: ["admin"] },
  ].filter((item) => item.roles.includes(userRole));

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  const sidebarContent = (
    <div
      className="flex flex-col h-full w-64"
      style={{ background: "#0D1117", borderRight: "1px solid #1E2733" }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-6" style={{ borderBottom: "1px solid #1E2733" }}>
        <div
          className="w-8 h-8 flex items-center justify-center flex-shrink-0"
          style={{ background: "#C8922A" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" stroke="#0D1117" strokeWidth="2.5" strokeLinecap="round"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" stroke="#0D1117" strokeWidth="2.5"/>
          </svg>
        </div>
        <div>
          <p className="font-serif font-bold text-base leading-none" style={{ color: "#F7F2E8" }}>
            Meridian
          </p>
          <p className="text-xs mt-0.5" style={{ color: "#4A5568" }}>
            Library System
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 overflow-y-auto">
        <p
          className="text-xs uppercase tracking-widest px-3 mb-3"
          style={{ color: "#4A5568" }}
        >
          Navigation
        </p>
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm transition-all rounded-sm group relative"
                  style={{
                    color: active ? "#F7F2E8" : "#6B7280",
                    background: active ? "rgba(200, 146, 42, 0.12)" : "transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      (e.currentTarget as HTMLAnchorElement).style.color = "#F7F2E8";
                      (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,0.04)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      (e.currentTarget as HTMLAnchorElement).style.color = "#6B7280";
                      (e.currentTarget as HTMLAnchorElement).style.background = "transparent";
                    }
                  }}
                >
                  {active && (
                    <span
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r"
                      style={{ background: "#C8922A" }}
                    />
                  )}
                  <span style={{ color: active ? "#C8922A" : "inherit" }}>
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User info */}
      <div
        className="px-4 py-4"
        style={{ borderTop: "1px solid #1E2733" }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0"
            style={{ background: ROLE_COLORS[userRole] + "22", color: ROLE_COLORS[userRole] }}
          >
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium leading-none truncate" style={{ color: "#F7F2E8" }}>
              {userName}
            </p>
            <p className="text-xs mt-1 truncate" style={{ color: "#4A5568" }}>
              {userEmail}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium uppercase tracking-wider"
            style={{
              background: ROLE_COLORS[userRole] + "22",
              color: ROLE_COLORS[userRole],
            }}
          >
            {ROLE_LABELS[userRole]}
          </span>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-1.5 text-xs transition-colors px-2 py-1"
            style={{ color: "#4A5568" }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#9B4040")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#4A5568")}
          >
            <LogoutIcon />
            Sign out
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:block flex-shrink-0 h-full">
        {sidebarContent}
      </div>

      {/* Mobile toggle */}
      <div className="lg:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          className="fixed top-4 left-4 z-30 p-2"
          style={{ background: "#0D1117", color: "#F7F2E8" }}
        >
          <MenuIcon />
        </button>

        {mobileOpen && (
          <>
            <div
              className="fixed inset-0 z-40 modal-backdrop"
              onClick={() => setMobileOpen(false)}
            />
            <div className="fixed inset-y-0 left-0 z-50 animate-slide-in">
              <div className="relative">
                {sidebarContent}
                <button
                  onClick={() => setMobileOpen(false)}
                  className="absolute top-4 right-4"
                  style={{ color: "#4A5568" }}
                >
                  <CloseIcon />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
