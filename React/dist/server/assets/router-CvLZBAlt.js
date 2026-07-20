import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { useRouterState, useNavigate, Link, createRootRouteWithContext, useRouter, Outlet, HeadContent, Scripts, createFileRoute, lazyRouteComponent, createRouter } from "@tanstack/react-router";
import { jsx, Fragment, jsxs } from "react/jsx-runtime";
import * as React from "react";
import { useState, useEffect, useRef, useCallback } from "react";
import { X, LayoutDashboard, Package, ArrowDownToLine, ArrowUpFromLine, History, Calculator, Store, Warehouse, ChevronDown, FileBarChart, ShoppingCart, Fingerprint, Settings, ShieldAlert, UserPen, Network, Plus, Trash2, Shield } from "lucide-react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Toaster as Toaster$1, toast } from "sonner";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { sha256 } from "js-sha256";
const appCss = "/assets/styles-CE47ZjCP.css";
function reportLovableError(error, context = {}) {
  if (typeof window === "undefined") return;
  window.__lovableEvents?.captureException?.(
    error,
    {
      source: "react_error_boundary",
      route: window.location.pathname,
      ...context
    },
    {
      mechanism: "react_error_boundary",
      handled: false,
      severity: "error"
    }
  );
}
function AuthGate({ children }) {
  return /* @__PURE__ */ jsx(Fragment, { children });
}
function cn(...inputs) {
  return twMerge(clsx(inputs));
}
const Dialog = DialogPrimitive.Root;
const DialogPortal = DialogPrimitive.Portal;
const DialogOverlay = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  DialogPrimitive.Overlay,
  {
    ref,
    className: cn(
      "fixed inset-0 z-50 bg-black/80  data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    ),
    ...props
  }
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;
const DialogContent = React.forwardRef(({ className, children, ...props }, ref) => /* @__PURE__ */ jsxs(DialogPortal, { children: [
  /* @__PURE__ */ jsx(DialogOverlay, {}),
  /* @__PURE__ */ jsxs(
    DialogPrimitive.Content,
    {
      ref,
      className: cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg",
        className
      ),
      ...props,
      children: [
        children,
        /* @__PURE__ */ jsxs(DialogPrimitive.Close, { className: "absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background cursor-pointer transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground", children: [
          /* @__PURE__ */ jsx(X, { className: "h-4 w-4" }),
          /* @__PURE__ */ jsx("span", { className: "sr-only", children: "Close" })
        ] })
      ]
    }
  )
] }));
DialogContent.displayName = DialogPrimitive.Content.displayName;
const DialogHeader = ({
  className,
  ...props
}) => /* @__PURE__ */ jsx(
  "div",
  {
    className: cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className
    ),
    ...props
  }
);
DialogHeader.displayName = "DialogHeader";
const DialogFooter = ({
  className,
  ...props
}) => /* @__PURE__ */ jsx(
  "div",
  {
    className: cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    ),
    ...props
  }
);
DialogFooter.displayName = "DialogFooter";
const DialogTitle = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  DialogPrimitive.Title,
  {
    ref,
    className: cn(
      "text-lg font-semibold leading-none tracking-tight",
      className
    ),
    ...props
  }
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;
const DialogDescription = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  DialogPrimitive.Description,
  {
    ref,
    className: cn("text-sm text-muted-foreground", className),
    ...props
  }
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;
const getApiUrl = () => {
  const savedIp = "192.168.1.88";
  return savedIp;
};
const API_URL$3 = getApiUrl();
const ROLE_WEIGHTS = {
  مالك: 5,
  مبرمج: 4,
  مدير: 3,
  محاسب: 2,
  كاشير: 1,
  "كابتن صالة": 1
};
function ActionGate({
  children,
  requiredRole = "محاسب",
  actionName = "هذا الإجراء",
  onSuccess
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [employees, setEmployees] = useState([]);
  useEffect(() => {
    if (isOpen && employees.length === 0) {
      fetch(`http://${API_URL$3}:5000/api/employees`).then((res) => res.json()).then((data) => setEmployees(data)).catch((err) => console.error("Error fetching employees:", err));
    }
  }, [isOpen, employees.length]);
  const handleVerify = () => {
    setError("");
    const employee = employees.find(
      (emp) => emp.pin === pin || emp.pinHash === pin
    );
    if (!employee) {
      setError("الرقم السري غير صحيح!");
      return;
    }
    const requiredWeight = ROLE_WEIGHTS[requiredRole] || 1;
    const employeeWeight = ROLE_WEIGHTS[employee.role] || 0;
    if (employeeWeight >= requiredWeight) {
      setIsOpen(false);
      setPin("");
      onSuccess(employee);
    } else {
      setError(`صلاحياتك لا تسمح بإجراء هذه العملية. مطلوب: ${requiredRole}`);
    }
  };
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(
      "div",
      {
        onClick: () => setIsOpen(true),
        className: "inline-block cursor-pointer",
        children
      }
    ),
    /* @__PURE__ */ jsx(Dialog, { open: isOpen, onOpenChange: setIsOpen, children: /* @__PURE__ */ jsxs(DialogContent, { dir: "rtl", children: [
      /* @__PURE__ */ jsxs(DialogHeader, { children: [
        /* @__PURE__ */ jsx(DialogTitle, { children: "صلاحية مطلوبة" }),
        /* @__PURE__ */ jsxs(DialogDescription, { children: [
          "لإتمام (",
          actionName,
          ")، يرجى إدخال الرقم السري لموظف بصلاحية",
          " ",
          requiredRole,
          " أو أعلى."
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "py-4", children: [
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "password",
            inputMode: "numeric",
            value: pin,
            onChange: (e) => setPin(e.target.value),
            placeholder: "أدخل الـ PIN هنا...",
            className: "w-full border rounded p-2 text-center text-xl tracking-widest bg-background text-foreground",
            autoFocus: true,
            onKeyDown: (e) => {
              if (e.key === "Enter") handleVerify();
            }
          }
        ),
        error && /* @__PURE__ */ jsx("p", { className: "text-destructive text-sm mt-2 text-center font-medium", children: error })
      ] }),
      /* @__PURE__ */ jsxs(DialogFooter, { className: "gap-2 sm:gap-0", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: () => setIsOpen(false),
            className: "bg-secondary text-foreground p-2 rounded px-4 w-full sm:w-auto",
            children: "إلغاء"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: handleVerify,
            className: "bg-primary text-primary-foreground p-2 rounded px-4 w-full sm:w-auto mt-2 sm:mt-0",
            children: "تأكيد"
          }
        )
      ] })
    ] }) })
  ] });
}
const API_URL$2 = getApiUrl();
const warehouseNav = [
  { to: "/", label: "لوحة التحكم", icon: LayoutDashboard },
  { to: "/inventory", label: "المخزون", icon: Package },
  { to: "/entry", label: "إذن توريد", icon: ArrowDownToLine },
  { to: "/issue", label: "إذن صرف", icon: ArrowUpFromLine },
  { to: "/history", label: "سجل العمليات", icon: History },
  { to: "/cost-control", label: "مراقبة التكاليف", icon: Calculator }
];
const primaryNav = [
  {
    to: "/reports",
    label: "التقرير",
    icon: FileBarChart,
    showFor: ["main", "sec_cashier"]
  },
  {
    to: "/orders",
    label: "الطلبات",
    icon: ShoppingCart,
    showFor: ["main", "micros", "sec_cashier"]
  },
  {
    to: "/roles",
    label: "بصمات الموظفين",
    icon: Fingerprint,
    showFor: ["main"]
  },
  {
    to: "/settings",
    label: "الإعدادات",
    icon: Settings,
    showFor: ["main", "sec_cashier"]
  },
  // 🌟 2. إضافة تابة الـ IPs والطابعات (للكاشير الرئيسي فقط + حماية المالك)
  {
    to: "/printers-settings",
    // مسار شاشة إعدادات الـ IPs بالطابعات (تقدر تغيره لو مسميه اسم تاني عندك)
    label: "IPs",
    icon: ShieldAlert,
    showFor: ["main"],
    // تظهر عند الكاشير الرئيسي فقط
    requiredRole: "مالك"
    // تتطلب بصمة مالك (Owner) لفتحها
  }
];
function AppShell({ children }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const [warehouseOpen, setWarehouseOpen] = useState(false);
  const [deviceType, setDeviceType] = useState(() => {
    if (typeof window !== "undefined") {
      if (localStorage.getItem("isMicrosDevice") === "true") return "micros";
      if (localStorage.getItem("isSecCashierDevice") === "true")
        return "sec_cashier";
    }
    return "main";
  });
  const isSecCashier = deviceType === "sec_cashier";
  const isMain = deviceType === "main";
  const isWarehouseRoute = warehouseNav.some((n) => n.to === pathname);
  useEffect(() => {
    const syncDeviceTypeWithServer = async () => {
      try {
        const res = await fetch(`http://${API_URL$2}:5000/api/device-check`);
        const data = await res.json();
        const fetchedType = data.deviceType;
        console.log(
          `🖥️ تم التعرف على الجهاز: IP [${data.ip}] - النوع [${fetchedType}]`
        );
        setDeviceType(fetchedType);
        if (fetchedType === "micros") {
          localStorage.setItem("isMicrosDevice", "true");
          localStorage.setItem("isSecCashierDevice", "false");
          if (pathname !== "/orders") navigate({ to: "/orders" });
        } else if (fetchedType === "sec_cashier") {
          localStorage.setItem("isMicrosDevice", "false");
          localStorage.setItem("isSecCashierDevice", "true");
          if (isWarehouseRoute) navigate({ to: "/orders" });
        } else {
          localStorage.setItem("isMicrosDevice", "false");
          localStorage.setItem("isSecCashierDevice", "false");
        }
        try {
          const printersRes = await fetch(
            `http://${API_URL$2}:5000/api/printers`
          );
          if (printersRes.ok) {
            const dbPrinters = await printersRes.json();
            const localPrinters = JSON.parse(
              localStorage.getItem("pos_dynamic_printers") || "[]"
            );
            if (JSON.stringify(dbPrinters) !== JSON.stringify(localPrinters)) {
              console.log(
                "🔄 تم مزامنة الطابعات محلياً من قاعدة البيانات بنجاح!"
              );
              localStorage.setItem(
                "pos_dynamic_printers",
                JSON.stringify(dbPrinters)
              );
            }
          }
        } catch (printErr) {
          console.warn(
            "⚠️ السيرفر غير متاح حالياً للمزامنة: العمل أوفلاين بطابعات الـ LocalStorage"
          );
        }
      } catch (err) {
        console.error("❌ فشل التعرف على الجهاز من السيرفر", err);
      }
    };
    syncDeviceTypeWithServer();
  }, [pathname, navigate, isWarehouseRoute]);
  useEffect(() => {
    setWarehouseOpen(false);
  }, [pathname]);
  useEffect(() => {
    function onClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setWarehouseOpen(false);
      }
    }
    if (warehouseOpen) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [warehouseOpen]);
  return /* @__PURE__ */ jsxs("div", { dir: "rtl", className: "min-h-screen flex flex-col bg-slate-50/50", children: [
    /* @__PURE__ */ jsxs("header", { className: "no-print sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-200/60 shadow-sm animate-in slide-in-from-top-4 duration-500", children: [
      /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 group cursor-pointer", children: [
          /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform duration-300", children: /* @__PURE__ */ jsx(Store, { className: "w-5 h-5" }) }),
          /* @__PURE__ */ jsxs("div", { className: "flex flex-col", children: [
            /* @__PURE__ */ jsx("h1", { className: "text-sm font-extrabold tracking-tight text-gray-900 group-hover:text-emerald-600 transition-colors", children: "نظام إدارة المطعم" }),
            /* @__PURE__ */ jsx("p", { className: "text-[10px] text-gray-500 font-medium", children: isMain ? "المخزن ونقطة البيع" : isSecCashier ? "كاشير فرعي" : "شاشة الطلبات" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("nav", { className: "hidden md:flex items-center gap-1.5 bg-gray-100/50 p-1 rounded-xl border border-gray-200/50", children: [
          isMain && /* @__PURE__ */ jsxs("div", { className: "relative", ref: dropdownRef, children: [
            /* @__PURE__ */ jsx(
              ActionGate,
              {
                requiredRole: "محاسب",
                actionName: "فتح المخزن و ظهور كل العناصر",
                onSuccess: () => setWarehouseOpen((v) => !v),
                children: /* @__PURE__ */ jsxs(
                  "button",
                  {
                    className: `px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all duration-300 ${isWarehouseRoute ? "bg-white text-emerald-600 shadow-sm border border-gray-200/60" : "text-gray-600 hover:bg-white hover:text-gray-900"}`,
                    children: [
                      /* @__PURE__ */ jsx(Warehouse, { className: "w-4 h-4" }),
                      "المخزن",
                      /* @__PURE__ */ jsx(
                        ChevronDown,
                        {
                          className: `w-3.5 h-3.5 transition-transform duration-300 ${warehouseOpen ? "rotate-180" : ""}`
                        }
                      )
                    ]
                  }
                )
              }
            ),
            warehouseOpen && /* @__PURE__ */ jsx("div", { className: "absolute end-0 mt-2 w-56 bg-white/95 backdrop-blur-xl border border-gray-100 rounded-xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 duration-200", children: warehouseNav.map((n) => {
              const active = pathname === n.to;
              const Icon = n.icon;
              return /* @__PURE__ */ jsxs(
                Link,
                {
                  to: n.to,
                  className: `mx-2 px-3 py-2.5 rounded-lg text-sm flex items-center gap-2.5 transition-all duration-200 ${active ? "bg-emerald-50 text-emerald-600 font-bold" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`,
                  children: [
                    /* @__PURE__ */ jsx(
                      Icon,
                      {
                        className: `w-4 h-4 ${active ? "text-emerald-600" : "text-gray-400"}`
                      }
                    ),
                    n.label
                  ]
                },
                n.to
              );
            }) })
          ] }),
          primaryNav.filter((n) => n.showFor.includes(deviceType)).map((n) => {
            const active = pathname === n.to;
            const Icon = n.icon;
            if (n.requiredRole) {
              return /* @__PURE__ */ jsx(
                ActionGate,
                {
                  requiredRole: "مالك",
                  actionName: `الدخول إلى شاشة ${n.label}`,
                  onSuccess: () => navigate({ to: n.to }),
                  children: /* @__PURE__ */ jsxs(
                    "button",
                    {
                      className: `shrink-0 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all duration-300 ${active ? "bg-rose-600 text-white shadow-lg shadow-rose-600/30 scale-105 ring-2 ring-rose-300" : "bg-gray-100 text-gray-700 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200"}`,
                      children: [
                        /* @__PURE__ */ jsx(
                          Icon,
                          {
                            className: `w-4 h-4 ${active ? "animate-pulse" : ""}`
                          }
                        ),
                        n.label
                      ]
                    }
                  )
                },
                n.to
              );
            }
            return /* @__PURE__ */ jsxs(
              Link,
              {
                to: n.to,
                className: `px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all duration-300 ${active ? "bg-white text-emerald-600 shadow-sm border border-gray-200/60" : "text-gray-600 hover:bg-white hover:text-gray-900"}`,
                children: [
                  /* @__PURE__ */ jsx(
                    Icon,
                    {
                      className: `w-4 h-4 ${active ? "animate-pulse" : ""}`
                    }
                  ),
                  n.label
                ]
              },
              n.to
            );
          })
        ] }),
        /* @__PURE__ */ jsxs("button", { className: "flex items-center gap-2 text-sm px-4 py-2 rounded-lg font-bold text-red-500 hover:bg-red-50 hover:text-red-600 transition-all duration-300 border border-transparent hover:border-red-100", children: [
          /* @__PURE__ */ jsx(UserPen, { className: "w-4 h-4" }),
          /* @__PURE__ */ jsx("span", { className: "hidden sm:inline", children: "ENG: Youssif Hamed" })
        ] })
      ] }),
      /* @__PURE__ */ jsx("nav", { className: "md:hidden flex overflow-x-auto gap-2 px-4 pb-3 pt-2 hide-scrollbar", children: [
        ...isSecCashier || isMain ? warehouseNav : [],
        ...primaryNav.filter((n) => n.showFor.includes(deviceType))
      ].map((n) => {
        const active = pathname === n.to;
        const Icon = n.icon;
        if ("requiredRole" in n && n.requiredRole) {
          return /* @__PURE__ */ jsx(
            ActionGate,
            {
              requiredRole: "مالك",
              actionName: `الدخول إلى شاشة ${n.label}`,
              onSuccess: () => navigate({ to: n.to }),
              children: /* @__PURE__ */ jsxs(
                "button",
                {
                  className: `shrink-0 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all duration-300 ${active ? "bg-rose-600 text-white shadow-lg shadow-rose-600/30 scale-105 ring-2 ring-rose-300" : "bg-gray-100 text-gray-700 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200"}`,
                  children: [
                    /* @__PURE__ */ jsx(Icon, { className: "w-4 h-4" }),
                    n.label
                  ]
                }
              )
            },
            n.to
          );
        }
        return /* @__PURE__ */ jsxs(
          Link,
          {
            to: n.to,
            className: `shrink-0 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all duration-300 ${active ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20 scale-105" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`,
            children: [
              /* @__PURE__ */ jsx(Icon, { className: "w-4 h-4" }),
              n.label
            ]
          },
          n.to
        );
      }) })
    ] }),
    /* @__PURE__ */ jsx("main", { className: "flex-1 max-w-7xl w-full mx-auto px-4 py-8 animate-in fade-in duration-700", children }),
    /* @__PURE__ */ jsx(
      "style",
      {
        dangerouslySetInnerHTML: {
          __html: `.hide-scrollbar::-webkit-scrollbar { display: none; } .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`
        }
      }
    )
  ] });
}
const Toaster = ({ ...props }) => {
  return /* @__PURE__ */ jsx(
    Toaster$1,
    {
      className: "toaster group",
      toastOptions: {
        classNames: {
          toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground"
        }
      },
      ...props
    }
  );
};
function NotFoundComponent() {
  return /* @__PURE__ */ jsx("div", { className: "flex min-h-screen items-center justify-center bg-background px-4", children: /* @__PURE__ */ jsxs("div", { className: "max-w-md text-center", children: [
    /* @__PURE__ */ jsx("h1", { className: "text-7xl font-bold text-foreground", children: "404" }),
    /* @__PURE__ */ jsx("h2", { className: "mt-4 text-xl font-semibold", children: "الصفحة غير موجودة" }),
    /* @__PURE__ */ jsx("div", { className: "mt-6", children: /* @__PURE__ */ jsx(
      Link,
      {
        to: "/",
        className: "inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90",
        children: "العودة للرئيسية"
      }
    ) })
  ] }) });
}
function ErrorComponent({ error, reset }) {
  console.error(error);
  const router2 = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return /* @__PURE__ */ jsx("div", { className: "flex min-h-screen items-center justify-center bg-background px-4", children: /* @__PURE__ */ jsxs("div", { className: "max-w-md text-center", children: [
    /* @__PURE__ */ jsx("h1", { className: "text-xl font-semibold", children: "حدث خطأ غير متوقع" }),
    /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: "يرجى إعادة المحاولة." }),
    /* @__PURE__ */ jsx("div", { className: "mt-6 flex flex-wrap justify-center gap-2", children: /* @__PURE__ */ jsx(
      "button",
      {
        onClick: () => {
          router2.invalidate();
          reset();
        },
        className: "rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90",
        children: "إعادة المحاولة"
      }
    ) })
  ] }) });
}
const Route$b = createRootRouteWithContext()(
  {
    head: () => ({
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { title: "مخزن" },
        {
          name: "description",
          content: "نظام إدارة المخزون للمطاعم - تتبع الأصناف، أذونات التوريد والصرف، والتقارير."
        },
        { property: "og:title", content: "مخزن" },
        { name: "twitter:title", content: "مخزن" },
        {
          property: "og:description",
          content: "نظام إدارة المخزون للمطاعم - تتبع الأصناف، أذونات التوريد والصرف، والتقارير."
        },
        {
          name: "twitter:description",
          content: "نظام إدارة المخزون للمطاعم - تتبع الأصناف، أذونات التوريد والصرف، والتقارير."
        },
        {
          property: "og:image",
          content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/f9f55625-871d-4ffd-9198-cddcbc3070b6/id-preview-1b0c44a2--7d655c8c-367f-4891-9b74-86fb5ba85c82.lovable.app-1781270568522.png"
        },
        {
          name: "twitter:image",
          content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/f9f55625-871d-4ffd-9198-cddcbc3070b6/id-preview-1b0c44a2--7d655c8c-367f-4891-9b74-86fb5ba85c82.lovable.app-1781270568522.png"
        },
        { name: "twitter:card", content: "summary_large_image" },
        { property: "og:type", content: "website" }
      ],
      links: [
        { rel: "stylesheet", href: appCss },
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        {
          rel: "preconnect",
          href: "https://fonts.gstatic.com",
          crossOrigin: "anonymous"
        },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap"
        }
      ]
    }),
    shellComponent: RootShell,
    component: RootComponent,
    notFoundComponent: NotFoundComponent,
    errorComponent: ErrorComponent
  }
);
function RootShell({ children }) {
  return /* @__PURE__ */ jsxs("html", { lang: "ar", dir: "rtl", children: [
    /* @__PURE__ */ jsx("head", { children: /* @__PURE__ */ jsx(HeadContent, {}) }),
    /* @__PURE__ */ jsxs("body", { children: [
      children,
      /* @__PURE__ */ jsx(Scripts, {})
    ] })
  ] });
}
function RootComponent() {
  const { queryClient } = Route$b.useRouteContext();
  return /* @__PURE__ */ jsxs(QueryClientProvider, { client: queryClient, children: [
    /* @__PURE__ */ jsx(AuthGate, { children: /* @__PURE__ */ jsx(AppShell, { children: /* @__PURE__ */ jsx(Outlet, {}) }) }),
    /* @__PURE__ */ jsx(
      Toaster,
      {
        richColors: true,
        position: "top-center",
        dir: "rtl",
        toastOptions: { duration: 1e3 }
      }
    )
  ] });
}
const $$splitComponentImporter$9 = () => import("./settings-DQZFVAom.js");
const Route$a = createFileRoute("/settings")({
  head: () => ({
    meta: [{
      title: "الإعدادات - أرشيف الفواتير"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$9, "component")
});
const $$splitComponentImporter$8 = () => import("./roles-4NV-zkAC.js");
const Route$9 = createFileRoute("/roles")({
  head: () => ({
    meta: [{
      title: "بصمات الموظفين - الصلاحيات"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$8, "component")
});
const $$splitComponentImporter$7 = () => import("./reports-D9JrW5TW.js");
const Route$8 = createFileRoute("/reports")({
  head: () => ({
    meta: [{
      title: "التقارير - تقفيل الشيفت"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$7, "component")
});
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline"
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);
const Button = React.forwardRef(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return /* @__PURE__ */ jsx(Comp, { className: cn(buttonVariants({ variant, size, className })), ref, ...props });
  }
);
Button.displayName = "Button";
const Input = React.forwardRef(
  ({ className, type, ...props }, ref) => {
    return /* @__PURE__ */ jsx(
      "input",
      {
        type,
        className: cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        ),
        ref,
        ...props
      }
    );
  }
);
Input.displayName = "Input";
const API_URL$1 = getApiUrl();
const Route$7 = createFileRoute("/printers-settings")({
  component: PrintersSettingsTab
});
function PrintersSettingsTab() {
  const [printers, setPrinters] = useState([]);
  useEffect(() => {
    const saved = localStorage.getItem("pos_dynamic_printers");
    if (saved) {
      setPrinters(JSON.parse(saved));
    } else {
      const defaultPrinters = [
        {
          id: "1",
          name: "طابعة المطبخ الرئيسي",
          ip: "127.0.0.1",
          port: "9100",
          targetDept: "مطبخ"
        },
        {
          id: "2",
          name: "طابعة البار والمشروبات",
          ip: "127.0.0.1",
          port: "9101",
          targetDept: "بار"
        },
        {
          id: "3",
          name: "طابعة الشيشة الخارجية",
          ip: "127.0.0.1",
          port: "9102",
          targetDept: "شيشة"
        }
      ];
      setPrinters(defaultPrinters);
      localStorage.setItem(
        "pos_dynamic_printers",
        JSON.stringify(defaultPrinters)
      );
    }
    fetch(`http://${API_URL$1}:5000/api/printers`).then((res) => res.ok ? res.json() : null).then((dbData) => {
      if (dbData && Array.isArray(dbData)) {
        setPrinters(dbData);
        localStorage.setItem("pos_dynamic_printers", JSON.stringify(dbData));
      }
    }).catch(() => console.log(" يعمل أوفلاين بالاعتماد على الكاش المحلي"));
  }, []);
  const handleSaveAll = async () => {
    try {
      toast.loading("جاري حفظ إعدادات الطابعات في السيرفر...", {
        id: "save-printers"
      });
      const response = await fetch(
        `http://${API_URL$1}:5000/api/printers/bulk`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(printers)
        }
      );
      if (response.ok) {
        localStorage.setItem("pos_dynamic_printers", JSON.stringify(printers));
        toast.success(
          "✅ تم حفظ إعدادات الطابعات بنجاح في قاعدة البيانات والذاكرة المحلية!",
          { id: "save-printers" }
        );
      } else {
        throw new Error("السيرفر رفض حفظ البيانات");
      }
    } catch (error) {
      console.error("❌ فشل الحفظ في السيرفر:", error);
      localStorage.setItem("pos_dynamic_printers", JSON.stringify(printers));
      toast.warning(
        "⚠️ تعذر الاتصال بالسيرفر! تم حفظ الإعدادات محلياً في الـ LocalStorage فقط.",
        { id: "save-printers" }
      );
    }
  };
  const addPrinter = () => {
    const newP = {
      id: Date.now().toString(),
      name: "طابعة جديدة",
      ip: "192.168.1.100",
      port: "9100",
      targetDept: "مطبخ"
    };
    setPrinters([...printers, newP]);
  };
  const updatePrinter = (id, field, val) => {
    setPrinters(
      (prev) => prev.map((p) => p.id === id ? { ...p, [field]: val } : p)
    );
  };
  const removePrinter = (id) => {
    setPrinters((prev) => prev.filter((p) => p.id !== id));
  };
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6 max-w-4xl mx-auto p-4 pb-20 mt-10", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-5 rounded-2xl border shadow-sm", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("h2", { className: "text-xl font-bold flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Network, { className: "h-6 w-6 text-primary" }),
          "إدارة طابعات الأقسام (IP Printers)"
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground mt-1", children: "قم بتوجيه كل قسم (مطبخ، بار، شيشة) إلى طابعة الشبكة الخاصة به" })
      ] }),
      /* @__PURE__ */ jsxs(Button, { onClick: addPrinter, className: "gap-2 shrink-0 rounded-xl", children: [
        /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4" }),
        "إضافة طابعة جديدة"
      ] })
    ] }),
    printers.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "text-center p-12 bg-card border rounded-2xl border-dashed", children: [
      /* @__PURE__ */ jsx(Network, { className: "h-12 w-12 text-muted-foreground/30 mx-auto mb-3" }),
      /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold", children: "لا توجد طابعات مضافة" }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: 'اضغط على "إضافة طابعة جديدة" للبدء في توجيه طلبات الأقسام.' })
    ] }) : /* @__PURE__ */ jsx("div", { className: "grid gap-4", children: printers.map((printer) => /* @__PURE__ */ jsxs(
      "div",
      {
        className: "bg-card border rounded-2xl p-4 sm:p-5 grid grid-cols-1 md:grid-cols-12 gap-4 items-start md:items-center hover:border-primary/30 transition-colors shadow-sm",
        children: [
          /* @__PURE__ */ jsxs("div", { className: "md:col-span-3 space-y-1.5", children: [
            /* @__PURE__ */ jsx("label", { className: "text-xs font-bold text-muted-foreground", children: "اسم الطابعة (للتوضيح)" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                value: printer.name,
                onChange: (e) => updatePrinter(printer.id, "name", e.target.value),
                className: "font-bold border-muted-foreground/20 h-10 rounded-xl",
                placeholder: "مثال: طابعة المطبخ الساخن..."
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "md:col-span-3 space-y-1.5", children: [
            /* @__PURE__ */ jsx("label", { className: "text-xs font-bold text-muted-foreground", children: "رقم الـ IP (الشبكة)" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                dir: "ltr",
                value: printer.ip,
                onChange: (e) => updatePrinter(printer.id, "ip", e.target.value),
                className: "font-mono text-center border-muted-foreground/20 h-10 rounded-xl",
                placeholder: "192.168.1.100"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "md:col-span-2 space-y-1.5", children: [
            /* @__PURE__ */ jsx("label", { className: "text-xs font-bold text-muted-foreground", children: "البورت (Port)" }),
            /* @__PURE__ */ jsx(
              Input,
              {
                dir: "ltr",
                value: printer.port,
                onChange: (e) => updatePrinter(printer.id, "port", e.target.value),
                className: "font-mono text-center border-muted-foreground/20 h-10 rounded-xl",
                placeholder: "9100"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "md:col-span-3 space-y-1.5", children: [
            /* @__PURE__ */ jsx("label", { className: "text-xs font-bold text-muted-foreground", children: "تستقبل طلبات قسم" }),
            /* @__PURE__ */ jsxs(
              "select",
              {
                value: printer.targetDept,
                onChange: (e) => updatePrinter(printer.id, "targetDept", e.target.value),
                className: "w-full h-10 px-3 rounded-xl border border-muted-foreground/20 bg-background text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
                children: [
                  /* @__PURE__ */ jsx("option", { value: "مطبخ", children: "🍽️ قسم المطبخ (أكل)" }),
                  /* @__PURE__ */ jsx("option", { value: "بار", children: "🍹 قسم البار (مشروبات)" }),
                  /* @__PURE__ */ jsx("option", { value: "شيشة", children: "💨 قسم الشيشة والمعسل" })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsx("div", { className: "md:col-span-1 pt-4 md:pt-0 flex justify-end md:justify-center", children: /* @__PURE__ */ jsx(
            Button,
            {
              variant: "ghost",
              size: "icon",
              onClick: () => removePrinter(printer.id),
              className: "text-destructive hover:text-destructive hover:bg-destructive/10 h-9 w-9 rounded-xl",
              children: /* @__PURE__ */ jsx(Trash2, { className: "h-4 w-4" })
            }
          ) })
        ]
      },
      printer.id
    )) }),
    /* @__PURE__ */ jsxs("div", { className: "border-t pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 bg-muted/10 p-3 rounded-xl", children: [
      /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground flex items-center gap-1", children: [
        /* @__PURE__ */ jsx(Shield, { className: "h-3.5 w-3.5 text-yellow-600" }),
        "ملاحظة: تأكد من تثبيت الـ IP من إعدادات الراوتر لكل طابعة (Static IP) لضمان استقرار الاتصال دوماً."
      ] }),
      /* @__PURE__ */ jsx(
        Button,
        {
          onClick: handleSaveAll,
          className: "w-full sm:w-auto h-11 px-8 rounded-xl font-bold shadow-md hover:shadow-lg transition-all",
          children: "حفظ إعدادات الطابعات"
        }
      )
    ] })
  ] });
}
const $$splitComponentImporter$6 = () => import("./orders-BNh7Gy2X.js");
const Route$6 = createFileRoute("/orders")({
  head: () => ({
    meta: [{
      title: "الطلبات - نقطة البيع"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$6, "component")
});
const triggerPrint = (data, isFinal = false) => {
  const printWindow = window.open("", "_blank", "width=400,height=600");
  if (!printWindow) return;
  const commVal = Number(data.commissionValue) || Number(data.commission_value) || 0;
  const dPrice = Number(data.deliveryPrice) || 0;
  const finalDiscVal = Number(data.discountValue || 0);
  const finalTaxVal = Number(data.taxValue || 0);
  const computedTotal = Number(data.total) || Number(data.subtotal || 0) - finalDiscVal + finalTaxVal + dPrice + commVal;
  const invoiceNumber = data.invoiceNumber || "000000";
  const createdAt = data.createdAt || Date.now();
  const orderTypeArabic = data.type === "delivery" ? "توصيل 🛵" : data.type === "takeaway" ? "تيك أواي 🛍️" : "صالة 🍽️";
  const formattedDate = new Date(createdAt).toLocaleDateString("en-GB");
  const formattedTime = new Date(createdAt).toLocaleTimeString("ar-EG", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });
  const tableName = data.tableCode || data.customerName || "..........";
  const cashierName = data.cashierName || "..........";
  const itemsArray = typeof data.items === "string" ? JSON.parse(data.items) : data.items || [];
  const html = `
    <!doctype html>
    <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>فاتورة - ${invoiceNumber}</title>
        <script src="https://cdn.tailwindcss.com"><\/script>
        <style>
          @media print {
            body {
              background: white;
              margin: 0;
              padding: 0;
            }
            .receipt-container {
              box-shadow: none;
              max-width: 100%;
              padding: 10px;
            }
            /* لمنع تكرار راس الجدول */ 
            thead {
              display: table-row-group !important;
            }
          }
          body {
            background-color: #f5f5f5;
            direction: rtl;
            font-family: Arial, sans-serif;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .separator-line {
            border-top: 1px dashed #333;
            margin: 12px 0;
          }
          .separator-solid {
            border-top: 2px solid #000;
            margin: 16px 0;
          }
        </style>
      </head>
      <body class="p-4">
        <div class="receipt-container bg-white rounded-lg shadow-lg px-8 py-10 max-w-2xl mx-auto">
          
          <div class="mb-6 text-right">
            <div class="flex items-center justify-between mb-4">
              <div class="text-right">
                <div class="text-5xl font-bold text-black mb-1">مول زايد</div>
                <div class="text-sm text-gray-800">عنوان المطعم - مدينة طنطا</div>
              </div>
              <img
                class="h-16 w-16 ml-4"
                src="../.././public/favicon.ico"
                alt="Logo"
              />
            </div>
          </div>

          <div class="separator-solid"></div>

          <div class="text-center mb-6">
            <h2 class="text-2xl font-bold bg-gray-100 py-2 rounded-xl">
              ${orderTypeArabic}
            </h2>
          </div>

          <div class="grid grid-cols-2 gap-4 mb-6 text-center text-sm">
            <div>
              <div class="text-gray-500 mb-0.5">التاريخ</div>
              <div class="font-bold text-black text-xs">${formattedDate}</div>
            </div>
            <div>
              <div class="text-gray-500 mb-0.5">الوقت</div>
              <div class="font-bold text-black text-xs">${formattedTime}</div>
            </div>
            <div>
              <div>
                <div class="text-gray-500 mb-0.5">اسم الطاولة / الطلب</div>
                <div class="font-bold text-black border-b border-gray-300 pb-1">
                  ${tableName.length > 15 ? tableName.substring(0, 15) + "..." : tableName}
                </div>
              </div>
            </div>
            <div>
              <div class="text-gray-500 mb-0.5">اسم الكاشير</div>
              <div class="font-bold text-black border-b border-gray-300 pb-1">
                ${cashierName}
              </div>
            </div>
          </div>

          ${(data.type === "takeaway" || data.type === "delivery") && data.orderCategory && data.orderCategory !== "normal" ? `
              <div class="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-2.5 text-center text-xs font-bold mb-4">
                منصة التوصيل: 
                <span>
                  ${data.orderCategory === "talabat" ? "طلبات (Talabat)" : data.orderCategory === "fast" ? "فاست (Fast)" : data.orderCategory}
                </span>
              </div>
              ` : ""}

          <div class="separator-line"></div>

          <div class="mb-6">
            <table class="w-full table-fixed text-center text-sm mb-4">
              <thead>
                <tr class="border-b border-gray-300">
                  <th class="w-[22%] text-gray-800 font-bold py-3 text-xs text-center whitespace-nowrap">الإجمالي</th>
                  <th class="w-[20%] text-gray-800 font-bold py-3 text-xs text-center whitespace-nowrap">السعر</th>
                  <th class="w-[13%] text-gray-800 font-bold py-3 text-xs text-center whitespace-nowrap">الكمية</th>
                  <th class="w-[45%] text-gray-800 font-bold py-3 text-xs text-center whitespace-nowrap">الصنف</th>
                </tr>
              </thead>
              <tbody>
                ${itemsArray.map((line) => {
    const exStr = line.extras && line.extras.length ? ` <span class="text-xs text-gray-500 block mt-0.5 font-normal break-words whitespace-normal leading-relaxed">(+ ${line.extras.map((e) => e.name || e.label).join(", ")})</span>` : "";
    const displayName = line.mealName || line.name || "صنف غير معروف";
    const singlePrice = Number(line.unitPrice || line.price || 0) + (line.extras ? line.extras.reduce((s, e) => s + Number(e.price || 0), 0) : 0);
    const lineTotal = singlePrice * Number(line.qty || 1);
    return `
                    <tr class="border-b border-gray-200">
                      <td class="py-3 text-gray-700 text-center font-medium whitespace-nowrap">${lineTotal.toFixed(0)}</td>
                      <td class="py-3 text-gray-700 text-center whitespace-nowrap">${singlePrice.toFixed(0)}</td>
                      <td class="py-3 text-gray-700 text-center font-bold whitespace-nowrap">${line.qty}</td>
                      <td class="py-3 text-gray-800 font-bold text-center break-words whitespace-normal pr-1 leading-tight">
                        ${displayName}
                        ${exStr}
                      </td>
                    </tr>
                    `;
  }).join("")}
              </tbody>
            </table>
          </div>

          <div class="separator-solid"></div>

          <div class="mb-6 space-y-2.5 text-sm">
            <div class="flex justify-between items-center">
              <span class="text-gray-800 font-bold">المجموع الأصلي:</span>
              <span class="text-gray-700 font-semibold">${Number(data.subtotal || 0).toFixed(2)}</span>
            </div>
            
            ${finalDiscVal > 0 ? `
                <div class="flex justify-between items-center text-red-600 font-bold">
                  <span>الخصم (${data.discountPct || 0}%):</span>
                  <span>-${finalDiscVal.toFixed(2)}</span>
                </div>
                ` : ""}
            
            ${finalTaxVal > 0 ? `
                <div class="flex justify-between items-center text-gray-700">
                  <span>الضريبة (${data.taxPct || 0}%):</span>
                  <span>${finalTaxVal.toFixed(2)}</span>
                </div>
                ` : ""}

            ${commVal > 0 ? `
                <div class="flex justify-between items-center text-amber-700 font-bold">
                  <span>منصة (${data.orderCategory === "talabat" ? "طلبات" : "فاست"}):</span>
                  <span>+${commVal.toFixed(2)}</span>
                </div>
                ` : ""}

            ${dPrice > 0 ? `
                <div class="flex justify-between items-center text-gray-700 font-semibold">
                  <span>خدمة التوصيل:</span>
                  <span>+${dPrice.toFixed(2)}</span>
                </div>
                ` : ""}

            <div class="flex justify-between items-center text-xl font-black border-t border-b border-gray-300 py-3.5 mt-2">
              <span class="text-black">الإجمالي الكلي:</span>
              <span class="text-black text-2xl">${computedTotal.toFixed(2)}</span>
            </div>
          </div>

          <div class="grid grid-cols-1 gap-6 mb-6 text-right text-xs">
            <div>
              <div class="font-bold text-gray-800 mb-2 uppercase">أرقام التواصل</div>
              <div class="space-y-1 text-gray-600" dir="ltr">
                <div class="text-right">☎ +20 123 456 7890</div>
              </div>
            </div>
          </div>
          
          <div class="text-center mt-4">
            <div class="text-sm font-black text-gray-800 mb-2">
              شكراً لاختيارك.. نرجو أن نكون قد نلنا اعجابكم 🙏
            </div>
          </div>

        </div>

        <script>
          window.onload = function() {
            setTimeout(() => {
              window.print();
              window.close();
            }, 500);
          }
        <\/script>
      </body>
    </html>
  `;
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
};
const $$splitComponentImporter$5 = () => import("./issue-D5or8l2o.js");
const Route$5 = createFileRoute("/issue")({
  head: () => ({
    meta: [{
      title: "إذن صرف - نظام المخزون"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$5, "component")
});
const $$splitComponentImporter$4 = () => import("./inventory-DqAmP1-e.js");
const Route$4 = createFileRoute("/inventory")({
  head: () => ({
    meta: [{
      title: "المخزون - نظام المخزون"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
const $$splitComponentImporter$3 = () => import("./history-DWM4etDS.js");
const Route$3 = createFileRoute("/history")({
  head: () => ({
    meta: [{
      title: "سجل العمليات - نظام المخزون"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
const $$splitComponentImporter$2 = () => import("./entry-DeC4oFNp.js");
const Route$2 = createFileRoute("/entry")({
  head: () => ({
    meta: [{
      title: "إذن توريد - نظام المخزون"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
function round2(n) {
  if (!isFinite(n)) return 0;
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
function fmt2(n) {
  return round2(n || 0).toFixed(2);
}
function clamp0(v) {
  if (typeof v === "string") v = parseFloat(v.replace(/^-+/, "")) || 0;
  return Math.max(0, v);
}
function cleanNumInput(raw) {
  return raw.replace(/^-+/, "").replace(/[^\d.]/g, "").replace(/(\..*?)\./g, "$1");
}
const API_URL = getApiUrl();
if (typeof window !== "undefined") {
  if (!window.crypto) {
    window.crypto = {};
  }
  if (!window.crypto.randomUUID) {
    window.crypto.randomUUID = () => {
      return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === "x" ? r : r & 3 | 8;
        return v.toString(16);
      });
    };
  }
}
const UNITS = ["كيلوجرام", "لتر", "قطعة", "طبق", "كيس", "علبة"];
const SUB_UNIT_TYPES = [
  "كيلوجرام",
  "جرام",
  "لتر",
  "مل",
  "قطعة"
];
const YIELD_UNITS = ["كيلوجرام", "جرام", "لتر", "مل"];
const RECIPE_UNITS = [
  "جرام",
  "مل",
  "كيلوجرام",
  "لتر",
  "قطعة",
  "طبق",
  "كيس",
  "علبة"
];
const BASIC_UNITS = ["كيلوجرام", "لتر"];
const DEPARTMENTS = ["مطبخ", "بار", "صالة", "شيشه"];
const SUB_DEPTS = ["مطبخ", "بار", "شيشه"];
const deptKey = (dept, itemId) => `${dept}_${itemId}`;
const SHISHA_CATEGORY = "شيشه";
const KEY = "rest-inv-db-v1";
const PASS_HASH_KEY = "rest-inv-password-hash";
function nextCode(items) {
  let max = 0;
  for (const it of items) {
    const m = (it.code || "").match(/ING-(\d+)/);
    if (m) max = Math.max(max, parseInt(m[1]));
  }
  return "ING-" + String(max + 1).padStart(3, "0");
}
function defaultDB() {
  const items = [
    {
      id: crypto.randomUUID(),
      code: "ING-001",
      name: "طماطم",
      unit: "كيلوجرام",
      qty: 25,
      avgPrice: 12,
      critical: 10,
      conversionFactor: 1,
      kind: "standard",
      department: ""
    },
    {
      id: crypto.randomUUID(),
      code: "ING-002",
      name: "أرز بسمتي",
      unit: "كيس",
      qty: 8,
      avgPrice: 180,
      critical: 5,
      conversionFactor: 25e3,
      subUnitQty: 25e3,
      subUnitType: "جرام",
      kind: "standard",
      department: ""
    },
    {
      id: crypto.randomUUID(),
      code: "ING-003",
      name: "زيت دوار الشمس",
      unit: "لتر",
      qty: 4,
      avgPrice: 55,
      critical: 6,
      conversionFactor: 1,
      kind: "standard",
      department: ""
    },
    {
      id: crypto.randomUUID(),
      code: "ING-004",
      name: "دجاج",
      unit: "كيلوجرام",
      qty: 18,
      avgPrice: 85,
      critical: 10,
      conversionFactor: 1,
      kind: "standard",
      department: ""
    },
    {
      id: crypto.randomUUID(),
      code: "ING-005",
      name: "أكواب زجاجية",
      unit: "قطعة",
      qty: 120,
      avgPrice: 7,
      critical: 50,
      conversionFactor: 1,
      kind: "standard",
      department: ""
    }
  ];
  return {
    orders: void 0,
    updateDeptStock: void 0,
    items,
    vouchers: [],
    deptStock: {},
    meals: [],
    sales: [],
    audits: [],
    shifts: [],
    // 🌟 ضفنا دي
    invoices: [],
    // 🌟 وضفنا دي
    shift: null
    // 🌟 الـ shift مطلوب في الـ DB
    // shift: [], // 🌟 حطينا المصفوفة الاحتياطية للورديات
  };
}
function fixUnit(u) {
  if (u === "كيلو") return "كيلوجرام";
  if (UNITS.includes(u)) return u;
  return "قطعة";
}
function migrate(db) {
  const base = defaultDB();
  const out = {
    orders: db.orders,
    shifts: Array.isArray(db.shifts) ? db.shifts : base.shifts,
    // 🌟 تحديث المايجريشن
    invoices: Array.isArray(db.invoices) ? db.invoices : base.invoices,
    // 🌟 تحديث المايجريشن
    updateDeptStock: db.updateDeptStock,
    items: Array.isArray(db.items) ? db.items : base.items,
    vouchers: Array.isArray(db.vouchers) ? db.vouchers : [],
    deptStock: db.deptStock && typeof db.deptStock === "object" ? db.deptStock : {},
    meals: Array.isArray(db.meals) ? db.meals : [],
    sales: Array.isArray(db.sales) ? db.sales : [],
    audits: Array.isArray(db.audits) ? db.audits : [],
    shift: db.shift !== void 0 ? db.shift : base.shift
    // 🌟 مابين الـ shift القديم أو الديفولت
  };
  for (const it of out.items) {
    if (!it.code) it.code = nextCode(out.items.filter((x) => x.code));
    it.unit = fixUnit(it.unit);
    if (typeof it.conversionFactor !== "number" || it.conversionFactor <= 0)
      it.conversionFactor = 1;
    if (it.qty < 0) it.qty = 0;
    if (it.avgPrice < 0) it.avgPrice = 0;
    if (it.kind === "raw") it.kind = "processed";
    if (!it.kind) it.kind = "standard";
    delete it.yieldedFrom;
    if (it.yieldDef && Array.isArray(it.yieldDef.components)) {
      for (const c of it.yieldDef.components) {
        if (!c.unit) {
          const tgt = out.items.find((x) => x.id === c.itemId);
          c.unit = tgt?.unit === "لتر" ? "لتر" : "كيلوجرام";
        }
      }
      if (!it.yieldDef.wasteMode) it.yieldDef.wasteMode = "fixed";
    }
  }
  for (const v of out.vouchers) {
    for (const ln of v.lines) ln.unit = fixUnit(ln.unit);
  }
  for (const m of out.meals) {
    if (!m.kind) m.kind = "menu";
    if (!m.wasteMode) m.wasteMode = "percent";
    if (!m.category) m.category = "";
    for (const ing of m.ingredients) {
      if (ing.unit === "كيلو") ing.unit = "كيلوجرام";
      if (typeof ing.errorMargin !== "number" || ing.errorMargin < 0)
        ing.errorMargin = 0;
    }
  }
  return out;
}
function load() {
  if (typeof window === "undefined") return defaultDB();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      const d = defaultDB();
      localStorage.setItem(KEY, JSON.stringify(d));
      return d;
    }
    return migrate(JSON.parse(raw));
  } catch {
    return defaultDB();
  }
}
function save(db) {
  localStorage.setItem(KEY, JSON.stringify(db));
  window.dispatchEvent(new Event("db-update"));
}
function yieldToSubUnit(qty, fromUnit, subUnit) {
  if (!subUnit) return null;
  if (fromUnit === subUnit) return qty;
  if (fromUnit === "جرام" && subUnit === "كيلوجرام") return qty / 1e3;
  if (fromUnit === "كيلوجرام" && subUnit === "جرام") return qty * 1e3;
  if (fromUnit === "مل" && subUnit === "لتر") return qty / 1e3;
  if (fromUnit === "لتر" && subUnit === "مل") return qty * 1e3;
  return null;
}
function useDB() {
  const [db, setDb] = useState(
    () => typeof window !== "undefined" ? load() : {
      orders: void 0,
      updateDeptStock: void 0,
      shifts: [],
      // 🌟 إضافة عشان التايب سكريبت
      invoices: [],
      // 🌟 إضافة عشان التايب سكريبت
      items: [],
      vouchers: [],
      deptStock: {},
      meals: [],
      sales: [],
      audits: [],
      shift: null
      // 🌟 ضفنا الـ shift هنا عشان التايب سكريبت يرتاح
    }
  );
  useEffect(() => {
    const refresh = () => setDb(load());
    refresh();
    window.addEventListener("db-update", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("db-update", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);
  const addItem = useCallback(async (item) => {
    const cleanItem = {
      id: typeof window !== "undefined" && window.crypto?.randomUUID ? window.crypto.randomUUID() : "local-" + Date.now(),
      department: item.department || "",
      code: item.code || "",
      name: item.name || "",
      unit: item.unit,
      qty: Number(item.qty) || 0,
      avgPrice: Number(item.avgPrice) || 0,
      critical: Number(item.critical) || 0,
      conversionFactor: Number(item.conversionFactor) || 1,
      subUnitQty: Number(item.subUnitQty) || 0,
      subUnitType: item.subUnitType,
      kind: item.kind || "standard",
      yieldDef: item.yieldDef || void 0,
      lastYieldDeltas: item.lastYieldDeltas || [],
      notes: item.notes || ""
    };
    console.log("🚀 البيانات اللي طالعة من الفورمة للسيرفر:", cleanItem);
    try {
      const response = await fetch(`http://${API_URL}:5000/api/inventory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cleanItem)
      });
      if (response.ok) {
        const savedItem = await response.json();
        const cur = load();
        cur.items = [...cur.items, savedItem];
        save(cur);
        setDb(cur);
        toast.success(
          `✅ تم تسجيل الصنف "${savedItem.name}" في الداتابيز بنجاح!`
        );
        return savedItem;
      } else {
        const errorText = await response.text();
        console.error("⚠️ رد السيرفر بالرفض:", errorText);
        toast.error("⚠️ السيرفر رفض حفظ الصنف الجديد");
      }
    } catch (error) {
      console.error("❌ السيرفر واقع أو مش شغال:", error);
      toast.error("مش قادر أتصل بالسيرفر أصلاً.");
    }
  }, []);
  const updateItem = useCallback(
    async (id, updatedFields) => {
      const cur = load();
      const currentItem = cur.items.find((i) => i.id === id);
      if (!currentItem) return;
      const fullUpdatedItem = { ...currentItem, ...updatedFields };
      try {
        const response = await fetch(`http://${API_URL}:5000/api/inventory`, {
          method: "POST",
          // السيرفر بيستقبلها وبيدخل في الـ UPDATE علطول بسبب الـ ON CONFLICT
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(fullUpdatedItem)
        });
        if (response.ok) {
          const savedItem = await response.json();
          cur.items = cur.items.map((i) => i.id === id ? savedItem : i);
          save(cur);
          setDb(cur);
          toast.success("✅ تم تحديث بيانات الصنف بنجاح");
        } else {
          toast.error("⚠️ فشل تحديث بيانات الصنف بالسيرفر");
        }
      } catch (error) {
        console.error("❌ خطأ أثناء تحديث الصنف:", error);
        toast.error("خطأ في الاتصال بالسيرفر أثناء التعديل");
      }
    },
    []
  );
  const deleteItem = useCallback(async (id) => {
    try {
      const response = await fetch(
        `http://${API_URL}:5000/api/inventory/${id}`,
        {
          method: "DELETE"
        }
      );
      if (response.ok) {
        const cur = load();
        cur.items = cur.items.filter((i) => i.id !== id);
        save(cur);
        setDb(cur);
        toast.success("🗑️ تم حذف الصنف نهائياً من الداتابيز والكاش");
      } else {
        toast.error("⚠️ السيرفر رفض عملية الحذف");
      }
    } catch (error) {
      console.error("❌ خطأ أثناء حذف الصنف:", error);
      toast.error("خطأ في الاتصال بالسيرفر أثناء الحذف");
    }
  }, []);
  const syncFromServer = useCallback(async () => {
    try {
      console.log("🔄 جاري سحب الأصناف، أرصدة الأقسام، الريسبي، والمبيعات...");
      const [invRes, deptRes, mealsRes, salesRes] = await Promise.all([
        fetch(`http://${API_URL}:5000/api/inventory`),
        fetch(`http://${API_URL}:5000/api/dept-stock`),
        fetch(`http://${API_URL}:5000/api/meals`),
        fetch(`http://${API_URL}:5000/api/sales`)
        // 🌟 ضفنا مسار المبيعات هنا
      ]);
      if (invRes.ok && deptRes.ok && mealsRes.ok && salesRes.ok) {
        const serverItems = await invRes.json();
        const deptStockData = await deptRes.json();
        const serverMeals = await mealsRes.json();
        const serverSales = await salesRes.json();
        const cur = load();
        cur.items = serverItems;
        cur.meals = serverMeals;
        cur.sales = serverSales;
        const newDeptStock = {};
        deptStockData.forEach((row) => {
          const key = deptKey(row.department, row.item_id);
          newDeptStock[key] = Number(row.qty);
        });
        cur.deptStock = newDeptStock;
        save(cur);
        setDb(cur);
      }
    } catch (error) {
      console.error("❌ فشل سحب البيانات من السيرفر:", error);
    }
  }, []);
  useEffect(() => {
    syncFromServer();
    const refresh = () => setDb(load());
    window.addEventListener("db-update", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("db-update", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [syncFromServer]);
  const addEntryVoucher = useCallback(
    async (date, supplier, lines) => {
      const cur = load();
      const fullLines = [];
      const itemsToUpdateDB = [];
      for (const l of lines) {
        const qty = clamp0(l.qty);
        const price = clamp0(l.price);
        if (qty <= 0) continue;
        const item = cur.items.find((i) => i.id === l.itemId);
        if (!item) continue;
        const newQty = item.qty + qty;
        const newAvg = newQty > 0 ? (item.qty * item.avgPrice + qty * price) / newQty : price;
        item.qty = round2(clamp0(newQty));
        item.avgPrice = round2(clamp0(newAvg));
        itemsToUpdateDB.push(item);
        fullLines.push({
          itemId: item.id,
          itemName: item.name,
          unit: item.unit,
          qty: round2(qty),
          price: round2(price)
        });
      }
      const v = {
        id: crypto.randomUUID(),
        type: "entry",
        date,
        supplier,
        lines: fullLines,
        createdAt: Date.now()
      };
      fetch(`http://${API_URL}:5000/api/vouchers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(v)
      }).catch((err) => console.error("❌ فشل إرسال إذن التوريد:", err));
      cur.vouchers.unshift(v);
      save(cur);
      setDb(cur);
      for (const updatedItem of itemsToUpdateDB) {
        try {
          await fetch(`http://${API_URL}:5000/api/inventory`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedItem)
          });
        } catch (err) {
          console.error("❌ فشل مزامنة الصنف مع الداتابيز بعد التوريد:", err);
        }
      }
      return v;
    },
    []
  );
  const addIssueVoucher = useCallback(
    async (date, department, lines) => {
      const cur = load();
      for (const l of lines) {
        const q = clamp0(l.qty);
        if (q <= 0)
          return { ok: false, error: "الكمية يجب أن تكون أكبر من صفر" };
        const item = cur.items.find((i) => i.id === l.itemId);
        if (!item) return { ok: false, error: "صنف غير موجود" };
        if (q > item.qty)
          return {
            ok: false,
            error: `الكمية المطلوبة من "${item.name}" تتجاوز المتاح (${round2(item.qty)} ${item.unit})`
          };
      }
      const fullLines = [];
      const itemsToUpdateDB = [];
      const deptStocksToUpdateDB = [];
      const isSubDept = SUB_DEPTS.includes(department);
      for (const l of lines) {
        const q = clamp0(l.qty);
        const item = cur.items.find((i) => i.id === l.itemId);
        item.qty = round2(clamp0(item.qty - q));
        itemsToUpdateDB.push(item);
        fullLines.push({
          itemId: item.id,
          itemName: item.name,
          unit: item.unit,
          qty: round2(q)
        });
        if (isSubDept) {
          const k = deptKey(department, item.id);
          const newDeptQty = round2(clamp0((cur.deptStock[k] || 0) + q));
          cur.deptStock[k] = newDeptQty;
          deptStocksToUpdateDB.push({
            department,
            itemId: item.id,
            itemName: item.name,
            qty: newDeptQty
          });
        }
      }
      const v = {
        id: crypto.randomUUID(),
        type: "issue",
        date,
        department,
        lines: fullLines,
        createdAt: Date.now()
      };
      fetch(`http://${API_URL}:5000/api/vouchers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(v)
      }).catch((err) => console.error("❌ فشل إرسال إذن الصرف:", err));
      cur.vouchers.unshift(v);
      save(cur);
      setDb(cur);
      for (const updatedItem of itemsToUpdateDB) {
        try {
          await fetch(`http://${API_URL}:5000/api/inventory`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedItem)
          });
        } catch (err) {
          console.error("❌ فشل خصم الصنف من الداتابيز بعد الصرف:", err);
        }
      }
      for (const ds of deptStocksToUpdateDB) {
        try {
          await fetch(`http://${API_URL}:5000/api/dept-stock`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(ds)
          });
        } catch (err) {
          console.error(`❌ فشل حفظ رصيد ${ds.department} في الداتابيز:`, err);
        }
      }
      return { ok: true, voucher: v };
    },
    []
  );
  const saveMeal = useCallback(async (meal) => {
    const cur = load();
    const m = {
      ...meal,
      sellingPrice: round2(clamp0(meal.sellingPrice)),
      wasteMargin: 0,
      wasteMode: "fixed",
      kind: meal.kind || "menu"
    };
    const idx = cur.meals.findIndex((x) => x.id === m.id);
    if (idx >= 0) cur.meals[idx] = m;
    else cur.meals.push(m);
    save(cur);
    setDb(cur);
    try {
      await fetch(`http://${API_URL}:5000/api/meals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(m)
      });
    } catch (e) {
      console.error("❌ فشل حفظ الريسبي في السيرفر:", e);
    }
  }, []);
  const deleteMeal = useCallback(async (id) => {
    const cur = load();
    cur.meals = cur.meals.filter((m) => m.id !== id);
    save(cur);
    setDb(cur);
    try {
      await fetch(`http://${API_URL}:5000/api/meals/${id}`, {
        method: "DELETE"
      });
    } catch (e) {
      console.error("❌ فشل حذف الريسبي من السيرفر:", e);
    }
  }, []);
  const bulkAddMeals = useCallback(async (meals) => {
    const cur = load();
    const formattedMeals = meals.map((m) => ({
      ...m,
      wasteMargin: 0,
      wasteMode: "fixed",
      kind: m.kind || "menu"
    }));
    cur.meals.push(...formattedMeals);
    save(cur);
    setDb(cur);
    for (const m of formattedMeals) {
      try {
        await fetch(`http://${API_URL}:5000/api/meals`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(m)
        });
      } catch (e) {
        console.error("❌ فشل رفع أحد الأصناف:", e);
      }
    }
  }, []);
  const addSale = useCallback(
    async (date, department, lines) => {
      const cur = load();
      const deductions = /* @__PURE__ */ new Map();
      let totalSales = 0;
      let totalCost = 0;
      for (const sl of lines) {
        const qty = clamp0(sl.qty);
        if (qty <= 0) continue;
        const meal = cur.meals.find((m) => m.id === sl.mealId);
        if (!meal) continue;
        if (meal.department !== department) {
          return {
            ok: false,
            error: `الصنف "${meal.name}" لا ينتمي لقسم ${department}`
          };
        }
        totalSales += meal.sellingPrice * qty;
        const baseDeds = expandMealToBase(meal, cur.meals, cur.items);
        for (const [itemId, info] of baseDeds) {
          const total = info.qty * qty;
          deductions.set(itemId, (deductions.get(itemId) || 0) + total);
          totalCost += info.cost * qty;
        }
      }
      for (const [itemId, qty] of deductions) {
        const k = deptKey(department, itemId);
        const have = cur.deptStock[k] || 0;
        if (qty > have + 1e-9) {
          const it = cur.items.find((i) => i.id === itemId);
          return {
            ok: false,
            error: `عفواً، لا يمكن إتمام البيع بسبب نقص الموارد! (نقص في: ${it?.name || "صنف"})`
          };
        }
      }
      const sale = {
        id: crypto.randomUUID(),
        date,
        department,
        lines,
        totalSales: round2(clamp0(totalSales)),
        totalCost: round2(clamp0(totalCost)),
        createdAt: Date.now()
      };
      try {
        const response = await fetch(`http://${API_URL}:5000/api/sales`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sale)
        });
        if (!response.ok) {
          return {
            ok: false,
            error: "فشل تسجيل المبيعات في خادم قاعدة البيانات"
          };
        }
      } catch (err) {
        console.error("❌ فشل الاتصال بالسيرفر لحفظ البيع:", err);
        return {
          ok: false,
          error: "خطأ في الاتصال بالسيرفر، لم يتم حفظ العملية."
        };
      }
      for (const [itemId, qty] of deductions) {
        const k = deptKey(department, itemId);
        cur.deptStock[k] = round2(clamp0((cur.deptStock[k] || 0) - qty));
      }
      cur.sales.unshift(sale);
      save(cur);
      setDb(cur);
      return { ok: true, sale };
    },
    []
  );
  const addAudit = useCallback(
    async (audit, opts = {}) => {
      const cur = load();
      const prior = cur.audits.find(
        (a) => a.date === audit.date && a.department === audit.department
      );
      if (prior && !opts.overwrite) return { ok: false, error: "duplicate" };
      try {
        const response = await fetch(`http://${API_URL}:5000/api/audits`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(audit)
        });
        if (!response.ok) {
          return { ok: false, error: "فشل حفظ الجرد في قاعدة البيانات" };
        }
      } catch (err) {
        console.error("❌ فشل الاتصال بالسيرفر لحفظ الجرد:", err);
        return { ok: false, error: "خطأ في الاتصال بالسيرفر" };
      }
      if (prior) {
        for (const r of prior.rows) {
          if (r.expected > r.actual) {
            const k = deptKey(prior.department, r.itemId);
            cur.deptStock[k] = round2(
              clamp0((cur.deptStock[k] || 0) + (r.expected - r.actual))
            );
          }
        }
        cur.audits = cur.audits.filter((a) => a.id !== prior.id);
      }
      if (opts.deduct) {
        for (const r of audit.rows) {
          if (r.expected > r.actual) {
            const k = deptKey(audit.department, r.itemId);
            cur.deptStock[k] = round2(
              clamp0((cur.deptStock[k] || 0) - (r.expected - r.actual))
            );
          }
        }
      }
      cur.audits.unshift(audit);
      save(cur);
      setDb(cur);
      return { ok: true, audit };
    },
    []
  );
  const setDeptStockQty = useCallback(
    async (dept, itemId, newQty) => {
      const cur = load();
      const safeQty = Math.max(0, newQty);
      const key = deptKey(dept, itemId);
      cur.deptStock[key] = safeQty;
      save(cur);
      setDb(cur);
      const itemName = cur.items.find((i) => i.id === itemId)?.name || "غير محدد";
      try {
        await fetch(`http://${API_URL}:5000/api/dept-stock`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            itemId,
            itemName,
            department: dept,
            qty: safeQty
          })
        });
        console.log(
          `✅ تم حفظ رصيد ${dept} للصنف ${itemName} في الداتابيز بنجاح!`
        );
      } catch (err) {
        console.error("❌ فشل تحديث رصيد القسم في السيرفر:", err);
      }
    },
    []
  );
  const deductSubStock = useCallback(
    async (dept, deltas) => {
      const cur = load();
      const payloadItems = [];
      for (const d of deltas) {
        const k = deptKey(dept, d.itemId);
        const newQty = round2(
          clamp0((cur.deptStock[k] || 0) - clamp0(d.baseQty))
        );
        cur.deptStock[k] = newQty;
        payloadItems.push({
          itemId: d.itemId,
          baseQty: d.baseQty
        });
      }
      save(cur);
      setDb(cur);
      if (payloadItems.length > 0) {
        try {
          await fetch(`http://${API_URL}:5000/api/inventory/deduct-substock`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              department: dept,
              items: payloadItems
            })
          });
        } catch (err) {
          console.error(`❌ فشل خصم رصيد ${dept} من الداتابيز:`, err);
        }
      }
    },
    []
  );
  return {
    db,
    syncFromServer,
    addItem,
    updateItem,
    deleteItem,
    addEntryVoucher,
    addIssueVoucher,
    saveMeal,
    deleteMeal,
    bulkAddMeals,
    addSale,
    addAudit,
    setDeptStockQty,
    deductSubStock
  };
}
async function verifyPin(pin) {
  if (typeof window === "undefined") return false;
  const stored = localStorage.getItem(PASS_HASH_KEY);
  if (!stored || !pin) return false;
  const h = sha256(pin);
  return h === stored;
}
function expandMealToBase(meal, allMeals, allItems, visited = /* @__PURE__ */ new Set()) {
  const out = /* @__PURE__ */ new Map();
  if (visited.has(meal.id)) return out;
  visited.add(meal.id);
  for (const ing of meal.ingredients) {
    if (ing.refKind === "meal") {
      const sub = allMeals.find((m) => m.id === ing.itemId);
      if (!sub) continue;
      const subMap = expandMealToBase(
        sub,
        allMeals,
        allItems,
        new Set(visited)
      );
      for (const [iid, info] of subMap) {
        const scaled = { qty: info.qty * ing.qty, cost: info.cost * ing.qty };
        const cur = out.get(iid) || { qty: 0, cost: 0 };
        cur.qty += scaled.qty;
        cur.cost += scaled.cost;
        out.set(iid, cur);
      }
    } else {
      const item = allItems.find((i) => i.id === ing.itemId);
      if (!item) continue;
      const base = convertToBase(
        ing.qty,
        ing.unit,
        item.unit,
        item.conversionFactor,
        item.subUnitType
      );
      const cost = base * item.avgPrice;
      const cur = out.get(item.id) || { qty: 0, cost: 0 };
      cur.qty += base;
      cur.cost += cost;
      out.set(item.id, cur);
    }
  }
  return out;
}
function convertToBase(qty, recipeUnit, invUnit, conv, subUnitType) {
  if (recipeUnit === invUnit) return qty;
  if (recipeUnit === "جرام" && invUnit === "كيلوجرام") return qty / 1e3;
  if (recipeUnit === "كيلوجرام" && invUnit === "كيلوجرام") return qty;
  if (recipeUnit === "مل" && invUnit === "لتر") return qty / 1e3;
  if (subUnitType && recipeUnit === subUnitType && conv > 0)
    return qty / conv;
  if (subUnitType === "كيلوجرام" && recipeUnit === "جرام" && conv > 0)
    return qty / (conv * 1e3);
  if (subUnitType === "لتر" && recipeUnit === "مل" && conv > 0)
    return qty / (conv * 1e3);
  if (recipeUnit === "قطعة" && (invUnit === "كيس" || invUnit === "طبق" || invUnit === "علبة"))
    return qty / (conv || 1);
  if (recipeUnit === "جرام" && (invUnit === "كيس" || invUnit === "طبق" || invUnit === "قطعة" || invUnit === "علبة") && conv > 0)
    return qty / conv;
  if (recipeUnit === "مل" && (invUnit === "كيس" || invUnit === "طبق" || invUnit === "قطعة" || invUnit === "علبة") && conv > 0)
    return qty / conv;
  return qty;
}
const $$splitComponentImporter$1 = () => import("./cost-control-DK_ot8_e.js");
const Route$1 = createFileRoute("/cost-control")({
  head: () => ({
    meta: [{
      title: "مراقبة التكاليف - نظام المخزون"
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
const $$splitComponentImporter = () => import("./index-Zp3lzCRT.js");
const Route = createFileRoute("/")({
  head: () => ({
    meta: [{
      title: "لوحة التحكم - نظام المخزون"
    }, {
      name: "description",
      content: "نظرة عامة على المخزون وتنبيهات نقص الأصناف."
    }]
  }),
  component: lazyRouteComponent($$splitComponentImporter, "component")
});
const SettingsRoute = Route$a.update({
  id: "/settings",
  path: "/settings",
  getParentRoute: () => Route$b
});
const RolesRoute = Route$9.update({
  id: "/roles",
  path: "/roles",
  getParentRoute: () => Route$b
});
const ReportsRoute = Route$8.update({
  id: "/reports",
  path: "/reports",
  getParentRoute: () => Route$b
});
const PrintersSettingsRoute = Route$7.update({
  id: "/printers-settings",
  path: "/printers-settings",
  getParentRoute: () => Route$b
});
const OrdersRoute = Route$6.update({
  id: "/orders",
  path: "/orders",
  getParentRoute: () => Route$b
});
const IssueRoute = Route$5.update({
  id: "/issue",
  path: "/issue",
  getParentRoute: () => Route$b
});
const InventoryRoute = Route$4.update({
  id: "/inventory",
  path: "/inventory",
  getParentRoute: () => Route$b
});
const HistoryRoute = Route$3.update({
  id: "/history",
  path: "/history",
  getParentRoute: () => Route$b
});
const EntryRoute = Route$2.update({
  id: "/entry",
  path: "/entry",
  getParentRoute: () => Route$b
});
const CostControlRoute = Route$1.update({
  id: "/cost-control",
  path: "/cost-control",
  getParentRoute: () => Route$b
});
const IndexRoute = Route.update({
  id: "/",
  path: "/",
  getParentRoute: () => Route$b
});
const rootRouteChildren = {
  IndexRoute,
  CostControlRoute,
  EntryRoute,
  HistoryRoute,
  InventoryRoute,
  IssueRoute,
  OrdersRoute,
  PrintersSettingsRoute,
  ReportsRoute,
  RolesRoute,
  SettingsRoute
};
const routeTree = Route$b._addFileChildren(rootRouteChildren)._addFileTypes();
const getRouter = () => {
  const queryClient = new QueryClient();
  const router2 = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0
  });
  return router2;
};
const router = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  getRouter
}, Symbol.toStringTag, { value: "Module" }));
export {
  ActionGate as A,
  Button as B,
  Dialog as D,
  Input as I,
  RECIPE_UNITS as R,
  SHISHA_CATEGORY as S,
  UNITS as U,
  YIELD_UNITS as Y,
  DialogContent as a,
  DialogHeader as b,
  clamp0 as c,
  DialogTitle as d,
  DialogFooter as e,
  fmt2 as f,
  getApiUrl as g,
  cleanNumInput as h,
  expandMealToBase as i,
  deptKey as j,
  DEPARTMENTS as k,
  SUB_UNIT_TYPES as l,
  BASIC_UNITS as m,
  SUB_DEPTS as n,
  convertToBase as o,
  DialogDescription as p,
  router as q,
  round2 as r,
  triggerPrint as t,
  useDB as u,
  verifyPin as v,
  yieldToSubUnit as y
};
