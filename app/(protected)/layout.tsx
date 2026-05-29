import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="flex h-full" style={{ background: "#F7F2E8" }}>
      <Sidebar
        userName={session.user.name ?? ""}
        userEmail={session.user.email ?? ""}
        userRole={session.user.role}
      />
      <main className="flex-1 overflow-y-auto min-w-0">
        {children}
      </main>
    </div>
  );
}
