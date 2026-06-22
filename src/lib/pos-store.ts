/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useState } from "react";
import { round2, clamp0 } from "./format";

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
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(s),
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
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

// --- Hook ---
export function usePosDB() {
  const [db, setDb] = useState<PosDB>(load);

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
      const cur = load();
      cur.employees.push({
        id: crypto.randomUUID(),
        name: name.trim(),
        role,
        pinHash: await sha256(pin),
      });
      save(cur);
      setDb(cur);
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

  const addInvoice = useCallback((inv: Invoice) => {
    const cur = load();
    cur.invoices = [inv, ...cur.invoices];
    save(cur);
    setDb(cur);
  }, []);

  const openShift = useCallback((cashierId: string, cashierName: string) => {
    const cur = load();
    cur.shift = { cashierId, cashierName, openedAt: Date.now() };
    save(cur);
    setDb(cur);
  }, []);

  const closeShift = useCallback(() => {
    const cur = load();
    if (cur.shift) {
      const closedShift = { ...cur.shift, closedAt: Date.now() };
      cur.shifts = [...(cur.shifts || []), closedShift];
      cur.shift = null;
      save(cur);
      setDb(cur);
    }
  }, []);

  // Transfer Items Logic
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
