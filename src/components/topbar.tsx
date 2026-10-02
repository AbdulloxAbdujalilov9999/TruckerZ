import { Bell, LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { SignOutButton } from "@/components/sign-out-button";

export function Topbar({
  companyName,
  roleLabel,
  userInitials,
}: {
  companyName: string;
  roleLabel: string;
  userInitials: string;
}) {
  return (
    <header className="flex items-center justify-between border-b border-border bg-surface px-6 py-4">
      <div>
        <div className="text-sm font-medium">{companyName}</div>
        <div className="text-xs text-muted">{roleLabel}</div>
      </div>
      <div className="flex items-center gap-1">
        <ThemeToggle />
        <button
          aria-label="Notifications"
          className="rounded-md p-2 text-muted hover:bg-background"
        >
          <Bell className="h-4 w-4" />
        </button>
        <SignOutButton>
          <span className="flex items-center gap-1 rounded-md p-2 text-muted hover:bg-background">
            <LogOut className="h-4 w-4" />
          </span>
        </SignOutButton>
        <div className="ml-2 flex h-8 w-8 items-center justify-center rounded-full bg-brand-soft text-xs font-medium text-brand">
          {userInitials}
        </div>
      </div>
    </header>
  );
}
