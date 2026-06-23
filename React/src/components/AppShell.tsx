import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Package,
  ArrowDownToLine,
  ArrowUpFromLine,
  History,
  LogOut,
  Calculator,
  Warehouse,
  ChevronDown,
  FileBarChart,
  ShoppingCart,
  Fingerprint,
  Settings,
} from "lucide-react";
import { logout } from "@/lib/store";
import { useEffect, useRef, useState, type ReactNode } from "react";
const warehouseNav = [
  { to: "/", label: "لوحة التحكم", icon: LayoutDashboard },
  { to: "/inventory", label: "المخزون", icon: Package },
  { to: "/entry", label: "إذن توريد", icon: ArrowDownToLine },
  { to: "/issue", label: "إذن صرف", icon: ArrowUpFromLine },
  { to: "/history", label: "سجل العمليات", icon: History },
  { to: "/cost-control", label: "مراقبة التكاليف", icon: Calculator },
] as const;

const primaryNav = [
  { to: "/reports", label: "التقرير", icon: FileBarChart },
  { to: "/orders", label: "الطلبات", icon: ShoppingCart },
  { to: "/roles", label: "بصمات الموظفين", icon: Fingerprint },
  { to: "/settings", label: "الإعدادات", icon: Settings },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [warehouseOpen, setWarehouseOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isWarehouseRoute = warehouseNav.some((n) => n.to === pathname);

  useEffect(() => {
    setWarehouseOpen(false);
  }, [pathname]);
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setWarehouseOpen(false);
      }
    }
    if (warehouseOpen) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [warehouseOpen]);

  return (
    <div dir="rtl" className="min-h-screen flex flex-col bg-background">
      <header className="no-print sticky top-0 z-30 bg-card/95 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary text-primary-foreground grid place-items-center font-bold">
              م
            </div>
            <div>
              <h1 className="text-base font-bold leading-tight">
                نظام إدارة المطعم
              </h1>
              <p className="text-xs text-muted-foreground leading-tight">
                المخزن ونقطة البيع
              </p>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-1">
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setWarehouseOpen((v) => !v)}
                className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition ${
                  isWarehouseRoute
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-secondary"
                }`}
              >
                <Warehouse className="w-4 h-4" />
                المخزن
                <ChevronDown
                  className={`w-3.5 h-3.5 transition ${warehouseOpen ? "rotate-180" : ""}`}
                />
              </button>
              {warehouseOpen && (
                <div className="absolute end-0 mt-1 w-56 bg-card border border-border rounded-lg shadow-lg py-1 z-40">
                  {warehouseNav.map((n) => {
                    const active = pathname === n.to;
                    const Icon = n.icon;
                    return (
                      <Link
                        key={n.to}
                        to={n.to}
                        className={`px-3 py-2 text-sm flex items-center gap-2 transition ${
                          active
                            ? "bg-primary text-primary-foreground"
                            : "text-foreground hover:bg-secondary"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {n.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
            {primaryNav.map((n) => {
              const active = pathname === n.to;
              const Icon = n.icon;
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`px-3 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition ${
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-secondary"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {n.label}
                </Link>
              );
            })}
          </nav>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-md text-destructive hover:bg-destructive/10"
            title="تسجيل خروج"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">خروج</span>
          </button>
        </div>
        <nav className="md:hidden flex overflow-x-auto gap-1 px-3 pb-2 border-t border-border pt-2">
          {[...warehouseNav, ...primaryNav].map((n) => {
            const active = pathname === n.to;
            const Icon = n.icon;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`shrink-0 px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {n.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
}
