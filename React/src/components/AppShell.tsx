/* eslint-disable prettier/prettier */
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Package,
  ArrowDownToLine,
  ArrowUpFromLine,
  History,
  Calculator,
  Warehouse,
  ChevronDown,
  FileBarChart,
  ShoppingCart,
  Fingerprint,
  Settings,
  Store,
  UserPen,
  type LucideIcon,
  ShieldAlert,
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

// 🌟 تعريف نوع البيانات لضمان عدم حدوث أخطاء TypeScript مع إضافة حقل الصلاحية
interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  showFor: string[];
  requiredRole?: string; // 🌟 حقل اختياري لتحديد الرتبة المطلوبة (مثل: مالك)
}

const primaryNav: NavItem[] = [
  {
    to: "/reports",
    label: "التقرير",
    icon: FileBarChart,
    showFor: ["main", "sec_cashier"],
  },
  {
    to: "/orders",
    label: "الطلبات",
    icon: ShoppingCart,
    showFor: ["main", "micros", "sec_cashier"],
  },
  {
    to: "/roles",
    label: "بصمات الموظفين",
    icon: Fingerprint,
    showFor: ["main"],
  },
  {
    to: "/settings",
    label: "الإعدادات",
    icon: Settings,
    showFor: ["main", "sec_cashier"],
  },
  // 🌟 2. إضافة تابة الـ IPs والطابعات (للكاشير الرئيسي فقط + حماية المالك)
  {
    to: "/printers-settings", // مسار شاشة إعدادات الـ IPs بالطابعات (تقدر تغيره لو مسميه اسم تاني عندك)
    label: "IPs",
    icon: ShieldAlert,
    showFor: ["main"], // تظهر عند الكاشير الرئيسي فقط
    requiredRole: "مالك", // تتطلب بصمة مالك (Owner) لفتحها
  },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [warehouseOpen, setWarehouseOpen] = useState(false);

  // 🌟 State واحدة تلم الليلة كلها (بتقرأ من الكاش مبدئياً عشان الشاشة مترعشش)
  const [deviceType, setDeviceType] = useState<
    "main" | "micros" | "sec_cashier"
  >(() => {
    if (typeof window !== "undefined") {
      if (localStorage.getItem("isMicrosDevice") === "true") return "micros";
      if (localStorage.getItem("isSecCashierDevice") === "true")
        return "sec_cashier";
    }
    return "main";
  });

  // 🌟 استنتاج الحالات عشان نستخدمها في الشاشة بسهولة
  const isMicros = deviceType === "micros";
  const isSecCashier = deviceType === "sec_cashier";
  const isMain = deviceType === "main";

  const isWarehouseRoute = warehouseNav.some((n) => n.to === pathname);

  // 🌟 useEffect واحدة ذكية بتكلم السيرفر وتحدث كل حاجة
  useEffect(() => {
    const syncDeviceTypeWithServer = async () => {
      try {
        const res = await fetch("http://192.168.100.195:5000/api/device-check");
        const data = await res.json();
        const fetchedType = data.deviceType; // "main" أو "micros" أو "sec_cashier"

        console.log(
          `🖥️ تم التعرف على الجهاز: IP [${data.ip}] - النوع [${fetchedType}]`,
        );
        setDeviceType(fetchedType);

        if (fetchedType === "micros") {
          localStorage.setItem("isMicrosDevice", "true");
          localStorage.setItem("isSecCashierDevice", "false");

          // الميكروس ملوش غير صفحة الطلبات
          if (pathname !== "/orders") navigate({ to: "/orders" });
        } else if (fetchedType === "sec_cashier") {
          localStorage.setItem("isMicrosDevice", "false");
          localStorage.setItem("isSecCashierDevice", "true");

          // حماية: لو الكاشير الفرعي فاتح رابط المخزن نطرده للطلبات
          if (isWarehouseRoute) navigate({ to: "/orders" });
        } else {
          localStorage.setItem("isMicrosDevice", "false");
          localStorage.setItem("isSecCashierDevice", "false");
        }
        // 🌟 🚀 الإضافة السحرية هنا: مزامنة الطابعات بالخلفية 🚀 🌟
        try {
          const printersRes = await fetch(
            "http://192.168.100.195:5000/api/printers",
          );
          if (printersRes.ok) {
            const dbPrinters = await printersRes.json();
            const localPrinters = JSON.parse(
              localStorage.getItem("pos_dynamic_printers") || "[]",
            );

            // لو في اختلاف بين الداتابيز والـ LocalStorage، الداتابيز تكسب وتحدث المحلي فوراً
            if (JSON.stringify(dbPrinters) !== JSON.stringify(localPrinters)) {
              console.log(
                "🔄 تم مزامنة الطابعات محلياً من قاعدة البيانات بنجاح!",
              );
              localStorage.setItem(
                "pos_dynamic_printers",
                JSON.stringify(dbPrinters),
              );
            }
          }
        } catch (printErr) {
          console.warn(
            "⚠️ السيرفر غير متاح حالياً للمزامنة: العمل أوفلاين بطابعات الـ LocalStorage",
          );
        }
        // 🌟 --------------------------------------------------- 🌟
      } catch (err) {
        console.error("❌ فشل التعرف على الجهاز من السيرفر", err);
      }
    };

    syncDeviceTypeWithServer();
  }, [pathname, navigate, isWarehouseRoute]);

  // قفل قائمة المخزن لو الرابط اتغير
  useEffect(() => {
    setWarehouseOpen(false);
  }, [pathname]);

  // قفل القائمة لو داس بره
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
      <header className="no-print sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-200/60 shadow-sm animate-in slide-in-from-top-4 duration-500">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          {/* اللوجو */}
          <div className="flex items-center gap-3 group cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform duration-300">
              <Store className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-sm font-extrabold tracking-tight text-gray-900 group-hover:text-emerald-600 transition-colors">
                نظام إدارة المطعم
              </h1>
              <p className="text-[10px] text-gray-500 font-medium">
                {isMain
                  ? "المخزن ونقطة البيع"
                  : isSecCashier
                    ? "كاشير فرعي"
                    : "شاشة الطلبات"}
              </p>
            </div>
          </div>

          {/* 💻 قائمة الشاشات الكبيرة */}
          <nav className="hidden md:flex items-center gap-1.5 bg-gray-100/50 p-1 rounded-xl border border-gray-200/50">
            {/* المخزن بيظهر للجهاز الرئيسي فقط! */}
            {isMain && (
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

            {/* 🟢 القائمة الرئيسية بفلتر الصلاحيات الذكي + حماية ActionGate */}
            {primaryNav
              .filter((n) => n.showFor.includes(deviceType))
              .map((n) => {
                const active = pathname === n.to;
                const Icon = n.icon;

                // 🌟 3. لو التابة محتاجة رتبة معينة (زي بصمة المالك)، بنغلفها بـ ActionGate
                if (n.requiredRole) {
                  return (
                    <ActionGate
                      key={n.to}
                      requiredRole="مالك"
                      actionName={`الدخول إلى شاشة ${n.label}`}
                      onSuccess={() => navigate({ to: n.to })}
                    >
                      <button
                        className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all duration-300 ${
                          active
                            ? "bg-rose-600 text-white shadow-lg shadow-rose-600/30 scale-105 ring-2 ring-rose-300"
                            : "bg-gray-100 text-gray-700 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200"
                        }`}
                      >
                        <Icon
                          className={`w-4 h-4 ${active ? "animate-pulse" : ""}`}
                        />
                        {n.label}
                      </button>
                    </ActionGate>
                  );
                }

                // التابات العادية بدون حماية إضافية
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

          {/* 🔴 زرار الخروج (مخفي من الميكروس) */}
          <button className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg font-bold text-red-500 hover:bg-red-50 hover:text-red-600 transition-all duration-300 border border-transparent hover:border-red-100">
            <UserPen className="w-4 h-4" />
            <span className="hidden sm:inline">ENG: Youssif Hamed</span>
          </button>
        </div>

        {/* 📱 قائمة الشاشات الصغيرة / التابلت (مجهزة بنفس الحماية) */}
        <nav className="md:hidden flex overflow-x-auto gap-2 px-4 pb-3 pt-2 hide-scrollbar">
          {[
            ...(isSecCashier || isMain ? warehouseNav : []),
            ...primaryNav.filter((n) => n.showFor.includes(deviceType)),
          ].map((n) => {
            const active = pathname === n.to;
            const Icon = n.icon;

            // 🌟 4. تطبيق نفس الحماية في الشاشات الصغيرة للمالك
            if ("requiredRole" in n && n.requiredRole) {
              return (
                <ActionGate
                  key={n.to}
                  requiredRole="مالك"
                  actionName={`الدخول إلى شاشة ${n.label}`}
                  onSuccess={() => navigate({ to: n.to })}
                >
                  <button
                    className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all duration-300 ${
                      active
                        ? "bg-rose-600 text-white shadow-lg shadow-rose-600/30 scale-105 ring-2 ring-rose-300"
                        : "bg-gray-100 text-gray-700 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {n.label}
                  </button>
                </ActionGate>
              );
            }

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

      <style
        dangerouslySetInnerHTML={{
          __html: `.hide-scrollbar::-webkit-scrollbar { display: none; } .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`,
        }}
      />
    </div>
  );
}
