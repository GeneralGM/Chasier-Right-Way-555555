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
  expandMealToBase,
} from "@/lib/store";
import {
  usePosDB,
  ZONES,
  PAGE_SIZE,
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
  Bike,
  AlertTriangle,
} from "lucide-react";

export const Route = createFileRoute("/orders")({
  head: () => ({ meta: [{ title: "الطلبات - نقطة البيع" }] }),
  component: OrdersGate,
});

function OrdersGate() {
  const { db: pos } = usePosDB();
  if (!pos.shift) return <ShiftLogin />;
  return <PosScreen />;
}

// دالة بتحسب الرقم بناءً على تاريخ اليوم
function getNextInvoiceNumber(invoices: Invoice[]) {
  const today = new Date().toDateString();
  const todayInvoices = invoices.filter(
    (i) => i.createdAt && new Date(i.createdAt).toDateString() === today,
  );

  if (todayInvoices.length === 0) return 1;

  // بنجيب أكبر رقم موجود النهاردة ونزود عليه 1
  const maxNum = Math.max(...todayInvoices.map((i) => i.invoiceNumber || 0));
  return maxNum + 1;
}

/* ---------------- Shift login (Cashier PIN) ---------------- */
function ShiftLogin() {
  const { db: pos, findByPin, openShift } = usePosDB();
  const [pin, setPin] = useState("");
  const [err, setErr] = useState("");

  // 🌟 ولايات المزامنة مع السيرفر
  const [serverEmployees, setServerEmployees] = useState<any[]>([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);

  // 🔄 جلب الموظفين من الـ Backend فوراً لو الـ LocalStorage ممسوح
  useEffect(() => {
    async function fetchEmployeesFallback() {
      if (pos.employees && pos.employees.length > 0) return;
      try {
        setIsLoadingEmployees(true);
        const response = await fetch("http://localhost:5000/api/employees");
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

  // القائمة الذكية المدمجة
  const activeEmployeesList =
    pos.employees && pos.employees.length > 0 ? pos.employees : serverEmployees;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");

    // البحث في القائمة المدمجة عن طريق الباسوورد
    const emp = activeEmployeesList.find(
      (x) =>
        (x.pin === pin || x.pinHash === pin || x.pin_hash === pin) &&
        x.role === "كاشير",
    );

    if (!emp) {
      // محاولة أخيرة عبر الدالة الأصلية تحسباً للتشويش
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

  // شاشة التحميل وقت الفحص
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
        {err && <p className="text-xs text-destructive text-center">{err}</p>}
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
  const [openOrder, setOpenOrder] = useState<string | null>(null); // tableCode
  const [transferOpen, setTransferOpen] = useState(false);
  const [printOrder, setPrintOrder] = useState<string | null>(null);
  const [checkoutConfirm, setCheckoutConfirm] = useState<string | null>(null);

  const currentZone = ZONES.find((z) => z.id === zone)!;
  useEffect(() => {
    setPage(0);
    setSelectedTable(null);
  }, [zone]);

  // Generate table codes for current zone (paginated)
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
    // find zone matching prefix
    const z = ZONES.find((z) => c.startsWith(z.prefix) && z.id !== "takeaway");
    if (!z) {
      toast.error("كود طاولة غير معروف");
      return;
    }
    const n = parseInt(c.slice(z.prefix.length));
    if (!n || n < 1 || n > z.count) {
      toast.error("رقم الطاولة خارج النطاق");
      return;
    }
    setZone(z.id);
    setPage(Math.floor((n - 1) / PAGE_SIZE));
    setSelectedTable(c);
  }

  function actionOpen() {
    if (!selectedTable) return toast.error("اختر طاولة أولاً");
    // ensure order exists
    if (!pos.orders[selectedTable]) {
      upsertOrder({
        tableCode: selectedTable,
        zone,
        items: [],
        state: "active",
        discountPct: 0,
        taxPct: 14,
        openedAt: Date.now(),
      });
    }
    setOpenOrder(selectedTable);
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

  // TAKEAWAY: render customer DB view instead of tables
  if (zone === "takeaway") {
    return (
      <PosFrame
        onLogout={() =>
          closeShift({
            kitchenSales: 0,
            barSales: 0,
            shishaSales: 0,
            taxValue: 0,
            discountValue: 0,
            dineinSales: 0,
            takeawaySales: 0,
            deliverySales: 0,
          })
        }
        cashierName={pos.shift?.cashierName || "جاري التحميل..."}
        zoneTabs={<ZoneTabs zone={zone} setZone={setZone} />}
      >
        <TakeawayView onOpenOrder={(code) => setOpenOrder(code)} />
        {openOrder && pos.orders[openOrder] && (
          <OrderEntryDialog
            tableCode={openOrder}
            order={pos.orders[openOrder]}
            meals={db.meals}
            items={db.items}
            onClose={() => setOpenOrder(null)}
          />
        )}
      </PosFrame>
    );
  }

  return (
    <PosFrame
      onLogout={() =>
        closeShift({
          kitchenSales: 0,
          barSales: 0,
          shishaSales: 0,
          taxValue: 0,
          discountValue: 0,
          dineinSales: 0,
          takeawaySales: 0,
          deliverySales: 0,
        })
      }
      cashierName={pos.shift?.cashierName || "جاري التحميل..."}
      zoneTabs={<ZoneTabs zone={zone} setZone={setZone} />}
    >
      {/* Top: search */}
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

      {/* Center: grid + side actions */}
      <div className="flex-1 flex gap-3 px-4 pt-3 min-h-0 overflow-hidden">
        <div className="flex-1 grid grid-cols-5 grid-rows-4 gap-3 min-h-0">
          {filteredTables.map((code) => {
            const st = tableState(code);
            const sel = selectedTable === code;
            const matchSearch =
              search && code.toUpperCase().includes(search.toUpperCase());
            // 1. اتأكد من حالة الأوردر (هل فيه items ولا لأ)
            const order = pos.orders[code];
            const hasItems =
              order && Array.isArray(order.items) && order.items.length > 0;

            // 2. غير منطق الألوان بحيث لو مفيش items يرجع للـ default
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
                className={`relative rounded-2xl border-2 flex flex-col items-center justify-center gap-1 transition
                  ${colors}
                  ${sel ? "ring-4 ring-primary/60 scale-[1.02]" : ""}
                  ${matchSearch ? "ring-2 ring-emerald-500" : ""}`}
              >
                <TableChairsSvg />
                <span className="font-bold text-lg">{code}</span>
                {st !== "empty" && (
                  <span className="text-[10px] uppercase tracking-wide">
                    {st === "active" ? "نشط" : "مطبوع"}
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

        {/* Side actions */}
        <aside className="w-44 shrink-0 flex flex-col gap-2">
          <Button onClick={actionOpen} className="h-16 text-base gap-2">
            <Plus className="w-5 h-5" /> فتح
          </Button>
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
        </aside>
      </div>

      {/* Footer: pagination + zones */}
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
            // السطر ده هو الساحر: بيحذف الأوردر النشط من الطاولة لأن خلاص نزل مبيعات
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
  return (
    <div className="flex gap-1 overflow-x-auto px-2">
      {ZONES.map((z) => (
        <button
          key={z.id}
          onClick={() => setZone(z.id)}
          className={`shrink-0 px-3 h-10 rounded-md text-sm font-medium transition ${zone === z.id ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}
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
  // tiny stylized table+6 chairs
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

  // حالات الإضافة والتعديل
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
      // مرر الهاتف والعنوان للـ store
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
  const [deliveryModalOpen, setDeliveryModalOpen] = useState(false);
  const [deliveryInputPrice, setDeliveryInputPrice] = useState("");
  const [q, setQ] = useState("");
  const [modifierMeal, setModifierMeal] = useState<Meal | null>(null);

  // State الجديد للتحكم في القسم النشط
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const sellable = meals.filter((m) => m.kind === "menu");

  // تحسين البحث ليكون مرن وغير حساس لحالة الأحرف (Case-Insensitive)
  const filtered = sellable.filter(
    (m) => !q || m.name.toLowerCase().includes(q.toLowerCase()),
  );

  // استخراج قائمة الأقسام الفريدة المتاحة في المنيو تلقائياً
  const categories = useMemo(() => {
    return Array.from(new Set(sellable.map((m) => m.category).filter(Boolean)));
  }, [sellable]);

  const getAvailableQty = (targetMeal: Record<string, unknown>) => {
    if (targetMeal.category === SHISHA_CATEGORY) return Infinity;

    // تعريف الـ DB كـ unknown عشان نتحايل على قيود النوع
    const dbRaw = db as unknown as Record<string, unknown>;
    const allOrders = Object.values(
      (dbRaw.orders as Record<string, unknown>[]) || {},
    );

    let maxPossible = Infinity;
    const ingredients =
      (targetMeal.ingredients as Array<Record<string, unknown>>) || [];

    for (const ing of ingredients) {
      if (ing.refKind === "meal") continue;
      const itemId = ing.itemId as string;

      // حساب المحجوز (Reserved)
      const reservedQty = allOrders.reduce((sum: number, order: unknown) => {
        const typedOrder = order as Record<string, unknown>;
        const itemsList =
          (typedOrder.items as Array<Record<string, unknown>>) || [];
        const itemInOrder = itemsList.find((i) => i.mealId === targetMeal.id);
        return (
          sum + ((itemInOrder?.qty as number) || 0) * ((ing.qty as number) || 0)
        );
      }, 0);

      const itemsList = items as unknown as Array<Record<string, unknown>>;
      const it = itemsList?.find((x) => x.id === itemId);
      if (!it) continue;

      const targetDept = ((targetMeal.department as string) ||
        (it.department as string)) as "بار" | "مطبخ";
      const key = deptKey(targetDept, it.id as string);

      const deptStock = dbRaw?.deptStock as Record<string, number> | undefined;
      const currentStock = ((deptStock?.[key] as number) || 0) - reservedQty;

      const conversion =
        (it.conversionFactor as number) > 0
          ? (it.conversionFactor as number)
          : 1;

      // استخدام Parameters لسحب النوع مباشرة من الدالة وتجنب أي نوع صريح
      const needBasePerOne = convertToBase(
        ing.qty as number,
        ing.unit as Parameters<typeof convertToBase>[1],
        it.unit as Parameters<typeof convertToBase>[2],
        conversion,
        it.subUnitType as Parameters<typeof convertToBase>[4],
      );

      const possibleMeals = Math.floor(currentStock / needBasePerOne);
      if (possibleMeals < maxPossible) {
        maxPossible = possibleMeals;
      }
    }

    return maxPossible;
  };

  // Manufacturable qty per meal (limit by sub-inventory; shisha bypassed)
  function manufacturable(meal: Meal): number | null {
    if (meal.category === SHISHA_CATEGORY) return null;
    if (!meal.ingredients || meal.ingredients.length === 0) return 0;

    const dbRaw = db as unknown as Record<string, unknown>;
    const allOrders = Object.values(
      (dbRaw.orders as Record<string, unknown>[]) || {},
    );

    let min = Infinity;
    for (const ing of meal.ingredients) {
      // التعامل مع الوجبات الفرعية
      if (ing.refKind === "meal") {
        // (نفس منطقك القديم)
        continue;
      }

      const it = items.find((x) => x.id === ing.itemId);
      if (!it) return 0;

      // حساب المحجوز
      const reservedQty = allOrders.reduce((sum: number, order: unknown) => {
        const typedOrder = order as Record<string, unknown>;
        const itemsList =
          (typedOrder.items as Array<Record<string, unknown>>) || [];
        const mealsUsingIt = itemsList.filter((i) => i.mealId === meal.id);
        const count = mealsUsingIt.reduce(
          (s, i) => s + ((i.qty as number) || 0),
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

      // نفس حركة سحب الأنواع
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
    upsertOrder({ ...order, items: [...order.items, line], state: "active" });
  }

  const getMaxQty = (meal: any, db: any, currentQty: number = 0) => {
    const department = meal.department;

    const limits = meal.ingredients.map((ing: any) => {
      const stockKey = `${department}::${ing.itemId}`;

      // الرصيد الحالي في المخزن
      const stockInDb = db.deptStock[stockKey] || 0;

      // 💡 السر هنا: بنرجع الكمية اللي الوجبة دي سحباها حالياً للمخزن "حسابياً فقط"
      // عشان نعرف الإجمالي الحقيقي المتاح للوجبة دي من البداية
      const currentIngWeightInKg = (currentQty * ing.qty) / 1000;
      const availableStock = stockInDb + currentIngWeightInKg;

      return Math.floor((availableStock * 1000) / ing.qty);
    });

    return Math.min(...limits);
  };

  function deductInventoryFinal() {
    const perDept: Record<string, { itemId: string; baseQty: number }[]> = {};
    for (const line of order.items) {
      const meal = db.meals.find((m) => m.id === line.mealId);
      if (!meal || meal.category === SHISHA_CATEGORY) continue;
      const dept = meal.department;
      for (const ing of meal.ingredients) {
        if (ing.refKind === "meal") continue;
        const it = items.find((x) => x.id === ing.itemId);
        if (!it) continue;
        const conversion =
          it.conversionFactor && it.conversionFactor > 0
            ? it.conversionFactor
            : 1;
        const baseQty = round2(
          clamp0(
            convertToBase(
              ing.qty,
              ing.unit,
              it.unit,
              conversion,
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

  async function handleSaveAndDeduct(code: string) {
    const updatedDeptStock = { ...db.deptStock };
    const outOfStockMeals: string[] = [];

    // 1. جلب نسخة الأوردر القديم من قاعدة البيانات قبل التعديل
    const oldOrder = db.orders?.find(
      (o: Record<string, unknown>) => o.tableCode === code,
    );

    // 2. عمل خريطة (Map) لحساب كميات الوجبات (القديمة والجديدة) لمعرفة الفرق
    const qtyMap: Record<string, { oldQty: number; newQty: number }> = {};

    // نملأ الكميات الجديدة من السلة الحالية
    for (const item of order.items) {
      qtyMap[item.mealId] = { oldQty: 0, newQty: item.qty };
    }

    // نملأ الكميات القديمة لو الأوردر ده كان محفوظ قبل كده
    if (
      oldOrder &&
      Array.isArray((oldOrder as Record<string, unknown>).items)
    ) {
      const oldItems = (oldOrder as Record<string, unknown>).items as Array<{
        mealId: string;
        qty: number;
      }>;
      for (const item of oldItems) {
        if (!qtyMap[item.mealId]) {
          qtyMap[item.mealId] = { oldQty: item.qty, newQty: 0 };
        } else {
          qtyMap[item.mealId].oldQty = item.qty;
        }
      }
    }

    // 3. الفحص والخصم أو الإرجاع بناءً على الفرق (Diff)
    for (const mealId in qtyMap) {
      const { oldQty, newQty } = qtyMap[mealId];
      const diffQty = newQty - oldQty;

      if (diffQty === 0) continue;

      const meal = meals.find((m) => m.id === mealId);
      if (!meal || meal.category === SHISHA_CATEGORY) continue;

      for (const ing of meal.ingredients) {
        if (ing.refKind === "meal") continue;

        const it = items.find((x) => x.id === ing.itemId);
        if (!it) continue;

        const targetDept = meal.department || it.department;
        const key = deptKey(targetDept, it.id);

        const conversion =
          it.conversionFactor && it.conversionFactor > 0
            ? it.conversionFactor
            : 1;
        const needBasePerOne = convertToBase(
          ing.qty,
          ing.unit || ing.unit,
          it.unit,
          conversion,
          it.subUnitType,
        );

        const totalDiffNeeded = needBasePerOne * diffQty;
        const currentStock = updatedDeptStock[key] || 0;

        // أمان: لو المخزن مش مكفي
        if (totalDiffNeeded > 0 && currentStock < totalDiffNeeded) {
          if (!outOfStockMeals.includes(meal.name)) {
            outOfStockMeals.push(meal.name);
          }
        }

        // تطبيق التغيير (خصم أو إرجاع تلقائي)
        if (outOfStockMeals.length === 0) {
          updatedDeptStock[key] = Math.max(0, currentStock - totalDiffNeeded);
        }
      }
    }

    // 4. الرد الحاسم لو فيه عجز في المخزن
    if (outOfStockMeals.length > 0) {
      alert(
        `🚨 خطأ في المخزن: الأصناف [ ${outOfStockMeals.join(", ")} ] كميتها لا تكفي الزيادة الحالية!`,
      );
      return;
    }

    // 5. التثبيت النهائي لحركة المخزن في الداتابيز
    if (db.updateDeptStock) {
      await db.updateDeptStock(updatedDeptStock);
    }
    // ==========================================
    // 💡 التعديل المتوافق مع نوع SaleEntry بالظبط
    // ==========================================

    // 1. حساب إجمالي البيع للعملية الحالية
    const currentTotalSales = order.items.reduce(
      (sum: number, item: any) => sum + item.price * item.qty,
      0,
    );

    // لو مش متاحة أو صعبة الوصول هنا، حطها مؤقتاً 0 والجدول في النتائج كدة كدة بيحسبها لوحده
    let currentTotalCost = 0;
    if (typeof expandMealToBase === "function" && db.meals && db.items) {
      order.items.forEach((item: any) => {
        const meal = meals.find((m) => m.id === item.mealId);
        if (meal) {
          const expandMap = expandMealToBase(meal, meals, db.items);
          let c = 0;
          for (const [, info] of expandMap) c += info.cost;
          currentTotalCost += c * item.qty;
        }
      });
    }

    // 3. بناء الأوبجكت بالمواصفات الكاملة المطلوبة
    const newSale = {
      id: "sale_" + Date.now(),
      date: new Date().toISOString().slice(0, 10),
      department: order.items[0]?.department || "مطبخ",
      lines: order.items.map((item: any) => ({
        mealId: item.mealId,
        qty: item.qty,
        price: item.price,
      })),
      // الثلاثة المطلوبة اللي كانت ناقصة ومسببة الخطأ 👇
      totalSales: currentTotalSales,
      totalCost: currentTotalCost,
      createdAt: Date.now(),
    };

    // 4. الحفظ في الداتا بيس (باستخدام التايب كاستنج لضمان عدم اعتراض TS)
    if ((db as any).setDb) {
      (db as any).setDb((prev: any) => ({
        ...prev,
        sales: [...(prev.sales || []), newSale],
      }));
    } else if (db.sales) {
      db.sales.push(newSale as any);
    }
    // ==========================================

    // لو السلة فاضية اقفل الأوردر وامسحه بلاش فواتير صفرية
    if (order.items.length === 0) {
      clearOrder(code);
      onClose();
      return;
    }

    // ==========================================
    // 🛍️ لوجيك التوجيه بناءً على نوع الزون (Takeaway أو صالة)
    // ==========================================
    if (order.zone === "takeaway") {
      // 🛵 لوجيك التيك أواي المطور
      let finalDeliveryPrice = 0;
      const inputPrice = prompt(
        "الرجاء إدخال مصاريف التوصيل (اتركه 0 إذا كان تيك أواي عادي):",
        "0",
      );

      // لو الكاشير ضغط إلغاء (Cancel)، نوقف العملية تماماً ومفيش حاجة تتحفظ
      if (inputPrice === null) return;

      finalDeliveryPrice = Number(inputPrice) || 0;

      // الشرط الذكي: لو أكبر من 0 يتحول لـ delivery (توصيل)، غير كده يفضل takeaway
      const computedType = finalDeliveryPrice > 0 ? "delivery" : "takeaway";

      const inv: any = {
        id: crypto.randomUUID(),
        invoiceNumber: getNextInvoiceNumber
          ? getNextInvoiceNumber(pos.invoices)
          : Math.floor(100000 + Math.random() * 900000),
        type: computedType,
        tableCode: code,
        zone: "takeaway",
        customerName: order.customerName || null,
        customerAddress: order.customerAddress || null,
        cashierId: pos.shift?.cashierId || null,
        cashierName: pos.shift?.cashierName || null,
        items: order.items,
        subtotal: totals.subtotal,
        discountPct: order.discountPct,
        discountValue: totals.discountValue,
        taxPct: order.taxPct,
        taxValue: totals.taxValue,
        deliveryPrice: finalDeliveryPrice,
        total: totals.total + finalDeliveryPrice,
        createdAt: Date.now(),
      };

      try {
        const response = await fetch("http://localhost:5000/api/invoices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(inv),
        });

        if (!response.ok) {
          throw new Error("فشل في حفظ الفاتورة على السيرفر");
        }

        addInvoice(inv);

        if (order.customerName) {
          const c = pos.customers.find((c) => c.name === order.customerName);
          if (c) incCustomerOrders(c.id);
        }

        clearOrder(code);

        if (computedType === "delivery") {
          toast.success(
            `تم حفظ الفاتورة كـ Order توصيل! 🛵 (+${finalDeliveryPrice} ج.م)`,
          );
        } else {
          toast.success("تم حفظ فاتورة تيك أواي بنجاح! 🛍️");
        }

        onClose();
      } catch (error: any) {
        console.error("خطأ أثناء حفظ الفاتورة:", error);
        toast.error(`حدث خطأ أثناء الحفظ على السيرفر: ${error.message}`);
      }
    } else {
      // ==========================================
      // 🍽️ لوجيك الصالة الأساسي (طاولات)
      // ==========================================
      upsertOrder({ ...order, state: "active" });
      toast.success("تم حفظ طلب الصالة على الطاولة! 🍽️");
      onClose();
    }
  }

  async function processTakeawayInvoice(isDelivery: boolean) {
    const finalDeliveryPrice = isDelivery ? Number(deliveryInputPrice) || 0 : 0;
    const computedType = isDelivery ? "delivery" : "takeaway";

    // إغلاق البوكس
    setDeliveryModalOpen(false);

    const inv: any = {
      id: crypto.randomUUID(),
      invoiceNumber: getNextInvoiceNumber
        ? getNextInvoiceNumber(pos.invoices)
        : Math.floor(100000 + Math.random() * 900000),
      type: computedType, // 'takeaway' أو 'delivery'
      tableCode: order.tableCode,
      zone: "takeaway",
      customerName: order.customerName || null,
      customerAddress: order.customerAddress || null,
      cashierId: pos.shift?.cashierId || null,
      cashierName: pos.shift?.cashierName || null,
      items: order.items,
      subtotal: totals.subtotal,
      discountPct: order.discountPct,
      discountValue: totals.discountValue,
      taxPct: order.taxPct,
      taxValue: totals.taxValue,
      deliveryPrice: finalDeliveryPrice, // لو Skip هتبقي 0
      total: totals.total + finalDeliveryPrice,
      createdAt: Date.now(),
    };

    try {
      const response = await fetch("http://localhost:5000/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inv),
      });

      if (!response.ok) throw new Error("فشل في حفظ الفاتورة على السيرفر");

      addInvoice(inv);

      // هنا بنحسب الأوردر للزبون بناءً على اسمه عشان orderCount يزيد صح
      if (order.customerName) {
        const c = pos.customers.find((c) => c.name === order.customerName);
        if (c) incCustomerOrders(c.id);
      }

      clearOrder(order.tableCode);

      if (computedType === "delivery") {
        toast.success(
          `تم حفظ الفاتورة كـ أوردر توصيل 🛵 (+${finalDeliveryPrice} ج.م)`,
        );
      } else {
        toast.success("تم حفظ فاتورة تيك أواي 🛍️");
      }

      onClose();
    } catch (error: any) {
      console.error("خطأ:", error);
      toast.error(`حدث خطأ أثناء الحفظ: ${error.message}`);
    }
  }

  function onPickMeal(meal: Meal) {
    if (meal.hasModifiers && (meal.modifierGroups?.length || 0) > 0) {
      setModifierMeal(meal);
    } else {
      addLine(meal);
    }
  }

  const handleQtyChange = (val: number, maxQty: number, lineId: string) => {
    if (val > maxQty) {
      // إظهار التنبيه
      alert("عفواً، الكمية المطلوبة غير متوفرة! المتاح هو: " + maxQty);

      // تصفير القيمة أو ضبطها على الأقصى
      changeQty(lineId, maxQty);
    } else {
      changeQty(lineId, val);
    }
  };

  function changeQty(lineId: string, qty: number) {
    upsertOrder({
      ...order,
      items: order.items.map((l) =>
        l.id === lineId ? { ...l, qty: clamp0(qty) } : l,
      ),
    });
  }

  function removeLine(lineId: string) {
    upsertOrder({
      ...order,
      items: order.items.filter((l) => l.id !== lineId),
    });
  }

  const totals = computeTotals(order.items, order.discountPct, order.taxPct);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        dir="rtl"
        className="max-w-7xl w-[100vw] h-[95vh] p-0 overflow-hidden"
      >
        <div className="flex h-full">
          {/* Left: meals grid & categories */}
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

            {/* حاوية عرض الأصناف والأقسام الديناميكية */}
            <div className="flex-1 overflow-auto p-3">
              {q ? (
                /* الحالة الأولى: إذا كان هناك نص بحث، اعرض النتائج المطابقة مباشرة */
                <div className="grid grid-cols-5 gap-3 justify-items-center">
                  {filtered.map((m) => {
                    const stockQty = manufacturable(m);
                    const addedInCart =
                      ((
                        order.items as unknown as Array<Record<string, unknown>>
                      )?.find((it) => it.mealId === m.id)?.qty as number) || 0;
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
                        className={`h-[150px] w-[170px] rounded-xl border-2 p-3 flex flex-col items-center justify-center text-center gap-2 transition
                          ${disabled ? "opacity-40 cursor-not-allowed" : "hover:border-primary hover:bg-primary/5"}
                          ${isShisha ? "border-purple-300 bg-purple-50 dark:bg-purple-950/30" : "border-border bg-card"}`}
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
                /* الحالة الثانية: لا يوجد بحث ولم يتم اختيار قسم بعد -> اعرض قائمة الأقسام */
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
                /* الحالة الثالثة: تم اختيار قسم معين -> اعرض أصنافه فقط مع زر الرجوع */
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
                        const addedInCart =
                          ((
                            order.items as unknown as Array<
                              Record<string, unknown>
                            >
                          )?.find((it) => it.mealId === m.id)?.qty as number) ||
                          0;
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
                            className={`h-[150px] w-[170px] rounded-xl border-2 p-3 flex flex-col items-center justify-center text-center gap-2 transition
                              ${disabled ? "opacity-40 cursor-not-allowed" : "hover:border-primary hover:bg-primary/5"}
                              ${isShisha ? "border-purple-300 bg-purple-50 dark:bg-purple-950/30" : "border-border bg-card"}`}
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

              {/* رسالة عدم وجود نتائج في حال فشل البحث */}
              {filtered.length === 0 && (
                <div className="col-span-full text-center p-8 text-muted-foreground">
                  لا توجد أصناف مطابقة.
                </div>
              )}
            </div>
          </div>

          {/* Right: cart */}
          <div className="w-80 flex flex-col bg-secondary/30">
            <div className="p-3 border-b border-border">
              <h3 className="font-bold">السلة ({order.items.length})</h3>
            </div>
            <div className="flex-1 overflow-auto p-2 space-y-2">
              {order.items.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm p-6">
                  السلة فارغة — اختر صنف للإضافة.
                </p>
              ) : (
                order.items.map((l) => {
                  const extras = l.extras.reduce((s, e) => s + e.price, 0);
                  const lineTotal = (l.unitPrice + extras) * l.qty;
                  return (
                    <div
                      key={l.id}
                      className="bg-card border border-border rounded-lg p-2 text-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{l.name}</div>
                          {l.modifiersSummary && (
                            <div className="text-[10px] text-muted-foreground">
                              {l.modifiersSummary}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => removeLine(l.id)}
                          className="text-destructive p-1"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => changeQty(l.id, l.qty - 1)}
                          className="w-9 h-9 rounded bg-secondary"
                        >
                          -
                        </button>

                        <input
                          type="number"
                          value={l.qty}
                          className="w-12 text-center border rounded"
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            const meal = db.meals.find(
                              (m) => m.id === l.mealId,
                            );
                            const maxQty = meal ? getMaxQty(meal, db) : 999;

                            const clampedValue = Math.min(val, maxQty);
                            changeQty(l.id, clampedValue);
                          }}
                          readOnly
                        />

                        <button
                          onClick={() => changeQty(l.id, l.qty + 1)}
                          className="w-9 h-9 rounded bg-secondary"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <div className="p-3 border-t border-border space-y-1 text-sm">
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
            <DialogFooter className="p-3 border-t border-border">
              <Button
                onClick={() => handleSaveAndDeduct(order.tableCode)}
                className={`w-full ${order.zone === "takeaway" ? "bg-green-600 hover:bg-green-700 text-white" : ""}`}
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
        <Dialog open={deliveryModalOpen} onOpenChange={setDeliveryModalOpen}>
          <DialogContent dir="rtl" className="max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Bike className="w-5 h-5 text-amber-600" />
                تحديد مصاريف التوصيل
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground">
                لو الطلب ده دليفري (أوردر)، دخل مصاريف التوصيل واضغط OK. لو
                العميل هياخده وهو ماشي، اضغط Skip.
              </p>
              <div>
                <label className="text-xs font-bold mb-1 block">
                  قيمة التوصيل (ج.م)
                </label>
                <Input
                  type="number"
                  autoFocus
                  placeholder="مثال: 20"
                  value={deliveryInputPrice}
                  onChange={(e) => setDeliveryInputPrice(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") processTakeawayInvoice(true);
                  }}
                />
              </div>
            </div>
            <DialogFooter className="flex justify-between sm:justify-between w-full">
              <Button
                variant="outline"
                onClick={() => processTakeawayInvoice(false)}
                className="bg-gray-100"
              >
                Skip (تيك أواي)
              </Button>
              <Button
                onClick={() => processTakeawayInvoice(true)}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                OK (أوردر دليفري)
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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

/* ---------------- Modifier modal ---------------- */
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
  const [picks, setPicks] = useState<Record<string, string>>({}); // groupId -> optionId

  function confirm() {
    const extras: { label: string; price: number }[] = [];
    const parts: string[] = [];
    for (const g of groups) {
      const oid = picks[g.id];
      if (!oid && g.required) {
        toast.error(`اختر من ${g.name}`);
        return;
      }
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

/* ---------------- Transfer modal ---------------- */
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

/* ---------------- Print receipt (dialog) ---------------- */
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
    upsertOrder({ ...order, discountPct: discount });
    window.print();
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
            <p className="text-[10px] text-muted-foreground">
              تغيير الخصم يتطلب كلمة سر المسؤول.
            </p>
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
            toast.success("تم تطبيق الخصم وحفظه في الطلب بنجاح");
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

/* ---------------- Checkout (two-step) ---------------- */
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

  async function finalize() {
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

      let finalDeliveryPrice = 0;
      let finalType: "takeaway" | "delivery" | "dinein" = isTakeaway
        ? "takeaway"
        : "dinein";

      if (isTakeaway) {
        const inputPrice = prompt(
          "الرجاء إدخال مصاريف التوصيل (اتركه 0 أو فارغ إذا كان تيك أواي عادي):",
          "0",
        );

        if (inputPrice === null) return;

        finalDeliveryPrice = Number(inputPrice) || 0;

        if (finalDeliveryPrice > 0) {
          finalType = "delivery";
        }
      }

      const inv: Invoice = {
        id: crypto.randomUUID(),
        invoiceNumber: getNextInvoiceNumber(pos.invoices),
        type: finalType,
        tableCode: isTakeaway ? undefined : tableCode,
        zone: isTakeaway ? undefined : currentOrder.zone,
        customerName: currentOrder.customerName,
        customerAddress: currentOrder.customerAddress,
        cashierId: pos.shift?.cashierId,
        cashierName: pos.shift?.cashierName,
        items: currentOrder.items,

        subtotal: totals.subtotal,
        discountPct: currentOrder.discountPct,
        discountValue: totals.discountValue,
        taxPct: currentOrder.taxPct,
        taxValue: totals.taxValue,
        deliveryPrice: finalDeliveryPrice,
        total: totals.total + finalDeliveryPrice,
        createdAt: Date.now(),
      };

      // 1. حفظ الفاتورة على السيرفر
      await addInvoice(inv);

      // 2. خصم الكميات محلياً
      deductInventory();

      // 3. ترحيل خصم الجرامات والمكونات إلى الـ pgAdmin فوراً
      try {
        for (const line of currentOrder.items) {
          const meal = db.meals.find((m) => m.id === line.mealId);
          if (!meal || !meal.ingredients) continue;

          const dept = meal.department;

          for (const ing of meal.ingredients) {
            const key = deptKey(dept as SubDept, ing.itemId);

            const freshDb = JSON.parse(
              localStorage.getItem("rest-inv-db-v1") || "{}",
            );
            const nextDeptStock = freshDb.deptStock || {};
            const remainingQty =
              nextDeptStock[key] !== undefined ? nextDeptStock[key] : 0;

            const originalItem = db.items.find((i) => i.id === ing.itemId);
            const itemName = originalItem ? originalItem.name : "صنف مخزني";

            await fetch("http://localhost:5000/api/dept-stock", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                itemId: ing.itemId,
                itemName: itemName,
                department: dept,
                qty: remainingQty,
              }),
            });
          }
        }
        console.log(
          "🚀 تم ترحيل وتثبيت خصم المكونات في pgAdmin بنجاح يا هندسة!",
        );
      } catch (stockError) {
        console.error(
          "🚨 خطأ أثناء ترحيل خصم المخازن الفرعية للسيرفر:",
          stockError,
        );
      }

      // =========================================================
      // 🔥 4. تسجيل المبيعات وترحيلها إلى السيرفر (pgAdmin) لدعم الـ ResultsTab
      // =========================================================
      const salesByDept: Record<
        string,
        { mealId: string; qty: number; price: number }[]
      > = {};

      for (const line of currentOrder.items) {
        const meal = db.meals.find((m) => m.id === line.mealId);
        if (!meal) continue;
        const dept = meal.department;

        if (!salesByDept[dept]) {
          salesByDept[dept] = [];
        }

        const existingLine = salesByDept[dept].find(
          (l) => l.mealId === line.mealId,
        );
        if (existingLine) {
          existingLine.qty += line.qty;
        } else {
          salesByDept[dept].push({
            mealId: line.mealId,
            qty: line.qty,
            price: meal.sellingPrice || 0, // 🔥 سحبنا السعر من الـ meal مباشرة عشان الـ OrderItem ما فيهوش price
          });
        }
      }
      const todayStr = new Date().toISOString().slice(0, 10);

      // تجهيز نسخة الـ LocalStorage للاحتياط التزاماً بالسرعة المحلية
      const freshDbForSales = JSON.parse(
        localStorage.getItem("rest-inv-db-v1") || "{}",
      );
      if (!freshDbForSales.sales) freshDbForSales.sales = [];

      for (const [deptName, deptLines] of Object.entries(salesByDept)) {
        if (deptLines.length > 0) {
          // حساب إجمالي البيع للقسم الحالي
          const totalSales = deptLines.reduce(
            (sum, l) => sum + l.price * l.qty,
            0,
          );

          // حساب إجمالي التكلفة بناءً على مكونات الريسبي
          let totalCost = 0;
          if (typeof expandMealToBase === "function" && db.items) {
            for (const l of deptLines) {
              const meal = db.meals.find((m) => m.id === l.mealId);
              if (meal) {
                const expandMap = expandMealToBase(meal, db.meals, db.items);
                let c = 0;
                for (const [, info] of expandMap) c += info.cost;
                totalCost += c * l.qty;
              }
            }
          }

          // بناء أوبجكت المبيعات المتوافق بالملي مع الـ TypeScript والـ pgAdmin
          const newSale = {
            id: "sale_" + crypto.randomUUID().split("-")[0] + "_" + Date.now(),
            date: todayStr,
            department: deptName,
            lines: deptLines,
            totalSales: totalSales,
            totalCost: totalCost,
            createdAt: Date.now(),
          };

          // أ. الحفظ في الـ pgAdmin عن طريق الـ API الخاص بالسيرفر
          try {
            await fetch("http://localhost:5000/api/sales", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(newSale),
            });
            console.log(
              `✅ تم ترحيل بيعة قسم [${deptName}] إلى pgAdmin بنجاح!`,
            );
          } catch (apiError) {
            console.error("🚨 فشل ترحيل المبيعات للسيرفر:", apiError);
          }

          // ب. التحديث المحلي السريع عشان التبويبات تسمع فوراً بدون ريفريش
          freshDbForSales.sales.push(newSale);
          if (db.sales) {
            db.sales.push(newSale as any);
          }

          // ج. استدعاء الدالة القديمة لضمان عدم كسر أي منطق آخر بالسيستم
          try {
            addSale(todayStr, deptName as SubDept, deptLines);
          } catch (e) {
            console.warn("addSale fallback notice:", e);
          }
        }
      }

      // حفظ أخير في اللوكال ستوريدج للحفاظ على المزامنة
      localStorage.setItem("rest-inv-db-v1", JSON.stringify(freshDbForSales));
      // =========================================================

      if (isTakeaway && currentOrder.customerName) {
        const c = pos.customers.find(
          (c) => c.name === currentOrder.customerName,
        );
        if (c) incCustomerOrders(c.id);
      }

      // 5. إشعار النجاح للمستخدم
      if (finalType === "delivery") {
        toast.success(
          `تم إنهاء أوردر التوصيل بنجاح 🛵 (+${finalDeliveryPrice} ج.م)`,
        );
      } else if (finalType === "takeaway") {
        toast.success("تم إنهاء التيك أواي بنجاح 🛍️");
      } else {
        toast.success("تم إنهاء الطاولة بنجاح 🍽️");
      }

      onDone();
    } catch (e) {
      console.error("خطأ في خطوات إنهاء الفاتورة:", e);
      toast.error("حدث خطأ أثناء إنهاء الفاتورة");
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
          <Button variant="outline" onClick={onClose}>
            إلغاء
          </Button>
          {currentOrder.zone === "takeaway" ? (
            <Button
              onClick={finalize}
              className="bg-green-600 hover:bg-green-700 text-white font-bold px-6"
            >
              إنهاء الفاتورة
            </Button>
          ) : (
            <>
              {!confirmed ? (
                <Button
                  variant="destructive"
                  onClick={() => setConfirmed(true)}
                >
                  إنهاء ودفع
                </Button>
              ) : (
                <Button
                  variant="destructive"
                  onClick={finalize}
                  className="animate-pulse"
                >
                  تأكيد نهائي
                </Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
