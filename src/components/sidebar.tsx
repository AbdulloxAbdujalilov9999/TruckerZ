"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Truck,
  Package,
  CreditCard,
  Receipt,
  FileText,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { navForRole, type AppRole } from "@/lib/nav";

const ICONS: Record<string, LucideIcon> = {
  dashboard: LayoutDashboard,
  truck: Truck,
  load: Package,
  payment: CreditCard,
  expense: Receipt,
  document: FileText,
  settings: Settings,
};

export function Sidebar({ role }: { role: AppRole }) {
  const pathname = usePathname();
  const items = navForRole(role);
  const overview = items.filter((i) => i.icon !== "document" && i.icon !== "settings");
  const admin = items.filter((i) => i.icon === "document" || i.icon === "settings");

  return (
    <aside className="hidden w-60 shrink-0 border-r border-border bg-surface md:flex md:flex-col">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-brand text-brand-foreground font-bold text-sm">
          Z
        </div>
        <span className="text-lg font-semibold">truckerz</span>
      </div>

      <nav className="flex-1 px-3">
        <div className="px-2 pb-2 text-xs font-medium uppercase tracking-wide text-muted">
          Overview
        </div>
        <ul className="space-y-0.5">
          {overview.map((item) => {
            const Icon = ICONS[item.icon];
            const active = pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-2 rounded-md px-2 py-2 text-sm ${
                    active
                      ? "bg-brand-soft text-brand font-medium"
                      : "text-foreground/80 hover:bg-background"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

        {admin.length > 0 && (
          <>
            <div className="mt-6 px-2 pb-2 text-xs font-medium uppercase tracking-wide text-muted">
              Admin
            </div>
            <ul className="space-y-0.5">
              {admin.map((item) => {
                const Icon = ICONS[item.icon];
                const active = pathname.startsWith(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-2 rounded-md px-2 py-2 text-sm ${
                        active
                          ? "bg-brand-soft text-brand font-medium"
                          : "text-foreground/80 hover:bg-background"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </nav>
    </aside>
  );
}
