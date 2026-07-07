/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useState } from "react";
import { round2, clamp0 } from "./format";
import { sha256 as jsSha256 } from "js-sha256";
import { toast } from "sonner";

// 🛡️ قفل المزامنة العالمي - بره الـ Hook تماماً عشان يحمي الطاولة المفتوحة
interface SyncLocks {
  editingTable: string | null;
  isPollingOrders: boolean;
}

const syncLocks: SyncLocks = {
  editingTable: null,
  isPollingOrders: false,
};

export function setGlobalEditingTable(code: string | null) {
  syncLocks.editingTable = code;
}

if (typeof window !== "undefined") {
  if (!window.crypto) {
    (window as any).crypto = {};
  }
  if (!window.crypto.randomUUID) {
    (window as any).crypto.randomUUID = () => {
      return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
    };
  }
}

export type EmployeeRole = "كاشير" | "كابتن صالة";
export interface Employee {
  id: string;
  name: string;
  role: EmployeeRole;
  pinHash: string;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  orderCount: number;
  createdAt: number;
}

export type ZoneId =
  | "close"
  | "open"
  | "takeaway"
  | "others"
  | "small"
  | "large"
  | "kids";
export interface Zone {
  id: ZoneId;
  label: string;
  prefix: string;
  count: number;
}

export const ZONES: Zone[] = [
  { id: "close", label: "صالة مغلقة", prefix: "C", count: 70 },
  { id: "open", label: "صالة مفتوحة", prefix: "O", count: 70 },
  { id: "takeaway", label: "Take-away", prefix: "T", count: 0 },
  { id: "others", label: "Others", prefix: "X", count: 20 },
  { id: "small", label: "القاعة الصغيرة", prefix: "ص", count: 30 },
  { id: "large", label: "القاعة الكبيرة", prefix: "ك", count: 50 },
  { id: "kids", label: "منطقة الأطفال", prefix: "K", count: 20 },
];

export const PAGE_SIZE = 20;
export type TableState = "empty" | "active" | "printed";

export interface OrderItem {
  department: string;
  mealName: any;
  id: string;
  mealId: string;
  name: string;
  qty: number;
  unitPrice: number;
  extras: { name?: any; label: string; price: number }[];
  modifiersSummary?: string;
}

export interface ActiveOrder {
  tableCode: string;
  zone: ZoneId;
  items: OrderItem[];
  state: TableState;
  discountPct: number;
  taxPct: number;
  customerName?: string;
  customerAddress?: string;
  openedAt: number;
  inventoryDeducted?: boolean;
  type?: "takeaway" | "delivery";
  customerPhone?: string | null;
  deliveryPrice?: number;
  openedByPassword?: string; // البصمة (الباسوورد) اللي اتفتحت بيها لمنع دخول كابتن آخر
  captainName?: string; // اسم الكابتن (لو مفتوحة من ميكروس)
  cashierName?: string; // اسم الكاشير (لو مفتوحة من الرئيسي)
}

export interface Invoice {
  id: string;
  type: "dinein" | "takeaway" | "delivery";
  deliveryPrice?: number;
  invoiceNumber: number;
  tableCode?: string;
  zone?: ZoneId;
  customerName?: string;
  customerAddress?: string;
  cashierId?: string;
  cashierName?: string;
  captainName?: string | null;
  items: OrderItem[];
  subtotal: number;
  discountPct: number;
  discountValue: number;
  taxPct: number;
  taxValue: number;
  total: number;
  createdAt: number;
  // 🌟 ضيف السطرين دول هنا عشان الـ TypeScript يتعرف عليهم:
  terminalId?: string;
  createdBy?: string;
  // لو الباك إند بيبعتهم أحياناً بـ snake_case ممكن تضيفهم برضه كأمان:
  terminal_id?: string;
  created_by?: string;
}

export interface ShiftState {
  id?: string; // 👈 ضفنا الـ id كاختياري
  cashierId: string;
  cashierName: string;
  openedAt: number;
  closedAt?: number | null; // 👈 خليناه يقبل null أو undefined عشان الأخطاء تموت
  terminalId?: string;
}

interface PosDB {
  employees: Employee[];
  customers: Customer[];
  orders: Record<string, ActiveOrder>;
  invoices: Invoice[];
  shift: ShiftState | null;
  shifts: ShiftState[];
}

const KEY = "rest-pos-db-v1";

export const hashPin = async (s: string): Promise<string> => jsSha256(s);

function defaultDB(): PosDB {
  return {
    employees: [],
    customers: [],
    orders: {},
    invoices: [],
    shift: null,
    shifts: [],
  };
}

function load(): PosDB {
  if (typeof window === "undefined") return defaultDB();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultDB();
    return JSON.parse(raw);
  } catch {
    return defaultDB();
  }
}

function save(db: PosDB) {
  localStorage.setItem(KEY, JSON.stringify(db));
  window.dispatchEvent(new Event("pos-update"));
}

export function usePosDB() {
  // 1. نبدأ بالديفولت عشان نتجنب أخطاء الريفريش
  const [db, setDb] = useState<PosDB>(defaultDB);
  const [isLoadingEmployees] = useState(false);

  useEffect(() => {
    // 2. نجبر الكود يقرأ اللوكل ستوريدج بمجرد ما الصفحة تفتح ويحط الشيفت المفتوح
    const initialDb = load();
    setDb(initialDb);

    const r = () => setDb(load());
    window.addEventListener("pos-update", r);
    window.addEventListener("storage", r);
    return () => {
      window.removeEventListener("pos-update", r);
      window.removeEventListener("storage", r);
    };
  }, []);

  // 1. مزامنة منفصلة تطلب شيفت الجهاز الحالي بس وتترجم البيانات للواجهة
  useEffect(() => {
    if (typeof window === "undefined" || syncLocks.isPollingOrders) return;
    syncLocks.isPollingOrders = true;

    const fetchActiveOrders = async () => {
      try {
        const isSecCashier =
          localStorage.getItem("isSecCashierDevice") === "true";
        const currentTerminalId = isSecCashier ? "Sub-1" : "Main";
        
        const [ordersRes, shiftRes] = await Promise.all([
          fetch("http://192.168.1.44:5000/api/pos/orders").catch(() => null),
          // 👈 بنبعت رقم الجهاز الحالي (Sub-1 للتابلت) عشان السيرفر يرد بالشيفت بتاعه
          fetch(
            `http://192.168.1.44:5000/api/pos/shift?terminalId=${currentTerminalId}`,
          ).catch(() => null),
        ]);

        if (!ordersRes || !ordersRes.ok) return;
        const serverOrders = await ordersRes.json();

        let serverShift = null;
        if (shiftRes && shiftRes.ok) {
          const rawShift = await shiftRes.json();
          // 🔥 السحر هنا: المترجم اللي بيحول بيانات الداتابيز لصيغة تفهمها الواجهة
          if (rawShift && (rawShift.opened_at || rawShift.openedAt)) {
            serverShift = {
              id: rawShift.id,
              cashierId: rawShift.cashier_id || rawShift.cashierId,
              cashierName:
                rawShift.cashier_name || rawShift.cashierName || "كاشير",
              openedAt: Number(rawShift.opened_at || rawShift.openedAt),
              closedAt: rawShift.closed_at
                ? Number(rawShift.closed_at)
                : undefined, // 👈 غيرناها لـ undefined
              terminalId:
                rawShift.terminal_id ||
                rawShift.terminalId ||
                currentTerminalId,
            };
          }
        }

        const cur = load();
        cur.shift = serverShift; // تحديث شيفت الجهاز الحالي فقط محلياً بالبيانات المترجمة

        let hasChanges = false;
        for (const code in serverOrders) {
          if (code === syncLocks.editingTable) continue;
          if (
            JSON.stringify(cur.orders[code]) !==
            JSON.stringify(serverOrders[code])
          ) {
            cur.orders[code] = serverOrders[code];
            hasChanges = true;
          }
        }

        for (const code in cur.orders) {
          if (code === syncLocks.editingTable) continue;
          if (!serverOrders[code]) {
            delete cur.orders[code];
            hasChanges = true;
          }
        }

        if (hasChanges) save(cur);
        setDb(cur);
      } catch (err) {
        /* empty */
      }
    };

    fetchActiveOrders();
    const interval = setInterval(fetchActiveOrders, 1500);
    return () => {
      clearInterval(interval);
      syncLocks.isPollingOrders = false;
    };
  }, []);

  // 🌟 دالة فتح الشيفت المتوافقة تماماً والمترجمة للواجهة
  const openShift = useCallback(
    async (cashierId: string, cashierName: string) => {
      const isSecCashier =
        localStorage.getItem("isSecCashierDevice") === "true";
      const currentTerminalId = isSecCashier ? "Sub-1" : "Main";

      const newShiftData = {
        cashierId,
        cashierName,
        openedAt: Date.now(),
        terminalId: currentTerminalId,
      };

      try {
        const res = await fetch("http://192.168.1.44:5000/api/pos/shift/open", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newShiftData),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "فشل فتح الوردية بالسيرفر");
        }

        const serverResponse = await res.json();

        if (serverResponse.success && serverResponse.shift) {
          const savedShift = serverResponse.shift;

          // 🔥 ترجمة البيانات فوراً وقت الفتح عشان الشاشة تدخلك على طول
          const formattedShift = {
            id: savedShift.id,
            cashierId: savedShift.cashier_id || savedShift.cashierId,
            cashierName:
              savedShift.cashier_name || savedShift.cashierName || cashierName,
            openedAt: Number(savedShift.opened_at || savedShift.openedAt),
            closedAt: savedShift.closed_at
              ? Number(savedShift.closed_at)
              : undefined, // 👈 غيرناها لـ undefined
            terminalId:
              savedShift.terminal_id ||
              savedShift.terminalId ||
              currentTerminalId,
          };

          const cur = load();
          cur.shift = formattedShift;
          save(cur);
          setDb(cur);

          toast.success(`🚀 تم بدء الوردية بنجاح للجهاز ${currentTerminalId}`);
          return true;
        } else {
          throw new Error("استجابة غير صالحة من السيرفر");
        }
      } catch (err: any) {
        toast.error(err.message || "خطأ في الاتصال بالسيرفر");
        return false;
      }
    },
    [],
  );

  // 3. دالة إغلاق الشيفت للجهاز الحالي حصراً
  const closeShift = useCallback(
    async (totalsData: {
      kitchenSales: number;
      barSales: number;
      shishaSales: number;
      taxValue: number;
      discountValue: number;
      dineinSales: number;
      takeawaySales: number;
      deliverySales: number;
      terminalId?: string;
      actualCash?: number;
    }) => {
      const isSecCashier =
        localStorage.getItem("isSecCashierDevice") === "true";
      const currentTerminalId = isSecCashier ? "Sub-1" : "Main";
      const activeShift = load().shift;

      if (!activeShift) {
        toast.error("لا يوجد وردية مفتوحة لإغلاقها على هذا الجهاز!");
        return false;
      }

      const closedShiftData = {
        cashierId: activeShift.cashierId,
        cashierName: activeShift.cashierName,
        openedAt: activeShift.openedAt,
        closedAt: Date.now(),
        ...totalsData,
        terminalId: currentTerminalId,
      };

      try {
        const res = await fetch("http://192.168.1.44:5000/api/shifts", {
          method: "POST",
          mode: "cors",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(closedShiftData),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "فشل الحفظ على السيرفر");
        }

        const savedShiftFromServer = await res.json();
        const cur = load();
        cur.shifts = [savedShiftFromServer, ...cur.shifts];
        cur.shift = null; // تصفير كاش الوردية للجهاز ده بس

        save(cur);
        setDb(cur);

        toast.success(
          `🎉 تم إغلاق الوردية وحفظ تقرير المطابقة للجهاز ${currentTerminalId}`,
        );
        return savedShiftFromServer;
      } catch (err: any) {
        toast.error(err.message || "فشل الاتصال بالسيرفر");
        return false;
      }
    },
    [],
  );

  const addEmployee = useCallback(
    async (name: string, role: EmployeeRole, pin: string) => {
      const cur = load();
      const pinHash = await hashPin(pin);

      // 🔍 التحقق من تكرار الـ PIN قبل الإضافة لمنع الأخطاء
      const isDuplicate = cur.employees.some((emp) => emp.pinHash === pinHash);
      if (isDuplicate) {
        toast.error(
          "عذراً، هذا الرقم السري مستخدم بالفعل لموظف آخر! اختر رقماً مختلفاً.",
        );
        return; // بيوقف التنفيذ ومبيضيفش حاجة
      }

      cur.employees.push({
        id: crypto.randomUUID(),
        name: name.trim(),
        role,
        pinHash,
      });
      save(cur);
      setDb(cur);
      toast.success("تم إضافة الموظف بنجاح");
    },
    [],
  );

  const updateEmployee = useCallback(async (id: string, patch: any) => {
    const cur = load();
    const e = cur.employees.find((x) => x.id === id);
    if (!e) return;

    // 🔍 لو المستخدم بيعدل الـ PIN، نتحقق إنه مش متكرر مع موظف تاني غير نفسه
    if (patch.newPin) {
      const newHash = await hashPin(patch.newPin);
      const isDuplicate = cur.employees.some(
        (emp) => emp.pinHash === newHash && emp.id !== id,
      );

      if (isDuplicate) {
        toast.error("عذراً، الرقم السري الجديد مستخدم بالفعل لموظف آخر!");
        return; // بيوقف التعديل
      }
      e.pinHash = newHash;
    }

    if (patch.name !== undefined) e.name = patch.name.trim();
    if (patch.role !== undefined) e.role = patch.role;

    save(cur);
    setDb(cur);
    toast.success("تم التحديث بنجاح");
  }, []);

  const deleteEmployee = useCallback((id: string) => {
    const cur = load();
    cur.employees = cur.employees.filter((e) => e.id !== id);
    save(cur);
    setDb(cur);
    toast.success("تم حذف الموظف");
  }, []);

  const verifyEmployeePin = useCallback(async (id: string, pin: string) => {
    const cur = load();
    const e = cur.employees.find((x) => x.id === id);
    if (!e) return false;
    return (await hashPin(pin)) === e.pinHash;
  }, []);

  const findByPin = useCallback(async (pin: string, role?: EmployeeRole) => {
    const cur = load();
    const h = await hashPin(pin);
    return (
      cur.employees.find(
        (e) => e.pinHash === h && (!role || e.role === role),
      ) || null
    );
  }, []);

  const addCustomer = useCallback(
    async (name: string, phone?: string, address?: string) => {
      const cur = load();
      cur.customers.push({
        id: crypto.randomUUID(),
        name,
        phone,
        address,
        orderCount: 0,
        createdAt: Date.now(),
      });
      save(cur);
      setDb(cur);
      toast.success("تم إضافة العميل بنجاح 🎉");
    },
    [],
  );

  const updateCustomer = useCallback(
    async (id: string, name: string, phone?: string, address?: string) => {
      const cur = load();
      cur.customers = cur.customers.map((c) =>
        c.id === id ? { ...c, name, phone, address } : c,
      );
      save(cur);
      setDb(cur);
      toast.success("تم تعديل بيانات العميل");
    },
    [],
  );

  const upsertOrder = useCallback(async (order: ActiveOrder) => {
    // 1️⃣ التحديث المحلي السريع فوراً (Optimistic UI) عشان الشاشة طلقة وماتهنجش
    const cur = load();
    cur.orders[order.tableCode] = order;
    save(cur);
    setDb(cur);

    // 2️⃣ إرسال التحديث للسيرفر (قاعدة البيانات الحقيقية)
    try {
      const response = await fetch(
        "http://192.168.1.44:5000/api/pos/orders/upsert",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tableCode: order.tableCode,
            orderData: order, // الأوردر ده جواه الـ state ('active' أو 'printed')
          }),
        },
      );

      if (!response.ok) {
        toast.error("⚠️ لم يتم حفظ الطاولة على السيرفر، تأكد من الشبكة!");
      }
    } catch (err) {
      console.error("🚨 خطأ أثناء تحديث الطاولة على السيرفر:", err);
      toast.error("⚠️ خطأ في الاتصال بالسيرفر الرئيسي!");
    }
  }, []);

  const clearOrder = useCallback(async (tableCode: string) => {
    // 1️⃣ مسح الطاولة محلياً فوراً عشان ترجع خضراء وفاضية عندك
    const cur = load();
    delete cur.orders[tableCode];
    save(cur);
    setDb(cur);

    // 2️⃣ إبلاغ السيرفر بمسح الطاولة عشان تتشال من عند الميكروس برضه
    try {
      await fetch("http://192.168.1.44:5000/api/pos/orders/clear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tableCode }),
      });
    } catch (err) {
      console.error("🚨 خطأ أثناء مسح الطاولة من السيرفر:", err);
    }
  }, []);

  const addInvoice = useCallback(
    async (inv: Omit<Invoice, "invoiceNumber" | "createdAt">) => {
      const cur = load();
      const invoiceNumber = Math.floor(100000 + Math.random() * 900000);
      const createdAt = Date.now();

      const fullInvoice: Invoice = {
        ...inv,
        id: crypto.randomUUID(),
        invoiceNumber,
        createdAt,
        deliveryPrice: Number(inv.deliveryPrice || 0),
        // 🌟 الحقول الجديدة بتتقرأ هنا بأمان تام لو مبعوتة من الشاشة، ولو مش مبعوتة بتنزل الرئيسي
        terminalId: inv.terminal_id || inv.terminalId || "Main",
        createdBy: inv.createdBy || inv.cashierName || "Main Cashier",
      };

      // 🌟 السحر هنا: إرسال الفاتورة فوراً لقاعدة البيانات (pgAdmin) على بورت 5000 المظبوط
      try {
        const response = await fetch("http://192.168.1.44:5000/api/invoices", {
          method: "POST",
          mode: "cors", // 🛡️ رجعنا الـ cors عشان الأجهزة الفرعية تشوف السيرفر
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(fullInvoice),
        });

        if (response.ok) {
          console.log("✅ تم حفظ الفاتورة بنجاح في قاعدة البيانات PostgreSQL!");
        } else {
          console.error("⚠️ السيرفر رجع خطأ أثناء حفظ الفاتورة");
        }
      } catch (error) {
        console.error(
          "❌ فشل الاتصال بالسيرفر لحفظ الفاتورة بالداتابيز:",
          error,
        );
      }

      // التحديث المحلي المستقر بتاعك زي ما هو بالظبط
      cur.invoices = [fullInvoice, ...cur.invoices];
      save(cur);
      setDb(cur);
      toast.success(
        `🎉 تم اعتماد الفاتورة محلياً ورفعها رقم: ${invoiceNumber}`,
      );
      return fullInvoice;
    },
    [],
  );
  /*
  const openShift = useCallback(
    async (cashierId: string, cashierName: string) => {
      const shiftData = { cashierId, cashierName, openedAt: Date.now() };

      // 1. الحفظ محلياً
      const cur = load();
      cur.shift = shiftData;
      save(cur);
      setDb(cur);

      // 2. إبلاغ السيرفر عشان يفتح أجهزة الميكروس
      try {
        await fetch("http://192.168.1.44:5000/api/pos/shift/open", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(shiftData),
        });
      } catch (err) {
        console.error("🚨 خطأ في إرسال الشيفت للسيرفر", err);
      }
    },
    [],
  );

  const closeShift = useCallback(
    async (totalsData: {
      kitchenSales: number;
      barSales: number;
      shishaSales: number;
      taxValue: number;
      discountValue: number;
      dineinSales: number;
      takeawaySales: number;
      deliverySales: number;
      terminalId?: string;
      actualCash?: number;
    }) => {
      const isSecCashier =
        localStorage.getItem("isSecCashierDevice") === "true";
      const currentTerminalId = isSecCashier ? "Sub-1" : "Main";

      const activeShift = load().shift;

      // 🌟 الأمان: لو الكاشير الأساسي قفل والـ activeShift بقا null، نقرأ من اللي سجلناه في الـ useEffect
      const storedOpenedAt = Number(localStorage.getItem("subShiftOpenedAt"));
      const storedCashierName = localStorage.getItem("currentCashierName");

      const closedShiftData = {
        cashierId: activeShift ? activeShift.cashierId : "sec-cashier",
        cashierName: activeShift
          ? activeShift.cashierName
          : storedCashierName || "كاشير فرعي",
        openedAt: activeShift
          ? activeShift.openedAt
          : storedOpenedAt || Date.now() - 3600000,
        closedAt: Date.now(),
        ...totalsData,
        terminalId: currentTerminalId,
      };

      try {
        const res = await fetch("http://192.168.1.44:5000/api/shifts", {
          method: "POST",
          mode: "cors",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(closedShiftData),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "فشل الحفظ على السيرفر");
        }

        const savedShiftFromServer = await res.json();
        const cur = load();
        cur.shifts = [savedShiftFromServer, ...cur.shifts];

        // 🌟 تفريغ المتغيرات عشان الشيفت يقفل بجد
        if (!isSecCashier) {
          cur.shift = null;
        }
        localStorage.removeItem("subShiftOpenedAt");

        save(cur);
        localStorage.setItem("pos_shifts", JSON.stringify(cur.shifts));
        setDb(cur);

        toast.success(`🎉 تم إغلاق الوردية للجهاز ${currentTerminalId} بنجاح!`);
        return savedShiftFromServer;
      } catch (err: any) {
        console.error("❌ خطأ أثناء إغلاق الشفت بالسيرفر:", err);
        toast.error(`حدث خطأ: ${err.message || "فشل الاتصال بالسيرفر"}`);
        return false;
      }
    },
    [],
  );
  */

  const incCustomerOrders = useCallback((id?: string) => {
    if (!id) return;
    setDb((cur) => {
      const updated = cur.customers.map((c) =>
        c.id === id ? { ...c, orderCount: (c.orderCount || 0) + 1 } : c,
      );
      const next = { ...cur, customers: updated };
      save(next);
      return next;
    });
  }, []);

  // 🌟 تعديل الـ transferItems لحل مشكلة التيك أواي مع الحفاظ على بقية الصفحات
  const transferItems = useCallback(
    (
      from: string,
      to: string,
      itemsToMove: { id: string; qty: number }[],
      targetZone: string,
    ) => {
      const cur = load();
      const src = cur.orders[from];
      if (!src) return { ok: false };

      // 1. معالجة الـ targetZone لضمان تحويل المسميات المختصرة (مثل O) إلى الـ ID الحقيقي (open)
      let finalZone: ZoneId = targetZone as ZoneId;
      const foundZone = ZONES.find(
        (z) =>
          z.id === targetZone ||
          z.prefix === targetZone ||
          (to && to.startsWith(z.prefix)),
      );
      if (foundZone) {
        finalZone = foundZone.id;
      }

      // 2. إنشاء الأوردر الجديد مع وراثة الخصائص الأصلية (العميل، الخصم، الضرائب) حتى لا تضيع البيانات
      const dst = cur.orders[to] || {
        ...src,
        tableCode: to,
        zone: finalZone,
        items: [],
        state: src.state || "active",
        discountPct: src.discountPct !== undefined ? src.discountPct : 0,
        taxPct: src.taxPct !== undefined ? src.taxPct : 14,
        openedAt: src.openedAt || Date.now(),
      };

      // 3. مسح خاصية الـ type التيك أواي طالما الأوردر منقول لصالة حقيقية حتي لا يقرأه السيستم كتيك أواي
      if (finalZone !== "takeaway") {
        delete dst.type;
      }

      for (const move of itemsToMove) {
        const idx = src.items.findIndex((i) => i.id === move.id);
        if (idx === -1) continue;
        const sourceItem = src.items[idx];
        if (move.qty >= sourceItem.qty) {
          src.items.splice(idx, 1);
          dst.items.push(sourceItem);
        } else {
          sourceItem.qty -= move.qty;
          dst.items.push({
            ...sourceItem,
            id: crypto.randomUUID(),
            qty: move.qty,
          });
        }
      }
      cur.orders[to] = dst;
      if (src.items.length === 0) delete cur.orders[from];
      save(cur);
      setDb(cur);
      return { ok: true };
    },
    [],
  );

  // تحديث مزامنة الداتابيز مع اللوكال ستوريدج
  // useEffect(() => {
  //   async function syncServerToLocalStorage() {
  //     try {
  //       const [invoicesRes, shiftsRes, employeesRes] = await Promise.all([
  //         fetch("http://192.168.1.44:5000/api/invoices"),
  //         fetch("http://192.168.1.44:5000/api/shifts"),
  //         fetch("http://192.168.1.44:5000/api/employees"),
  //       ]);

  //       if (invoicesRes.ok && shiftsRes.ok && employeesRes.ok) {
  //         const invoices = await invoicesRes.json();
  //         const shifts = await shiftsRes.json();
  //         const employees = await employeesRes.json();

  //         const cur = load();
  //         // تحديث اللوكال ستوريدج بالداتا اللي جاية من الداتابيز
  //         cur.shifts = shifts;
  //         cur.employees = employees;
  //         cur.invoices = invoices;

  //         save(cur); // دالة save بتعمل dispatch لـ 'pos-update'
  //         setDb(cur); // مهم جداً عشان الـ UI يحس بالتحديث ويغير الـ 6 فواتير
  //       }
  //     } catch (error) {
  //       console.error("❌ فشل تحديث الكاش المحلى من السيرفر:", error);
  //     }
  //   }

  //   // استدعاء المزامنة أول مرة
  //   syncServerToLocalStorage();

  //   // اختياري: لو عايز الفواتير تسمع بين الأجهزة كل 10 ثواني
  //   const interval = setInterval(syncServerToLocalStorage, 10000);
  //   return () => clearInterval(interval);
  // }, []);

  return {
    db,
    isLoadingEmployees,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    verifyEmployeePin,
    findByPin,
    addCustomer,
    updateCustomer,
    upsertOrder,
    clearOrder,
    transferItems,
    addInvoice,
    openShift,
    closeShift,
    incCustomerOrders,
  };
}
export function computeTotals(
  items: OrderItem[],
  discountPct: number,
  taxPct: number,
) {
  const subtotal = round2(
    items.reduce(
      (s, l) =>
        s +
        (clamp0(l.unitPrice) +
          l.extras.reduce((x, e) => x + clamp0(e.price), 0)) *
          clamp0(l.qty),
      0,
    ),
  );
  const discountValue = round2((subtotal * clamp0(discountPct)) / 100);
  const afterDiscount = round2(subtotal - discountValue);
  const taxValue = round2((afterDiscount * clamp0(taxPct)) / 100);
  const total = round2(afterDiscount + taxValue);
  return { subtotal, discountValue, taxValue, total };
}
