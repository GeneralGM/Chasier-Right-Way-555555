import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { I as Input, B as Button, u as useDB, D as Dialog, a as DialogContent, b as DialogHeader, d as DialogTitle, e as DialogFooter, S as SHISHA_CATEGORY, f as fmt2, c as clamp0, h as cleanNumInput, A as ActionGate, g as getApiUrl, i as expandMealToBase, j as deptKey, r as round2, t as triggerPrint } from "./router-DvcG6CTK.js";
import { u as usePosDB, Z as ZONES, P as PAGE_SIZE, s as setGlobalEditingTable, c as computeTotals } from "./pos-store-Drg8tCrh.js";
import { ShieldCheck, Monitor, RefreshCw, Search, Plus, Printer, ArrowLeftRight, UserPlus, CheckCircle2, ChevronRight, ChevronLeft, Lock, Trash2, AlertTriangle } from "lucide-react";
import "@tanstack/react-query";
import "@tanstack/react-router";
import "@radix-ui/react-dialog";
import "clsx";
import "tailwind-merge";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "js-sha256";
const API_URL = getApiUrl();
function OrdersGate() {
  const {
    db: pos
  } = usePosDB();
  const [isSecCashier] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("isSecCashierDevice") === "true";
    }
    return false;
  });
  const [secCashierName, setSecCashierName] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("secCashierName");
    }
    return null;
  });
  if (!pos.shift) return /* @__PURE__ */ jsx(ShiftLogin, {});
  if (isSecCashier && !secCashierName) {
    return /* @__PURE__ */ jsx(SecCashierLogin, { onLogin: (name, id) => {
      if (typeof window !== "undefined") {
        localStorage.setItem("secCashierName", name);
        localStorage.setItem("secCashierId", id);
      }
      setSecCashierName(name);
    } });
  }
  return /* @__PURE__ */ jsx(PosScreen, {});
}
function SecCashierLogin({
  onLogin
}) {
  const {
    db: pos,
    findByPin
  } = usePosDB();
  const [pin, setPin] = useState("");
  const [err, setErr] = useState("");
  const [serverEmployees, setServerEmployees] = useState([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
  useEffect(() => {
    async function fetchEmployeesFallback() {
      if (pos.employees && pos.employees.length > 0) return;
      try {
        setIsLoadingEmployees(true);
        const response = await fetch(`http://${API_URL}:5000/api/employees`);
        if (response.ok) {
          const data = await response.json();
          setServerEmployees(data);
        }
      } catch (error) {
        console.error("❌ خطأ أثناء جلب الكاشيرية:", error);
      } finally {
        setIsLoadingEmployees(false);
      }
    }
    fetchEmployeesFallback();
  }, [pos.employees.length]);
  const activeEmployeesList = useMemo(() => {
    const map = /* @__PURE__ */ new Map();
    if (pos.employees) pos.employees.forEach((e) => map.set(e.name, e));
    if (serverEmployees) serverEmployees.forEach((e) => map.set(e.name, e));
    return Array.from(map.values());
  }, [pos.employees, serverEmployees]);
  async function submit(e) {
    e.preventDefault();
    setErr("");
    let emp = activeEmployeesList.find((x) => (x.pin === pin || x.pinHash === pin || x.pin_hash === pin) && x.role === "كاشير");
    if (!emp) {
      emp = await findByPin(pin, "كاشير");
    }
    if (!emp) {
      setErr("الرمز السري غير صحيح أو ليس لديك صلاحية كاشير");
      return;
    }
    toast.success(`مرحباً بك يا ${emp.name} في جهاز الكاشير الفرعي`);
    onLogin(emp.name, emp.id);
  }
  if (isLoadingEmployees) {
    return /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center h-[70vh]", dir: "rtl", children: /* @__PURE__ */ jsx("p", { className: "text-xl font-medium text-emerald-600 animate-pulse font-bold", children: "جاري التحقق من الكاشيرية المسجلين في السيرفر..." }) });
  }
  return /* @__PURE__ */ jsx("div", { dir: "rtl", className: "min-h-[70vh] grid place-items-center animate-in fade-in zoom-in-95 duration-300", children: /* @__PURE__ */ jsxs("form", { onSubmit: submit, className: "bg-white border border-gray-200 rounded-3xl p-8 w-full max-w-sm space-y-6 shadow-2xl relative overflow-hidden", children: [
    /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-teal-500" }),
    /* @__PURE__ */ jsxs("div", { className: "text-center space-y-2", children: [
      /* @__PURE__ */ jsx("div", { className: "mx-auto w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-4 border border-emerald-100", children: /* @__PURE__ */ jsx(ShieldCheck, { className: "w-8 h-8" }) }),
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-extrabold text-gray-800", children: "الكاشير الفرعي" }),
      /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-gray-500", children: "أدخل الرمز السري لبدء العمل" })
    ] }),
    /* @__PURE__ */ jsx(Input, { type: "password", inputMode: "numeric", autoFocus: true, value: pin, onChange: (e) => setPin(e.target.value), className: "text-center text-3xl tracking-widest h-14 font-bold text-emerald-700 bg-gray-50 border-gray-200 rounded-xl focus-visible:ring-emerald-500", placeholder: "••••" }),
    err && /* @__PURE__ */ jsx("p", { className: "text-sm font-bold text-red-500 text-center bg-red-50 py-2 rounded-lg", children: err }),
    /* @__PURE__ */ jsx(Button, { type: "submit", className: "w-full h-14 text-lg font-bold bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-500/20", disabled: !pin, children: "تسجيل الدخول" })
  ] }) });
}
function ShiftLogin() {
  const {
    db: pos,
    findByPin,
    openShift
  } = usePosDB();
  const [pin, setPin] = useState("");
  const [err, setErr] = useState("");
  const [serverEmployees, setServerEmployees] = useState([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
  const [isMicros, setIsMicros] = useState(() => {
    return localStorage.getItem("isMicrosDevice") === "true";
  });
  const [isSecCashier, setIsSecCashier] = useState(() => {
    return localStorage.getItem("isSecCashierDevice") === "true";
  });
  useEffect(() => {
    const checkMicros = localStorage.getItem("isMicrosDevice") === "true";
    const checkSecCashier = localStorage.getItem("isSecCashierDevice") === "true";
    setIsMicros(checkMicros);
    setIsSecCashier(checkSecCashier);
  }, []);
  useEffect(() => {
    async function fetchEmployeesFallback() {
      if (pos.employees && pos.employees.length > 0) return;
      try {
        setIsLoadingEmployees(true);
        const response = await fetch(`http://${API_URL}:5000/api/employees`);
        if (response.ok) {
          const data = await response.json();
          setServerEmployees(data);
        }
      } catch (error) {
        console.error("❌ خطأ أثناء جلب الكاشيرية:", error);
      } finally {
        setIsLoadingEmployees(false);
      }
    }
    fetchEmployeesFallback();
  }, [pos.employees.length]);
  const activeEmployeesList = useMemo(() => {
    const map = /* @__PURE__ */ new Map();
    if (pos.employees) pos.employees.forEach((e) => map.set(e.name, e));
    if (serverEmployees) serverEmployees.forEach((e) => map.set(e.name, e));
    return Array.from(map.values());
  }, [pos.employees, serverEmployees]);
  async function submit(e) {
    e.preventDefault();
    setErr("");
    const emp = activeEmployeesList.find((x) => (x.pin === pin || x.pinHash === pin || x.pin_hash === pin) && x.role === "كاشير");
    if (!emp) {
      const fallbackEmp = await findByPin(pin, "كاشير");
      if (!fallbackEmp) {
        setErr("كلمة سر الكاشير غير صحيحة");
        return;
      }
      openShift(fallbackEmp.id, fallbackEmp.name);
      toast.success(`أهلاً ${fallbackEmp.name} — بدأت الشيفت`);
      return;
    }
    openShift(emp.id, emp.name);
    toast.success(`أهلاً ${emp.name} — بدأت الشيفت`);
  }
  if (isLoadingEmployees) {
    return /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center h-[70vh]", dir: "rtl", children: /* @__PURE__ */ jsx("p", { className: "text-xl font-medium text-amber-600 animate-pulse font-bold", children: "جاري التحقق من الكاشيرية المسجلين في السيرفر..." }) });
  }
  const cashiersCount = activeEmployeesList.filter((e) => e.role === "كاشير").length;
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    isMicros && /* @__PURE__ */ jsxs("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md animate-[fadeIn_0.2s_ease-out_forwards]", children: [
      /* @__PURE__ */ jsxs("div", { className: "relative w-full max-w-md p-6 overflow-hidden border shadow-2xl bg-white rounded-2xl border-gray-200 animate-[scaleUp_0.3s_cubic-bezier(0.34,1.56,0.64,1)_forwards]", children: [
        /* @__PURE__ */ jsx("div", { className: "absolute -top-12 -left-12 w-32 h-32 bg-emerald-100 rounded-full blur-3xl animate-pulse" }),
        /* @__PURE__ */ jsx("div", { className: "absolute -bottom-12 -right-12 w-32 h-32 bg-gray-100 rounded-full blur-3xl animate-pulse" }),
        /* @__PURE__ */ jsxs("div", { className: "relative flex flex-col items-center text-center space-y-5", children: [
          /* @__PURE__ */ jsxs("div", { className: "relative flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100", children: [
            /* @__PURE__ */ jsx("span", { className: "absolute inline-flex h-full w-full rounded-full bg-emerald-400/20 opacity-75 animate-ping" }),
            /* @__PURE__ */ jsx(ShieldCheck, { className: "w-8 h-8 relative z-10 animate-bounce" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
            /* @__PURE__ */ jsx("h2", { className: "text-xl font-bold tracking-tight text-gray-800", children: "حالة نظام الكاشير" }),
            /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold leading-relaxed text-emerald-700 bg-emerald-50/60 border border-emerald-100/80 px-4 py-2.5 rounded-xl", children: "لابد من فتح الشيفت في جهاز الكاشير الأساسي أولاً" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "w-full p-4 text-right bg-gray-50 rounded-xl border border-gray-100 space-y-2", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-gray-500 text-xs font-bold", children: [
              /* @__PURE__ */ jsx(Monitor, { className: "w-4 h-4 text-emerald-600" }),
              /* @__PURE__ */ jsx("span", { children: "الخطوات المطلوبة:" })
            ] }),
            /* @__PURE__ */ jsxs("p", { className: "text-[11px] text-gray-600 leading-normal pr-5 relative", children: [
              /* @__PURE__ */ jsx("span", { className: "absolute right-1 top-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500" }),
              "توجه إلى الشاشة الرئيسية لجهاز الكاشير السيرفر (الأساسي)، قم بتسجيل الدخول وبدء وردية جديدة لتفعيل النظام على باقي الأجهزة الفرعية."
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "flex flex-col w-full gap-2 pt-2", children: /* @__PURE__ */ jsxs("button", { onClick: () => window.location.reload(), className: "flex items-center justify-center gap-2 h-10 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-sm group active:scale-[0.98]", children: [
            /* @__PURE__ */ jsx(RefreshCw, { className: "w-3.5 h-3.5 transition-transform group-hover:rotate-180 duration-500" }),
            "إعادة فحص حالة الشيفت"
          ] }) })
        ] })
      ] }),
      /* @__PURE__ */ jsx("style", { dangerouslySetInnerHTML: {
        __html: `
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleUp {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `
      } })
    ] }),
    !isMicros && /* @__PURE__ */ jsx("div", { dir: "rtl", className: "min-h-[70vh] grid place-items-center", children: /* @__PURE__ */ jsxs("form", { onSubmit: submit, className: "bg-card border border-border rounded-2xl p-8 w-full max-w-sm space-y-4 shadow-lg", children: [
      /* @__PURE__ */ jsxs("div", { className: "text-center space-y-1", children: [
        /* @__PURE__ */ jsx("h1", { className: "text-xl font-bold", children: "بدء شيفت الكاشير" }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground", children: "أدخل كلمة سر الكاشير لفتح شاشة الطلبات." })
      ] }),
      /* @__PURE__ */ jsx(Input, { type: "password", inputMode: "numeric", autoFocus: true, placeholder: "••••", value: pin, onChange: (e) => setPin(e.target.value), className: "text-center text-xl tracking-widest h-12" }),
      err && /* @__PURE__ */ jsx("p", { className: "text-xs text-destructive text-center", children: err }),
      /* @__PURE__ */ jsx(Button, { type: "submit", className: "w-full h-11", disabled: !pin || cashiersCount === 0, children: "دخول" }),
      cashiersCount === 0 && /* @__PURE__ */ jsx("p", { className: "text-xs text-amber-600 text-center font-bold", children: "لا يوجد كاشير مسجل — أضف من صفحة بصمات الموظفين." })
    ] }) })
  ] });
}
function PosScreen() {
  const {
    db
  } = useDB();
  const {
    db: pos,
    closeShift,
    clearOrder,
    upsertOrder
  } = usePosDB();
  const [zone, setZone] = useState("close");
  const [page, setPage] = useState(0);
  const [selectedTable, setSelectedTable] = useState(null);
  const [search, setSearch] = useState("");
  const [openOrder, setOpenOrder] = useState(null);
  const [transferOpen, setTransferOpen] = useState(false);
  const [printOrder, setPrintOrder] = useState(null);
  const [checkoutConfirm, setCheckoutConfirm] = useState(null);
  const [isMicros, setIsMicros] = useState(() => {
    return localStorage.getItem("isMicrosDevice") === "true";
  });
  const isSecCashier = localStorage.getItem("isSecCashierDevice") === "true";
  const [transferCaptainOpen, setTransferCaptainOpen] = useState(false);
  const [othersPromptOpen, setOthersPromptOpen] = useState(null);
  const [othersName, setOthersName] = useState("");
  const [othersType, setOthersType] = useState("staff");
  function handleOpenOrder(code) {
    setOpenOrder(code);
    setGlobalEditingTable(code);
  }
  const [captainPromptOpen, setCaptainPromptOpen] = useState(false);
  const [captainPromptMode, setCaptainPromptMode] = useState("new");
  const [targetTable, setTargetTable] = useState(null);
  const [captainPin, setCaptainPin] = useState("");
  useEffect(() => {
    const checkDevice = localStorage.getItem("isMicrosDevice") === "true";
    setIsMicros(checkDevice);
  }, []);
  const currentZone = ZONES.find((z) => z.id === zone);
  useEffect(() => {
    setPage(0);
    setSelectedTable(null);
  }, [zone]);
  const tableCodes = useMemo(() => {
    const arr = [];
    for (let i = 1; i <= currentZone.count; i++) arr.push(`${currentZone.prefix}${i}`);
    return arr;
  }, [currentZone]);
  const pageCount = Math.max(1, Math.ceil(tableCodes.length / PAGE_SIZE));
  const visible = tableCodes.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const filteredTables = useMemo(() => {
    if (!search) return visible;
    return visible.filter((code) => code.toUpperCase().includes(search.toUpperCase()));
  }, [visible, search]);
  function tableState(code) {
    const o = pos.orders[code];
    if (!o) return "empty";
    return o.state;
  }
  function jumpToCode(code) {
    const c = code.trim();
    if (!c) return;
    const z = ZONES.find((z2) => c.startsWith(z2.prefix) && z2.id !== "takeaway");
    if (!z) return toast.error("كود طاولة غير معروف");
    const n = parseInt(c.slice(z.prefix.length));
    if (!n || n < 1 || n > z.count) return toast.error("رقم الطاولة خارج النطاق");
    setZone(z.id);
    setPage(Math.floor((n - 1) / PAGE_SIZE));
    setSelectedTable(c);
  }
  function actionOpen() {
    if (!selectedTable) return toast.error("اختر طاولة أولاً");
    const order = pos.orders[selectedTable];
    if (zone === "others") {
      if (!order) {
        setOthersPromptOpen(selectedTable);
        return;
      }
      handleOpenOrder(selectedTable);
      return;
    }
    if (!isMicros) {
      if (!order) {
        upsertOrder({
          tableCode: selectedTable,
          zone,
          items: [],
          state: "active",
          discountPct: 0,
          taxPct: 14,
          openedAt: Date.now(),
          openedBy: "cashier",
          cashierName: pos.shift?.cashierName || "كاشير"
        });
      }
      handleOpenOrder(selectedTable);
    } else {
      if (!order) {
        setTargetTable(selectedTable);
        setCaptainPromptMode("new");
        setCaptainPin("");
        setCaptainPromptOpen(true);
      } else {
        setTargetTable(selectedTable);
        setCaptainPromptMode(order.openedBy === "captain" ? "verify_existing" : "verify_any");
        setCaptainPin("");
        setCaptainPromptOpen(true);
      }
    }
  }
  async function handleCaptainSubmit(e) {
    e.preventDefault();
    if (!captainPin) return;
    const order = pos.orders[targetTable];
    const expectedCaptain = captainPromptMode === "verify_existing" ? order?.captainName : void 0;
    try {
      const res = await fetch(`http://${API_URL}:5000/api/pos/verify-captain`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          password: captainPin,
          expectedCaptainName: expectedCaptain
          // 🌟 بنبعت للسيرفر الاسم اللي فاتح الطاولة حالياً
        })
      });
      const data = await res.json();
      if (data.success) {
        if (captainPromptMode === "new") {
          upsertOrder({
            tableCode: targetTable,
            zone,
            items: [],
            state: "active",
            discountPct: 0,
            taxPct: 14,
            openedAt: Date.now(),
            openedBy: "captain",
            captainName: data.captainName
          });
        } else if (captainPromptMode === "verify_any") {
          upsertOrder({
            ...order,
            captainName: data.captainName
          });
        }
        handleOpenOrder(targetTable);
        setCaptainPromptOpen(false);
      } else {
        toast.error(data.error || "رمز غير صحيح أو غير مصرح لك");
      }
    } catch (err) {
      toast.error("خطأ في الاتصال بالسيرفر");
    }
  }
  function actionPrint() {
    const order = selectedTable ? pos.orders[selectedTable] : null;
    if (!selectedTable || !order) return toast.error("لا يوجد طلب على هذه الطاولة");
    if (!order.items || order.items.length === 0) return toast.error("لا يمكن طباعة طاولة فارغة من الأصناف");
    setPrintOrder(selectedTable);
  }
  function actionCheckout() {
    const order = selectedTable ? pos.orders[selectedTable] : null;
    if (!selectedTable || !order) return toast.error("لا يوجد طلب على هذه الطاولة");
    if (!order.items || order.items.length === 0) {
      clearOrder(selectedTable);
      setSelectedTable(null);
      return toast.success("تم إلغاء الطاولة لأنها فارغة");
    }
    setCheckoutConfirm(selectedTable);
  }
  const secCashierName = localStorage.getItem("secCashierName");
  function handleLogout() {
    if (isSecCashier) {
      localStorage.removeItem("secCashierName");
      localStorage.removeItem("secCashierId");
      window.location.reload();
    } else {
      closeShift({
        kitchenSales: 0,
        barSales: 0,
        shishaSales: 0,
        taxValue: 0,
        discountValue: 0,
        dineinSales: 0,
        takeawaySales: 0,
        deliverySales: 0
      });
    }
  }
  const currentCashierName = isSecCashier ? secCashierName || "كاشير فرعي" : pos.shift?.cashierName || "جاري التحميل...";
  if (zone === "takeaway") {
    return /* @__PURE__ */ jsxs(
      PosFrame,
      {
        onLogout: handleLogout,
        cashierName: currentCashierName,
        zoneTabs: /* @__PURE__ */ jsx(ZoneTabs, { zone, setZone }),
        children: [
          /* @__PURE__ */ jsx(TakeawayView, { onOpenOrder: (code) => handleOpenOrder(code) }),
          openOrder && pos.orders[openOrder] && /* @__PURE__ */ jsx(OrderEntryDialog, { tableCode: openOrder, order: pos.orders[openOrder], meals: db.meals, items: db.items, onClose: () => {
            handleOpenOrder(null);
          } })
        ]
      }
    );
  }
  return /* @__PURE__ */ jsxs(
    PosFrame,
    {
      onLogout: handleLogout,
      cashierName: currentCashierName,
      zoneTabs: /* @__PURE__ */ jsx(ZoneTabs, { zone, setZone }),
      children: [
        /* @__PURE__ */ jsx(Dialog, { open: !!othersPromptOpen, onOpenChange: (o) => !o && setOthersPromptOpen(null), children: /* @__PURE__ */ jsxs(DialogContent, { dir: "rtl", className: "max-w-sm", children: [
          /* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsx(DialogTitle, { children: "بيانات الطلب الداخلي" }) }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-4 pt-4", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "text-xs font-bold mb-1 block", children: "اسم الشخص (موظف / إدارة)" }),
              /* @__PURE__ */ jsx(Input, { autoFocus: true, placeholder: "مثال: يوسف، أحمد المحاسب...", value: othersName, onChange: (e) => setOthersName(e.target.value) })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "text-xs font-bold mb-1 block", children: "نوع الطلب" }),
              /* @__PURE__ */ jsxs("select", { value: othersType, onChange: (e) => setOthersType(e.target.value), className: "w-full h-10 px-3 rounded-md border border-input bg-background text-sm font-bold", children: [
                /* @__PURE__ */ jsx("option", { value: "staff", children: "مسحوبات موظفين (Staff)" }),
                /* @__PURE__ */ jsx("option", { value: "hospitality", children: "ضيافة (Hospitality)" })
              ] })
            ] }),
            /* @__PURE__ */ jsx(Button, { className: "w-full h-11 font-bold", onClick: () => {
              if (!othersName.trim()) return toast.error("يجب إدخال الاسم");
              upsertOrder({
                tableCode: othersPromptOpen,
                zone: "others",
                items: [],
                state: "active",
                discountPct: 0,
                taxPct: 0,
                customerName: othersName.trim(),
                orderCategory: othersType,
                openedAt: Date.now(),
                openedBy: "cashier",
                cashierName: pos.shift?.cashierName || "كاشير"
              });
              handleOpenOrder(othersPromptOpen);
              setOthersPromptOpen(null);
              setOthersName("");
              setOthersType("staff");
            }, children: "فتح الطاولة" })
          ] })
        ] }) }),
        ";",
        /* @__PURE__ */ jsxs("div", { className: "px-4 pt-3 flex gap-2 items-center shrink-0", children: [
          /* @__PURE__ */ jsxs("div", { className: "relative flex-1", children: [
            /* @__PURE__ */ jsx(Search, { className: "w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" }),
            /* @__PURE__ */ jsx(Input, { dir: "rtl", placeholder: "بحث عن طاولة (مثال: O5, ك12, ص3)...", value: search, onChange: (e) => setSearch(e.target.value), onKeyDown: (e) => {
              if (e.key === "Enter") jumpToCode(search);
            }, className: "pe-10 h-10" })
          ] }),
          /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => jumpToCode(search), children: "اذهب" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex-1 flex gap-3 px-4 pt-3 min-h-0 overflow-hidden", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex-1 grid grid-cols-5 grid-rows-4 gap-3 min-h-0", children: [
            filteredTables.map((code) => {
              const order = pos.orders[code];
              const st = tableState(code);
              const sel = selectedTable === code;
              const matchSearch = search && code.toUpperCase().includes(search.toUpperCase());
              const hasItems = order && Array.isArray(order.items) && order.items.length > 0;
              const colors = !hasItems ? "bg-card border-border" : st === "active" ? "bg-amber-100 dark:bg-amber-950/40 border-amber-400 text-amber-900 dark:text-amber-200" : st === "printed" ? "bg-blue-100 dark:bg-blue-950/40 border-blue-400 text-blue-900 dark:text-blue-200" : "bg-card border-border";
              return /* @__PURE__ */ jsxs("button", { onClick: () => setSelectedTable(code), className: `relative rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition overflow-hidden p-2
        ${colors}
        ${sel ? "ring-4 ring-primary/60 scale-[1.02]" : ""}
        ${matchSearch ? "ring-2 ring-emerald-500" : ""}`, children: [
                /* @__PURE__ */ jsx(TableChairsSvg, {}),
                /* @__PURE__ */ jsx("span", { className: "font-bold text-lg text-center break-words px-1 leading-tight", children: order?.customerName || code }),
                hasItems && /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-center gap-0.5 mt-0.5 w-full px-1", children: [
                  order?.captainName && /* @__PURE__ */ jsxs("span", { className: "text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 px-1.5 py-0.5 rounded font-extrabold truncate max-w-full text-center", children: [
                    "كابتن: ",
                    order.captainName
                  ] }),
                  order?.cashierName && /* @__PURE__ */ jsxs("span", { className: "text-[10px] bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-200 px-1.5 py-0.5 rounded font-extrabold truncate max-w-full text-center", children: [
                    "كاشير: ",
                    order.cashierName
                  ] })
                ] }),
                st === "printed" && /* @__PURE__ */ jsx("span", { className: "text-[10px] uppercase tracking-wide font-bold mt-0.5 text-red-600", children: "مطبوع" })
              ] }, code);
            }),
            Array.from({
              length: PAGE_SIZE - visible.length
            }).map((_, i) => /* @__PURE__ */ jsx("div", { className: "rounded-2xl border-2 border-dashed border-border/40" }, `pad-${i}`))
          ] }),
          /* @__PURE__ */ jsxs("aside", { className: "w-44 shrink-0 flex flex-col gap-2", children: [
            /* @__PURE__ */ jsxs(Button, { onClick: actionOpen, className: "h-16 text-base gap-2", children: [
              /* @__PURE__ */ jsx(Plus, { className: "w-5 h-5" }),
              " فتح"
            ] }),
            !isMicros && /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsxs(Button, { onClick: actionPrint, variant: "secondary", className: "h-16 text-base gap-2", children: [
                /* @__PURE__ */ jsx(Printer, { className: "w-5 h-5" }),
                " طباعة"
              ] }),
              /* @__PURE__ */ jsxs(Button, { onClick: () => {
                const o = selectedTable ? pos.orders[selectedTable] : null;
                if (!selectedTable || !o) return toast.error("اختر طاولة نشطة أولاً");
                if (!o.items || o.items.length === 0) return toast.error("لا يمكن تحويل طاولة فارغة");
                setTransferOpen(true);
              }, variant: "secondary", className: "h-16 text-base gap-2", children: [
                /* @__PURE__ */ jsx(ArrowLeftRight, { className: "w-5 h-5" }),
                " تحويل الطاولة"
              ] }),
              /* @__PURE__ */ jsxs(Button, { onClick: () => {
                const o = selectedTable ? pos.orders[selectedTable] : null;
                if (!selectedTable || !o) return toast.error("اختر طاولة نشطة أولاً");
                if (!o.items || o.items.length === 0) return toast.error("لا يمكن تحويل كابتن لطاولة فارغة");
                setTransferCaptainOpen(true);
              }, variant: "secondary", className: "h-16 text-base gap-2", children: [
                /* @__PURE__ */ jsx(UserPlus, { className: "w-5 h-5" }),
                " تحويل الكابتن"
              ] }),
              /* @__PURE__ */ jsxs(Button, { onClick: actionCheckout, variant: "destructive", className: "h-16 text-base gap-2", children: [
                /* @__PURE__ */ jsx(CheckCircle2, { className: "w-5 h-5" }),
                " إنهاء"
              ] })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "px-4 py-2 flex items-center justify-between gap-3 shrink-0 border-t border-border", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
          /* @__PURE__ */ jsx(Button, { size: "sm", variant: "outline", disabled: page === 0, onClick: () => setPage((p) => Math.max(0, p - 1)), children: /* @__PURE__ */ jsx(ChevronRight, { className: "w-4 h-4" }) }),
          /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground px-2", children: [
            "صفحة ",
            page + 1,
            " / ",
            pageCount
          ] }),
          /* @__PURE__ */ jsx(Button, { size: "sm", variant: "outline", disabled: page >= pageCount - 1, onClick: () => setPage((p) => Math.min(pageCount - 1, p + 1)), children: /* @__PURE__ */ jsx(ChevronLeft, { className: "w-4 h-4" }) })
        ] }) }),
        /* @__PURE__ */ jsx(Dialog, { open: captainPromptOpen, onOpenChange: setCaptainPromptOpen, children: /* @__PURE__ */ jsxs(DialogContent, { dir: "rtl", className: "max-w-xs", children: [
          /* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsxs(DialogTitle, { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Lock, { className: "w-5 h-5 text-amber-600" }),
            "تأكيد الدخول"
          ] }) }),
          /* @__PURE__ */ jsxs("form", { onSubmit: handleCaptainSubmit, className: "space-y-4 pt-4", children: [
            /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: captainPromptMode === "verify_existing" ? "هذه الطاولة محصورة. يرجى إدخال بصمة الكابتن." : "يرجى إدخال الرمز السري الخاص بك ككابتن." }),
            /* @__PURE__ */ jsx(Input, { type: "password", inputMode: "numeric", autoFocus: true, placeholder: "••••", value: captainPin, onChange: (e) => setCaptainPin(e.target.value), className: "text-center text-xl tracking-widest h-12" }),
            /* @__PURE__ */ jsx(Button, { type: "submit", className: "w-full h-11", disabled: !captainPin, children: "دخول" })
          ] })
        ] }) }),
        openOrder && pos.orders[openOrder] && /* @__PURE__ */ jsx(OrderEntryDialog, { tableCode: openOrder, order: pos.orders[openOrder], meals: db.meals, items: db.items, onClose: () => {
          handleOpenOrder(null);
        } }),
        transferOpen && selectedTable && /* @__PURE__ */ jsx(TransferDialog, { sourceTable: selectedTable, onClose: () => setTransferOpen(false) }),
        transferCaptainOpen && selectedTable && pos.orders[selectedTable] && /* @__PURE__ */ jsx(TransferCaptainDialog, { tableCode: selectedTable, currentCaptain: pos.orders[selectedTable].captainName || "غير محدد", onClose: () => setTransferCaptainOpen(false) }),
        printOrder && pos.orders[printOrder] && /* @__PURE__ */ jsx(PrintDialog, { tableCode: printOrder, order: pos.orders[printOrder], onClose: () => setPrintOrder(null), onPrinted: () => {
          const o = pos.orders[printOrder];
          upsertOrder({
            ...o,
            state: "printed"
          });
          setPrintOrder(null);
        } }),
        checkoutConfirm && pos.orders[checkoutConfirm] && /* @__PURE__ */ jsx(CheckoutDialog, { tableCode: checkoutConfirm, order: pos.orders[checkoutConfirm], onClose: () => setCheckoutConfirm(null), onDone: () => {
          clearOrder(checkoutConfirm);
          setCheckoutConfirm(null);
          setSelectedTable(null);
        } })
      ]
    }
  );
}
function ZoneTabs({
  zone,
  setZone
}) {
  const [isMicros, setIsMicros] = useState(() => localStorage.getItem("isMicrosDevice") === "true");
  useEffect(() => {
    setIsMicros(localStorage.getItem("isMicrosDevice") === "true");
  }, []);
  const allowedZones = isMicros ? ZONES.filter((z) => z.id !== "takeaway" && z.id !== "others") : ZONES;
  return /* @__PURE__ */ jsx("div", { className: "flex gap-1 overflow-x-auto px-2", children: allowedZones.map((z) => /* @__PURE__ */ jsx("button", { onClick: () => setZone(z.id), className: `shrink-0 px-3 h-10 rounded-md text-sm font-medium transition ${zone === z.id ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`, children: z.label }, z.id)) });
}
function PosFrame({
  children,
  onLogout,
  cashierName,
  zoneTabs
}) {
  return /* @__PURE__ */ jsxs("div", { dir: "rtl", className: "h-[calc(100vh-4rem)] flex flex-col overflow-hidden -my-6 -mx-4", children: [
    children,
    /* @__PURE__ */ jsxs("footer", { className: "border-t border-border bg-card/60 py-2 flex items-center justify-between gap-2 px-3 shrink-0", children: [
      zoneTabs,
      /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2 shrink-0", children: /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground text-[15px]", children: [
        "الكاشير: ",
        /* @__PURE__ */ jsx("strong", { className: "text-foreground", children: cashierName })
      ] }) })
    ] })
  ] });
}
function TableChairsSvg() {
  return /* @__PURE__ */ jsxs("svg", { width: "46", height: "32", viewBox: "0 0 46 32", className: "opacity-60", children: [
    /* @__PURE__ */ jsx("rect", { x: "11", y: "10", width: "24", height: "12", rx: "3", fill: "currentColor", opacity: "0.25" }),
    [8, 18, 28].map((x) => /* @__PURE__ */ jsx("rect", { x, y: "4", width: "6", height: "3", rx: "1", fill: "currentColor", opacity: "0.55" }, `t-${x}`)),
    [8, 18, 28].map((x) => /* @__PURE__ */ jsx("rect", { x, y: "25", width: "6", height: "3", rx: "1", fill: "currentColor", opacity: "0.55" }, `b-${x}`))
  ] });
}
function TakeawayView({
  onOpenOrder
}) {
  const {
    db: pos,
    addCustomer,
    upsertOrder,
    updateCustomer
  } = usePosDB();
  const [q, setQ] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const filtered = useMemo(() => pos.customers.filter((c) => !q || c.name.includes(q) || c.phone && c.phone.includes(q)), [pos.customers, q]);
  function openModal(customer) {
    if (customer) {
      setEditingId(customer.id);
      setNewName(customer.name);
      setNewPhone(customer.phone || "");
      setNewAddress(customer.address || "");
    } else {
      setEditingId(null);
      setNewName("");
      setNewPhone("");
      setNewAddress("");
    }
    setModalOpen(true);
  }
  function handleSave() {
    if (!newName.trim()) return toast.error("اسم العميل مطلوب على الأقل");
    if (editingId && updateCustomer) {
      updateCustomer(editingId, newName, newPhone, newAddress);
      toast.success("تم تعديل بيانات العميل");
    } else {
      addCustomer(newName, newPhone, newAddress);
      toast.success("تم إضافة العميل بنجاح");
    }
    setModalOpen(false);
  }
  function openFor(c, isDelivery = false) {
    const prefix = isDelivery ? "DEL" : "TAK";
    const code = `${prefix}-${c.id.slice(0, 6)}-${Date.now().toString(36)}`;
    upsertOrder({
      tableCode: code,
      zone: "takeaway",
      type: isDelivery ? "delivery" : "takeaway",
      items: [],
      state: "active",
      discountPct: 0,
      taxPct: 0,
      customerName: c.name,
      customerAddress: c.address || "",
      customerPhone: c.phone || "",
      deliveryPrice: 0,
      openedAt: Date.now()
    });
    onOpenOrder(code);
  }
  return /* @__PURE__ */ jsxs("div", { className: "flex-1 flex flex-col min-h-0 overflow-hidden px-4 pt-3 gap-3", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex gap-2 items-center shrink-0", children: [
      /* @__PURE__ */ jsxs("div", { className: "relative flex-1", children: [
        /* @__PURE__ */ jsx(Search, { className: "w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" }),
        /* @__PURE__ */ jsx(Input, { dir: "rtl", placeholder: "بحث باسم العميل أو رقمه...", value: q, onChange: (e) => setQ(e.target.value), className: "pe-10 h-10" })
      ] }),
      /* @__PURE__ */ jsxs(Button, { onClick: () => openModal(), className: "gap-2", children: [
        /* @__PURE__ */ jsx(UserPlus, { className: "w-4 h-4" }),
        " إضافة عميل جديد"
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "flex-1 overflow-auto bg-card border border-border rounded-xl", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
      /* @__PURE__ */ jsx("thead", { className: "bg-secondary/50 text-xs sticky top-0", children: /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("th", { className: "text-right p-3", children: "الاسم" }),
        /* @__PURE__ */ jsx("th", { className: "text-right p-3", children: "الهاتف" }),
        /* @__PURE__ */ jsx("th", { className: "text-right p-3", children: "العنوان" }),
        /* @__PURE__ */ jsx("th", { className: "text-right p-3", children: "الطلبات" }),
        /* @__PURE__ */ jsx("th", { className: "text-right p-3", children: "إجراءات" })
      ] }) }),
      /* @__PURE__ */ jsx("tbody", { children: filtered.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 5, className: "p-8 text-center text-muted-foreground", children: "لا يوجد عملاء." }) }) : filtered.map((c) => /* @__PURE__ */ jsxs("tr", { className: "border-t border-border hover:bg-secondary/40", children: [
        /* @__PURE__ */ jsx("td", { className: "p-3 font-medium", children: c.name }),
        /* @__PURE__ */ jsx("td", { className: "p-3 text-muted-foreground", children: c.phone || "—" }),
        /* @__PURE__ */ jsx("td", { className: "p-3 text-muted-foreground", children: c.address || "—" }),
        /* @__PURE__ */ jsx("td", { className: "p-3 font-bold", children: c.orderCount || 0 }),
        /* @__PURE__ */ jsxs("td", { className: "p-3 text-left flex gap-2 justify-end", children: [
          /* @__PURE__ */ jsx(Button, { size: "sm", variant: "ghost", onClick: () => openModal(c), children: "تعديل" }),
          /* @__PURE__ */ jsx(Button, { size: "sm", variant: "default", className: "bg-amber-600 hover:bg-amber-700 text-white", onClick: () => openFor(c, true), children: "🛵 أوردر" })
        ] })
      ] }, c.id)) })
    ] }) }),
    modalOpen && /* @__PURE__ */ jsx(Dialog, { open: true, onOpenChange: (o) => !o && setModalOpen(false), children: /* @__PURE__ */ jsxs(DialogContent, { dir: "rtl", className: "max-w-md", children: [
      /* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsx(DialogTitle, { children: editingId ? "تعديل بيانات عميل" : "إضافة عميل جديد" }) }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "text-xs", children: "الاسم (مطلوب)" }),
          /* @__PURE__ */ jsx(Input, { value: newName, onChange: (e) => setNewName(e.target.value) })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "text-xs", children: "رقم الهاتف (اختياري)" }),
          /* @__PURE__ */ jsx(Input, { type: "tel", value: newPhone, onChange: (e) => setNewPhone(e.target.value) })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "text-xs", children: "العنوان (اختياري)" }),
          /* @__PURE__ */ jsx(Input, { value: newAddress, onChange: (e) => setNewAddress(e.target.value) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(DialogFooter, { className: "gap-2", children: [
        /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => setModalOpen(false), children: "إلغاء" }),
        /* @__PURE__ */ jsx(Button, { onClick: handleSave, children: "حفظ" })
      ] })
    ] }) })
  ] });
}
function OrderEntryDialog({
  tableCode,
  order,
  meals,
  items,
  onClose
}) {
  const {
    db,
    deductSubStock
  } = useDB();
  const {
    db: pos,
    upsertOrder,
    addInvoice,
    clearOrder,
    incCustomerOrders
  } = usePosDB();
  const [draftItems, setDraftItems] = useState(order.items || []);
  const [q, setQ] = useState("");
  const [modifierMeal, setModifierMeal] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const [takeawayConfirmOpen, setTakeawayConfirmOpen] = useState(false);
  const [takeawayDiscount, setTakeawayDiscount] = useState(order.discountPct || 0);
  const [pendingTakeawayDiscount, setPendingTakeawayDiscount] = useState(null);
  const [takeawayDeliveryFee, setTakeawayDeliveryFee] = useState(0);
  const sellable = meals.filter((m) => m.kind === "menu");
  const [isMicros, setIsMicros] = useState(() => localStorage.getItem("isMicrosDevice") === "true");
  function changeNotes(lineId, notes) {
    setDraftItems(draftItems.map((l) => l.id === lineId ? {
      ...l,
      notes
    } : l));
  }
  useEffect(() => {
    setIsMicros(localStorage.getItem("isMicrosDevice") === "true");
  }, []);
  const filtered = sellable.filter((m) => !q || m.name.toLowerCase().includes(q.toLowerCase()));
  const categories = useMemo(() => Array.from(new Set(sellable.map((m) => m.category).filter(Boolean))), [sellable]);
  function manufacturable(meal) {
    if (meal.category === SHISHA_CATEGORY) return null;
    if (!meal.ingredients || meal.ingredients.length === 0) return 0;
    const dbRaw = db;
    const allOrders = Object.values(pos.orders || {});
    const baseIngredients = expandMealToBase(meal, db.meals, db.items);
    let min = Infinity;
    for (const [itemId, info] of baseIngredients) {
      const it = items.find((x) => x.id === itemId);
      if (!it) return 0;
      const reservedQty = allOrders.reduce((sum, order2) => {
        const itemsList = order2.items || [];
        const mealsUsingIt = itemsList.filter((i) => i.mealId === meal.id);
        const count = mealsUsingIt.reduce((s, i) => s + (i.qty || 0), 0);
        return sum + count * info.qty;
      }, 0);
      const targetDept = meal.department || it.department;
      const totalHave = dbRaw.deptStock?.[deptKey(targetDept, it.id)] || 0;
      const have = clamp0(totalHave - reservedQty);
      if (info.qty <= 0) continue;
      min = Math.min(min, Math.floor(have / info.qty));
    }
    return min === Infinity ? 99 : Math.max(0, min);
  }
  function deductInventoryForTakeaway() {
    const perDept = {};
    for (const line of draftItems) {
      const meal = db.meals.find((m) => m.id === line.mealId);
      if (!meal || meal.category === SHISHA_CATEGORY) continue;
      const dept = meal.department || "عام";
      if (!perDept[dept]) perDept[dept] = {};
      const baseIngredients = expandMealToBase(meal, db.meals, db.items);
      for (const [itemId, info] of baseIngredients) {
        const baseQty = round2(clamp0(info.qty * line.qty));
        if (baseQty <= 0) continue;
        perDept[dept][itemId] = (perDept[dept][itemId] || 0) + baseQty;
      }
    }
    for (const [deptName, itemsMap] of Object.entries(perDept)) {
      const arr = Object.entries(itemsMap).map(([itemId, baseQty]) => ({
        itemId,
        baseQty
      }));
      deductSubStock(deptName, arr);
    }
  }
  function addLine(meal, extras = [], summary) {
    const existingLineIndex = draftItems.findIndex((item) => item.mealId === meal.id && item.modifiersSummary === summary);
    if (existingLineIndex >= 0) {
      const newDraftItems = [...draftItems];
      newDraftItems[existingLineIndex].qty += 1;
      setDraftItems(newDraftItems);
    } else {
      const line = {
        id: crypto.randomUUID(),
        mealId: meal.id,
        name: meal.name,
        qty: 1,
        unitPrice: round2(meal.sellingPrice),
        extras,
        modifiersSummary: summary,
        mealName: void 0,
        department: meal.department || "مطبخ",
        price: 0,
        notes: ""
        // 🌟 هنا
      };
      setDraftItems([...draftItems, line]);
    }
  }
  function changeQty(lineId, qty) {
    setDraftItems(draftItems.map((l) => l.id === lineId ? {
      ...l,
      qty: clamp0(qty)
    } : l));
  }
  function removeLine(lineId) {
    setDraftItems(draftItems.filter((l) => l.id !== lineId));
  }
  function onPickMeal(meal) {
    if (meal.hasModifiers && (meal.modifierGroups?.length || 0) > 0) setModifierMeal(meal);
    else addLine(meal);
  }
  const totals = computeTotals(draftItems, order.discountPct, order.taxPct, order.orderCategory || "normal");
  async function handleSendToKitchenPrinters(currentOrder) {
    if (!currentOrder) return;
    const oldOrder = pos.orders[currentOrder.tableCode];
    const oldItems = oldOrder ? oldOrder.items || [] : [];
    const currentItems = currentOrder.items || [];
    const diffItems = [];
    const getUniqueKey = (item) => `${item.mealId}___${item.modifiersSummary || ""}`;
    const oldQtyMap = {};
    const oldDetailsMap = {};
    oldItems.forEach((item) => {
      const key = getUniqueKey(item);
      oldQtyMap[key] = (oldQtyMap[key] || 0) + item.qty;
      oldDetailsMap[key] = item;
    });
    const currentQtyMap = {};
    const currentDetailsMap = {};
    currentItems.forEach((item) => {
      const key = getUniqueKey(item);
      currentQtyMap[key] = (currentQtyMap[key] || 0) + item.qty;
      currentDetailsMap[key] = item;
    });
    Object.keys(currentQtyMap).forEach((key) => {
      const curQty = currentQtyMap[key];
      const oldQty = oldQtyMap[key] || 0;
      const diff = curQty - oldQty;
      if (diff !== 0) {
        const item = currentDetailsMap[key];
        const originalMeal = db.meals.find((m) => m.id === item.mealId);
        const dept = item.department || originalMeal?.department || "مطبخ";
        const fullName = item.modifiersSummary ? `${item.name} (${item.modifiersSummary})` : item.name;
        diffItems.push({
          itemId: item.mealId,
          name: fullName,
          diffQty: diff,
          department: dept,
          notes: item.notes || ""
        });
      }
    });
    Object.keys(oldQtyMap).forEach((key) => {
      if (!currentQtyMap[key]) {
        const oldQty = oldQtyMap[key];
        const item = oldDetailsMap[key];
        const originalMeal = db.meals.find((m) => m.id === item.mealId);
        const dept = item.department || originalMeal?.department || "مطبخ";
        const fullName = item.modifiersSummary ? `${item.name} (${item.modifiersSummary})` : item.name;
        diffItems.push({
          itemId: item.mealId,
          name: fullName,
          diffQty: -oldQty,
          department: dept,
          notes: item.notes || ""
        });
      }
    });
    if (diffItems.length === 0) return;
    const savedPrinters = JSON.parse(localStorage.getItem("pos_dynamic_printers") || "[]");
    const printersToUse = savedPrinters.length > 0 ? savedPrinters : [{
      id: "1",
      name: "طابعة المطبخ الرئيسي",
      ip: "127.0.0.1",
      port: 9100,
      targetDept: "مطبخ"
    }, {
      id: "2",
      name: "طابعة البار والمشروبات",
      ip: "127.0.0.1",
      port: 9101,
      targetDept: "بار"
    }, {
      id: "3",
      name: "طابعة الشيشة الخارجية",
      ip: "127.0.0.1",
      port: 9102,
      targetDept: "شيشة"
    }, {
      id: "4",
      name: "طابعة الكاشير الفرعي",
      ip: "127.0.0.1",
      port: 9103,
      targetDept: "كاشير فرعي"
    }, {
      id: "5",
      name: "طابعة التجربة (Test 5)",
      ip: "127.0.0.1",
      port: 9104,
      targetDept: "عام"
    }];
    const matchDept = (itemDept, targetDept) => {
      const cleanItem = itemDept.trim().toLowerCase();
      const cleanTarget = targetDept.trim().toLowerCase();
      if (cleanTarget === "مطبخ" || cleanTarget === "kitchen") return cleanItem === "مطبخ" || cleanItem === "kitchen" || cleanItem === "صالة";
      if (cleanTarget === "بار" || cleanTarget === "bar") return cleanItem === "بار" || cleanItem === "bar";
      if (cleanTarget === "شيشة" || cleanTarget === "shisha") return cleanItem === "شيشة" || cleanItem === "shisha";
      if (cleanTarget === "كاشير فرعي" || cleanTarget === "عام") return cleanItem === "كاشير فرعي" || cleanItem === "عام" || cleanItem === "other";
      return cleanItem === cleanTarget;
    };
    for (const printer of printersToUse) {
      const printerItems = diffItems.filter((i) => matchDept(i.department, printer.targetDept));
      if (printerItems.length > 0) {
        try {
          await fetch(`http://${API_URL}:5000/api/print-kitchen`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              printerIP: printer.ip,
              printerPort: Number(printer.port) || 9100,
              deptName: printer.name,
              tableName: currentOrder.tableCode,
              zoneName: currentOrder.zone,
              items: printerItems,
              orderCategory: currentOrder.orderCategory || "dinein",
              customerName: currentOrder.customerName || ""
            })
          });
        } catch (err) {
          console.error(`❌ فشل الاتصال بالطابعة: ${printer.name}`);
        }
      }
    }
  }
  const [isSubmitting, setIsSubmitting] = useState(false);
  async function handleSaveClick(code) {
    if (order.zone === "takeaway") {
      setTakeawayDiscount(order.discountPct || 0);
      setTakeawayDeliveryFee(0);
      setPendingTakeawayDiscount(null);
      setTakeawayConfirmOpen(true);
    } else {
      if (isSubmitting) return;
      setIsSubmitting(true);
      try {
        await handleSendToKitchenPrinters({
          ...order,
          items: draftItems,
          tableCode: code
        });
        upsertOrder({
          ...order,
          items: draftItems,
          state: "active"
        });
        toast.success("تم حفظ طلب الصالة على الطاولة! 🍽️");
        onClose();
      } catch (error) {
        toast.error(`حدث خطأ: ${error.message}`);
      } finally {
        setIsSubmitting(false);
      }
    }
  }
  async function executeTakeawaySave() {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const finalDiscountPct = takeawayDiscount;
      const finalDeliveryPrice = takeawayDeliveryFee;
      const computedType = finalDeliveryPrice > 0 ? "delivery" : "takeaway";
      const updatedTotals = computeTotals(draftItems, finalDiscountPct, order.taxPct, order.orderCategory || "normal");
      const isSecDevice = localStorage.getItem("isSecCashierDevice") === "true";
      const secName = localStorage.getItem("secCashierName") || "كاشير فرعي";
      const currentCashierName = isSecDevice ? secName : pos.shift?.cashierName || "كاشير رئيسي";
      const currentCashierId = isSecDevice ? localStorage.getItem("secCashierId") : pos.shift?.cashierId;
      const currentTerminalId = isSecDevice ? "Sub-1" : "Main";
      const inv = {
        id: crypto.randomUUID(),
        type: computedType,
        tableCode,
        zone: "takeaway",
        customerName: order.customerName || null,
        customerAddress: order.customerAddress || null,
        cashierId: currentCashierId || null,
        cashierName: currentCashierName,
        captainName: order.captainName || null,
        items: draftItems,
        subtotal: updatedTotals.subtotal,
        discountPct: finalDiscountPct,
        discountValue: updatedTotals.discountValue,
        taxPct: 0,
        taxValue: 0,
        deliveryPrice: finalDeliveryPrice,
        createdAt: Date.now(),
        terminalId: currentTerminalId,
        createdBy: currentCashierName,
        orderCategory: order.orderCategory || "normal",
        commissionValue: updatedTotals.commissionValue,
        total: updatedTotals.subtotal - updatedTotals.discountValue + finalDeliveryPrice + updatedTotals.commissionValue
      };
      await handleSendToKitchenPrinters({
        ...order,
        items: draftItems,
        tableCode
      });
      const savedInvoice = await addInvoice(inv);
      deductInventoryForTakeaway();
      if (savedInvoice) {
        triggerPrint(savedInvoice, true);
      }
      clearOrder(tableCode);
      setTakeawayConfirmOpen(false);
      onClose();
      const salesByDept = {};
      draftItems.forEach((item) => {
        const meal = db.meals.find((m) => m.id === item.mealId);
        const dept = meal?.department || "عام";
        if (!salesByDept[dept]) salesByDept[dept] = [];
        salesByDept[dept].push(item);
      });
      for (const [deptName, deptLines] of Object.entries(salesByDept)) {
        const lines = deptLines;
        if (lines.length > 0) {
          const totalSales = lines.reduce((sum, l) => sum + (l.unitPrice || l.price || 0) * l.qty, 0);
          let totalCost = 0;
          for (const l of lines) {
            const m = db.meals.find((x) => x.id === l.mealId);
            if (m) {
              const baseDeds = expandMealToBase(m, db.meals, db.items);
              for (const [, info] of baseDeds) totalCost += info.cost * l.qty;
            }
          }
          const newSale = {
            id: "sale_" + crypto.randomUUID().split("-")[0] + "_" + Date.now(),
            date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
            department: deptName,
            lines,
            totalSales,
            totalCost,
            createdAt: Date.now()
          };
          fetch(`http://${API_URL}:5000/api/sales`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify(newSale)
          }).catch((err) => console.error("❌ فشل تسجيل المبيعات:", err));
        }
      }
      if (order.customerName) {
        const c = pos.customers.find((c2) => c2.name === order.customerName);
        if (c) incCustomerOrders(c.id);
      }
      clearOrder(tableCode);
      if (computedType === "delivery") toast.success(`تم حفظ وطباعة الفاتورة 🛵 (+${finalDeliveryPrice} ج.م)`);
      else toast.success("تم حفظ وطباعة فاتورة التيك أواي بنجاح 🛍️");
      setTakeawayConfirmOpen(false);
      onClose();
    } catch (error) {
      toast.error(`حدث خطأ: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  }
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(Dialog, { open: true, onOpenChange: (o) => !o && onClose(), children: /* @__PURE__ */ jsxs(DialogContent, { dir: "rtl", className: "max-w-7xl w-[100vw] h-[95vh] p-0 overflow-hidden", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex h-full", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex-1 flex flex-col min-w-0 border-l border-border", children: [
          /* @__PURE__ */ jsxs("div", { className: "p-3 border-b border-border space-y-2", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-3", children: [
              /* @__PURE__ */ jsx(DialogTitle, { children: "طلب الطاولة" }),
              /* @__PURE__ */ jsxs("div", { className: "text-sm flex items-center gap-3", children: [
                /* @__PURE__ */ jsx("span", { className: "px-2 py-1 rounded bg-secondary font-mono", children: order.zone === "takeaway" ? "تيك أواي" : tableCode }),
                order.customerName && /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: order.customerName })
              ] })
            ] }),
            /* @__PURE__ */ jsx(Input, { placeholder: "ابحث عن صنف...", value: q, onChange: (e) => setQ(e.target.value) })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "flex-1 overflow-auto p-3", children: q ? /* @__PURE__ */ jsx("div", { className: "grid grid-cols-5 gap-3 justify-items-center", children: filtered.map((m) => {
            const stockQty = manufacturable(m);
            const addedInCart = draftItems.find((it) => it.mealId === m.id)?.qty || 0;
            const mq = typeof stockQty === "number" ? Math.max(0, stockQty - addedInCart) : stockQty;
            const isShisha = m.category === SHISHA_CATEGORY;
            const disabled = !isShisha && mq !== null && mq <= 0;
            return /* @__PURE__ */ jsxs("button", { disabled, onClick: () => onPickMeal(m), className: `h-[150px] w-[170px] rounded-xl border-2 p-3 flex flex-col items-center justify-center text-center gap-2 transition ${disabled ? "opacity-40 cursor-not-allowed" : "hover:border-primary hover:bg-primary/5"} ${isShisha ? "border-purple-300 bg-purple-50 dark:bg-purple-950/30" : "border-border bg-card"}`, children: [
              /* @__PURE__ */ jsx("span", { className: "font-bold text-base leading-tight", children: m.name }),
              /* @__PURE__ */ jsxs("span", { className: "text-sm text-muted-foreground font-medium", children: [
                fmt2(m.sellingPrice),
                " ج.م"
              ] }),
              isShisha ? /* @__PURE__ */ jsx("span", { className: "text-xs text-purple-700 dark:text-purple-300", children: "شيشة" }) : /* @__PURE__ */ jsxs("span", { className: `text-xs font-bold ${(mq ?? 0) > 5 ? "text-emerald-600" : "text-amber-600"}`, children: [
                "العدد: ",
                mq ?? "—"
              ] })
            ] }, m.id);
          }) }) : !activeCategory ? /* @__PURE__ */ jsx("div", { className: "grid grid-cols-6 gap-4", children: categories.map((cat) => /* @__PURE__ */ jsx("button", { onClick: () => setActiveCategory(cat ?? null), className: "h-[150px] rounded-xl border-2 border-primary/30 bg-primary/5 text-primary p-4 flex flex-col items-center justify-center text-center font-bold text-lg hover:bg-primary/10 hover:border-primary transition", children: /* @__PURE__ */ jsx("span", { className: "truncate w-full", children: cat }) }, cat)) }) : /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between border-b pb-2", children: [
              /* @__PURE__ */ jsxs("h4", { className: "font-bold text-lg text-primary", children: [
                "قسم: ",
                activeCategory
              ] }),
              /* @__PURE__ */ jsx(Button, { size: "sm", variant: "outline", onClick: () => setActiveCategory(null), children: "رجوع للأقسام ←" })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "grid grid-cols-5 gap-3 justify-items-center", children: filtered.filter((m) => m.category === activeCategory).map((m) => {
              const stockQty = manufacturable(m);
              const addedInCart = draftItems.find((it) => it.mealId === m.id)?.qty || 0;
              const mq = typeof stockQty === "number" ? Math.max(0, stockQty - addedInCart) : stockQty;
              const isShisha = m.category === SHISHA_CATEGORY;
              const disabled = !isShisha && mq !== null && mq <= 0;
              return /* @__PURE__ */ jsxs("button", { disabled, onClick: () => onPickMeal(m), className: `h-[150px] w-[170px] rounded-xl border-2 p-3 flex flex-col items-center justify-center text-center gap-2 transition ${disabled ? "opacity-40 cursor-not-allowed" : "hover:border-primary hover:bg-primary/5"} ${isShisha ? "border-purple-300 bg-purple-50 dark:bg-purple-950/30" : "border-border bg-card"}`, children: [
                /* @__PURE__ */ jsx("span", { className: "font-bold text-base leading-tight", children: m.name }),
                /* @__PURE__ */ jsxs("span", { className: "text-sm text-muted-foreground font-medium", children: [
                  fmt2(m.sellingPrice),
                  " ج.م"
                ] }),
                isShisha ? /* @__PURE__ */ jsx("span", { className: "text-xs text-purple-700 dark:text-purple-300", children: "شيشة" }) : /* @__PURE__ */ jsxs("span", { className: `text-xs font-bold ${(mq ?? 0) > 5 ? "text-emerald-600" : "text-amber-600"}`, children: [
                  "العدد: ",
                  mq ?? "—"
                ] })
              ] }, m.id);
            }) })
          ] }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "w-80 flex flex-col bg-secondary/30 h-full overflow-hidden", children: [
          /* @__PURE__ */ jsx("div", { className: "p-3 border-b border-border shrink-0", children: /* @__PURE__ */ jsxs("h3", { className: "font-bold text-sm", children: [
            "السلة (",
            draftItems.length,
            ")"
          ] }) }),
          /* @__PURE__ */ jsx("div", { className: "flex-1 overflow-y-auto min-h-0 max-h-[360px] p-2 space-y-1.5", children: draftItems.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-center text-muted-foreground text-xs p-6", children: "السلة فارغة — اختر صنف للإضافة." }) : draftItems.map((l, index) => /* @__PURE__ */ jsxs("div", { className: "bg-card border border-border rounded-md p-1.5 text-xs shadow-sm", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-1.5", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
                /* @__PURE__ */ jsx("div", { className: "font-medium truncate", children: l.name }),
                l.modifiersSummary && /* @__PURE__ */ jsx("div", { className: "text-[10px] text-muted-foreground mt-0.5", children: l.modifiersSummary })
              ] }),
              !isMicros && /* @__PURE__ */ jsx("button", { onClick: () => removeLine(l.id), className: "text-destructive hover:bg-destructive/10 p-1 rounded transition-colors", children: /* @__PURE__ */ jsx(Trash2, { className: "w-3.5 h-3.5" }) })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "mt-1.5", children: /* @__PURE__ */ jsx("input", { type: "text", placeholder: "📝 إضافة ملاحظة (مثال: بدون بصل، سكر زيادة...)", value: l.notes || "", onChange: (e) => changeNotes(l.id, e.target.value), className: "w-full text-[11px] px-2 py-1 bg-secondary/40 border border-border/60 rounded focus:bg-background focus:border-primary transition-colors outline-none text-foreground placeholder:text-muted-foreground/70 font-medium" }) }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-1 mt-2", children: [
              /* @__PURE__ */ jsxs("span", { className: "font-bold text-primary text-[11px]", children: [
                fmt2((l.unitPrice + l.extras.reduce((s, e) => s + e.price, 0)) * l.qty),
                " ",
                "ج.م"
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
                !isMicros && /* @__PURE__ */ jsx("button", { onClick: () => changeQty(l.id, l.qty - 1), className: "w-6 h-6 flex items-center justify-center rounded bg-secondary hover:bg-secondary/80 font-bold", children: "-" }),
                /* @__PURE__ */ jsx("input", { type: "number", value: l.qty, className: "w-8 h-6 text-center text-xs border rounded bg-background font-bold", readOnly: true }),
                /* @__PURE__ */ jsx("button", { onClick: () => changeQty(l.id, l.qty + 1), className: "w-6 h-6 flex items-center justify-center rounded bg-secondary hover:bg-secondary/80 font-bold", children: "+" })
              ] })
            ] })
          ] }, `${l.id}-${index}`)) }),
          /* @__PURE__ */ jsxs("div", { className: "p-3 border-t border-border space-y-1 text-xs shrink-0 bg-background/50", children: [
            /* @__PURE__ */ jsx(Row, { label: "المجموع", value: fmt2(totals.subtotal) }),
            /* @__PURE__ */ jsx(Row, { label: `الخصم (${order.discountPct}%)`, value: fmt2(totals.discountValue) }),
            /* @__PURE__ */ jsx(Row, { label: `الضريبة (${order.taxPct}%)`, value: fmt2(totals.taxValue) }),
            totals.commissionValue > 0 && /* @__PURE__ */ jsx(Row, { label: "نسبة المنصة (+5%)", value: fmt2(totals.commissionValue) }),
            /* @__PURE__ */ jsx(Row, { label: "الإجمالي", value: fmt2(totals.total), bold: true })
          ] }),
          order.zone === "takeaway" && /* @__PURE__ */ jsx("div", { className: "p-2 border-t border-border bg-background/40 space-y-2 shrink-0", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-1.5", children: [
            /* @__PURE__ */ jsx(Button, { type: "button", size: "sm", variant: order.orderCategory === "talabat" ? "default" : "outline", className: `h-8 text-xs font-bold transition-all ${order.orderCategory === "talabat" ? "bg-orange-600 hover:bg-orange-700 text-white shadow" : "text-orange-600 border-orange-300 hover:bg-orange-50"}`, onClick: () => {
              const nextCat = order.orderCategory === "talabat" ? "normal" : "talabat";
              upsertOrder({
                ...order,
                items: draftItems,
                orderCategory: nextCat
              });
            }, children: "طلبات (Talabat)" }),
            /* @__PURE__ */ jsx(Button, { type: "button", size: "sm", variant: order.orderCategory === "fast" ? "default" : "outline", className: `h-8 text-xs font-bold transition-all ${order.orderCategory === "fast" ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow" : "text-emerald-600 border-emerald-300 hover:bg-emerald-50"}`, onClick: () => {
              const nextCat = order.orderCategory === "fast" ? "normal" : "fast";
              upsertOrder({
                ...order,
                items: draftItems,
                orderCategory: nextCat
              });
            }, children: "فاست (Fast)" })
          ] }) }),
          /* @__PURE__ */ jsx(DialogFooter, { className: "p-3 border-t border-border shrink-0", children: /* @__PURE__ */ jsx(
            Button,
            {
              onClick: () => handleSaveClick(tableCode),
              disabled: order.zone === "takeaway" && draftItems.length === 0 || isSubmitting,
              className: `w-full text-[15px] font-bold h-11 transition-all ${order.zone === "takeaway" ? "bg-green-600 hover:bg-green-700 text-white shadow-md shadow-green-600/20" : "bg-primary hover:bg-primary/90 text-primary-foreground shadow-md"}`,
              children: order.zone === "takeaway" ? "⚡ ضرب الأوردر وإنهاء الفاتورة" : draftItems.length === 0 ? "🔒 تأكيد حجز الطاولة (بدون طلبات حالياً)" : "💾 حفظ الطلبات وإغلاق الطاولة"
            }
          ) })
        ] })
      ] }),
      modifierMeal && /* @__PURE__ */ jsx(ModifierDialog, { meal: modifierMeal, onCancel: () => setModifierMeal(null), onConfirm: (extras, summary) => {
        addLine(modifierMeal, extras, summary);
        setModifierMeal(null);
      } })
    ] }) }),
    takeawayConfirmOpen && /* @__PURE__ */ jsx(Dialog, { open: takeawayConfirmOpen, onOpenChange: (o) => !o && setTakeawayConfirmOpen(false), children: /* @__PURE__ */ jsxs(DialogContent, { dir: "rtl", className: "max-w-sm", children: [
      /* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsxs(DialogTitle, { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Printer, { className: "w-5 h-5 text-green-600" }),
        " إنهاء وطباعة - تيك أواي"
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "bg-white text-black border rounded p-4 font-mono text-xs space-y-1 print:block", children: [
        /* @__PURE__ */ jsx("div", { className: "text-center font-bold text-sm", children: "مراجعة الفاتورة" }),
        /* @__PURE__ */ jsx("div", { className: "text-center", children: "النوع: تيك أواي / دليفري" }),
        /* @__PURE__ */ jsx("hr", { className: "border-dashed border-black my-2" }),
        draftItems.map((l) => /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
          /* @__PURE__ */ jsxs("span", { children: [
            l.name,
            " ×",
            l.qty
          ] }),
          /* @__PURE__ */ jsx("span", { children: fmt2((l.unitPrice + l.extras.reduce((s, e) => s + e.price, 0)) * l.qty) })
        ] }, l.id)),
        /* @__PURE__ */ jsx("hr", { className: "border-dashed border-black my-2" }),
        (() => {
          const twTotals = computeTotals(draftItems, takeawayDiscount, order.taxPct, order.orderCategory || "normal");
          return /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
              /* @__PURE__ */ jsx("span", { children: "المجموع" }),
              /* @__PURE__ */ jsx("span", { children: fmt2(twTotals.subtotal) })
            ] }),
            takeawayDiscount > 0 && /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-red-600 font-bold", children: [
              /* @__PURE__ */ jsxs("span", { children: [
                "خصم ",
                takeawayDiscount,
                "%"
              ] }),
              /* @__PURE__ */ jsxs("span", { children: [
                "-",
                fmt2(twTotals.discountValue)
              ] })
            ] }),
            twTotals.commissionValue > 0 && /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-amber-600", children: [
              /* @__PURE__ */ jsx("span", { children: "عمولة المنصة" }),
              /* @__PURE__ */ jsxs("span", { children: [
                "+",
                fmt2(twTotals.commissionValue)
              ] })
            ] }),
            takeawayDeliveryFee > 0 && /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-blue-600", children: [
              /* @__PURE__ */ jsx("span", { children: "مصاريف التوصيل" }),
              /* @__PURE__ */ jsxs("span", { children: [
                "+",
                fmt2(takeawayDeliveryFee)
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between font-bold text-sm border-t border-black pt-1", children: [
              /* @__PURE__ */ jsx("span", { children: "الإجمالي" }),
              /* @__PURE__ */ jsx("span", { children: fmt2(twTotals.total + takeawayDeliveryFee) })
            ] })
          ] });
        })()
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-3 pt-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 no-print", children: [
          /* @__PURE__ */ jsx("label", { className: "text-xs font-bold w-16", children: "خصم %" }),
          /* @__PURE__ */ jsx(Input, { type: "number", step: "any", min: "0", max: "100", value: pendingTakeawayDiscount !== null ? pendingTakeawayDiscount : takeawayDiscount, onChange: (e) => setPendingTakeawayDiscount(clamp0(parseFloat(cleanNumInput(e.target.value)) || 0)), className: "h-8 w-24" }),
          pendingTakeawayDiscount !== null && pendingTakeawayDiscount !== takeawayDiscount && /* @__PURE__ */ jsx(ActionGate, { requiredRole: "محاسب", actionName: "تطبيق نسبة الخصم", onSuccess: (employee) => {
            setTakeawayDiscount(pendingTakeawayDiscount);
            toast.success(`تم تطبيق خصم ${pendingTakeawayDiscount}% بواسطة: ${employee.name} 🛡️`);
            setPendingTakeawayDiscount(null);
          }, children: /* @__PURE__ */ jsx(Button, { size: "sm", children: "تطبيق" }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 no-print", children: [
          /* @__PURE__ */ jsx("label", { className: "text-xs font-bold w-16", children: "توصيل" }),
          /* @__PURE__ */ jsx(Input, { type: "number", min: "0", value: takeawayDeliveryFee || "", onChange: (e) => setTakeawayDeliveryFee(Number(e.target.value) || 0), placeholder: "0", className: "h-8 w-24 border-blue-200 focus-visible:ring-blue-500" }),
          /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground font-bold", children: "ج.م (للدليفري)" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(DialogFooter, { className: "gap-2 no-print mt-2", children: [
        /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => setTakeawayConfirmOpen(false), disabled: isSubmitting, children: "إلغاء" }),
        /* @__PURE__ */ jsx(Button, { onClick: executeTakeawaySave, disabled: isSubmitting, className: "gap-2 bg-green-600 hover:bg-green-700 text-white font-bold px-6", children: isSubmitting ? "جاري..." : /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx(Printer, { className: "w-4 h-4" }),
          " حفظ وطباعة 🖨️"
        ] }) })
      ] })
    ] }) })
  ] });
}
function Row({
  label,
  value,
  bold
}) {
  return /* @__PURE__ */ jsxs("div", { className: `flex items-center justify-between ${bold ? "text-base font-bold pt-1 border-t border-border" : "text-muted-foreground"}`, children: [
    /* @__PURE__ */ jsx("span", { children: label }),
    /* @__PURE__ */ jsxs("span", { children: [
      value,
      " ج.م"
    ] })
  ] });
}
function ModifierDialog({
  meal,
  onCancel,
  onConfirm
}) {
  const groups = meal.modifierGroups || [];
  const [picks, setPicks] = useState({});
  function confirm() {
    const extras = [];
    const parts = [];
    for (const g of groups) {
      const oid = picks[g.id];
      if (!oid && g.required) return toast.error(`اختر من ${g.name}`);
      if (!oid) continue;
      const opt = g.options.find((o) => o.id === oid);
      extras.push({
        label: `${g.name}: ${opt.label}`,
        price: opt.extraPrice
      });
      parts.push(`${g.name}: ${opt.label}`);
    }
    onConfirm(extras, parts.join(" • "));
  }
  return /* @__PURE__ */ jsx(Dialog, { open: true, onOpenChange: (o) => !o && onCancel(), children: /* @__PURE__ */ jsxs(DialogContent, { dir: "rtl", className: "max-w-lg", children: [
    /* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsxs(DialogTitle, { children: [
      meal.name,
      " — الخيارات والإضافات"
    ] }) }),
    /* @__PURE__ */ jsx("div", { className: "space-y-4 max-h-[60vh] overflow-auto", children: groups.map((g) => /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
      /* @__PURE__ */ jsx("div", { className: "flex items-center justify-between", children: /* @__PURE__ */ jsxs("h4", { className: "font-medium", children: [
        g.name,
        " ",
        g.required && /* @__PURE__ */ jsx("span", { className: "text-destructive text-xs", children: "*مطلوب" })
      ] }) }),
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 gap-2", children: g.options.map((o) => {
        const sel = picks[g.id] === o.id;
        return /* @__PURE__ */ jsxs("button", { onClick: () => setPicks((p) => ({
          ...p,
          [g.id]: o.id
        })), className: `px-3 py-2 rounded-lg border text-sm flex items-center justify-between ${sel ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border"}`, children: [
          /* @__PURE__ */ jsx("span", { children: o.label }),
          o.extraPrice > 0 && /* @__PURE__ */ jsxs("span", { className: "text-xs", children: [
            "+",
            fmt2(o.extraPrice)
          ] })
        ] }, o.id);
      }) })
    ] }, g.id)) }),
    /* @__PURE__ */ jsxs(DialogFooter, { className: "gap-2", children: [
      /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: onCancel, children: "إلغاء" }),
      /* @__PURE__ */ jsx(Button, { onClick: confirm, children: "إضافة للسلة" })
    ] })
  ] }) });
}
function TransferDialog({
  sourceTable,
  onClose
}) {
  const {
    db: pos,
    transferItems
  } = usePosDB();
  const [from] = useState(sourceTable);
  const [to, setTo] = useState("");
  const [search, setSearch] = useState("");
  const [showList, setShowList] = useState(false);
  const [picks, setPicks] = useState({});
  const [isTransferring, setIsTransferring] = useState(false);
  const allTables = useMemo(() => {
    const cTables = Array.from({
      length: 70
    }, (_, i) => `C${i + 1}`);
    const oTables = Array.from({
      length: 70
    }, (_, i) => `O${i + 1}`);
    const smallTables = Array.from({
      length: 30
    }, (_, i) => `ص${i + 1}`);
    const largeTables = Array.from({
      length: 50
    }, (_, i) => `ك${i + 1}`);
    const kidsTables = Array.from({
      length: 20
    }, (_, i) => `K${i + 1}`);
    return [...cTables, ...oTables, ...smallTables, ...largeTables, ...kidsTables];
  }, []);
  const filteredTables = allTables.filter((t) => t.toLowerCase().includes(search.toLowerCase()));
  const src = from ? pos.orders[from.trim()] : null;
  async function doTransfer() {
    if (!to.trim()) return toast.error("أدخل الطاولة المنقول إليها");
    if (from.trim() === to.trim()) return toast.error("لا يمكن التحويل لنفس الطاولة!");
    const itemsToMove = Object.entries(picks).map(([id, qty]) => ({
      id,
      qty
    }));
    if (itemsToMove.length === 0) return toast.error("اختر أصنافاً للنقل");
    const targetZone = "dining";
    setIsTransferring(true);
    const r = await transferItems(from.trim(), to.trim().toUpperCase(), itemsToMove, targetZone);
    setIsTransferring(false);
    if (!r.ok) return toast.error(r.error || "فشل نقل الأصناف");
    toast.success(`تم نقل الأصناف بنجاح إلى ${to.trim().toUpperCase()}`);
    onClose();
  }
  return /* @__PURE__ */ jsx(Dialog, { open: true, onOpenChange: (o) => !o && onClose(), children: /* @__PURE__ */ jsxs(DialogContent, { dir: "rtl", className: "max-w-2xl", children: [
    /* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsxs(DialogTitle, { children: [
      "تحويل أصناف من طاولة (",
      sourceTable,
      ")"
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
        /* @__PURE__ */ jsx("label", { className: "text-xs font-bold text-muted-foreground", children: "المنقول منها (ثابتة)" }),
        /* @__PURE__ */ jsx(Input, { value: from, disabled: true, className: "bg-secondary/50 font-bold cursor-not-allowed border-muted" }),
        src && /* @__PURE__ */ jsx("div", { className: "border rounded-lg max-h-60 overflow-auto p-2 bg-card", children: src.items.map((l) => {
          const isSelected = picks[l.id] !== void 0;
          return /* @__PURE__ */ jsxs("div", { className: `flex items-center gap-2 border-b py-2 text-sm transition-colors ${isSelected ? "bg-primary/5" : ""}`, children: [
            /* @__PURE__ */ jsx("input", { type: "checkbox", checked: isSelected, className: "w-4 h-4 cursor-pointer", onChange: (e) => {
              if (e.target.checked) setPicks((prev) => ({
                ...prev,
                [l.id]: l.qty
              }));
              else setPicks((prev) => {
                const n = {
                  ...prev
                };
                delete n[l.id];
                return n;
              });
            } }),
            /* @__PURE__ */ jsx("span", { className: "flex-1 font-medium", children: l.name }),
            isSelected && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 bg-background border rounded px-2 shadow-sm", children: [
              /* @__PURE__ */ jsx("button", { className: "w-6 h-6 flex items-center justify-center hover:bg-secondary rounded font-bold", onClick: () => setPicks((p) => ({
                ...p,
                [l.id]: Math.min(l.qty, (p[l.id] || 0) + 1)
              })), children: "+" }),
              /* @__PURE__ */ jsx("span", { className: "w-6 text-center font-bold text-primary", children: picks[l.id] }),
              /* @__PURE__ */ jsx("button", { className: "w-6 h-6 flex items-center justify-center hover:bg-secondary rounded font-bold", onClick: () => setPicks((p) => ({
                ...p,
                [l.id]: Math.max(1, (p[l.id] || 0) - 1)
              })), children: "-" })
            ] })
          ] }, l.id);
        }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-2 relative", children: [
        /* @__PURE__ */ jsx("label", { className: "text-xs font-bold text-primary", children: "إلى الطاولة (الجديدة)" }),
        /* @__PURE__ */ jsx(Input, { value: search, placeholder: "ابحث واختر طاولة (مثال: C5)...", onChange: (e) => {
          setSearch(e.target.value);
          setTo(e.target.value.toUpperCase());
          setShowList(true);
        }, onFocus: () => setShowList(true), className: "border-primary focus-visible:ring-primary" }),
        showList && /* @__PURE__ */ jsx("div", { className: "absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-auto", children: filteredTables.length === 0 ? /* @__PURE__ */ jsx("div", { className: "p-3 text-center text-sm text-muted-foreground", children: "لا توجد طاولات مطابقة" }) : filteredTables.map((t) => /* @__PURE__ */ jsxs("div", { className: "p-2 cursor-pointer hover:bg-primary/10 hover:text-primary font-medium text-sm border-b transition-colors", onClick: () => {
          setTo(t);
          setSearch(t);
          setShowList(false);
        }, children: [
          "طاولة ",
          t
        ] }, t)) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(DialogFooter, { children: [
      /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: onClose, disabled: isTransferring, children: "إلغاء" }),
      /* @__PURE__ */ jsx(Button, { onClick: doTransfer, disabled: isTransferring, children: isTransferring ? "جاري التحويل..." : "تنفيذ التحويل" })
    ] })
  ] }) });
}
function PrintDialog({
  tableCode,
  order,
  onClose,
  onPrinted
}) {
  const {
    upsertOrder
  } = usePosDB();
  const [discount, setDiscount] = useState(order.discountPct);
  const [pinOpen, setPinOpen] = useState(false);
  const [pendingDiscount, setPendingDiscount] = useState(null);
  const totals = computeTotals(order.items, discount, order.taxPct);
  function doPrint() {
    const updatedOrder = {
      ...order,
      discountPct: discount,
      state: "printed"
    };
    const printData = {
      ...updatedOrder,
      subtotal: totals.subtotal,
      discountValue: totals.discountValue,
      taxValue: totals.taxValue,
      total: totals.total
    };
    upsertOrder(updatedOrder);
    triggerPrint(printData, false);
    onPrinted();
  }
  return /* @__PURE__ */ jsx(Fragment, { children: /* @__PURE__ */ jsx(Dialog, { open: true, onOpenChange: (o) => !o && onClose(), children: /* @__PURE__ */ jsxs(DialogContent, { dir: "rtl", className: "max-w-sm", children: [
    /* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsxs(DialogTitle, { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsx(Printer, { className: "w-5 h-5" }),
      " طباعة الفاتورة"
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "bg-white text-black rounded p-4 font-mono text-xs space-y-1 print:block", children: [
      /* @__PURE__ */ jsx("div", { className: "text-center font-bold text-sm", children: "فاتورة" }),
      /* @__PURE__ */ jsx("div", { className: "text-center", children: order.zone === "takeaway" ? "تيك أواي" : `طاولة: ${tableCode}` }),
      /* @__PURE__ */ jsx("hr", { className: "border-dashed border-black my-2" }),
      order.items.map((l) => /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
        /* @__PURE__ */ jsxs("span", { children: [
          l.name,
          " ×",
          l.qty
        ] }),
        /* @__PURE__ */ jsx("span", { children: fmt2((l.unitPrice + l.extras.reduce((s, e) => s + e.price, 0)) * l.qty) })
      ] }, l.id)),
      /* @__PURE__ */ jsx("hr", { className: "border-dashed border-black my-2" }),
      /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
        /* @__PURE__ */ jsx("span", { children: "المجموع" }),
        /* @__PURE__ */ jsx("span", { children: fmt2(totals.subtotal) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
        /* @__PURE__ */ jsxs("span", { children: [
          "خصم ",
          discount,
          "%"
        ] }),
        /* @__PURE__ */ jsx("span", { children: fmt2(totals.discountValue) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
        /* @__PURE__ */ jsxs("span", { children: [
          "ضريبة ",
          order.taxPct,
          "%"
        ] }),
        /* @__PURE__ */ jsx("span", { children: fmt2(totals.taxValue) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex justify-between font-bold text-sm border-t border-black pt-1", children: [
        /* @__PURE__ */ jsx("span", { children: "الإجمالي" }),
        /* @__PURE__ */ jsx("span", { children: fmt2(totals.total) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 no-print", children: [
      /* @__PURE__ */ jsx("label", { className: "text-xs", children: "خصم %" }),
      /* @__PURE__ */ jsx(Input, { type: "number", step: "any", min: "0", max: "100", value: pendingDiscount !== null ? pendingDiscount : discount, onChange: (e) => setPendingDiscount(clamp0(parseFloat(cleanNumInput(e.target.value)) || 0)), className: "h-8 w-24" }),
      pendingDiscount !== null && pendingDiscount !== discount && /* 🌟 لفينا زرار "تطبيق" بالـ ActionGate بتاعك مباشرة */
      /* @__PURE__ */ jsx(ActionGate, { requiredRole: "محاسب", actionName: "تطبيق نسبة الخصم", onSuccess: (employee) => {
        setDiscount(pendingDiscount);
        upsertOrder({
          ...order,
          discountPct: pendingDiscount
        });
        toast.success(`تم تطبيق خصم ${pendingDiscount}% بواسطة: ${employee.name} 🛡️`);
        setPendingDiscount(null);
      }, children: /* @__PURE__ */ jsx(Button, { size: "sm", children: "تطبيق" }) })
    ] }),
    /* @__PURE__ */ jsxs(DialogFooter, { className: "gap-2 no-print", children: [
      /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: onClose, children: "إلغاء" }),
      /* @__PURE__ */ jsxs(Button, { onClick: doPrint, className: "gap-2", children: [
        /* @__PURE__ */ jsx(Printer, { className: "w-4 h-4" }),
        " طباعة"
      ] })
    ] })
  ] }) }) });
}
function CheckoutDialog({
  tableCode,
  order,
  onClose,
  onDone
}) {
  const {
    db,
    deductSubStock
  } = useDB();
  const {
    db: pos,
    addInvoice
  } = usePosDB();
  const [confirmed, setConfirmed] = useState(false);
  const currentOrder = pos.orders[tableCode] || order;
  const totals = computeTotals(currentOrder.items, currentOrder.discountPct, currentOrder.taxPct);
  function deductInventory() {
    const perDept = {};
    for (const line of currentOrder.items) {
      const meal = db.meals.find((m) => m.id === line.mealId);
      if (!meal || meal.category === SHISHA_CATEGORY) continue;
      const dept = meal.department;
      if (!perDept[dept]) perDept[dept] = {};
      const baseIngredients = expandMealToBase(meal, db.meals, db.items);
      for (const [itemId, info] of baseIngredients) {
        const baseQty = round2(clamp0(info.qty * line.qty));
        if (baseQty <= 0) continue;
        perDept[dept][itemId] = (perDept[dept][itemId] || 0) + baseQty;
      }
    }
    for (const [deptName, itemsMap] of Object.entries(perDept)) {
      const arr = Object.entries(itemsMap).map(([itemId, baseQty]) => ({
        itemId,
        baseQty
      }));
      deductSubStock(deptName, arr);
    }
  }
  const [isSubmitting, setIsSubmitting] = useState(false);
  async function finalize() {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const isTakeaway = currentOrder.zone === "takeaway" || tableCode === "تيك أواي" || currentOrder.tableCode === "تيك أواي" || String(tableCode || "").toUpperCase().startsWith("T") || String(currentOrder.tableCode || "").toUpperCase().startsWith("T");
      const todayStr = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      const deliveryPrice = Number(currentOrder.deliveryPrice) || 0;
      const isOthers = currentOrder.zone === "others";
      let computedType = isTakeaway ? deliveryPrice > 0 ? "delivery" : "takeaway" : "dinein";
      if (isOthers) {
        computedType = currentOrder.orderCategory || "staff";
      }
      const totals2 = computeTotals(currentOrder.items, currentOrder.discountPct || 0, isTakeaway ? 0 : currentOrder.taxPct || 14);
      const isSecCashier = localStorage.getItem("isSecCashierDevice") === "true";
      const secName = localStorage.getItem("secCashierName") || "كاشير فرعي";
      const currentCashierName = isSecCashier ? secName : pos.shift?.cashierName;
      const currentCashierId = isSecCashier ? localStorage.getItem("secCashierId") : pos.shift?.cashierId;
      const inv = {
        id: crypto.randomUUID(),
        type: computedType,
        tableCode: tableCode || currentOrder.tableCode,
        zone: currentOrder.zone || (isTakeaway ? "takeaway" : "dine-in"),
        customerName: currentOrder.customerName || null,
        customerAddress: currentOrder.customerAddress || null,
        cashierId: currentCashierId || null,
        cashierName: currentCashierName || null,
        items: currentOrder.items,
        subtotal: totals2.subtotal,
        discountPct: currentOrder.discountPct || 0,
        discountValue: totals2.discountValue,
        taxPct: totals2.taxPct,
        taxValue: totals2.taxValue,
        deliveryPrice,
        total: totals2.total + deliveryPrice,
        createdAt: Date.now(),
        terminalId: isSecCashier ? "Sub-1" : "Main",
        createdBy: currentCashierName || "كاشير رئيسي"
      };
      const savedInvoice = await addInvoice(inv);
      deductInventory();
      if (savedInvoice) {
        triggerPrint(savedInvoice, true);
      }
      onDone();
      const salesByDept = {};
      currentOrder.items.forEach((item) => {
        const meal = db.meals.find((m) => m.id === item.mealId);
        const dept = meal?.department || "عام";
        if (!salesByDept[dept]) salesByDept[dept] = [];
        salesByDept[dept].push(item);
      });
      for (const [deptName, deptLines] of Object.entries(salesByDept)) {
        const lines = deptLines;
        if (lines.length > 0) {
          const reportCategory = deptName;
          const totalSales = lines.reduce((sum, l) => sum + (l.unitPrice || l.price || 0) * l.qty, 0);
          let totalCost = 0;
          for (const l of lines) {
            const m = db.meals.find((x) => x.id === l.mealId);
            if (m) {
              const baseDeds = expandMealToBase(m, db.meals, db.items);
              for (const [, info] of baseDeds) totalCost += info.cost * l.qty;
            }
          }
          const newSale = {
            id: "sale_" + crypto.randomUUID().split("-")[0] + "_" + Date.now(),
            date: todayStr,
            department: reportCategory,
            lines,
            totalSales,
            totalCost,
            createdAt: Date.now()
          };
          fetch(`http://${API_URL}:5000/api/sales`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify(newSale)
          }).catch((err) => console.error("❌ فشل تسجيل المبيعات:", err));
        }
      }
      onDone();
    } catch (e) {
      toast.error("حدث خطأ أثناء إنهاء الفاتورة");
    } finally {
      setIsSubmitting(false);
    }
  }
  return /* @__PURE__ */ jsx(Dialog, { open: true, onOpenChange: (o) => !o && onClose(), children: /* @__PURE__ */ jsxs(DialogContent, { dir: "rtl", className: "max-w-md", children: [
    /* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsxs(DialogTitle, { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsx(AlertTriangle, { className: "w-5 h-5 text-amber-500" }),
      " تأكيد الإنهاء"
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-2 text-sm", children: [
      /* @__PURE__ */ jsxs("p", { children: [
        "سيتم إنهاء طلب",
        " ",
        /* @__PURE__ */ jsx("strong", { children: currentOrder.zone === "takeaway" ? "تيك أواي" : tableCode }),
        " ",
        "وخصم الكميات من المخزن الفرعي."
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-secondary/50 rounded-lg p-3 space-y-1", children: [
        /* @__PURE__ */ jsx(Row, { label: "المجموع", value: fmt2(totals.subtotal) }),
        /* @__PURE__ */ jsx(Row, { label: "الخصم", value: fmt2(totals.discountValue) }),
        /* @__PURE__ */ jsx(Row, { label: "الضريبة", value: fmt2(totals.taxValue) }),
        totals.commissionValue > 0 && /* @__PURE__ */ jsx(Row, { label: "نسبة المنصة (+5%)", value: fmt2(totals.commissionValue) }),
        /* @__PURE__ */ jsx(Row, { label: "الإجمالي", value: fmt2(totals.total), bold: true })
      ] })
    ] }),
    /* @__PURE__ */ jsxs(DialogFooter, { className: "gap-2", children: [
      /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: onClose, disabled: isSubmitting, children: "إلغاء" }),
      currentOrder.zone === "takeaway" ? /* @__PURE__ */ jsx(Button, { onClick: finalize, disabled: isSubmitting, className: "bg-green-600 hover:bg-green-700 text-white font-bold px-6", children: isSubmitting ? "جاري الإنهاء..." : "إنهاء الفاتورة" }) : /* @__PURE__ */ jsx(Fragment, { children: !confirmed ? /* @__PURE__ */ jsx(Button, { variant: "destructive", onClick: () => setConfirmed(true), disabled: isSubmitting, children: "إنهاء ودفع" }) : /* @__PURE__ */ jsx(Button, { variant: "destructive", onClick: finalize, disabled: isSubmitting, className: "animate-pulse", children: isSubmitting ? "جاري التأكيد..." : "تأكيد نهائي" }) })
    ] })
  ] }) });
}
function TransferCaptainDialog({
  tableCode,
  currentCaptain,
  onClose
}) {
  const {
    db: pos,
    transferCaptain
  } = usePosDB();
  const [pin, setPin] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverEmployees, setServerEmployees] = useState([]);
  const [isMicros] = useState(() => localStorage.getItem("isMicrosDevice") === "true");
  useEffect(() => {
    if (isMicros) return;
    async function fetchEmps() {
      try {
        const res = await fetch(`http://${API_URL}:5000/api/employees`);
        if (res.ok) setServerEmployees(await res.json());
      } catch (e) {
        console.error(e);
      }
    }
    fetchEmps();
  }, [isMicros]);
  const captainsList = useMemo(() => {
    const map = /* @__PURE__ */ new Map();
    if (pos.employees) {
      pos.employees.forEach((e) => {
        if (e.role === "كابتن صالة" || e.role === "captain") map.set(e.name, e);
      });
    }
    if (serverEmployees) {
      serverEmployees.forEach((e) => {
        if (e.role === "كابتن صالة" || e.role === "captain") map.set(e.name, e);
      });
    }
    return Array.from(map.values()).filter((c) => c.name !== currentCaptain);
  }, [pos.employees, serverEmployees, currentCaptain]);
  async function handlePinSubmit(e) {
    e.preventDefault();
    if (!pin || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`http://${API_URL}:5000/api/pos/verify-captain`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          password: pin
        })
      });
      const data = await res.json();
      if (data.success) {
        if (data.captainName === currentCaptain) {
          toast.error("هذا هو نفس الكابتن المسؤول عن الطاولة حالياً!");
          setIsSubmitting(false);
          return;
        }
        const r = await transferCaptain(tableCode, data.captainName);
        if (r.ok) {
          toast.success(`🎉 تم نقل عهدة الطاولة بنجاح إلى الكابتن: ${data.captainName}`);
          onClose();
        }
      } else {
        toast.error(data.error || "رمز الكابتن غير صحيح");
      }
    } catch (err) {
      toast.error("خطأ في الاتصال بالسيرفر");
    } finally {
      setIsSubmitting(false);
    }
  }
  async function handleDirectTransfer(newCapName) {
    if (isSubmitting) return;
    setIsSubmitting(true);
    const r = await transferCaptain(tableCode, newCapName);
    setIsSubmitting(false);
    if (r.ok) {
      toast.success(`🎉 تم نقل عهدة الطاولة بنجاح إلى الكابتن: ${newCapName}`);
      onClose();
    }
  }
  return /* @__PURE__ */ jsx(Dialog, { open: true, onOpenChange: (o) => !o && onClose(), children: /* @__PURE__ */ jsxs(DialogContent, { dir: "rtl", className: "w-[75vw] h-[75vh] max-w-none flex flex-col p-6", children: [
    /* @__PURE__ */ jsx(DialogHeader, { className: "shrink-0", children: /* @__PURE__ */ jsxs(DialogTitle, { className: "flex items-center gap-2 text-lg font-bold", children: [
      /* @__PURE__ */ jsx(UserPlus, { className: "w-5 h-5 text-primary" }),
      " تحويل الطاولة (",
      tableCode,
      ") لكابتن آخر"
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "bg-secondary/40 p-3 rounded-xl border border-border flex items-center justify-between text-sm shrink-0", children: [
      /* @__PURE__ */ jsx("span", { className: "text-muted-foreground font-medium", children: "الكابتن المسؤول حالياً:" }),
      /* @__PURE__ */ jsx("span", { className: "font-bold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 px-2.5 py-1 rounded-md", children: currentCaptain })
    ] }),
    isMicros ? /* @__PURE__ */ jsxs("form", { onSubmit: handlePinSubmit, className: "space-y-4 pt-2 flex-1 flex flex-col justify-center max-w-md mx-auto w-full", children: [
      /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground text-center font-medium", children: "يرجى من الكابتن الجديد المستلم للطاولة إدخال الرمز السري (PIN) للتأكيد والاستلام:" }),
      /* @__PURE__ */ jsx(Input, { type: "password", inputMode: "numeric", autoFocus: true, placeholder: "••••", value: pin, onChange: (e) => setPin(e.target.value), className: "text-center text-2xl tracking-widest h-14 font-bold" }),
      /* @__PURE__ */ jsxs(DialogFooter, { className: "gap-2 pt-2", children: [
        /* @__PURE__ */ jsx(Button, { type: "button", variant: "outline", onClick: onClose, disabled: isSubmitting, children: "إلغاء" }),
        /* @__PURE__ */ jsx(Button, { type: "submit", className: "flex-1 font-bold", disabled: !pin || isSubmitting, children: isSubmitting ? "جاري التحقق والنقل..." : "تأكيد الاستلام والتحويل" })
      ] })
    ] }) : (
      /* 2. الـ container الرئيسي للكاشير بياخد باقي مساحة الارتفاع المتاحة بديناميكية */
      /* @__PURE__ */ jsxs("div", { className: "flex-1 flex flex-col space-y-3 pt-2 min-h-0", children: [
        /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground font-medium shrink-0", children: "اختر اسم الكابتن الجديد الذي سيتم نقل الطاولة إلى عهدته:" }),
        captainsList.length === 0 ? /* @__PURE__ */ jsx("div", { className: "text-center p-6 border rounded-xl bg-muted/30 text-xs text-muted-foreground flex-1 flex items-center justify-center", children: "لا يوجد كباتن آخرون متاحون للتحويل حالياً." }) : (
          /* 3. قمنا بإلغاء الارتفاع الثابت max-h-60 وجعلناه flex-1 ومطاطي مع إضافة Scroll ذكي وتوزيع الأزرار في شبكة متجاوبة */
          /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 overflow-y-auto p-1 flex-1 content-start custom-scrollbar", children: captainsList.map((cap) => /* @__PURE__ */ jsx("button", { type: "button", disabled: isSubmitting, onClick: () => handleDirectTransfer(cap.name), className: "p-4 rounded-xl border-2 border-border bg-card hover:border-primary hover:bg-primary/5 transition flex items-center justify-center font-bold text-sm shadow-sm active:scale-95 h-16", children: cap.name }, cap.id || cap.name)) })
        ),
        /* @__PURE__ */ jsx(DialogFooter, { className: "pt-2 shrink-0", children: /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: onClose, className: "w-full", children: "إغلاق" }) })
      ] })
    )
  ] }) });
}
export {
  OrdersGate as component
};
