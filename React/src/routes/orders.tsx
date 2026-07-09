/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  useDB,
  deptKey,
  convertToBase,
  SHISHA_CATEGORY,
  type Meal,
  type SubDept,
  type Item,
  type ModifierGroup,
} from "@/lib/store";
import {
  usePosDB,
  ZONES,
  PAGE_SIZE,
  setGlobalEditingTable,
  computeTotals,
  type ZoneId,
  type ActiveOrder,
  type OrderItem,
  type Invoice,
} from "@/lib/pos-store.ts";
import { fmt2, round2, clamp0, cleanNumInput } from "@/lib/format";
import { PinPrompt } from "@/components/PinPrompt";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Plus,
  Printer,
  ArrowLeftRight,
  CheckCircle2,
  UserPlus,
  Trash2,
  AlertTriangle,
  Lock,
  ShieldCheck,
  Monitor,
  RefreshCw,
} from "lucide-react";

export const Route = createFileRoute("/orders")({
  head: () => ({ meta: [{ title: "الطلبات - نقطة البيع" }] }),
  component: OrdersGate,
});

function OrdersGate() {
  const { db: pos } = usePosDB();
  const [isSecCashier] = useState(
    () => localStorage.getItem("isSecCashierDevice") === "true",
  );
  const [secCashierName, setSecCashierName] = useState(() =>
    localStorage.getItem("secCashierName"),
  );

  // 1. لو الشيفت الرئيسي مقفول، نوقف الكل هنا
  if (!pos.shift) return <ShiftLogin />;

  // 2. لو الشيفت مفتوح وده "كاشير فرعي" ولسه مسجلش دخول، نطلعله شاشته
  if (isSecCashier && !secCashierName) {
    return (
      <SecCashierLogin
        onLogin={(name, id) => {
          localStorage.setItem("secCashierName", name);
          localStorage.setItem("secCashierId", id);
          setSecCashierName(name);
        }}
      />
    );
  }

  // 3. لو كله تمام، يدخل على شاشة الطلبات
  return <PosScreen />;
}

// 🌟 شاشة تسجيل الدخول الأنيقة المخصصة للكاشير الفرعي فقط (محدثة)
function SecCashierLogin({
  onLogin,
}: {
  onLogin: (name: string, id: string) => void;
}) {
  const { db: pos, findByPin } = usePosDB();
  const [pin, setPin] = useState("");
  const [err, setErr] = useState("");

  const [serverEmployees, setServerEmployees] = useState<any[]>([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);

  // 🌟 جلب الموظفين من السيرفر لو الكاش المحلي فاضي
  useEffect(() => {
    async function fetchEmployeesFallback() {
      if (pos.employees && pos.employees.length > 0) return;
      try {
        setIsLoadingEmployees(true);
        const response = await fetch("http://192.168.1.44:5000/api/employees");
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
  }, [pos.employees, pos.employees.length]);

  const activeEmployeesList = useMemo(() => {
    const map = new Map();
    if (pos.employees) pos.employees.forEach((e) => map.set(e.name, e));
    if (serverEmployees) serverEmployees.forEach((e) => map.set(e.name, e));
    return Array.from(map.values());
  }, [pos.employees, serverEmployees]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");

    // 1️⃣ الفحص الأول: بدون تشفير (عشان يقبل الباسووردات القديمة أو اللي متسجلة نص عادي)
    let emp = activeEmployeesList.find(
      (x) =>
        (x.pin === pin || x.pinHash === pin || x.pin_hash === pin) &&
        x.role === "كاشير",
    );

    // 2️⃣ الفحص التاني: بالتشفير لو الأول فشل (زي الشاشة الرئيسية بالظبط)
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
    return (
      <div className="flex items-center justify-center h-[70vh]" dir="rtl">
        <p className="text-xl font-medium text-emerald-600 animate-pulse font-bold">
          جاري التحقق من الكاشيرية المسجلين في السيرفر...
        </p>
      </div>
    );
  }

  return (
    <div
      dir="rtl"
      className="min-h-[70vh] grid place-items-center animate-in fade-in zoom-in-95 duration-300"
    >
      <form
        onSubmit={submit}
        className="bg-white border border-gray-200 rounded-3xl p-8 w-full max-w-sm space-y-6 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-full h-2 bg-gradient-to-r from-emerald-400 to-teal-500" />
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-4 border border-emerald-100">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-800">
            الكاشير الفرعي
          </h1>
          <p className="text-sm font-medium text-gray-500">
            أدخل الرمز السري لبدء العمل
          </p>
        </div>
        <Input
          type="password"
          inputMode="numeric"
          autoFocus
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          className="text-center text-3xl tracking-widest h-14 font-bold text-emerald-700 bg-gray-50 border-gray-200 rounded-xl focus-visible:ring-emerald-500"
          placeholder="••••"
        />
        {err && (
          <p className="text-sm font-bold text-red-500 text-center bg-red-50 py-2 rounded-lg">
            {err}
          </p>
        )}
        <Button
          type="submit"
          className="w-full h-14 text-lg font-bold bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md shadow-emerald-500/20"
          disabled={!pin}
        >
          تسجيل الدخول
        </Button>
      </form>
    </div>
  );
}
function getNextInvoiceNumber(invoices: Invoice[]) {
  const today = new Date().toDateString();
  const todayInvoices = invoices.filter(
    (i) => i.createdAt && new Date(i.createdAt).toDateString() === today,
  );

  if (todayInvoices.length === 0) return 1;

  const maxNum = Math.max(...todayInvoices.map((i) => i.invoiceNumber || 0));
  return maxNum + 1;
}

/* ---------------- Shift login (Cashier PIN) ---------------- */
function ShiftLogin() {
  const { db: pos, findByPin, openShift } = usePosDB();
  const [pin, setPin] = useState("");
  const [err, setErr] = useState("");

  const [serverEmployees, setServerEmployees] = useState<any[]>([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);

  // 🌟 نقلنا الـ useState دي فوق عشان تتنفذ بالترتيب الصحيح
  const [isMicros, setIsMicros] = useState(() => {
    return localStorage.getItem("isMicrosDevice") === "true";
  });

  // 2. الـ State الجديدة بتاعة الكاشير الفرعي 🌟
  const [isSecCashier, setIsSecCashier] = useState(() => {
    return localStorage.getItem("isSecCashierDevice") === "true";
  });

  // 🌟 الـ useEffect اللي بتشيك أول ما الجهاز يفتح
  useEffect(() => {
    const checkMicros = localStorage.getItem("isMicrosDevice") === "true";
    const checkSecCashier =
      localStorage.getItem("isSecCashierDevice") === "true";

    setIsMicros(checkMicros);
    setIsSecCashier(checkSecCashier); // تحديث حالة الكاشير الفرعي
  }, []);

  useEffect(() => {
    async function fetchEmployeesFallback() {
      if (pos.employees && pos.employees.length > 0) return;
      try {
        setIsLoadingEmployees(true);
        const response = await fetch("http://192.168.1.44:5000/api/employees");
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
  }, [pos.employees, pos.employees.length]);

  const activeEmployeesList = useMemo(() => {
    const map = new Map();
    if (pos.employees) pos.employees.forEach((e) => map.set(e.name, e));
    if (serverEmployees) serverEmployees.forEach((e) => map.set(e.name, e));
    return Array.from(map.values());
  }, [pos.employees, serverEmployees]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");

    const emp = activeEmployeesList.find(
      (x) =>
        (x.pin === pin || x.pinHash === pin || x.pin_hash === pin) &&
        x.role === "كاشير",
    );

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

  // 🌟 الـ Return المشروط ده بقى تحت الـ Hooks فكده السيرفر والـ React مش هيعترضوا
  if (isLoadingEmployees) {
    return (
      <div className="flex items-center justify-center h-[70vh]" dir="rtl">
        <p className="text-xl font-medium text-amber-600 animate-pulse font-bold">
          جاري التحقق من الكاشيرية المسجلين في السيرفر...
        </p>
      </div>
    );
  }

  const cashiersCount = activeEmployeesList.filter(
    (e) => e.role === "كاشير",
  ).length;

  return (
    <>
      {isMicros && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md animate-[fadeIn_0.2s_ease-out_forwards]">
          {/* البوكس الأساسي - ثيم أبيض ونظيف مع حواف رمادية وإضاءة خضراء خفيفة */}
          <div className="relative w-full max-w-md p-6 overflow-hidden border shadow-2xl bg-white rounded-2xl border-gray-200 animate-[scaleUp_0.3s_cubic-bezier(0.34,1.56,0.64,1)_forwards]">
            {/* إضاءة نيون خضراء خافتة في الخلفية للحركة */}
            <div className="absolute -top-12 -left-12 w-32 h-32 bg-emerald-100 rounded-full blur-3xl animate-pulse" />
            <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-gray-100 rounded-full blur-3xl animate-pulse" />

            <div className="relative flex flex-col items-center text-center space-y-5">
              {/* حاوية الأيقونة الخضراء مع أنيميشن نبض رادار (Ping) خفيف */}
              <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400/20 opacity-75 animate-ping" />
                <ShieldCheck className="w-8 h-8 relative z-10 animate-bounce" />
              </div>

              {/* النصوص والعناوين باللون الرمادي الداكن والأخضر */}
              <div className="space-y-2">
                <h2 className="text-xl font-bold tracking-tight text-gray-800">
                  حالة نظام الكاشير
                </h2>
                <p className="text-sm font-semibold leading-relaxed text-emerald-700 bg-emerald-50/60 border border-emerald-100/80 px-4 py-2.5 rounded-xl">
                  لابد من فتح الشيفت في جهاز الكاشير الأساسي أولاً
                </p>
              </div>

              {/* بطاقة توضيحية رمادية ناعمة لشرح الخطوة التالية */}
              <div className="w-full p-4 text-right bg-gray-50 rounded-xl border border-gray-100 space-y-2">
                <div className="flex items-center gap-2 text-gray-500 text-xs font-bold">
                  <Monitor className="w-4 h-4 text-emerald-600" />
                  <span>الخطوات المطلوبة:</span>
                </div>
                <p className="text-[11px] text-gray-600 leading-normal pr-5 relative">
                  <span className="absolute right-1 top-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  توجه إلى الشاشة الرئيسية لجهاز الكاشير السيرفر (الأساسي)، قم
                  بتسجيل الدخول وبدء وردية جديدة لتفعيل النظام على باقي الأجهزة
                  الفرعية.
                </p>
              </div>

              {/* أزرار التحكم - زر أساسي أخضر وزر فرعي رمادي */}
              <div className="flex flex-col w-full gap-2 pt-2">
                <button
                  onClick={() => window.location.reload()}
                  className="flex items-center justify-center gap-2 h-10 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-sm group active:scale-[0.98]"
                >
                  <RefreshCw className="w-3.5 h-3.5 transition-transform group-hover:rotate-180 duration-500" />
                  إعادة فحص حالة الشيفت
                </button>
              </div>
            </div>
          </div>

          {/* الـ Keyframes حق الأنيميشن مدمجة هنا عشان تشتغل تلقائياً بدون تعديل tailwind.config */}
          <style
            dangerouslySetInnerHTML={{
              __html: `
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleUp {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `,
            }}
          />
        </div>
      )}
      {!isMicros && (
        <div dir="rtl" className="min-h-[70vh] grid place-items-center">
          <form
            onSubmit={submit}
            className="bg-card border border-border rounded-2xl p-8 w-full max-w-sm space-y-4 shadow-lg"
          >
            <div className="text-center space-y-1">
              <h1 className="text-xl font-bold">بدء شيفت الكاشير</h1>
              <p className="text-xs text-muted-foreground">
                أدخل كلمة سر الكاشير لفتح شاشة الطلبات.
              </p>
            </div>
            <Input
              type="password"
              inputMode="numeric"
              autoFocus
              placeholder="••••"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="text-center text-xl tracking-widest h-12"
            />
            {err && (
              <p className="text-xs text-destructive text-center">{err}</p>
            )}
            <Button
              type="submit"
              className="w-full h-11"
              disabled={!pin || cashiersCount === 0}
            >
              دخول
            </Button>
            {cashiersCount === 0 && (
              <p className="text-xs text-amber-600 text-center font-bold">
                لا يوجد كاشير مسجل — أضف من صفحة بصمات الموظفين.
              </p>
            )}
          </form>
        </div>
      )}
    </>
  );
}

/* ---------------- Main POS screen ---------------- */
function PosScreen() {
  const { db } = useDB();
  const { db: pos, closeShift, clearOrder, upsertOrder } = usePosDB();
  const [zone, setZone] = useState<ZoneId>("close");
  const [page, setPage] = useState(0);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [openOrder, setOpenOrder] = useState<string | null>(null);
  const [transferOpen, setTransferOpen] = useState(false);
  const [printOrder, setPrintOrder] = useState<string | null>(null);
  const [checkoutConfirm, setCheckoutConfirm] = useState<string | null>(null);
  const [isMicros, setIsMicros] = useState(() => {
    return localStorage.getItem("isMicrosDevice") === "true";
  });
  const isSecCashier = localStorage.getItem("isSecCashierDevice") === "true";

  // 🌟 دالة فتح الطاولة وإرسال قفل الحماية للستور بالترتيب الصحيح
  function handleOpenOrder(code: string | null) {
    setOpenOrder(code); // 1. فتح الـ Dialog في الـ UI أولاً
    setGlobalEditingTable(code); // 2. إبلاغ الستور لحماية الطاولة من المسح
  }

  // 🌟 State الخاصة بنافذة الكابتن
  const [captainPromptOpen, setCaptainPromptOpen] = useState(false);
  const [captainPromptMode, setCaptainPromptMode] = useState<
    "new" | "verify_existing" | "verify_any"
  >("new");
  const [targetTable, setTargetTable] = useState<string | null>(null);
  const [captainPin, setCaptainPin] = useState("");

  useEffect(() => {
    const checkDevice = localStorage.getItem("isMicrosDevice") === "true";
    setIsMicros(checkDevice);
  }, []);

  const currentZone = ZONES.find((z) => z.id === zone)!;
  useEffect(() => {
    setPage(0);
    setSelectedTable(null);
  }, [zone]);

  const tableCodes = useMemo(() => {
    const arr: string[] = [];
    for (let i = 1; i <= currentZone.count; i++)
      arr.push(`${currentZone.prefix}${i}`);
    return arr;
  }, [currentZone]);
  const pageCount = Math.max(1, Math.ceil(tableCodes.length / PAGE_SIZE));
  const visible = tableCodes.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const filteredTables = useMemo(() => {
    if (!search) return visible;
    return visible.filter((code) =>
      code.toUpperCase().includes(search.toUpperCase()),
    );
  }, [visible, search]);

  function tableState(code: string) {
    const o = pos.orders[code];
    if (!o) return "empty" as const;
    return o.state;
  }

  function jumpToCode(code: string) {
    const c = code.trim();
    if (!c) return;
    const z = ZONES.find((z) => c.startsWith(z.prefix) && z.id !== "takeaway");
    if (!z) return toast.error("كود طاولة غير معروف");
    const n = parseInt(c.slice(z.prefix.length));
    if (!n || n < 1 || n > z.count)
      return toast.error("رقم الطاولة خارج النطاق");
    setZone(z.id);
    setPage(Math.floor((n - 1) / PAGE_SIZE));
    setSelectedTable(c);
  }

  // 🌟 المنطق السحري لفتح الطاولة
  function actionOpen() {
    if (!selectedTable) return toast.error("اختر طاولة أولاً");
    const order = pos.orders[selectedTable] as any;

    if (!isMicros) {
      // الكاشير: يدخل فوراً ويفتح الطاولة بدون باسوورد
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
          cashierName: pos.shift?.cashierName || "كاشير غير معروف",
        } as any);
      }
      handleOpenOrder(selectedTable);
      return;
    }

    // الميكروس: هنا الحماية
    if (!order) {
      // 1. طاولة فاضية: نطلب باسوورد كابتن جديد
      setTargetTable(selectedTable);
      setCaptainPromptMode("new");
      setCaptainPin("");
      setCaptainPromptOpen(true);
    } else {
      // 2. طاولة مفتوحة بالفعل
      if (order.openedBy === "captain") {
        // اتفتحت بكابتن: لازم نفس الباسوورد اللي فتحها
        setTargetTable(selectedTable);
        setCaptainPromptMode("verify_existing");
        setCaptainPin("");
        setCaptainPromptOpen(true);
      } else {
        // اتفتحت بكاشير: نطلب باسوورد عشان نسجل اسم الكابتن اللي بيضيف بس
        setTargetTable(selectedTable);
        setCaptainPromptMode("verify_any");
        setCaptainPin("");
        setCaptainPromptOpen(true);
      }
    }
  }

  // 🌟 التحقق من باسوورد الكابتن ومنع التداخل بين الكباتن
  async function handleCaptainSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!captainPin) return;

    const order = pos.orders[targetTable!] as any;

    // تحديد هل الطاولة مفتوحة بكابتن وعايزين نتحقق منه هو بالذات؟
    const expectedCaptain =
      captainPromptMode === "verify_existing" ? order?.captainName : undefined;

    try {
      const res = await fetch(
        "http://192.168.1.44:5000/api/pos/verify-captain",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            password: captainPin,
            expectedCaptainName: expectedCaptain, // 🌟 بنبعت للسيرفر الاسم اللي فاتح الطاولة حالياً
          }),
        },
      );
      const data = await res.json();

      if (data.success) {
        if (captainPromptMode === "new") {
          // طاولة جديدة
          upsertOrder({
            tableCode: targetTable!,
            zone,
            items: [],
            state: "active",
            discountPct: 0,
            taxPct: 14,
            openedAt: Date.now(),
            openedBy: "captain",
            captainName: data.captainName,
          } as any);
        } else if (captainPromptMode === "verify_any") {
          // كانت مفتوحة بكاشير ودخل أول كابتن مسكها
          upsertOrder({
            ...order,
            captainName: data.captainName,
          } as any);
        }

        // لو نجح في الـ verify_existing هيدخل علطول من غير ما يغير أي داتا
        handleOpenOrder(targetTable);
        setCaptainPromptOpen(false);
      } else {
        // ❌ السيرفر هيطلع رسالة الخطأ الصارمة (اسم الكابتن الأصلي) والسيستم هيرفض يدخله
        toast.error(data.error || "رمز غير صحيح أو غير مصرح لك");
      }
    } catch (err) {
      toast.error("خطأ في الاتصال بالسيرفر");
    }
  }

  function actionPrint() {
    if (!selectedTable || !pos.orders[selectedTable])
      return toast.error("لا يوجد طلب على هذه الطاولة");
    setPrintOrder(selectedTable);
  }
  function actionCheckout() {
    if (!selectedTable || !pos.orders[selectedTable])
      return toast.error("لا يوجد طلب على هذه الطاولة");
    setCheckoutConfirm(selectedTable);
  }
  // 🌟 1. تحديد بيانات الكاشير الفرعي ودالة تسجيل الخروج الذكية
  const secCashierName = localStorage.getItem("secCashierName");

  function handleLogout() {
    if (isSecCashier) {
      localStorage.removeItem("secCashierName");
      localStorage.removeItem("secCashierId");
      window.location.reload(); // يرجعه لشاشة الـ PIN الفرعية
    } else {
      closeShift({
        kitchenSales: 0,
        barSales: 0,
        shishaSales: 0,
        taxValue: 0,
        discountValue: 0,
        dineinSales: 0,
        takeawaySales: 0,
        deliverySales: 0,
      });
    }
  }

  const currentCashierName = isSecCashier
    ? secCashierName || "كاشير فرعي"
    : pos.shift?.cashierName || "جاري التحميل...";

  if (zone === "takeaway") {
    return (
      <PosFrame
        onLogout={handleLogout} // 👈 التعديل هنا
        cashierName={currentCashierName} // 👈 التعديل هنا
        zoneTabs={<ZoneTabs zone={zone} setZone={setZone} />}
      >
        <TakeawayView onOpenOrder={(code) => handleOpenOrder(code)} />
        {openOrder && pos.orders[openOrder] && (
          <OrderEntryDialog
            tableCode={openOrder}
            order={pos.orders[openOrder]}
            meals={db.meals}
            items={db.items}
            onClose={() => handleOpenOrder(null)}
          />
        )}
      </PosFrame>
    );
  }

  return (
    <PosFrame
      onLogout={handleLogout} // 👈 التعديل هنا
      cashierName={currentCashierName} // 👈 التعديل هنا
      zoneTabs={<ZoneTabs zone={zone} setZone={setZone} />}
    >
      <div className="px-4 pt-3 flex gap-2 items-center shrink-0">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            dir="rtl"
            placeholder="بحث عن طاولة (مثال: O5, ك12, ص3)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") jumpToCode(search);
            }}
            className="pe-10 h-10"
          />
        </div>
        <Button variant="outline" onClick={() => jumpToCode(search)}>
          اذهب
        </Button>
      </div>

      <div className="flex-1 flex gap-3 px-4 pt-3 min-h-0 overflow-hidden">
        <div className="flex-1 grid grid-cols-5 grid-rows-4 gap-3 min-h-0">
          {filteredTables.map((code) => {
            const order = pos.orders[code] as any;
            const st = tableState(code);
            const sel = selectedTable === code;
            const matchSearch =
              search && code.toUpperCase().includes(search.toUpperCase());
            const hasItems =
              order && Array.isArray(order.items) && order.items.length > 0;

            const colors = !hasItems
              ? "bg-card border-border"
              : st === "active"
                ? "bg-amber-100 dark:bg-amber-950/40 border-amber-400 text-amber-900 dark:text-amber-200"
                : st === "printed"
                  ? "bg-blue-100 dark:bg-blue-950/40 border-blue-400 text-blue-900 dark:text-blue-200"
                  : "bg-card border-border";

            return (
              <button
                key={code}
                onClick={() => setSelectedTable(code)}
                className={`relative rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition overflow-hidden p-2
        ${colors}
        ${sel ? "ring-4 ring-primary/60 scale-[1.02]" : ""}
        ${matchSearch ? "ring-2 ring-emerald-500" : ""}`}
              >
                <TableChairsSvg />
                <span className="font-bold text-lg">{code}</span>

                {/* 🌟 المربع الصغير لعرض أسماء الكباتن والكاشيرات بذكاء */}
                {hasItems && (
                  <div className="flex flex-col items-center gap-0.5 mt-0.5 w-full px-1">
                    {/* 1. لو الطاولة عليها اسم كابتن يظهر أولاً */}
                    {order?.captainName && (
                      <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 px-1.5 py-0.5 rounded font-extrabold truncate max-w-full text-center">
                        كابتن: {order.captainName}
                      </span>
                    )}

                    {/* 2. يعرض اسم الكاشير لو هو اللي فاتح الطاولة، ولو الكابتن اشتغل عليها يعرضهم تحت بعض */}
                    {order?.cashierName && (
                      <span className="text-[10px] bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-200 px-1.5 py-0.5 rounded font-extrabold truncate max-w-full text-center">
                        كاشير: {order.cashierName}
                      </span>
                    )}
                  </div>
                )}

                {st === "printed" && (
                  <span className="text-[10px] uppercase tracking-wide font-bold mt-0.5 text-red-600">
                    مطبوع
                  </span>
                )}
              </button>
            );
          })}
          {Array.from({ length: PAGE_SIZE - visible.length }).map((_, i) => (
            <div
              key={`pad-${i}`}
              className="rounded-2xl border-2 border-dashed border-border/40"
            />
          ))}
        </div>

        <aside className="w-44 shrink-0 flex flex-col gap-2">
          <Button onClick={actionOpen} className="h-16 text-base gap-2">
            <Plus className="w-5 h-5" /> فتح
          </Button>
          {!isMicros && (
            <>
              <Button
                onClick={actionPrint}
                variant="secondary"
                className="h-16 text-base gap-2"
              >
                <Printer className="w-5 h-5" /> طباعة
              </Button>
              <Button
                onClick={() => setTransferOpen(true)}
                variant="secondary"
                className="h-16 text-base gap-2"
              >
                <ArrowLeftRight className="w-5 h-5" /> تحويل
              </Button>
              <Button
                onClick={actionCheckout}
                variant="destructive"
                className="h-16 text-base gap-2"
              >
                <CheckCircle2 className="w-5 h-5" /> إنهاء
              </Button>
            </>
          )}
        </aside>
      </div>

      <div className="px-4 py-2 flex items-center justify-between gap-3 shrink-0 border-t border-border">
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="outline"
            disabled={page === 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          <span className="text-xs text-muted-foreground px-2">
            صفحة {page + 1} / {pageCount}
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={page >= pageCount - 1}
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* 🌟 نافذة الكابتن */}
      <Dialog open={captainPromptOpen} onOpenChange={setCaptainPromptOpen}>
        <DialogContent dir="rtl" className="max-w-xs">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-amber-600" />
              تأكيد الدخول
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCaptainSubmit} className="space-y-4 pt-4">
            <p className="text-sm text-muted-foreground">
              {captainPromptMode === "verify_existing"
                ? "هذه الطاولة محصورة. يرجى إدخال بصمة الكابتن."
                : "يرجى إدخال الرمز السري الخاص بك ككابتن."}
            </p>
            <Input
              type="password"
              inputMode="numeric"
              autoFocus
              placeholder="••••"
              value={captainPin}
              onChange={(e) => setCaptainPin(e.target.value)}
              className="text-center text-xl tracking-widest h-12"
            />
            <Button
              type="submit"
              className="w-full h-11"
              disabled={!captainPin}
            >
              دخول
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modals */}
      {openOrder && pos.orders[openOrder] && (
        <OrderEntryDialog
          tableCode={openOrder}
          order={pos.orders[openOrder]}
          meals={db.meals}
          items={db.items}
          onClose={() => setOpenOrder(null)}
        />
      )}
      {transferOpen && (
        <TransferDialog onClose={() => setTransferOpen(false)} />
      )}
      {printOrder && pos.orders[printOrder] && (
        <PrintDialog
          tableCode={printOrder}
          order={pos.orders[printOrder]}
          onClose={() => setPrintOrder(null)}
          onPrinted={() => {
            const o = pos.orders[printOrder!];
            upsertOrder({ ...o, state: "printed" });
            setPrintOrder(null);
          }}
        />
      )}
      {checkoutConfirm && pos.orders[checkoutConfirm] && (
        <CheckoutDialog
          tableCode={checkoutConfirm}
          order={pos.orders[checkoutConfirm]}
          onClose={() => setCheckoutConfirm(null)}
          onDone={() => {
            clearOrder(checkoutConfirm!);
            setCheckoutConfirm(null);
            setSelectedTable(null);
          }}
        />
      )}
    </PosFrame>
  );
}

function ZoneTabs({
  zone,
  setZone,
}: {
  zone: ZoneId;
  setZone: (z: ZoneId) => void;
}) {
  const [isMicros, setIsMicros] = useState(
    () => localStorage.getItem("isMicrosDevice") === "true",
  );

  useEffect(() => {
    setIsMicros(localStorage.getItem("isMicrosDevice") === "true");
  }, []);

  const allowedZones = isMicros
    ? ZONES.filter((z) => z.id !== "takeaway" && z.id !== "others")
    : ZONES;

  return (
    <div className="flex gap-1 overflow-x-auto px-2">
      {allowedZones.map((z) => (
        <button
          key={z.id}
          onClick={() => setZone(z.id)}
          className={`shrink-0 px-3 h-10 rounded-md text-sm font-medium transition ${
            zone === z.id
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          }`}
        >
          {z.label}
        </button>
      ))}
    </div>
  );
}

function PosFrame({
  children,
  onLogout,
  cashierName,
  zoneTabs,
}: {
  children: React.ReactNode;
  onLogout: () => void;
  cashierName: string;
  zoneTabs: React.ReactNode;
}) {
  return (
    <div
      dir="rtl"
      className="h-[calc(100vh-4rem)] flex flex-col overflow-hidden -my-6 -mx-4"
    >
      {children}
      <footer className="border-t border-border bg-card/60 py-2 flex items-center justify-between gap-2 px-3 shrink-0">
        {zoneTabs}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted-foreground text-[15px]">
            الكاشير: <strong className="text-foreground">{cashierName}</strong>
          </span>
        </div>
      </footer>
    </div>
  );
}

function TableChairsSvg() {
  return (
    <svg width="46" height="32" viewBox="0 0 46 32" className="opacity-60">
      <rect
        x="11"
        y="10"
        width="24"
        height="12"
        rx="3"
        fill="currentColor"
        opacity="0.25"
      />
      {[8, 18, 28].map((x) => (
        <rect
          key={`t-${x}`}
          x={x}
          y="4"
          width="6"
          height="3"
          rx="1"
          fill="currentColor"
          opacity="0.55"
        />
      ))}
      {[8, 18, 28].map((x) => (
        <rect
          key={`b-${x}`}
          x={x}
          y="25"
          width="6"
          height="3"
          rx="1"
          fill="currentColor"
          opacity="0.55"
        />
      ))}
    </svg>
  );
}

function TakeawayView({
  onOpenOrder,
}: {
  onOpenOrder: (code: string) => void;
}) {
  const { db: pos, addCustomer, upsertOrder, updateCustomer } = usePosDB();
  const [q, setQ] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newAddress, setNewAddress] = useState("");

  const filtered = useMemo(
    () =>
      pos.customers.filter(
        (c) => !q || c.name.includes(q) || (c.phone && c.phone.includes(q)),
      ),
    [pos.customers, q],
  );

  function openModal(customer?: any) {
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

  function openFor(c: any, isDelivery: boolean = false) {
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
      openedAt: Date.now(),
    });
    onOpenOrder(code);
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden px-4 pt-3 gap-3">
      <div className="flex gap-2 items-center shrink-0">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            dir="rtl"
            placeholder="بحث باسم العميل أو رقمه..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pe-10 h-10"
          />
        </div>
        <Button onClick={() => openModal()} className="gap-2">
          <UserPlus className="w-4 h-4" /> إضافة عميل جديد
        </Button>
      </div>

      <div className="flex-1 overflow-auto bg-card border border-border rounded-xl">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-xs sticky top-0">
            <tr>
              <th className="text-right p-3">الاسم</th>
              <th className="text-right p-3">الهاتف</th>
              <th className="text-right p-3">العنوان</th>
              <th className="text-right p-3">الطلبات</th>
              <th className="text-right p-3">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="p-8 text-center text-muted-foreground"
                >
                  لا يوجد عملاء.
                </td>
              </tr>
            ) : (
              filtered.map((c) => (
                <tr
                  key={c.id}
                  className="border-t border-border hover:bg-secondary/40"
                >
                  <td className="p-3 font-medium">{c.name}</td>
                  <td className="p-3 text-muted-foreground">
                    {c.phone || "—"}
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {c.address || "—"}
                  </td>
                  <td className="p-3 font-bold">{c.orderCount || 0}</td>
                  <td className="p-3 text-left flex gap-2 justify-end">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openModal(c)}
                    >
                      تعديل
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openFor(c, false)}
                    >
                      🛍️ تيك أواي
                    </Button>
                    <Button
                      size="sm"
                      variant="default"
                      className="bg-amber-600 hover:bg-amber-700 text-white"
                      onClick={() => openFor(c, true)}
                    >
                      🛵 توصيل
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <Dialog open onOpenChange={(o) => !o && setModalOpen(false)}>
          <DialogContent dir="rtl" className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingId ? "تعديل بيانات عميل" : "إضافة عميل جديد"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-xs">الاسم (مطلوب)</label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs">رقم الهاتف (اختياري)</label>
                <Input
                  type="tel"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs">العنوان (اختياري)</label>
                <Input
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setModalOpen(false)}>
                إلغاء
              </Button>
              <Button onClick={handleSave}>حفظ</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

/* ---------------- Order entry (فتح) ---------------- */
function OrderEntryDialog({
  tableCode,
  order,
  meals,
  items,
  onClose,
}: {
  tableCode: string;
  order: ActiveOrder;
  meals: Meal[];
  items: Item[];
  onClose: () => void;
}) {
  const { db, deductSubStock } = useDB();
  const {
    db: pos,
    upsertOrder,
    addInvoice,
    clearOrder,
    incCustomerOrders,
  } = usePosDB();

  // 🌟 السر هنا: المسودة المعزولة تماماً عن المزامنة
  const [draftItems, setDraftItems] = useState<OrderItem[]>(order.items || []);

  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false);
  const [deliveryInputPrice, setDeliveryInputPrice] = useState("");
  const [q, setQ] = useState("");
  const [modifierMeal, setModifierMeal] = useState<Meal | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const sellable = meals.filter((m) => m.kind === "menu");
  const [isMicros, setIsMicros] = useState(
    () => localStorage.getItem("isMicrosDevice") === "true",
  );

  useEffect(() => {
    setIsMicros(localStorage.getItem("isMicrosDevice") === "true");
  }, []);

  const filtered = sellable.filter(
    (m) => !q || m.name.toLowerCase().includes(q.toLowerCase()),
  );
  const categories = useMemo(
    () => Array.from(new Set(sellable.map((m) => m.category).filter(Boolean))),
    [sellable],
  );

  function manufacturable(meal: Meal): number | null {
    if (meal.category === SHISHA_CATEGORY) return null;
    if (!meal.ingredients || meal.ingredients.length === 0) return 0;

    const dbRaw = db as unknown as Record<string, unknown>;

    // 🌟 التعديل السحري هنا: ربطناها بالـ pos.orders الجديدة بدل القديمة
    const allOrders = Object.values(pos.orders || {});

    let min = Infinity;
    for (const ing of meal.ingredients) {
      if (ing.refKind === "meal") continue;
      const it = items.find((x) => x.id === ing.itemId);
      if (!it) return 0;

      const reservedQty = allOrders.reduce((sum: number, order: any) => {
        const itemsList = order.items || [];
        const mealsUsingIt = itemsList.filter((i: any) => i.mealId === meal.id);
        const count = mealsUsingIt.reduce(
          (s: number, i: any) => s + (i.qty || 0),
          0,
        );
        return sum + count * (ing.qty as number);
      }, 0);

      const targetDept = (meal.department || it.department) as "بار" | "مطبخ";
      const totalHave =
        (dbRaw.deptStock as Record<string, number>)?.[
          deptKey(targetDept, it.id)
        ] || 0;

      const have = clamp0(totalHave - reservedQty);
      const conversion =
        it.conversionFactor && it.conversionFactor > 0
          ? it.conversionFactor
          : 1;
      const needBase = convertToBase(
        ing.qty,
        ing.unit as Parameters<typeof convertToBase>[1],
        it.unit as Parameters<typeof convertToBase>[2],
        conversion,
        it.subUnitType as Parameters<typeof convertToBase>[4],
      );

      if (needBase <= 0) continue;
      min = Math.min(min, Math.floor(have / needBase));
    }
    return min === Infinity ? 99 : Math.max(0, min);
  }
  // 🌟 استرجاع دالة السحب الخاصة بالتيك أواي
  function deductInventoryForTakeaway() {
    const perDept: Record<string, { itemId: string; baseQty: number }[]> = {};
    for (const line of draftItems) {
      // بتسحب من مسودة الطلب
      const meal = db.meals.find((m) => m.id === line.mealId);
      if (!meal) continue;
      if (meal.category === SHISHA_CATEGORY) continue;
      const dept = meal.department || "عام";
      for (const ing of meal.ingredients) {
        if (ing.refKind === "meal") continue;
        const it = db.items.find((x) => x.id === ing.itemId);
        if (!it) continue;
        const baseQty = round2(
          clamp0(
            convertToBase(
              ing.qty,
              ing.unit,
              it.unit,
              it.conversionFactor,
              it.subUnitType,
            ) * line.qty,
          ),
        );
        if (baseQty <= 0) continue;
        (perDept[dept] = perDept[dept] || []).push({ itemId: it.id, baseQty });
      }
    }
    for (const [d, arr] of Object.entries(perDept)) {
      deductSubStock(d as SubDept, arr);
    }
  }

  // 🌟 التعديلات على المسودة (لا تُرسل للسيرفر فوراً)
  function addLine(
    meal: Meal,
    extras: { label: string; price: number }[] = [],
    summary?: string,
  ) {
    const line: OrderItem = {
      id: crypto.randomUUID(),
      mealId: meal.id,
      name: meal.name,
      qty: 1,
      unitPrice: round2(meal.sellingPrice),
      extras,
      modifiersSummary: summary,
      mealName: undefined,
      department: "",
    };
    setDraftItems([...draftItems, line]);
  }

  function changeQty(lineId: string, qty: number) {
    setDraftItems(
      draftItems.map((l) => (l.id === lineId ? { ...l, qty: clamp0(qty) } : l)),
    );
  }

  function removeLine(lineId: string) {
    setDraftItems(draftItems.filter((l) => l.id !== lineId));
  }
  // 🌟 دالة اختيار الصنف (لو ليه إضافات يفتحها، لو لأ ينزله في المسودة علطول)
  function onPickMeal(meal: Meal) {
    if (meal.hasModifiers && (meal.modifierGroups?.length || 0) > 0)
      setModifierMeal(meal);
    else addLine(meal);
  }

  // 🌟 الحسابات تعتمد على المسودة المحلية
  const totals = computeTotals(draftItems, order.discountPct, order.taxPct);

  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSaveAndDeduct(code: string) {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      if (order.zone === "takeaway") {
        let finalDeliveryPrice = 0;
        const inputPrice = prompt(
          "الرجاء إدخال مصاريف التوصيل (اتركه 0 إذا كان تيك أواي عادي):",
          "0",
        );
        if (inputPrice === null) {
          setIsSubmitting(false);
          return;
        }
        finalDeliveryPrice = Number(inputPrice) || 0;
        const computedType = finalDeliveryPrice > 0 ? "delivery" : "takeaway";
        // 🌟 تعريفات الكاشير والجهاز المظبوطة 100%
        const isSecDevice =
          localStorage.getItem("isSecCashierDevice") === "true";
        const secName = localStorage.getItem("secCashierName") || "كاشير فرعي";
        const currentCashierName = isSecDevice
          ? secName
          : pos.shift?.cashierName || "كاشير رئيسي";
        const currentCashierId = isSecDevice
          ? localStorage.getItem("secCashierId")
          : pos.shift?.cashierId;
        const currentTerminalId = isSecDevice ? "Sub-1" : "Main";

        const inv: any = {
          id: crypto.randomUUID(),
          invoiceNumber: Math.floor(100000 + Math.random() * 900000),
          type: computedType,
          tableCode: code,
          zone: "takeaway",
          customerName: order.customerName || null,
          customerAddress: order.customerAddress || null,
          cashierId: currentCashierId || null,
          cashierName: currentCashierName,
          captainName: (order as any).captainName || null,
          items: draftItems,
          subtotal: totals.subtotal,
          discountPct: order.discountPct,
          discountValue: totals.discountValue,
          taxPct: 0,
          taxValue: 0,
          deliveryPrice: finalDeliveryPrice,
          total: totals.subtotal - totals.discountValue + finalDeliveryPrice,
          createdAt: Date.now(),

          // 🌟 تأمين الأجهزة والتقارير
          terminalId: currentTerminalId,
          createdBy: currentCashierName,
        };

        await addInvoice(inv);
        deductInventoryForTakeaway();
        if (order.customerName) {
          const c = pos.customers.find((c) => c.name === order.customerName);
          if (c) incCustomerOrders(c.id);
        }
        clearOrder(code);
        if (computedType === "delivery")
          toast.success(
            `تم حفظ الفاتورة كـ Order توصيل! 🛵 (+${finalDeliveryPrice} ج.م)`,
          );
        else toast.success("تم حفظ فاتورة تيك أواي بنجاح! 🛍️");
        onClose();
      } else {
        // 🌟 إرسال المسودة بالكامل للسيرفر عند الحفظ
        upsertOrder({ ...order, items: draftItems, state: "active" });
        toast.success("تم حفظ طلب الصالة على الطاولة! 🍽️");
        onClose();
      }
    } catch (error: any) {
      toast.error(`حدث خطأ: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        dir="rtl"
        className="max-w-7xl w-[100vw] h-[95vh] p-0 overflow-hidden"
      >
        <div className="flex h-full">
          <div className="flex-1 flex flex-col min-w-0 border-l border-border">
            <div className="p-3 border-b border-border space-y-2">
              <div className="flex items-center justify-between gap-3">
                <DialogTitle>طلب الطاولة</DialogTitle>
                <div className="text-sm flex items-center gap-3">
                  <span className="px-2 py-1 rounded bg-secondary font-mono">
                    {order.zone === "takeaway" ? "تيك أواي" : tableCode}
                  </span>
                  {order.customerName && (
                    <span className="text-muted-foreground">
                      {order.customerName}
                    </span>
                  )}
                </div>
              </div>
              <Input
                placeholder="ابحث عن صنف..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>

            <div className="flex-1 overflow-auto p-3">
              {q ? (
                <div className="grid grid-cols-5 gap-3 justify-items-center">
                  {filtered.map((m) => {
                    const stockQty = manufacturable(m);
                    // 🌟 الحسابات تعتمد على المسودة
                    const addedInCart =
                      draftItems.find((it) => it.mealId === m.id)?.qty || 0;
                    const mq =
                      typeof stockQty === "number"
                        ? Math.max(0, stockQty - addedInCart)
                        : stockQty;
                    const isShisha = m.category === SHISHA_CATEGORY;
                    const disabled = !isShisha && mq !== null && mq <= 0;
                    return (
                      <button
                        key={m.id}
                        disabled={disabled}
                        onClick={() => onPickMeal(m)}
                        className={`h-[150px] w-[170px] rounded-xl border-2 p-3 flex flex-col items-center justify-center text-center gap-2 transition ${disabled ? "opacity-40 cursor-not-allowed" : "hover:border-primary hover:bg-primary/5"} ${isShisha ? "border-purple-300 bg-purple-50 dark:bg-purple-950/30" : "border-border bg-card"}`}
                      >
                        <span className="font-bold text-base leading-tight">
                          {m.name}
                        </span>
                        <span className="text-sm text-muted-foreground font-medium">
                          {fmt2(m.sellingPrice)} ج.م
                        </span>
                        {isShisha ? (
                          <span className="text-xs text-purple-700 dark:text-purple-300">
                            شيشة
                          </span>
                        ) : (
                          <span
                            className={`text-xs font-bold ${(mq ?? 0) > 5 ? "text-emerald-600" : "text-amber-600"}`}
                          >
                            العدد: {mq ?? "—"}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : !activeCategory ? (
                <div className="grid grid-cols-6 gap-4">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat ?? null)}
                      className="h-[150px] rounded-xl border-2 border-primary/30 bg-primary/5 text-primary p-4 flex flex-col items-center justify-center text-center font-bold text-lg hover:bg-primary/10 hover:border-primary transition"
                    >
                      <span className="truncate w-full">{cat}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h4 className="font-bold text-lg text-primary">
                      قسم: {activeCategory}
                    </h4>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setActiveCategory(null)}
                    >
                      رجوع للأقسام ←
                    </Button>
                  </div>
                  <div className="grid grid-cols-5 gap-3 justify-items-center">
                    {filtered
                      .filter((m) => m.category === activeCategory)
                      .map((m) => {
                        const stockQty = manufacturable(m);
                        // 🌟 الحسابات تعتمد على المسودة
                        const addedInCart =
                          draftItems.find((it) => it.mealId === m.id)?.qty || 0;
                        const mq =
                          typeof stockQty === "number"
                            ? Math.max(0, stockQty - addedInCart)
                            : stockQty;
                        const isShisha = m.category === SHISHA_CATEGORY;
                        const disabled = !isShisha && mq !== null && mq <= 0;
                        return (
                          <button
                            key={m.id}
                            disabled={disabled}
                            onClick={() => onPickMeal(m)}
                            className={`h-[150px] w-[170px] rounded-xl border-2 p-3 flex flex-col items-center justify-center text-center gap-2 transition ${disabled ? "opacity-40 cursor-not-allowed" : "hover:border-primary hover:bg-primary/5"} ${isShisha ? "border-purple-300 bg-purple-50 dark:bg-purple-950/30" : "border-border bg-card"}`}
                          >
                            <span className="font-bold text-base leading-tight">
                              {m.name}
                            </span>
                            <span className="text-sm text-muted-foreground font-medium">
                              {fmt2(m.sellingPrice)} ج.م
                            </span>
                            {isShisha ? (
                              <span className="text-xs text-purple-700 dark:text-purple-300">
                                شيشة
                              </span>
                            ) : (
                              <span
                                className={`text-xs font-bold ${(mq ?? 0) > 5 ? "text-emerald-600" : "text-amber-600"}`}
                              >
                                العدد: {mq ?? "—"}
                              </span>
                            )}
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}
              {filtered.length === 0 && (
                <div className="col-span-full text-center p-8 text-muted-foreground">
                  لا توجد أصناف مطابقة.
                </div>
              )}
            </div>
          </div>

          <div className="w-80 flex flex-col bg-secondary/30 h-full overflow-hidden">
            <div className="p-3 border-b border-border shrink-0">
              <h3 className="font-bold text-sm">السلة ({draftItems.length})</h3>
            </div>
            <div className="flex-1 overflow-y-auto min-h-0 max-h-[360px] p-2 space-y-1.5">
              {draftItems.length === 0 ? (
                <p className="text-center text-muted-foreground text-xs p-6">
                  السلة فارغة — اختر صنف للإضافة.
                </p>
              ) : (
                draftItems.map((l, index) => (
                  <div
                    key={`${l.id}-${index}`}
                    className="bg-card border border-border rounded-md p-1.5 text-xs shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-1.5">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{l.name}</div>
                        {l.modifiersSummary && (
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            {l.modifiersSummary}
                          </div>
                        )}
                      </div>
                      {!isMicros && (
                        <button
                          onClick={() => removeLine(l.id)}
                          className="text-destructive hover:bg-destructive/10 p-1 rounded transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-2">
                      {!isMicros && (
                        <button
                          onClick={() => changeQty(l.id, l.qty - 1)}
                          className="w-7 h-7 flex items-center justify-center rounded bg-secondary hover:bg-secondary/80"
                        >
                          -
                        </button>
                      )}
                      <input
                        type="number"
                        value={l.qty}
                        className="w-10 h-7 text-center text-xs border rounded bg-background"
                        readOnly
                      />
                      <button
                        onClick={() => changeQty(l.id, l.qty + 1)}
                        className="w-7 h-7 flex items-center justify-center rounded bg-secondary hover:bg-secondary/80"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="p-3 border-t border-border space-y-1 text-xs shrink-0 bg-background/50">
              <Row label="المجموع" value={fmt2(totals.subtotal)} />
              <Row
                label={`الخصم (${order.discountPct}%)`}
                value={fmt2(totals.discountValue)}
              />
              <Row
                label={`الضريبة (${order.taxPct}%)`}
                value={fmt2(totals.taxValue)}
              />
              <Row label="الإجمالي" value={fmt2(totals.total)} bold />
            </div>
            <DialogFooter className="p-3 border-t border-border shrink-0">
              <Button
                onClick={() => handleSaveAndDeduct(order.tableCode)}
                className={`w-full text-sm h-10 ${order.zone === "takeaway" ? "bg-green-600 hover:bg-green-700 text-white" : ""}`}
              >
                {order.zone === "takeaway"
                  ? "ضرب الأوردر وإنهاء الفاتورة"
                  : "حفظ وإغلاق الطاولة"}
              </Button>
            </DialogFooter>
          </div>
        </div>
        {modifierMeal && (
          <ModifierDialog
            meal={modifierMeal}
            onCancel={() => setModifierMeal(null)}
            onConfirm={(extras, summary) => {
              addLine(modifierMeal, extras, summary);
              setModifierMeal(null);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
function Row({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between ${bold ? "text-base font-bold pt-1 border-t border-border" : "text-muted-foreground"}`}
    >
      <span>{label}</span>
      <span>{value} ج.م</span>
    </div>
  );
}

function ModifierDialog({
  meal,
  onCancel,
  onConfirm,
}: {
  meal: Meal;
  onCancel: () => void;
  onConfirm: (
    extras: { label: string; price: number }[],
    summary: string,
  ) => void;
}) {
  const groups = meal.modifierGroups || [];
  const [picks, setPicks] = useState<Record<string, string>>({});
  function confirm() {
    const extras: { label: string; price: number }[] = [];
    const parts: string[] = [];
    for (const g of groups) {
      const oid = picks[g.id];
      if (!oid && g.required) return toast.error(`اختر من ${g.name}`);
      if (!oid) continue;
      const opt = g.options.find((o) => o.id === oid)!;
      extras.push({ label: `${g.name}: ${opt.label}`, price: opt.extraPrice });
      parts.push(`${g.name}: ${opt.label}`);
    }
    onConfirm(extras, parts.join(" • "));
  }
  return (
    <Dialog open onOpenChange={(o) => !o && onCancel()}>
      <DialogContent dir="rtl" className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{meal.name} — الخيارات والإضافات</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 max-h-[60vh] overflow-auto">
          {groups.map((g: ModifierGroup) => (
            <div key={g.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">
                  {g.name}{" "}
                  {g.required && (
                    <span className="text-destructive text-xs">*مطلوب</span>
                  )}
                </h4>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {g.options.map((o) => {
                  const sel = picks[g.id] === o.id;
                  return (
                    <button
                      key={o.id}
                      onClick={() => setPicks((p) => ({ ...p, [g.id]: o.id }))}
                      className={`px-3 py-2 rounded-lg border text-sm flex items-center justify-between ${sel ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border"}`}
                    >
                      <span>{o.label}</span>
                      {o.extraPrice > 0 && (
                        <span className="text-xs">+{fmt2(o.extraPrice)}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onCancel}>
            إلغاء
          </Button>
          <Button onClick={confirm}>إضافة للسلة</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function TransferDialog({ onClose }: { onClose: () => void }) {
  const { db: pos, transferItems } = usePosDB();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [search, setSearch] = useState("");
  const [showList, setShowList] = useState(false);
  const [picks, setPicks] = useState<Record<string, number>>({});
  const allTables = useMemo(() => {
    const cTables = Array.from({ length: 70 }, (_, i) => `C${i + 1}`);
    const oTables = Array.from({ length: 70 }, (_, i) => `O${i + 1}`);
    return [...cTables, ...oTables];
  }, []);
  const filteredTables = allTables.filter((t) =>
    t.toLowerCase().includes(search.toLowerCase()),
  );
  const src = from ? pos.orders[from.trim()] : null;
  function doTransfer() {
    if (!from.trim() || !to.trim()) return toast.error("أدخل الطاولتين");
    const itemsToMove = Object.entries(picks).map(([id, qty]) => ({ id, qty }));
    if (itemsToMove.length === 0) return toast.error("اختر أصنافاً للنقل");
    const targetZone = to.startsWith("C") ? "dining" : "takeaway";
    const r = transferItems(
      from.trim(),
      to.trim(),
      itemsToMove,
      targetZone as any,
    );
    if (!r.ok) return toast.error((r as any).error || "فشل نقل الأصناف");
    toast.success("تم النقل بنجاح");
    onClose();
  }
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent dir="rtl" className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>تحويل أصناف</DialogTitle>
        </DialogHeader>
        {/* ... (نفس كود الترانزفير كما هو بدون تعديل) ... */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-medium">المنقول منها</label>
            <Input
              value={from}
              onChange={(e) => {
                setFrom(e.target.value);
                setPicks({});
              }}
              placeholder="مثال: C1"
            />
            {src && (
              <div className="border rounded-lg max-h-60 overflow-auto p-2">
                {src.items.map((l) => {
                  const isSelected = picks[l.id] !== undefined;
                  return (
                    <div
                      key={l.id}
                      className="flex items-center gap-2 border-b py-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked)
                            setPicks((prev) => ({ ...prev, [l.id]: l.qty }));
                          else
                            setPicks((prev) => {
                              const n = { ...prev };
                              delete n[l.id];
                              return n;
                            });
                        }}
                      />
                      <span className="flex-1">{l.name}</span>
                      {isSelected && (
                        <div className="flex items-center gap-1 bg-secondary rounded px-2">
                          <button
                            onClick={() =>
                              setPicks((p) => ({
                                ...p,
                                [l.id]: Math.min(l.qty, (p[l.id] || 0) + 1),
                              }))
                            }
                          >
                            +
                          </button>
                          <span className="w-6 text-center">{picks[l.id]}</span>
                          <button
                            onClick={() =>
                              setPicks((p) => ({
                                ...p,
                                [l.id]: Math.max(1, (p[l.id] || 0) - 1),
                              }))
                            }
                          >
                            -
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="space-y-2 relative">
            <label className="text-xs font-medium">المنقول إليها</label>
            <Input
              value={search}
              placeholder="بحث (مثال: C5)..."
              onChange={(e) => {
                setSearch(e.target.value);
                setShowList(true);
              }}
              onFocus={() => setShowList(true)}
            />
            {showList && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-auto">
                {filteredTables.map((t) => (
                  <div
                    key={t}
                    className="p-2 cursor-pointer hover:bg-secondary text-sm border-b"
                    onClick={() => {
                      setTo(t);
                      setSearch(t);
                      setShowList(false);
                    }}
                  >
                    {t}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            إلغاء
          </Button>
          <Button onClick={doTransfer}>تنفيذ التحويل</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PrintDialog({
  tableCode,
  order,
  onClose,
  onPrinted,
}: {
  tableCode: string;
  order: ActiveOrder;
  onClose: () => void;
  onPrinted: () => void;
}) {
  const { upsertOrder } = usePosDB();
  const [discount, setDiscount] = useState(order.discountPct);
  const [pinOpen, setPinOpen] = useState(false);
  const [pendingDiscount, setPendingDiscount] = useState<number | null>(null);
  const totals = computeTotals(order.items, discount, order.taxPct);

  function requestDiscount(v: number) {
    if (v === order.discountPct) {
      setDiscount(v);
      return;
    }
    setPendingDiscount(v);
    setPinOpen(true);
  }
  function doPrint() {
    // 1. تحديث الأوردر بالخصم والحالة الجديدة
    const updatedOrder = { ...order, discountPct: discount, state: "printed" };

    // 2. حساب المجاميع عشان تتبعت للطباعة صح
    const printData = {
      ...updatedOrder,
      subtotal: totals.subtotal,
      discountValue: totals.discountValue,
      taxValue: totals.taxValue,
      total: totals.total,
    };

    upsertOrder(updatedOrder as any);

    // 3. استدعاء الطباعة كـ "بون مبدئي" (false)
    triggerPrint(printData, false);

    onPrinted();
  }
  return (
    <>
      <Dialog open onOpenChange={(o) => !o && onClose()}>
        <DialogContent dir="rtl" className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Printer className="w-5 h-5" /> طباعة الفاتورة
            </DialogTitle>
          </DialogHeader>
          <div className="bg-white text-black rounded p-4 font-mono text-xs space-y-1 print:block">
            <div className="text-center font-bold text-sm">فاتورة</div>
            <div className="text-center">
              {order.zone === "takeaway" ? "تيك أواي" : `طاولة: ${tableCode}`}
            </div>
            <hr className="border-dashed border-black my-2" />
            {order.items.map((l) => (
              <div key={l.id} className="flex justify-between">
                <span>
                  {l.name} ×{l.qty}
                </span>
                <span>
                  {fmt2(
                    (l.unitPrice + l.extras.reduce((s, e) => s + e.price, 0)) *
                      l.qty,
                  )}
                </span>
              </div>
            ))}
            <hr className="border-dashed border-black my-2" />
            <div className="flex justify-between">
              <span>المجموع</span>
              <span>{fmt2(totals.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>خصم {discount}%</span>
              <span>{fmt2(totals.discountValue)}</span>
            </div>
            <div className="flex justify-between">
              <span>ضريبة {order.taxPct}%</span>
              <span>{fmt2(totals.taxValue)}</span>
            </div>
            <div className="flex justify-between font-bold text-sm border-t border-black pt-1">
              <span>الإجمالي</span>
              <span>{fmt2(totals.total)}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 no-print">
            <label className="text-xs">خصم %</label>
            <Input
              type="number"
              step="any"
              min="0"
              max="100"
              value={pendingDiscount !== null ? pendingDiscount : discount}
              onChange={(e) =>
                setPendingDiscount(
                  clamp0(parseFloat(cleanNumInput(e.target.value)) || 0),
                )
              }
              className="h-8 w-24"
            />
            {pendingDiscount !== null && pendingDiscount !== discount && (
              <Button size="sm" onClick={() => setPinOpen(true)}>
                تطبيق
              </Button>
            )}
          </div>
          <DialogFooter className="gap-2 no-print">
            <Button variant="outline" onClick={onClose}>
              إلغاء
            </Button>
            <Button onClick={doPrint} className="gap-2">
              <Printer className="w-4 h-4" /> طباعة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <PinPrompt
        open={pinOpen}
        title="تعديل الخصم"
        description="مطلوب كلمة سر المسؤول لتغيير نسبة الخصم."
        onClose={() => {
          setPinOpen(false);
          setPendingDiscount(null);
        }}
        onSuccess={() => {
          if (pendingDiscount !== null) {
            setDiscount(pendingDiscount);
            upsertOrder({ ...order, discountPct: pendingDiscount });
            toast.success("تم تطبيق الخصم");
          }
          setPinOpen(false);
          setPendingDiscount(null);
        }}
        onCancel={function (): void {
          throw new Error("Function not implemented.");
        }}
      />
    </>
  );
}

function CheckoutDialog({
  tableCode,
  order,
  onClose,
  onDone,
}: {
  tableCode: string;
  order: ActiveOrder;
  onClose: () => void;
  onDone: () => void;
}) {
  const { db, deductSubStock, addSale } = useDB();
  const { db: pos, addInvoice, incCustomerOrders } = usePosDB();
  const [confirmed, setConfirmed] = useState(false);

  const currentOrder = pos.orders[tableCode] || order;
  const totals = computeTotals(
    currentOrder.items,
    currentOrder.discountPct,
    currentOrder.taxPct,
  );

  function deductInventory() {
    const perDept: Record<string, { itemId: string; baseQty: number }[]> = {};
    for (const line of currentOrder.items) {
      const meal = db.meals.find((m) => m.id === line.mealId);
      if (!meal) continue;
      if (meal.category === SHISHA_CATEGORY) continue;
      const dept = meal.department;
      for (const ing of meal.ingredients) {
        if (ing.refKind === "meal") continue;
        const it = db.items.find((x) => x.id === ing.itemId);
        if (!it) continue;
        const baseQty = round2(
          clamp0(
            convertToBase(
              ing.qty,
              ing.unit,
              it.unit,
              it.conversionFactor,
              it.subUnitType,
            ) * line.qty,
          ),
        );
        if (baseQty <= 0) continue;
        (perDept[dept] = perDept[dept] || []).push({ itemId: it.id, baseQty });
      }
    }
    for (const [d, arr] of Object.entries(perDept))
      deductSubStock(d as SubDept, arr);
  }

  // 1. ضيف الـ State دي في بداية الكومبوننت لو مش ضايفها
  const [isSubmitting, setIsSubmitting] = useState(false);
  async function finalize() {
    if (isSubmitting) return; // منع الضغط المزدوج
    setIsSubmitting(true);

    try {
      const isTakeaway =
        currentOrder.zone === "takeaway" ||
        tableCode === "تيك أواي" ||
        currentOrder.tableCode === "تيك أواي" ||
        String(tableCode || "")
          .toUpperCase()
          .startsWith("T") ||
        String(currentOrder.tableCode || "")
          .toUpperCase()
          .startsWith("T");

      const todayStr = new Date().toISOString().split("T")[0];
      const deliveryPrice = Number((currentOrder as any).deliveryPrice) || 0;
      const computedType = isTakeaway
        ? deliveryPrice > 0
          ? "delivery"
          : "takeaway"
        : "dinein";

      // 🌟 الاعتماد الكلي على الدالة الأصلية لمنع التضارب وازدواجية الضريبة
      const totals = computeTotals(
        currentOrder.items,
        currentOrder.discountPct || 0,
        isTakeaway ? 0 : (currentOrder as any).taxPct || 14,
      );

      const isSecCashier =
        localStorage.getItem("isSecCashierDevice") === "true";
      const secName = localStorage.getItem("secCashierName") || "كاشير فرعي";
      const currentCashierName = isSecCashier
        ? secName
        : pos.shift?.cashierName;
      const currentCashierId = isSecCashier
        ? localStorage.getItem("secCashierId")
        : pos.shift?.cashierId;

      const inv: any = {
        id: crypto.randomUUID(),
        invoiceNumber: Math.floor(100000 + Math.random() * 900000),
        type: computedType,
        tableCode: tableCode || currentOrder.tableCode,
        zone: currentOrder.zone || (isTakeaway ? "takeaway" : "dine-in"),
        customerName: currentOrder.customerName || null,
        customerAddress: currentOrder.customerAddress || null,
        cashierId: currentCashierId || null,
        cashierName: currentCashierName || null,
        items: currentOrder.items,

        // 🌟 إرسال الحسابات السليمة المظبوطة
        subtotal: totals.subtotal,
        discountPct: currentOrder.discountPct || 0,
        discountValue: totals.discountValue,
        taxPct: totals.taxPct,
        taxValue: totals.taxValue,
        deliveryPrice: deliveryPrice,
        total: totals.total + deliveryPrice,

        createdAt: Date.now(),
        terminalId: isSecCashier ? "Sub-1" : "Main",
        createdBy: currentCashierName || "كاشير رئيسي",
      };

      // 3️⃣ حفظ الفاتورة وتحديث المخزون
      await addInvoice(inv);
      deductInventory();
      // 🌟 استدعاء الطباعة كـ "فاتورة نهائية" (true)
      triggerPrint(inv, true);

      // 4️⃣ توزيع المبيعات على الأقسام والتقرير اليومي
      const salesByDept: Record<string, any[]> = {};
      currentOrder.items.forEach((item: any) => {
        const dept = item.department || "عام";
        if (!salesByDept[dept]) {
          salesByDept[dept] = [];
        }
        salesByDept[dept].push(item);
      });

      for (const [deptName, deptLines] of Object.entries(salesByDept)) {
        const lines = deptLines as any[];

        if (lines.length > 0) {
          // لو تيك أواي هينزل في خانة مستقلة باسم "التيك اوي"[cite: 12]
          const reportCategory = isTakeaway ? "التيك اوي" : deptName;

          const totalSales = lines.reduce(
            (sum: number, l: any) => sum + l.price * l.qty,
            0,
          );
          const totalCost = lines.reduce(
            (sum: number, l: any) => sum + (l.costPrice || 0) * l.qty,
            0,
          );

          const newSale = {
            id: "sale_" + crypto.randomUUID().split("-")[0] + "_" + Date.now(),
            date: todayStr,
            department: reportCategory,
            lines: lines,
            totalSales: totalSales,
            totalCost: totalCost,
            createdAt: Date.now(),
          };

          // await addDailySale(newSale);
        }
      }

      onDone();
    } catch (e) {
      toast.error("حدث خطأ أثناء إنهاء الفاتورة");
    } finally {
      setIsSubmitting(false);
    }
  }
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent dir="rtl" className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" /> تأكيد الإنهاء
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-2 text-sm">
          <p>
            سيتم إنهاء طلب{" "}
            <strong>
              {currentOrder.zone === "takeaway" ? "تيك أواي" : tableCode}
            </strong>{" "}
            وخصم الكميات من المخزن الفرعي.
          </p>
          <div className="bg-secondary/50 rounded-lg p-3 space-y-1">
            <Row label="المجموع" value={fmt2(totals.subtotal)} />
            <Row label="الخصم" value={fmt2(totals.discountValue)} />
            <Row label="الضريبة" value={fmt2(totals.taxValue)} />
            <Row label="الإجمالي" value={fmt2(totals.total)} bold />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            إلغاء
          </Button>
          {currentOrder.zone === "takeaway" ? (
            <Button
              onClick={finalize}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700 text-white font-bold px-6"
            >
              {isSubmitting ? "جاري الإنهاء..." : "إنهاء الفاتورة"}
            </Button>
          ) : (
            <>
              {!confirmed ? (
                <Button
                  variant="destructive"
                  onClick={() => setConfirmed(true)}
                  disabled={isSubmitting}
                >
                  إنهاء ودفع
                </Button>
              ) : (
                <Button
                  variant="destructive"
                  onClick={finalize}
                  disabled={isSubmitting}
                  className="animate-pulse"
                >
                  {isSubmitting ? "جاري التأكيد..." : "تأكيد نهائي"}
                </Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// 🌟 دالة الطباعة الذكية (بون مبدئي أو فاتورة نهائية)
// eslint-disable-next-line react-refresh/only-export-components
export const triggerPrint = (data: any, isFinal: boolean = false) => {
  const printWindow = window.open("", "_blank", "width=400,height=600");
  if (!printWindow) return;

  const dPrice = Number(data.deliveryPrice) || 0;
  const invoiceNumber = data.invoiceNumber || "000000";
  const createdAt = data.createdAt || Date.now();
  const typeLabel =
    data.type === "delivery"
      ? "توصيل"
      : data.type === "takeaway"
        ? "تيك أواي"
        : "صالة";

  const html = `
  <html dir="rtl">
    <head>
      <title>طباعة الفاتورة</title>
      <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 20px; font-size: 14px; }
        .header { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
        .type-title { font-size: 18px; font-weight: bold; margin: 10px 0; border: 2px dashed #000; padding: 5px; background: #f9f9f9; }
        .meta { margin-bottom: 10px; font-size: 12px; border-bottom: 1px dashed #000; padding-bottom: 5px; text-align: right; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; text-align: right; }
        th { border-bottom: 1px solid #000; padding: 4px; font-size: 13px; }
        td { padding: 4px; font-size: 13px; vertical-align: top; }
        .totals { margin-top: 10px; border-top: 1px dashed #000; padding-top: 5px; text-align: right; }
        .totals div { display: flex; justify-content: space-between; margin-bottom: 3px; font-size: 13px; }
        .bold { font-weight: bold; font-size: 15px; }
      </style>
    </head>
    <body>
      <div class="header">مجمع الـمـول</div>
      
      <div class="type-title">
        ${isFinal ? "فاتورة نهائية (مدفوعة)" : "بون حساب مبدئي (غير مدفوع)"}
      </div>

      <div class="meta">
        ${isFinal ? `<div>رقم الفاتورة: ${invoiceNumber}</div>` : ""}
        <div>التاريخ: ${new Date(createdAt).toLocaleString("ar-EG")}</div>
        <div>النوع: ${typeLabel}</div>
        ${data.tableCode ? `<div>رقم الطاولة: ${data.tableCode}</div>` : ""}
        ${data.cashierName ? `<div>الكاشير: ${data.cashierName}</div>` : ""}
      </div>
      
      <table>
        <thead>
          <tr>
            <th>الصنف</th>
            <th style="text-align:center;">الكمية</th>
            <th style="text-align:left;">الإجمالي</th>
          </tr>
        </thead>
        <tbody>
          ${(typeof data.items === "string"
            ? JSON.parse(data.items)
            : data.items
          )
            .map((line: any) => {
              const exStr =
                line.extras && line.extras.length
                  ? ` <br><span style="font-size:10px;color:#555;">(+${line.extras.map((e: any) => e.name || e.label).join(", ")})</span>`
                  : "";
              const lineTotal =
                (line.unitPrice +
                  (line.extras
                    ? line.extras.reduce((s: number, e: any) => s + e.price, 0)
                    : 0)) *
                line.qty;
              return `<tr><td>${line.mealName || line.name}${exStr}</td><td style="text-align:center;">${line.qty}</td><td style="text-align:left;">${lineTotal.toFixed(2)} ج</td></tr>`;
            })
            .join("")}
        </tbody>
      </table>
      
      <div class="totals">
        <div><span>المجموع الأصلي:</span> <span>${Number(data.subtotal || 0).toFixed(2)} ج</span></div>
        ${data.discountValue > 0 ? `<div><span>الخصم:</span> <span>${Number(data.discountValue).toFixed(2)} ج</span></div>` : ""}
        ${data.taxValue > 0 ? `<div><span>الضريبة:</span> <span>${Number(data.taxValue).toFixed(2)} ج</span></div>` : ""}
        ${dPrice > 0 ? `<div><span>التوصيل:</span> <span class="bold">${dPrice.toFixed(2)} ج</span></div>` : ""}
        <div class="bold" style="border-top:1px solid #000; padding-top:4px; margin-top:4px;">
          <span>الإجمالي النهائي:</span> <span>${Number(data.total || 0).toFixed(2)} ج</span>
        </div>
      </div>
      <div style="margin-top:20px; font-size:11px; border-top:1px solid #000; padding-top:5px;">شكراً لزيارتكم!</div>
      <script>window.onload = function() { window.print(); window.close(); }</script>
    </body>
  </html>
  `;
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
};
