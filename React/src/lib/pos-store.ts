/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useState } from "react";
import { round2, clamp0 } from "./format";
import { sha256 as jsSha256 } from "js-sha256";
import { toast } from "sonner";

import { getApiUrl } from "@/api";
const API_URL = getApiUrl();

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
  price: number;
  department: string;
  mealName: any;
  id: string;
  mealId: string;
  name: string;
  qty: number;
  unitPrice: number;
  extras: { name?: any; label: string; price: number }[];
  modifiersSummary?: string;
  notes?: string; // 🌟 إضافة حقل الملاحظات للصنف
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
  orderCategory?: "normal" | "talabat" | "fast"; // 🌟 تصنيف المنصة
  commissionValue?: number; // 🌟 قيمة النسبة المضافة بالجنيه
}

export interface Invoice {
  captain_name: string | null | undefined;
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
  orderCategory: "normal" | "talabat" | "fast"; // الخانة الجديدة للباك إند
  commissionValue: number;
}

export interface ShiftState {
  cashier_name?: string;
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
          fetch(`http://${API_URL}:5000/api/pos/orders`).catch(() => null),
          // 👈 بنبعت رقم الجهاز الحالي (Sub-1 للتابلت) عشان السيرفر يرد بالشيفت بتاعه
          fetch(
            `http://${API_URL}:5000/api/pos/shift?terminalId=${currentTerminalId}`,
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
                rawShift.cashier_name ||
                rawShift.cashierName ||
                localStorage.getItem("backupCashierName") ||
                "كاشير",
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
        let hasChanges = false;

        // 🔥 التعديل السحري الأول: مش هنحدث الشيفت إلا لو اتغير فعلاً
        if (JSON.stringify(cur.shift) !== JSON.stringify(serverShift)) {
          cur.shift = serverShift;
          hasChanges = true;
        }

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

        // 🔥 التعديل السحري التاني: السيرفر مش هيعمل ريندر للشاشة إلا لو فيه تغيير حقيقي!
        if (hasChanges) {
          save(cur);
          setDb(cur);
        }
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
        const res = await fetch(`http://${API_URL}:5000/api/pos/shift/open`, {
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

          // 🌟 إضافة حماية: حفظ اسم الكاشير احتياطياً في الـ localStorage
          localStorage.setItem("backupCashierName", formattedShift.cashierName);

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

      // 🌟 الأمان النهائي: جلب الاسم من الاحتياطي لو الشيفت سقط من الـ State
      const fallbackName =
        localStorage.getItem("backupCashierName") || "كاشير احتياطي";

      if (!activeShift) {
        toast.error("لا يوجد وردية مفتوحة لإغلاقها على هذا الجهاز!");
        return false;
      }

      // 🌟 تأمين الـ Payload عشان الاسم ميتبعتش فاضي أبداً
      const closedShiftData = {
        cashierId: activeShift.cashierId || "sec-cashier",
        cashierName: activeShift.cashierName || fallbackName, // 👈 التأمين السحري هنا
        openedAt: activeShift.openedAt,
        closedAt: Date.now(),
        ...totalsData,
        terminalId: currentTerminalId,
      };

      try {
        const res = await fetch(`http://${API_URL}:5000/api/shifts`, {
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

        // 🌟 تصفير الاحتياطي بعد التقفيل الناجح
        localStorage.removeItem("backupCashierName");

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
      const newCustomer = {
        id: crypto.randomUUID(),
        name,
        phone: phone || "",
        address: address || "",
        orderCount: 0,
        createdAt: Date.now(),
      };

      cur.customers.push(newCustomer);
      save(cur);
      setDb(cur);
      toast.success("تم إضافة العميل بنجاح 🎉");

      // 🌟 إرسال للباك إند (pgAdmin)
      try {
        await fetch(`http://${API_URL}:5000/api/customers`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newCustomer),
        });
      } catch (err) {
        console.error("❌ فشل حفظ العميل في قاعدة البيانات:", err);
      }
    },
    [],
  );

  const updateCustomer = useCallback(
    async (id: string, name: string, phone?: string, address?: string) => {
      const cur = load();
      const updatedCustomer = {
        id,
        name,
        phone: phone || "",
        address: address || "",
      };

      cur.customers = cur.customers.map((c) =>
        c.id === id ? { ...c, ...updatedCustomer } : c,
      );
      save(cur);
      setDb(cur);
      toast.success("تم تعديل بيانات العميل");

      // 🌟 تحديث في الباك إند (pgAdmin)
      try {
        await fetch(`http://${API_URL}:5000/api/customers/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedCustomer),
        });
      } catch (err) {
        console.error("❌ فشل تحديث العميل في قاعدة البيانات:", err);
      }
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
        `http://${API_URL}:5000/api/pos/orders/upsert`,
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
      await fetch(`http://${API_URL}:5000/api/pos/orders/clear`, {
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

      // 1️⃣ حساب القيم بالملي
      const currentTaxPct = inv.type === "dinein" ? 14 : 0;
      const totals = computeTotals(
        inv.items,
        inv.discountPct || 0,
        inv.type === "dinein" ? 14 : 0,
        inv.orderCategory || "normal",
      );

      const deliveryPrice = Number(inv.deliveryPrice || 0); // 🌟 تأمين قيمة الدليفري

      const fullInvoice: any = {
        ...inv,
        id: crypto.randomUUID(),
        invoiceNumber,
        createdAt,
        subtotal: totals.subtotal, // الـ subtotal المدمج فيه الـ 5% جاهز
        discountValue: totals.discountValue,
        deliveryPrice: Number(inv.deliveryPrice || 0),
        taxPct: totals.taxPct,
        taxValue: totals.taxValue,
        orderCategory: inv.orderCategory || "normal", // 🌟 إرسال الفئة للسيرفر
        commissionValue: totals.commissionValue, // 🌟 إرسال العمولة للسيرفر
        total: totals.total + Number(inv.deliveryPrice || 0),
        terminalId: inv.terminalId || "Main",
        createdBy: inv.cashierName || "Main Cashier",
      };

      // 3️⃣ إرسال الفاتورة
      try {
        const response = await fetch(`http://${API_URL}:5000/api/invoices`, {
          method: "POST",
          mode: "cors",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(fullInvoice),
        });
        if (response.ok) {
          console.log("✅ تم حفظ الفاتورة بنجاح في قاعدة البيانات!");
        } else {
          console.error("❌ السيرفر رفض حفظ الفاتورة، تشيك على الراوت");
        }
      } catch (error) {
        console.error("❌ فشل الاتصال بالسيرفر:", error);
      }

      cur.invoices = [fullInvoice, ...cur.invoices];
      save(cur);
      setDb(cur);
      toast.success(`🎉 تم اعتماد الفاتورة رقم: ${invoiceNumber}`);
      return fullInvoice;
    },
    [],
  );
  // 🌟 دالة تزويد العداد مربوطة بالسيرفر
  const incCustomerOrders = useCallback(async (id?: string) => {
    if (!id) return;

    // التحديث محلياً فوراً لسرعة الاستجابة
    setDb((cur) => {
      const updated = cur.customers.map((c) =>
        c.id === id ? { ...c, orderCount: (c.orderCount || 0) + 1 } : c,
      );
      const next = { ...cur, customers: updated };
      save(next);
      return next;
    });

    // إرسال التحديث لـ PostgreSQL
    try {
      await fetch(`http://${API_URL}:5000/api/customers/${id}/increment`, {
        method: "PATCH",
      });
    } catch (err) {
      console.error("❌ فشل تزويد العداد في الداتابيز:", err);
    }
  }, []);

  // 🌟 مزامنة العملاء في الخلفية كل 10 ثواني عشان يسمعوا في كل الأجهزة
  useEffect(() => {
    if (typeof window === "undefined") return;

    const fetchCustomers = async () => {
      try {
        const res = await fetch(`http://${API_URL}:5000/api/customers`);
        if (!res.ok) return;
        const serverCustomers = await res.json();

        const cur = load();
        // بنقارن عشان مانعملش ريندر للصفحة على الفاضي
        if (JSON.stringify(cur.customers) !== JSON.stringify(serverCustomers)) {
          cur.customers = serverCustomers;
          save(cur);
          setDb(cur);
        }
      } catch (err) {
        /* صمت */
      }
    };

    fetchCustomers();
    const interval = setInterval(fetchCustomers, 10000);
    return () => clearInterval(interval);
  }, []);
  // 🌟 مزامنة الفواتير في الخلفية (عشان الكاشير الفرعي يشوف الفواتير الجديدة فوراً)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const fetchTodayInvoices = async () => {
      try {
        // بنحسب تاريخ النهاردة عشان نسحب فواتير اليوم بس وماتقلش الشبكة
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const end = new Date();
        end.setHours(23, 59, 59, 999);

        // ⚠️ تأكد إن الـ IP ده هو الصح اللي شغال عليه باقي السيستم
        const res = await fetch(
          `http://${API_URL}:5000/api/invoices?startDate=${start.toISOString()}&endDate=${end.toISOString()}`,
        );
        if (!res.ok) return;

        const serverInvoices = await res.json();
        const cur = load();

        // دمج الفواتير اللي من السيرفر مع اللي في الجهاز بدون تكرار
        const map = new Map();
        cur.invoices.forEach((inv) => map.set(inv.id, inv));
        serverInvoices.forEach((inv: Invoice) => map.set(inv.id, inv));

        const merged = Array.from(map.values()).sort(
          (a, b) => b.createdAt - a.createdAt,
        );

        // لو في فواتير جديدة انضافت، حدث الشاشة
        if (cur.invoices.length !== merged.length) {
          cur.invoices = merged;
          save(cur);
          setDb(cur);
        }
      } catch (err) {
        /* صمت عشان مايزعجش الكاشير لو الشبكة فصلت لحظة */
      }
    };

    fetchTodayInvoices();
    const interval = setInterval(fetchTodayInvoices, 10000); // بتلف كل 10 ثواني
    return () => clearInterval(interval);
  }, []);

  // 🌟 تعديل الـ transferItems لحل مشكلة التيك أواي مع الحفاظ على بقية الصفحات
  // 🌟 تعديل الـ transferItems عشان يرمي التعديل في السيرفر
  const transferItems = useCallback(
    async (
      // 👈 ضفنا async هنا
      from: string,
      to: string,
      itemsToMove: { id: string; qty: number }[],
      targetZone: string,
    ) => {
      const cur = load();
      const src = cur.orders[from];
      if (!src) return { ok: false, error: "الطاولة غير موجودة" };

      // 1. معالجة الـ targetZone
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

      // 2. إنشاء الأوردر الجديد
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

      if (finalZone !== "takeaway") {
        delete dst.type;
      }

      // 3. النقل المحلي للأصناف
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

      // 🌟 4. إرسال التحويل للسيرفر (قاعدة البيانات active_orders)
      try {
        await fetch(`http://${API_URL}:5000/api/pos/orders/transfer`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fromCode: from,
            toCode: to,
            fromOrder: cur.orders[from] || null,
            toOrder: dst,
          }),
        });
      } catch (err) {
        console.error("🚨 خطأ أثناء مزامنة التحويل مع السيرفر:", err);
        return { ok: false, error: "فشل الاتصال بالسيرفر أثناء التحويل" };
      }

      return { ok: true };
    },
    [],
  );

  // 🌟 دالة تحويل الكابتن (تحدث محلياً فوراً وترمي التعديل على السيرفر)
  const transferCaptain = useCallback(
    async (tableCode: string, newCaptainName: string) => {
      const cur = load();
      const order = cur.orders[tableCode];
      if (!order) return { ok: false, error: "الطاولة غير موجودة أو غير نشطة" };

      // 1. التحديث المحلي اللحظي
      order.captainName = newCaptainName;
      save(cur);
      setDb(cur);

      // 2. المزامنة مع السيرفر (PostgreSQL)
      try {
        const res = await fetch(
          `http://${API_URL}:5000/api/pos/orders/transfer-captain`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              tableCode,
              newCaptainName,
            }),
          },
        );

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "فشل الحفظ على السيرفر");
        }
      } catch (err: any) {
        console.error("🚨 خطأ أثناء مزامنة تحويل الكابتن مع السيرفر:", err);
        toast.error(
          "⚠️ تنبيه: حدث خطأ في الاتصال بالسيرفر أثناء تحويل الكابتن!",
        );
        return { ok: false, error: err.message || "فشل الاتصال بالسيرفر" };
      }

      return { ok: true };
    },
    [],
  );
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
    transferCaptain,
    addInvoice,
    openShift,
    closeShift,
    incCustomerOrders,
  };
}
export function computeTotals(
  items: OrderItem[],
  discountPct: number,
  taxPct: number, // الـ 14%
  orderCategory: "normal" | "talabat" | "fast" = "normal",
) {
  // 1. حساب المجموع الأساسي من أسعار الأصناف والإضافات
  const baseSubtotal = round2(
    items.reduce(
      (s, l) =>
        s +
        (clamp0(l.unitPrice) +
          l.extras.reduce((x, e) => x + clamp0(e.price), 0)) *
          clamp0(l.qty),
      0,
    ),
  );

  // 2. حساب قيمة عمولة المنصة بناءً على المجموع الأساسي
  let commissionValue = 0;
  if (orderCategory === "talabat") {
    commissionValue = round2((baseSubtotal * 15) / 100);
  } else if (orderCategory === "fast") {
    commissionValue = round2((baseSubtotal * 0) / 100);
  }

  // 3. 🌟 دمج العمولة مباشرة داخل الـ subtotal الكلي عشان يسمع في السيستم كله تلقائياً!
  const subtotal = round2(baseSubtotal + commissionValue);

  // 4. حساب الخصم والضريبة بناءً على الـ subtotal الجديد المدمج فيه النسبة
  const discountValue = round2((subtotal * clamp0(discountPct)) / 100);
  const afterDiscount = round2(subtotal - discountValue);
  const taxValue = round2((afterDiscount * clamp0(taxPct)) / 100);

  // 5. الإجمالي النهائي الكلي
  const total = round2(afterDiscount + taxValue);

  return {
    subtotal, // 🌟 مدمج جواه الـ 5% لطلبات أو فاست وجاهز لكل الصفحات
    baseSubtotal, // المجموع الأصلي الصافي للأصناف فقط بدون النسبة
    discountValue,
    taxValue,
    tax_value: taxValue,
    taxPct,
    tax_pct: taxPct,
    commissionValue, // قيمة النسبة بالجنيه لعرضها لو أحببت
    total,
  };
}
