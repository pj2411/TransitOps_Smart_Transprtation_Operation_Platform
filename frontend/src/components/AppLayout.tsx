import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Truck,
  Users,
  Route as RouteIcon,
  Wrench,
  Fuel,
  BarChart3,
  Settings,
  Search,
  Bell,
  LogOut,
  Check,
  Sun,
  Moon,
} from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/hooks/use-theme";
import { cn } from "@/lib/utils";
import type { Module } from "@/types";

const nav: {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  module: Module | null;
}[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, module: null },
  { to: "/fleet", label: "Fleet Registry", icon: Truck, module: "Fleet" },
  { to: "/drivers", label: "Drivers & Safety", icon: Users, module: "Drivers" },
  { to: "/dispatcher", label: "Trip Dispatcher", icon: RouteIcon, module: "Trips" },
  { to: "/maintenance", label: "Maintenance", icon: Wrench, module: "Fuel-Exp" },
  { to: "/fuel", label: "Fuel & Expenses", icon: Fuel, module: "Fuel-Exp" },
  { to: "/analytics", label: "Analytics", icon: BarChart3, module: "Analytics" },
  { to: "/settings", label: "Settings", icon: Settings, module: "Settings" },
];

export function AppLayout() {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const { user, logout, hasAccess } = useAuth();
  const navigate = useNavigate();
  const [activeNotifications, setActiveNotifications] = useState<any[]>([]);
  const { theme, toggleTheme } = useTheme();

  const handleLogout = () => {
    logout();
    navigate({ to: "/login" });
  };

  /* Filter nav items based on RBAC — dashboard is always visible */
  const visibleNav = nav.filter((item) => {
    if (item.module === null) return true;
    return hasAccess(item.module) !== "none";
  });

  const initials = user
    ? user.email.substring(0, 2).toUpperCase()
    : "??";

  return (
    <div className="flex min-h-screen w-full bg-canvas text-foreground">
      <aside className="fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-sidebar-border bg-sidebar">
        <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-bold">
            T
          </div>
          <div>
            <div className="text-sm font-semibold leading-none">TransitOps</div>
            <div className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">Ops Platform</div>
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {visibleNav.map((item) => {
            const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-hover hover:text-sidebar-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="ml-60 flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-panel/90 px-6 backdrop-blur">
          <div className="relative flex-1 max-w-xl">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search vehicles, drivers, trips…"
              className="h-9 border-border bg-canvas pl-9 text-sm placeholder:text-muted-foreground focus-visible:ring-primary"
            />
          </div>

          <button
            onClick={toggleTheme}
            className="rounded-md border border-border bg-canvas p-2 text-muted-foreground transition hover:text-foreground"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <Popover>
            <PopoverTrigger asChild>
              <button className="relative rounded-md border border-border bg-canvas p-2 text-muted-foreground transition hover:text-foreground">
                <Bell className="h-4 w-4" />
                {activeNotifications.length > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-danger-foreground">
                    {activeNotifications.length}
                  </span>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 border-border bg-panel p-0">
              <div className="flex items-center justify-between border-b border-border p-3">
                <span className="text-sm font-semibold">Notifications</span>
                {activeNotifications.length > 0 && (
                  <button 
                    onClick={() => setActiveNotifications([])}
                    className="text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
                  >
                    Clear All
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {activeNotifications.length === 0 ? (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    <Check className="mx-auto mb-2 h-8 w-8 text-success/50" />
                    You're all caught up!
                  </div>
                ) : (
                  activeNotifications.map((n) => (
                    <div 
                      key={n.id} 
                      className="cursor-pointer border-b border-border/60 p-3 transition-colors last:border-b-0 hover:bg-canvas"
                      onClick={() => setActiveNotifications(prev => prev.filter(x => x.id !== n.id))}
                    >
                      <div className="flex items-start gap-2">
                        <span
                          className={cn(
                            "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                            n.type === "warning" && "bg-warning",
                            n.type === "info" && "bg-info",
                            n.type === "success" && "bg-success",
                          )}
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium">{n.title}</div>
                          <div className="text-xs text-muted-foreground">{n.body}</div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </PopoverContent>
          </Popover>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-md border border-border bg-canvas px-3 py-1.5 text-sm hover:bg-panel">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                  {initials}
                </div>
                <div className="text-left leading-tight">
                  <div className="text-xs font-medium">{user?.email ?? ""}</div>
                  <div className="text-[10px] text-muted-foreground">{user?.role ?? ""}</div>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 border-border bg-panel">
              <div className="px-2 py-1.5 text-xs text-muted-foreground">
                Signed in as <span className="font-medium text-foreground">{user?.role}</span>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-sm text-danger">
                <LogOut className="mr-2 h-3.5 w-3.5" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
