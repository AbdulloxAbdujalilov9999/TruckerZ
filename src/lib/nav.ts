export type AppRole = "OWNER" | "DISPATCHER" | "OFFICE" | "DRIVER";

export type NavItem = {
  label: string;
  href: string;
  icon: "dashboard" | "truck" | "load" | "payment" | "expense" | "document" | "settings" | "fuel" | "drivers";
};

const DASHBOARD: NavItem = { label: "Dashboard", href: "/dashboard", icon: "dashboard" };
const TRUCKS: NavItem = { label: "Trucks", href: "/trucks", icon: "truck" };
const LOADS: NavItem = { label: "Loads", href: "/loads", icon: "load" };
const PAYMENTS: NavItem = { label: "Payments", href: "/payments", icon: "payment" };
const EXPENSES: NavItem = { label: "Expenses", href: "/expenses", icon: "expense" };
const FUEL_RECEIPTS: NavItem = { label: "Fuel Receipts", href: "/fuel-receipts", icon: "fuel" };
const DOCUMENTS: NavItem = { label: "Documents", href: "/documents", icon: "document" };
const DRIVERS: NavItem = { label: "Drivers", href: "/drivers", icon: "drivers" };
const SETTINGS: NavItem = { label: "Settings", href: "/settings", icon: "settings" };

/**
 * Matches the access rules observed in the real app: a driver sees their
 * own loads only, with financial fields removed entirely; office staff
 * handle loads and paperwork without seeing payments, expenses, or what
 * anyone earns; a dispatcher gets the full operational set but never the
 * owner-only admin pages.
 */
export function navForRole(role: AppRole): NavItem[] {
  switch (role) {
    case "OWNER":
      return [DASHBOARD, TRUCKS, LOADS, PAYMENTS, EXPENSES, FUEL_RECEIPTS, DOCUMENTS, DRIVERS, SETTINGS];
    case "DISPATCHER":
      return [DASHBOARD, TRUCKS, LOADS, PAYMENTS, EXPENSES, FUEL_RECEIPTS];
    case "OFFICE":
      return [DASHBOARD, TRUCKS, LOADS, FUEL_RECEIPTS];
    case "DRIVER":
      return [DASHBOARD, LOADS, FUEL_RECEIPTS];
    default:
      return [DASHBOARD];
  }
}

// Routes that require OWNER specifically.
export const OWNER_ONLY_PREFIXES = ["/documents", "/settings", "/drivers"];

// Routes blocked entirely for a given role, enforced in src/proxy.ts (not
// just hidden from the nav — a direct URL hit is refused server-side too).
export const ROLE_BLOCKED_PREFIXES: Record<AppRole, string[]> = {
  OWNER: [],
  DISPATCHER: [],
  OFFICE: ["/payments", "/expenses"],
  DRIVER: ["/trucks", "/payments", "/expenses"],
};
