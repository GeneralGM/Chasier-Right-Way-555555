/* eslint-disable prettier/prettier */
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
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
  Store, // أيقونة جديدة للوجو
  UserPen,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import ActionGate from "@/components/ui/ActionGate";

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
  const [deviceType, setDeviceType] = useState<"main" | "micros">("main");
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://192.168.100.195:5000/api/device-check")
      .then((res) => res.json())
      .then((data) => {
        console.log("🖥️ Device Connected:", data.ip, "Type:", data.deviceType);

        if (data.deviceType === "micros") {
          setDeviceType("micros");
          localStorage.setItem("isMicrosDevice", "true");

          if (pathname !== "/orders") {
            navigate({ to: "/orders" });
          }
        } else {
          setDeviceType("main");
          localStorage.setItem("isMicrosDevice", "false");
        }
      })
      .catch((err) => console.error("Error checking device IP:", err));
  }, [pathname, navigate]);

  const isMicros = deviceType === "micros";

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
    <div dir="rtl" className="min-h-screen flex flex-col bg-slate-50/50">
      {/* الهيدر بتأثير زجاجي وانيميشن ظهور */}
      <header className="no-print sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-200/60 shadow-sm animate-in slide-in-from-top-4 duration-500">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          {/* اللوجو الجديد مع تأثير النبض الخفيف */}
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform duration-300">
              <Store className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-sm font-extrabold tracking-tight text-gray-900 group-hover:text-emerald-600 transition-colors">
                نظام إدارة المطعم
              </h1>
              <p className="text-[10px] text-gray-500 font-medium">
                المخزن ونقطة البيع
              </p>
            </div>
          </div>

          {/* 💻 قائمة الشاشات الكبيرة */}
          <nav className="hidden md:flex items-center gap-1.5 bg-gray-100/50 p-1 rounded-xl border border-gray-200/50">
            {!isMicros && (
              <div className="relative" ref={dropdownRef}>
                <ActionGate
                  requiredRole="محاسب"
                  actionName="فتح المخزن و ظهور كل العناصر"
                  onSuccess={() => setWarehouseOpen((v) => !v)}
                >
                  <button
                    className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all duration-300 ${
                      isWarehouseRoute
                        ? "bg-white text-emerald-600 shadow-sm border border-gray-200/60"
                        : "text-gray-600 hover:bg-white hover:text-gray-900"
                    }`}
                  >
                    <Warehouse className="w-4 h-4" />
                    المخزن
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-300 ${warehouseOpen ? "rotate-180" : ""}`}
                    />
                  </button>
                </ActionGate>

                {/* قائمة المخزن المنسدلة بأنيميشن */}
                {warehouseOpen && (
                  <div className="absolute end-0 mt-2 w-56 bg-white/95 backdrop-blur-xl border border-gray-100 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                    {warehouseNav.map((n) => {
                      const active = pathname === n.to;
                      const Icon = n.icon;
                      return (
                        <Link
                          key={n.to}
                          to={n.to}
                          className={`mx-2 px-3 py-2.5 rounded-lg text-sm flex items-center gap-2.5 transition-all duration-200 ${
                            active
                              ? "bg-emerald-50 text-emerald-600 font-bold"
                              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                          }`}
                        >
                          <Icon
                            className={`w-4 h-4 ${active ? "text-emerald-600" : "text-gray-400"}`}
                          />
                          {n.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 🟢 القائمة الرئيسية */}
            {primaryNav
              .filter((n) => !isMicros || n.to === "/orders")
              .map((n) => {
                const active = pathname === n.to;
                const Icon = n.icon;
                return (
                  <Link
                    key={n.to}
                    to={n.to}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all duration-300 ${
                      active
                        ? "bg-white text-emerald-600 shadow-sm border border-gray-200/60"
                        : "text-gray-600 hover:bg-white hover:text-gray-900"
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 ${active ? "animate-pulse" : ""}`}
                    />
                    {n.label}
                  </Link>
                );
              })}
          </nav>

          {/* 🔴 زرار الخروج بتصميم عصري */}
          {!isMicros && (
            <button
              className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg font-bold text-red-500 hover:bg-red-50 hover:text-red-600 transition-all duration-300 border border-transparent hover:border-red-100"
              title="يوسف الرفاعي"
            >
              <UserPen className="w-4 h-4" />
              <span className="hidden sm:inline">ENG: Youssif Hamed</span>
            </button>
          )}
        </div>

        {/* 📱 قائمة الشاشات الصغيرة / التابلت */}
        <nav className="md:hidden flex overflow-x-auto gap-2 px-4 pb-3 pt-2 hide-scrollbar">
          {[
            ...(!isMicros ? warehouseNav : []),
            ...primaryNav.filter((n) => !isMicros || n.to === "/orders"),
          ].map((n) => {
            const active = pathname === n.to;
            const Icon = n.icon;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all duration-300 ${
                  active
                    ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20 scale-105"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <Icon className="w-4 h-4" />
                {n.label}
              </Link>
            );
          })}
        </nav>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 animate-in fade-in duration-700">
        {children}
      </main>

      {/* إضافة ستايل لإخفاء الـ Scrollbar في الموبايل */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `,
        }}
      />
    </div>
  );
}
