/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useState } from "react";
import { round2, clamp0 } from "./format";
import { sha256 as jsSha256 } from "js-sha256";
import {
  fetchEmployees,
  addEmployeeToDB,
  fetchInvoices,
  addInvoiceToDB,
  saveShiftToDB,
} from "./api";
import { toast } from "sonner";

// أضف هذا الكود تحت الـ imports مباشرة
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

// --- Types ---
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
  address: string;
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
  id: string;
  mealId: string;
  name: string;
  qty: number;
  unitPrice: number;
  extras: { label: string; price: number }[];
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
}

export interface Invoice {
  id: string;
  type: "dinein" | "takeaway";
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

// --- Helpers ---
async function sha256(s: string): Promise<string> {
  return jsSha256(s);
}
export const hashPin = sha256;

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

// دالة مساعدة لضبط التاريخ من السيرفر
function parseSafeDate(dateVal: any, fallback: number): number {
  if (!dateVal) return fallback;
  const parsed = new Date(dateVal).getTime();
  return isNaN(parsed) ? fallback : parsed;
}

// --- Hook ---
export function usePosDB() {
  const [db, setDb] = useState<PosDB>(load);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);

  // 1. جلب الموظفين من الـ API أول ما الـ Hook يشتغل
  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoadingEmployees(true);
      try {
        const [apiEmployees, apiInvoices] = await Promise.all([
          fetchEmployees(),
          fetchInvoices(),
        ]);

        const formattedInvoices = (apiInvoices || []).map((inv: any) => ({
          id: inv.id,
          invoiceNumber:
            inv.invoice_number !== undefined
              ? inv.invoice_number
              : inv.invoiceNumber,
          type: inv.type,
          tableCode:
            inv.table_code !== undefined ? inv.table_code : inv.tableCode,
          customerName:
            inv.customer_name !== undefined
              ? inv.customer_name
              : inv.customerName,
          customerAddress:
            inv.customer_address !== undefined
              ? inv.customer_address
              : inv.customerAddress,
          cashierId:
            inv.cashier_id !== undefined ? inv.cashier_id : inv.cashierId,
          cashierName:
            inv.cashier_name !== undefined ? inv.cashier_name : inv.cashierName,
          items:
            typeof inv.items === "string" ? JSON.parse(inv.items) : inv.items,
          subtotal: Number(inv.subtotal || 0),
          discountPct: Number(
            inv.discount_pct !== undefined
              ? inv.discount_pct
              : inv.discountPct || 0,
          ),
          discountValue: Number(
            inv.discount_value !== undefined
              ? inv.discount_value
              : inv.discountValue || 0,
          ),
          taxPct: Number(
            inv.tax_pct !== undefined ? inv.tax_pct : inv.taxPct || 0,
          ),
          taxValue: Number(
            inv.tax_value !== undefined ? inv.tax_value : inv.taxValue || 0,
          ),
          total: Number(inv.total || 0),
          // 🔥 السر كله هنا: تحويل التاريخ لنظام الأرقام المفهوم للفرونت إند
          createdAt: parseSafeDate(inv.created_at || inv.createdAt, Date.now()),
        }));

        setDb((prev) => {
          const updated = {
            ...prev,
            employees: apiEmployees || [],
            invoices: formattedInvoices,
          };
          localStorage.setItem(KEY, JSON.stringify(updated));
          return updated;
        });
      } catch (error) {
        console.error("❌ فشل في جلب البيانات من السيرفر:", error);
      } finally {
        setIsLoadingEmployees(false);
      }
    };
    loadInitialData();
  }, []);

  useEffect(() => {
    const r = () => setDb(load());
    window.addEventListener("pos-update", r);
    window.addEventListener("storage", r);
    return () => {
      window.removeEventListener("pos-update", r);
      window.removeEventListener("storage", r);
    };
  }, []);

  // -- Actions --

  const addEmployee = useCallback(
    async (name: string, role: EmployeeRole, pin: string) => {
      try {
        const pinHash = await sha256(pin);
        const newEmpData = { name: name.trim(), role, pinHash };
        const savedEmployee = await addEmployeeToDB(newEmpData);

        const cur = load();
        cur.employees.push(
          savedEmployee || {
            id: crypto.randomUUID(),
            ...newEmpData,
          },
        );

        save(cur);
        setDb(cur);
      } catch (error) {
        console.error("فشل في حفظ الموظف على السيرفر:", error);
        alert("حدث خطأ أثناء حفظ الموظف، يرجى المحاولة مرة أخرى.");
      }
    },
    [],
  );

  const updateEmployee = useCallback(async (id: string, patch: any) => {
    const cur = load();
    const e = cur.employees.find((x) => x.id === id);
    if (!e) return;
    if (patch.name !== undefined) e.name = patch.name.trim();
    if (patch.role !== undefined) e.role = patch.role;
    if (patch.newPin) e.pinHash = await sha256(patch.newPin);
    save(cur);
    setDb(cur);
  }, []);

  const deleteEmployee = useCallback((id: string) => {
    const cur = load();
    cur.employees = cur.employees.filter((e) => e.id !== id);
    save(cur);
    setDb(cur);
  }, []);

  const verifyEmployeePin = useCallback(async (id: string, pin: string) => {
    const cur = load();
    const e = cur.employees.find((x) => x.id === id);
    if (!e) return false;
    return (await sha256(pin)) === e.pinHash;
  }, []);

  const findByPin = useCallback(async (pin: string, role?: EmployeeRole) => {
    const cur = load();
    const h = await sha256(pin);
    return (
      cur.employees.find(
        (e) => e.pinHash === h && (!role || e.role === role),
      ) || null
    );
  }, []);

  const addCustomer = useCallback((name: string, address: string) => {
    const cur = load();
    cur.customers.push({
      id: crypto.randomUUID(),
      name: name.trim(),
      address: address.trim(),
      orderCount: 0,
      createdAt: Date.now(),
    });
    save(cur);
    setDb(cur);
  }, []);

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
      const invoiceNumber = Math.floor(100000 + Math.random() * 900000);
      const createdAt = Date.now();

      const fullInvoice = {
        ...inv,
        invoiceNumber,
        createdAt,
      };

      try {
        console.log("⏳ جاري محاولة الحفظ على السيرفر...", fullInvoice);
        const res = await addInvoiceToDB(fullInvoice);

        const savedInvoice =
          res && res.id
            ? {
                ...res,
                items:
                  typeof res.items === "string"
                    ? JSON.parse(res.items)
                    : res.items,
                subtotal: Number(res.subtotal),
                discountPct: Number(res.discount_pct || res.discountPct || 0),
                discountValue: Number(
                  res.discount_value || res.discountValue || 0,
                ),
                taxPct: Number(res.tax_pct || res.taxPct || 0),
                taxValue: Number(res.tax_value || res.taxValue || 0),
                total: Number(res.total),
                // 🔥 وهنا كمان تظبيط التاريخ بعد الحفظ مباشرة
                createdAt: parseSafeDate(
                  res.created_at || res.createdAt,
                  createdAt,
                ),
                invoiceNumber: Number(
                  res.invoice_number || res.invoiceNumber || invoiceNumber,
                ),
              }
            : fullInvoice;

        setDb((cur) => {
          const updatedInvoices = [savedInvoice, ...cur.invoices];
          const next = { ...cur, invoices: updatedInvoices };
          save(next);
          return next;
        });

        toast.success(`🎉 تم حفظ الفاتورة بنجاح رقم: ${invoiceNumber}`);
        return savedInvoice;
      } catch (err) {
        console.warn(
          "⚠️ السيرفر واجه مشكلة، يتم الحفظ محلياً الآن لتجنب التعطيل...",
        );

        setDb((cur) => {
          const updatedInvoices = [fullInvoice as any, ...cur.invoices];
          const next = { ...cur, invoices: updatedInvoices };
          save(next);
          return next;
        });

        toast.success(`🎉 تم اعتماد الفاتورة محلياً رقم: ${invoiceNumber}`);
        return fullInvoice;
      }
    },
    [],
  );

  const openShift = useCallback(
    async (cashierId: string, cashierName: string) => {
      const cur = load();
      const openedAt = Date.now();
      cur.shift = { cashierId, cashierName, openedAt };

      try {
        await saveShiftToDB({ cashierId, cashierName, openedAt });
      } catch (e) {
        console.error("خطأ في حفظ الشيفت بالباك إند", e);
      }

      save(cur);
      setDb(cur);
    },
    [],
  );

  const closeShift = useCallback(async () => {
    const cur = load();
    if (cur.shift) {
      const closedShift = { ...cur.shift, closedAt: Date.now() };
      cur.shifts = [...(cur.shifts || []), closedShift];
      cur.shift = null;

      try {
        await saveShiftToDB(closedShift);
      } catch (e) {
        console.error("خطأ في إغلاق الشيفت بالباك إند", e);
      }

      save(cur);
      setDb(cur);
    }
  }, []);

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
      const dst = cur.orders[to] || {
        tableCode: to,
        zone: targetZone,
        items: [],
        state: "active",
        discountPct: 0,
        taxPct: 14,
        openedAt: Date.now(),
      };

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

  return {
    db,
    isLoadingEmployees,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    verifyEmployeePin,
    findByPin,
    addCustomer,
    upsertOrder,
    clearOrder,
    transferItems,
    addInvoice,
    openShift,
    closeShift,
    incCustomerOrders: (id?: string) => {},
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
