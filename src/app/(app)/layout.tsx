import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import type { AppRole } from "@/lib/nav";

const ROLE_LABELS: Record<string, string> = {
  OWNER: "Owner",
  DISPATCHER: "Dispatcher",
  OFFICE: "Office",
  DRIVER: "Driver",
};

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role as AppRole;
  const initials = session.user.name
    ? session.user.name
        .split(" ")
        .map((p) => p[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U";

  return (
    <div className="flex min-h-screen">
      <Sidebar role={role} />
      <div className="flex min-h-screen flex-1 flex-col">
        <Topbar
          companyName={session.user.companyName}
          roleLabel={ROLE_LABELS[role] ?? role}
          userInitials={initials}
        />
        <main className="flex-1 bg-background px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
