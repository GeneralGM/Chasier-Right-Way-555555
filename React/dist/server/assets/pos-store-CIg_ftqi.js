import { useState, useEffect, useCallback } from "react";
import { g as getApiUrl, r as round2, c as clamp0 } from "./router-DEmB4OpK.js";
import { sha256 } from "js-sha256";
import { toast } from "sonner";
const API_URL = getApiUrl();
const syncLocks = {
  editingTable: null,
  isPollingOrders: false
};
function setGlobalEditingTable(code) {
  syncLocks.editingTable = code;
}
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
const ZONES = [
  { id: "close", label: "صالة مغلقة", prefix: "C", count: 70 },
  { id: "open", label: "صالة مفتوحة", prefix: "O", count: 70 },
  { id: "takeaway", label: "Take-away", prefix: "T", count: 0 },
  { id: "others", label: "Others", prefix: "X", count: 20 },
  { id: "small", label: "القاعة الصغيرة", prefix: "ص", count: 30 },
  { id: "large", label: "القاعة الكبيرة", prefix: "ك", count: 50 },
  { id: "kids", label: "منطقة الأطفال", prefix: "K", count: 20 }
];
const PAGE_SIZE = 20;
const KEY = "rest-pos-db-v1";
const hashPin = async (s) => sha256(s);
function defaultDB() {
  return {
    employees: [],
    customers: [],
    orders: {},
    invoices: [],
    shift: null,
    shifts: []
  };
}
function load() {
  if (typeof window === "undefined") return defaultDB();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultDB();
    return JSON.parse(raw);
  } catch {
    return defaultDB();
  }
}
function save(db) {
  localStorage.setItem(KEY, JSON.stringify(db));
  window.dispatchEvent(new Event("pos-update"));
}
function usePosDB() {
  const [db, setDb] = useState(defaultDB);
  const [isLoadingEmployees] = useState(false);
  useEffect(() => {
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
  useEffect(() => {
    if (typeof window === "undefined" || syncLocks.isPollingOrders) return;
    syncLocks.isPollingOrders = true;
    const fetchActiveOrders = async () => {
      try {
        const isSecCashier = localStorage.getItem("isSecCashierDevice") === "true";
        const currentTerminalId = isSecCashier ? "Sub-1" : "Main";
        const [ordersRes, shiftRes] = await Promise.all([
          fetch(`http://${API_URL}:5000/api/pos/orders`).catch(() => null),
          // 👈 بنبعت رقم الجهاز الحالي (Sub-1 للتابلت) عشان السيرفر يرد بالشيفت بتاعه
          fetch(
            `http://${API_URL}:5000/api/pos/shift?terminalId=${currentTerminalId}`
          ).catch(() => null)
        ]);
        if (!ordersRes || !ordersRes.ok) return;
        const serverOrders = await ordersRes.json();
        let serverShift = null;
        if (shiftRes && shiftRes.ok) {
          const rawShift = await shiftRes.json();
          if (rawShift && (rawShift.opened_at || rawShift.openedAt)) {
            serverShift = {
              id: rawShift.id,
              cashierId: rawShift.cashier_id || rawShift.cashierId,
              cashierName: rawShift.cashier_name || rawShift.cashierName || localStorage.getItem("backupCashierName") || "كاشير",
              openedAt: Number(rawShift.opened_at || rawShift.openedAt),
              closedAt: rawShift.closed_at ? Number(rawShift.closed_at) : void 0,
              // 👈 غيرناها لـ undefined
              terminalId: rawShift.terminal_id || rawShift.terminalId || currentTerminalId
            };
          }
        }
        const cur = load();
        let hasChanges = false;
        if (JSON.stringify(cur.shift) !== JSON.stringify(serverShift)) {
          cur.shift = serverShift;
          hasChanges = true;
        }
        for (const code in serverOrders) {
          if (code === syncLocks.editingTable) continue;
          if (JSON.stringify(cur.orders[code]) !== JSON.stringify(serverOrders[code])) {
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
        if (hasChanges) {
          save(cur);
          setDb(cur);
        }
      } catch (err) {
      }
    };
    fetchActiveOrders();
    const interval = setInterval(fetchActiveOrders, 1500);
    return () => {
      clearInterval(interval);
      syncLocks.isPollingOrders = false;
    };
  }, []);
  const openShift = useCallback(
    async (cashierId, cashierName) => {
      const isSecCashier = localStorage.getItem("isSecCashierDevice") === "true";
      const currentTerminalId = isSecCashier ? "Sub-1" : "Main";
      const newShiftData = {
        cashierId,
        cashierName,
        openedAt: Date.now(),
        terminalId: currentTerminalId
      };
      try {
        const res = await fetch(`http://${API_URL}:5000/api/pos/shift/open`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newShiftData)
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "فشل فتح الوردية بالسيرفر");
        }
        const serverResponse = await res.json();
        if (serverResponse.success && serverResponse.shift) {
          const savedShift = serverResponse.shift;
          const formattedShift = {
            id: savedShift.id,
            cashierId: savedShift.cashier_id || savedShift.cashierId,
            cashierName: savedShift.cashier_name || savedShift.cashierName || cashierName,
            openedAt: Number(savedShift.opened_at || savedShift.openedAt),
            closedAt: savedShift.closed_at ? Number(savedShift.closed_at) : void 0,
            // 👈 غيرناها لـ undefined
            terminalId: savedShift.terminal_id || savedShift.terminalId || currentTerminalId
          };
          const cur = load();
          cur.shift = formattedShift;
          save(cur);
          setDb(cur);
          localStorage.setItem("backupCashierName", formattedShift.cashierName);
          toast.success(`🚀 تم بدء الوردية بنجاح للجهاز ${currentTerminalId}`);
          return true;
        } else {
          throw new Error("استجابة غير صالحة من السيرفر");
        }
      } catch (err) {
        toast.error(err.message || "خطأ في الاتصال بالسيرفر");
        return false;
      }
    },
    []
  );
  const closeShift = useCallback(
    async (totalsData) => {
      const isSecCashier = localStorage.getItem("isSecCashierDevice") === "true";
      const currentTerminalId = isSecCashier ? "Sub-1" : "Main";
      const activeShift = load().shift;
      const fallbackName = localStorage.getItem("backupCashierName") || "كاشير احتياطي";
      if (!activeShift) {
        toast.error("لا يوجد وردية مفتوحة لإغلاقها على هذا الجهاز!");
        return false;
      }
      const closedShiftData = {
        cashierId: activeShift.cashierId || "sec-cashier",
        cashierName: activeShift.cashierName || fallbackName,
        // 👈 التأمين السحري هنا
        openedAt: activeShift.openedAt,
        closedAt: Date.now(),
        ...totalsData,
        terminalId: currentTerminalId
      };
      try {
        const res = await fetch(`http://${API_URL}:5000/api/shifts`, {
          method: "POST",
          mode: "cors",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(closedShiftData)
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "فشل الحفظ على السيرفر");
        }
        const savedShiftFromServer = await res.json();
        const cur = load();
        cur.shifts = [savedShiftFromServer, ...cur.shifts];
        cur.shift = null;
        localStorage.removeItem("backupCashierName");
        save(cur);
        setDb(cur);
        toast.success(
          `🎉 تم إغلاق الوردية وحفظ تقرير المطابقة للجهاز ${currentTerminalId}`
        );
        return savedShiftFromServer;
      } catch (err) {
        toast.error(err.message || "فشل الاتصال بالسيرفر");
        return false;
      }
    },
    []
  );
  const addEmployee = useCallback(
    async (name, role, pin) => {
      const cur = load();
      const pinHash = await hashPin(pin);
      const isDuplicate = cur.employees.some((emp) => emp.pinHash === pinHash);
      if (isDuplicate) {
        toast.error(
          "عذراً، هذا الرقم السري مستخدم بالفعل لموظف آخر! اختر رقماً مختلفاً."
        );
        return;
      }
      cur.employees.push({
        id: crypto.randomUUID(),
        name: name.trim(),
        role,
        pinHash
      });
      save(cur);
      setDb(cur);
      toast.success("تم إضافة الموظف بنجاح");
    },
    []
  );
  const updateEmployee = useCallback(async (id, patch) => {
    const cur = load();
    const e = cur.employees.find((x) => x.id === id);
    if (!e) return;
    if (patch.newPin) {
      const newHash = await hashPin(patch.newPin);
      const isDuplicate = cur.employees.some(
        (emp) => emp.pinHash === newHash && emp.id !== id
      );
      if (isDuplicate) {
        toast.error("عذراً، الرقم السري الجديد مستخدم بالفعل لموظف آخر!");
        return;
      }
      e.pinHash = newHash;
    }
    if (patch.name !== void 0) e.name = patch.name.trim();
    if (patch.role !== void 0) e.role = patch.role;
    save(cur);
    setDb(cur);
    toast.success("تم التحديث بنجاح");
  }, []);
  const deleteEmployee = useCallback((id) => {
    const cur = load();
    cur.employees = cur.employees.filter((e) => e.id !== id);
    save(cur);
    setDb(cur);
    toast.success("تم حذف الموظف");
  }, []);
  const verifyEmployeePin = useCallback(async (id, pin) => {
    const cur = load();
    const e = cur.employees.find((x) => x.id === id);
    if (!e) return false;
    return await hashPin(pin) === e.pinHash;
  }, []);
  const findByPin = useCallback(async (pin, role) => {
    const cur = load();
    const h = await hashPin(pin);
    return cur.employees.find(
      (e) => e.pinHash === h && (!role || e.role === role)
    ) || null;
  }, []);
  const addCustomer = useCallback(
    async (name, phone, address) => {
      const cur = load();
      const newCustomer = {
        id: crypto.randomUUID(),
        name,
        phone: phone || "",
        address: address || "",
        orderCount: 0,
        createdAt: Date.now()
      };
      cur.customers.push(newCustomer);
      save(cur);
      setDb(cur);
      toast.success("تم إضافة العميل بنجاح 🎉");
      try {
        await fetch(`http://${API_URL}:5000/api/customers`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newCustomer)
        });
      } catch (err) {
        console.error("❌ فشل حفظ العميل في قاعدة البيانات:", err);
      }
    },
    []
  );
  const updateCustomer = useCallback(
    async (id, name, phone, address) => {
      const cur = load();
      const updatedCustomer = {
        id,
        name,
        phone: phone || "",
        address: address || ""
      };
      cur.customers = cur.customers.map(
        (c) => c.id === id ? { ...c, ...updatedCustomer } : c
      );
      save(cur);
      setDb(cur);
      toast.success("تم تعديل بيانات العميل");
      try {
        await fetch(`http://${API_URL}:5000/api/customers/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedCustomer)
        });
      } catch (err) {
        console.error("❌ فشل تحديث العميل في قاعدة البيانات:", err);
      }
    },
    []
  );
  const upsertOrder = useCallback(async (order) => {
    const cur = load();
    cur.orders[order.tableCode] = order;
    save(cur);
    setDb(cur);
    try {
      const response = await fetch(
        `http://${API_URL}:5000/api/pos/orders/upsert`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tableCode: order.tableCode,
            orderData: order
            // الأوردر ده جواه الـ state ('active' أو 'printed')
          })
        }
      );
      if (!response.ok) {
        toast.error("⚠️ لم يتم حفظ الطاولة على السيرفر، تأكد من الشبكة!");
      }
    } catch (err) {
      console.error("🚨 خطأ أثناء تحديث الطاولة على السيرفر:", err);
      toast.error("⚠️ خطأ في الاتصال بالسيرفر الرئيسي!");
    }
  }, []);
  const clearOrder = useCallback(async (tableCode) => {
    const cur = load();
    delete cur.orders[tableCode];
    save(cur);
    setDb(cur);
    try {
      await fetch(`http://${API_URL}:5000/api/pos/orders/clear`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tableCode })
      });
    } catch (err) {
      console.error("🚨 خطأ أثناء مسح الطاولة من السيرفر:", err);
    }
  }, []);
  const addInvoice = useCallback(
    async (inv) => {
      const cur = load();
      const createdAt = Date.now();
      const totals = computeTotals(
        inv.items,
        inv.discountPct || 0,
        inv.type === "dinein" ? 14 : 0,
        inv.orderCategory || "normal"
      );
      const deliveryPrice = Number(inv.deliveryPrice || 0);
      const fullInvoice = {
        ...inv,
        id: crypto.randomUUID(),
        createdAt,
        subtotal: totals.subtotal,
        discountValue: totals.discountValue,
        deliveryPrice,
        taxPct: totals.taxPct,
        taxValue: totals.taxValue,
        orderCategory: inv.orderCategory || "normal",
        commissionValue: totals.commissionValue,
        total: totals.total + deliveryPrice,
        terminalId: inv.terminalId || "Main",
        createdBy: inv.cashierName || "Main Cashier"
      };
      let finalInvoiceToSave = { ...fullInvoice, invoiceNumber: 0 };
      try {
        const response = await fetch(`http://${API_URL}:5000/api/invoices`, {
          method: "POST",
          mode: "cors",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(fullInvoice)
        });
        if (response.ok) {
          const serverInvoice = await response.json();
          finalInvoiceToSave = serverInvoice;
          console.log("✅ تم حفظ الفاتورة بالترتيب الصحيح من السيرفر!");
        } else {
          console.error("❌ السيرفر رفض حفظ الفاتورة");
        }
      } catch (error) {
        console.error("❌ فشل الاتصال بالسيرفر:", error);
      }
      cur.invoices = [finalInvoiceToSave, ...cur.invoices];
      save(cur);
      setDb(cur);
      toast.success(
        `🎉 تم اعتماد الفاتورة رقم: ${finalInvoiceToSave.invoiceNumber}`
      );
      return finalInvoiceToSave;
    },
    []
  );
  const incCustomerOrders = useCallback(async (id) => {
    if (!id) return;
    setDb((cur) => {
      const updated = cur.customers.map(
        (c) => c.id === id ? { ...c, orderCount: (c.orderCount || 0) + 1 } : c
      );
      const next = { ...cur, customers: updated };
      save(next);
      return next;
    });
    try {
      await fetch(`http://${API_URL}:5000/api/customers/${id}/increment`, {
        method: "PATCH"
      });
    } catch (err) {
      console.error("❌ فشل تزويد العداد في الداتابيز:", err);
    }
  }, []);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const fetchCustomers = async () => {
      try {
        const res = await fetch(`http://${API_URL}:5000/api/customers`);
        if (!res.ok) return;
        const serverCustomers = await res.json();
        const cur = load();
        if (JSON.stringify(cur.customers) !== JSON.stringify(serverCustomers)) {
          cur.customers = serverCustomers;
          save(cur);
          setDb(cur);
        }
      } catch (err) {
      }
    };
    fetchCustomers();
    const interval = setInterval(fetchCustomers, 1e4);
    return () => clearInterval(interval);
  }, []);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const fetchTodayInvoices = async () => {
      try {
        const start = /* @__PURE__ */ new Date();
        start.setHours(0, 0, 0, 0);
        const end = /* @__PURE__ */ new Date();
        end.setHours(23, 59, 59, 999);
        const res = await fetch(
          `http://${API_URL}:5000/api/invoices?startDate=${start.toISOString()}&endDate=${end.toISOString()}`
        );
        if (!res.ok) return;
        const serverInvoices = await res.json();
        const cur = load();
        const map = /* @__PURE__ */ new Map();
        cur.invoices.forEach((inv) => map.set(inv.id, inv));
        serverInvoices.forEach((inv) => map.set(inv.id, inv));
        const merged = Array.from(map.values()).sort(
          (a, b) => b.createdAt - a.createdAt
        );
        if (cur.invoices.length !== merged.length) {
          cur.invoices = merged;
          save(cur);
          setDb(cur);
        }
      } catch (err) {
      }
    };
    fetchTodayInvoices();
    const interval = setInterval(fetchTodayInvoices, 1e4);
    return () => clearInterval(interval);
  }, []);
  const transferItems = useCallback(
    async (from, to, itemsToMove, targetZone) => {
      const cur = load();
      const src = cur.orders[from];
      if (!src) return { ok: false, error: "الطاولة غير موجودة" };
      let finalZone = targetZone;
      const foundZone = ZONES.find(
        (z) => z.id === targetZone || z.prefix === targetZone || to && to.startsWith(z.prefix)
      );
      if (foundZone) {
        finalZone = foundZone.id;
      }
      const dst = cur.orders[to] || {
        ...src,
        tableCode: to,
        zone: finalZone,
        items: [],
        state: src.state || "active",
        discountPct: src.discountPct !== void 0 ? src.discountPct : 0,
        taxPct: src.taxPct !== void 0 ? src.taxPct : 14,
        openedAt: src.openedAt || Date.now()
      };
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
            qty: move.qty
          });
        }
      }
      cur.orders[to] = dst;
      if (src.items.length === 0) delete cur.orders[from];
      save(cur);
      setDb(cur);
      try {
        await fetch(`http://${API_URL}:5000/api/pos/orders/transfer`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fromCode: from,
            toCode: to,
            fromOrder: cur.orders[from] || null,
            toOrder: dst
          })
        });
      } catch (err) {
        console.error("🚨 خطأ أثناء مزامنة التحويل مع السيرفر:", err);
        return { ok: false, error: "فشل الاتصال بالسيرفر أثناء التحويل" };
      }
      return { ok: true };
    },
    []
  );
  const transferCaptain = useCallback(
    async (tableCode, newCaptainName) => {
      const cur = load();
      const order = cur.orders[tableCode];
      if (!order) return { ok: false, error: "الطاولة غير موجودة أو غير نشطة" };
      order.captainName = newCaptainName;
      save(cur);
      setDb(cur);
      try {
        const res = await fetch(
          `http://${API_URL}:5000/api/pos/orders/transfer-captain`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              tableCode,
              newCaptainName
            })
          }
        );
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "فشل الحفظ على السيرفر");
        }
      } catch (err) {
        console.error("🚨 خطأ أثناء مزامنة تحويل الكابتن مع السيرفر:", err);
        toast.error(
          "⚠️ تنبيه: حدث خطأ في الاتصال بالسيرفر أثناء تحويل الكابتن!"
        );
        return { ok: false, error: err.message || "فشل الاتصال بالسيرفر" };
      }
      return { ok: true };
    },
    []
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
    incCustomerOrders
  };
}
function computeTotals(items, discountPct, taxPct, orderCategory = "normal") {
  const baseSubtotal = round2(
    items.reduce(
      (s, l) => s + (clamp0(l.unitPrice) + l.extras.reduce((x, e) => x + clamp0(e.price), 0)) * clamp0(l.qty),
      0
    )
  );
  let commissionValue = 0;
  if (orderCategory === "talabat") {
    commissionValue = round2(baseSubtotal * 15 / 100);
  } else if (orderCategory === "fast") {
    commissionValue = round2(baseSubtotal * 0 / 100);
  }
  const subtotal = round2(baseSubtotal + commissionValue);
  const discountValue = round2(subtotal * clamp0(discountPct) / 100);
  const afterDiscount = round2(subtotal - discountValue);
  const taxValue = round2(afterDiscount * clamp0(taxPct) / 100);
  const total = round2(afterDiscount + taxValue);
  return {
    subtotal,
    // 🌟 مدمج جواه الـ 5% لطلبات أو فاست وجاهز لكل الصفحات
    baseSubtotal,
    // المجموع الأصلي الصافي للأصناف فقط بدون النسبة
    discountValue,
    taxValue,
    tax_value: taxValue,
    taxPct,
    tax_pct: taxPct,
    commissionValue,
    // قيمة النسبة بالجنيه لعرضها لو أحببت
    total
  };
}
export {
  PAGE_SIZE as P,
  ZONES as Z,
  computeTotals as c,
  setGlobalEditingTable as s,
  usePosDB as u
};
