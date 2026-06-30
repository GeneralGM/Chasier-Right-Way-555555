/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useState } from "react";
import { round2, clamp0 } from "./format";
import { sha256 as jsSha256 } from "js-sha256";
import { toast } from "sonner";

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
  items: OrderItem[];
  subtotal: number;
  discountPct: number;
  discountValue: number;
  taxPct: number;
  taxValue: number;
  total: number;
  createdAt: number;
}

export interface ShiftState {
  cashierId: string;
  cashierName: string;
  openedAt: number;
  closedAt?: number;
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

  const upsertOrder = useCallback((order: ActiveOrder) => {
    const cur = load();
    cur.orders[order.tableCode] = order;
    save(cur);
    setDb(cur);
  }, []);

  const clearOrder = useCallback((tableCode: string) => {
    const cur = load();
    delete cur.orders[tableCode];
    save(cur);
    setDb(cur);
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
      };

      // 🌟 السحر هنا: إرسال الفاتورة فوراً لقاعدة البيانات (pgAdmin) مهما كان نوعها (صالة / تيك أواي / دليفري)
      try {
        const response = await fetch("http://localhost:5000/api/invoices", {
          method: "POST",
          mode: "cors",
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

      const triggerPrint = (invoice: any) => {
        const printWindow = window.open("", "_blank", "width=400,height=600");
        if (!printWindow) return;
        const dPrice = Number(invoice.deliveryPrice) || 0;
        const html = `
        <html>
          <head>
            <title>طباعة الفاتورة</title>
            <style>
              body { font-family: Arial, sans-serif; direction: rtl; text-align: center; padding: 20px; font-size: 14px; }
              .header { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
              .type-title { font-size: 22px; font-weight: bold; margin: 10px 0; border: 2px dashed #000; padding: 5px; text-transform: uppercase; }
              .meta { margin-bottom: 10px; font-size: 12px; border-bottom: 1px dashed #000; padding-bottom: 5px; }
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
            <div class="type-title">ORDER</div>
            <div class="meta">
              <div>رقم الفاتورة: ${String(invoice.id || invoiceNumber).slice(0, 8)}</div>
              <div>التاريخ: ${new Date(invoice.createdAt || createdAt).toLocaleString("ar-EG")}</div>
              <div>النوع: ${invoice.type === "delivery" ? "توصيل" : invoice.type === "takeaway" ? "تيك أواي" : "صالة"}</div>
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
                ${(typeof invoice.items === "string"
                  ? JSON.parse(invoice.items)
                  : invoice.items
                )
                  .map((line: any) => {
                    const exStr =
                      line.extras && line.extras.length
                        ? ` <span style="font-size:11px;color:#555;">(+${line.extras.map((e: any) => e.name || e.label).join(", ")})</span>`
                        : "";
                    return `<tr><td>${line.mealName || line.name}${exStr}</td><td style="text-align:center;">${line.qty}</td><td style="text-align:left;">${((line.unitPrice + (line.extras ? line.extras.reduce((s: number, e: any) => s + e.price, 0) : 0)) * line.qty).toFixed(2)} ج</td></tr>`;
                  })
                  .join("")}
              </tbody>
            </table>
            <div class="totals">
              <div><span>المجموع الأصلي:</span> <span>${Number(invoice.subtotal || 0).toFixed(2)} ج</span></div>
              ${invoice.discountValue > 0 ? `<div><span>الخصم:</span> <span>${Number(invoice.discountValue).toFixed(2)} ج</span></div>` : ""}
              ${invoice.taxValue > 0 ? `<div><span>الضريبة:</span> <span>${Number(invoice.taxValue).toFixed(2)} ج</span></div>` : ""}
              <div><span>التوصيل:</span> <span class="bold">${dPrice.toFixed(2)} ج</span></div>
              <div class="bold" style="border-top:1px solid #000; padding-top:4px; margin-top:4px;">
                <span>الإجمالي النهائي:</span> <span>${Number(invoice.total || 0).toFixed(2)} ج</span>
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

      cur.invoices = [fullInvoice, ...cur.invoices];
      save(cur);
      setDb(cur);
      toast.success(
        `🎉 تم اعتماد الفاتورة محلياً ورفعها رقم: ${invoiceNumber}`,
      );
      triggerPrint(fullInvoice);
      return fullInvoice;
    },
    [],
  );

  const openShift = useCallback(
    async (cashierId: string, cashierName: string) => {
      const cur = load();
      cur.shift = { cashierId, cashierName, openedAt: Date.now() };
      save(cur);
      setDb(cur);
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
    }) => {
      const activeShift = load().shift; // 🌟 التعديل هنا: نقرأ مباشرة من الـ localStorage لضمان أحدث داتا

      if (!activeShift) {
        toast.error("لا يوجد وردية مفتوحة لإغلاقها!");
        return false;
      }

      const closedShiftData = {
        cashierId: activeShift.cashierId,
        cashierName: activeShift.cashierName,
        openedAt: activeShift.openedAt,
        closedAt: Date.now(),
        ...totalsData,
      };

      try {
        const res = await fetch("http://localhost:5000/api/shifts", {
          method: "POST",
          mode: "cors",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(closedShiftData),
        });

        if (!res.ok) {
          throw new Error("فشل الحفظ على السيرفر");
        }

        const savedShiftFromServer = await res.json();
        const cur = load();

        cur.shifts = [savedShiftFromServer, ...cur.shifts];
        cur.shift = null; // 🌟 تصفير الشيفت صراحة

        save(cur);
        localStorage.setItem("pos_shifts", JSON.stringify(cur.shifts));
        setDb(cur);

        toast.success(`🎉 تم إغلاق الوردية وحفظها بنجاح في الداتابيز والكاش!`);
        return true; // 🌟 نرجع true عشان الفرونت إند يعرف إنه نجح ويقفل الشاشة فوراً
      } catch (err) {
        console.error("❌ خطأ أثناء إغلاق الشفت بالسيرفر:", err);
        toast.error("حدث خطأ أثناء الاتصال بالسيرفر لحفظ بيانات الوردية");
        return false;
      }
    },
    [],
  );

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

  useEffect(() => {
    async function syncServerToLocalStorage() {
      try {
        console.log("🔄 جاري مزامنة وتحديث البيانات من السيرفر...");

        const [invoicesRes, shiftsRes, employeesRes] = await Promise.all([
          fetch("http://localhost:5000/api/invoices"),
          fetch("http://localhost:5000/api/shifts"),
          fetch("http://localhost:5000/api/employees"),
        ]);

        if (invoicesRes.ok && shiftsRes.ok && employeesRes.ok) {
          const invoices = await invoicesRes.json();
          const shifts = await shiftsRes.json();
          const employees = await employeesRes.json();

          localStorage.setItem("pos_invoices", JSON.stringify(invoices));
          localStorage.setItem("pos_shifts", JSON.stringify(shifts));
          localStorage.setItem("pos_employees", JSON.stringify(employees));

          // 💾 بنجيب الكاش الحالي عشان نحافظ على الشيفت المفتوح من غير ما يطير
          const cur = load();
          cur.shifts = shifts;
          cur.employees = employees;

          // 🛠️ رجعنا الفواتير زي ما كانت عشان صفحة الطلبات متبوظش
          cur.invoices = invoices;

          save(cur);

          console.log("✅ تمت المزامنة بنجاح وصفحة الطلبات رجعت تمام.");
        }
      } catch (error) {
        console.error("❌ فشل تحديث الكاش المحلى من السيرفر:", error);
      }
    }

    syncServerToLocalStorage();
  }, []);

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
