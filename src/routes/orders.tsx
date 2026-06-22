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
  type SaleLine,
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
  LogOut,
  X,
  UserPlus,
  Phone,
  Trash2,
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

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    const emp = await findByPin(pin, "كاشير");
    if (!emp) {
      setErr("كلمة سر الكاشير غير صحيحة");
      return;
    }
    openShift(emp.id, emp.name);
    toast.success(`أهلاً ${emp.name} — بدأت الشيفت`);
  }

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
        <Button type="submit" className="w-full h-11" disabled={!pin}>
          دخول
        </Button>
        {pos.employees.filter((e) => e.role === "كاشير").length === 0 && (
          <p className="text-xs text-amber-600 text-center">
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
        onLogout={closeShift}
        cashierName={pos.shift!.cashierName}
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
      onLogout={closeShift}
      cashierName={pos.shift!.cashierName}
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

/* ---------------- Take-away CRM ---------------- */
function TakeawayView({
  onOpenOrder,
}: {
  onOpenOrder: (code: string) => void;
}) {
  const { db: pos, addCustomer, upsertOrder } = usePosDB();
  const [q, setQ] = useState("");
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAddr, setNewAddr] = useState("");

  const filtered = useMemo(
    () =>
      pos.customers.filter(
        (c) => !q || c.name.includes(q) || c.address.includes(q),
      ),
    [pos.customers, q],
  );

  function openFor(c: { id: string; name: string; address: string }) {
    const code = `T-${c.id.slice(0, 6)}-${Date.now().toString(36)}`;
    upsertOrder({
      tableCode: code,
      zone: "takeaway",
      items: [],
      state: "active",
      discountPct: 0,
      taxPct: 0,
      customerName: c.name,
      customerAddress: c.address,
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
            placeholder="بحث عن عميل بالاسم..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pe-10 h-10"
          />
        </div>
        <Button onClick={() => setAdding(true)} className="gap-2">
          <UserPlus className="w-4 h-4" /> إضافة عميل
        </Button>
      </div>
      <div className="flex-1 overflow-auto bg-card border border-border rounded-xl">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-xs sticky top-0">
            <tr>
              <th className="text-right p-3">الاسم</th>
              <th className="text-right p-3">العنوان</th>
              <th className="text-right p-3">عدد مرات الطلب</th>
              <th className="text-right p-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="p-8 text-center text-muted-foreground"
                >
                  لا يوجد عملاء — أضف عميل للبدء.
                </td>
              </tr>
            ) : (
              filtered.map((c) => (
                <tr
                  key={c.id}
                  onDoubleClick={() => openFor(c)}
                  className="border-t border-border hover:bg-secondary/40 cursor-pointer"
                >
                  <td className="p-3 font-medium">{c.name}</td>
                  <td className="p-3 text-muted-foreground flex items-center gap-1">
                    <Phone className="w-3 h-3" /> {c.address}
                  </td>
                  <td className="p-3 font-bold">{c.orderCount}</td>
                  <td className="p-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openFor(c)}
                    >
                      فتح طلب
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground shrink-0">
        انقر نقرة مزدوجة على عميل لفتح طلب تيك أواي مباشرة (بدون ضريبة).
      </p>

      {adding && (
        <Dialog open onOpenChange={(o) => !o && setAdding(false)}>
          <DialogContent dir="rtl" className="max-w-md">
            <DialogHeader>
              <DialogTitle>إضافة عميل</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-xs">الاسم الكامل</label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs">العنوان</label>
                <Input
                  value={newAddr}
                  onChange={(e) => setNewAddr(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setAdding(false)}>
                إلغاء
              </Button>
              <Button
                onClick={() => {
                  if (!newName.trim() || !newAddr.trim())
                    return toast.error("الاسم والعنوان مطلوبان");
                  addCustomer(newName, newAddr);
                  setAdding(false);
                  setNewName("");
                  setNewAddr("");
                  toast.success("تم إضافة العميل");
                }}
              >
                حفظ
              </Button>
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
    };
    upsertOrder({ ...order, items: [...order.items, line], state: "active" });
  }
  const getMaxQty = (meal: any, db: any) => {
    // 1. حدد القسم اللي الوجبة دي بتطلع منه (مثلاً "بار")
    const department = meal.department;

    // 2. احسب لكل مكون أقصى كمية نقدر ننتجها
    const limits = meal.ingredients.map((ing: any) => {
      // نجيب الرصيد من الـ deptStock
      // المفتاح في الـ deptStock عبارة عن "القسم::الـ ID بتاع المكون"
      const stockKey = `${department}::${ing.itemId}`;
      const availableStock = db.deptStock[stockKey] || 0; // الرصيد المتاح بالكيلو

      // نحول الرصيد لـ "جرام" عشان نقسمه على الكمية المطلوبة بالجرام
      // (الرصيد بالكيلو * 1000) / الكمية المطلوبة بالجرام
      return Math.floor((availableStock * 1000) / ing.qty);
    });

    // 3. أقل رقم هو ده اللي يحدد أقصى عدد وجبات نقدر نطلعه
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
  async function handleSaveAndDeduct() {
    const updatedDeptStock = { ...db.deptStock };
    const outOfStockMeals: string[] = [];

    // 1. جلب نسخة الأوردر القديم من قاعدة البيانات قبل التعديل
    const oldOrder = db.orders?.find(
      (o: Record<string, unknown>) => o.tableCode === order.tableCode,
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
          ing.unit,
          it.unit,
          conversion,
          it.subUnitType,
        );

        const totalDiffNeeded = needBasePerOne * diffQty;
        const currentStock = updatedDeptStock[key] || 0;

        // أمان: لو الكاشير بيزود طلب والمخزن مش مكفي
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

    // 4. الرد الحاسم لو فيه عجز
    if (outOfStockMeals.length > 0) {
      alert(
        `🚨 خطأ في المخزن: الأصناف [ ${outOfStockMeals.join(", ")} ] كميتها لا تكفي الزيادة الحالية!`,
      );
      return;
    }

    // 5. التثبيت النهائي في الداتابيز وقفل الشاشة
    if (db.updateDeptStock) {
      await db.updateDeptStock(updatedDeptStock);
    }

    // 5. التثبيت النهائي في الداتابيز وقفل الشاشة
    if (db.updateDeptStock) {
      await db.updateDeptStock(updatedDeptStock);
    }

    // ==========================================
    // السر كله هنا: الكاشير السريع للتيك أواي
    // ==========================================
    if (order.zone === "takeaway") {
      // لو السلة فاضية اقفل الأوردر وامسحه بلاش فواتير صفرية
      if (order.items.length === 0) {
        clearOrder(tableCode);
        onClose();
        return;
      }

      // 1. خصم المكونات من المخزن
      deductInventoryFinal();

      // 2. إنشاء الفاتورة
      const inv: Invoice = {
        id: crypto.randomUUID(),
        invoiceNumber: getNextInvoiceNumber(pos.invoices), // <--- ضيف السطر ده هنا
        type: "takeaway",
        tableCode: undefined,
        zone: undefined,
        customerName: order.customerName,
        customerAddress: order.customerAddress,
        cashierId: pos.shift?.cashierId,
        cashierName: pos.shift?.cashierName,
        items: order.items,
        subtotal: totals.subtotal,
        discountPct: order.discountPct,
        discountValue: totals.discountValue,
        taxPct: order.taxPct,
        taxValue: totals.taxValue,
        total: totals.total,
        createdAt: Date.now(),
      };

      addInvoice(inv);

      // 3. تزويد عداد طلبات العميل
      if (order.customerName) {
        const c = pos.customers.find((c) => c.name === order.customerName);
        if (c) incCustomerOrders(c.id);
      }

      // 4. مسح الأوردر من الشاشة المعلقة
      clearOrder(tableCode);
      toast.success("تم إنهاء الطلب وتحويله لفاتورة بنجاح!");
      onClose();
    } else {
      // ==========================================
      // لوجيك الصالة العادي (حفظ الطاولة مفتوحة)
      // ==========================================
      upsertOrder({ ...order, state: "active" });
      onClose();
    }
  } // دي قفلة دالة handleSaveAndDeduct
  function onPickMeal(meal: Meal) {
    if (meal.hasModifiers && (meal.modifierGroups?.length || 0) > 0) {
      setModifierMeal(meal);
    } else {
      addLine(meal);
    }
  }
  // onClose();
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
                      <div className="flex items-center justify-between mt-1">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => changeQty(l.id, l.qty - 1)}
                            className="w-6 h-6 rounded bg-secondary"
                          >
                            -
                          </button>
                          {order.items.map((item) => {
                            // 1. هات الوجبة الأصلية عشان نعرف مكوناتها
                            const meal = db.meals.find(
                              (m) => m.id === item.mealId,
                            );
                            const maxQty = meal ? getMaxQty(meal, db) : 999;
                            return (
                              <input
                                type="number"
                                value={item.qty}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  handleQtyChange(val, maxQty, item.id);
                                  const clampedValue = Math.min(val, maxQty);
                                  changeQty(item.id, clampedValue);
                                }}
                              />
                            );
                          })}
                          <button
                            onClick={() => changeQty(l.id, l.qty + 1)}
                            className="w-6 h-6 rounded bg-secondary"
                          >
                            +
                          </button>
                        </div>
                        <div className="font-bold">{fmt2(lineTotal)}</div>
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
                onClick={handleSaveAndDeduct}
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

  // 1. توليد قائمة ثابتة بكل الطاولات من 1 إلى 70 (بدلاً من الاعتماد على الأوردرات)
  const allTables = useMemo(() => {
    const cTables = Array.from({ length: 70 }, (_, i) => `C${i + 1}`);
    const oTables = Array.from({ length: 70 }, (_, i) => `O${i + 1}`);
    return [...cTables, ...oTables];
  }, []);

  // فلترة الطاولات بناءً على البحث
  const filteredTables = allTables.filter((t) =>
    t.toLowerCase().includes(search.toLowerCase()),
  );

  const src = from ? pos.orders[from.trim()] : null;

  function doTransfer() {
    if (!from.trim() || !to.trim()) return toast.error("أدخل الطاولتين");

    const itemsToMove = Object.entries(picks).map(([id, qty]) => ({ id, qty }));
    if (itemsToMove.length === 0) return toast.error("اختر أصنافاً للنقل");

    // نحدد الزون بناءً على كود الطاولة (C غالباً كافيه، O غالباً أوردرات خارجية أو شيء آخر)
    // يمكنك تعديل هذا المنطق ليناسب مشروعك
    const targetZone = to.startsWith("C") ? "dining" : "takeaway";

    const r = transferItems(
      from.trim(),
      to.trim(),
      itemsToMove,
      targetZone as any,
    );
    if (!r.ok) return toast.error(r.error);

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
          {/* اختيار الطاولة المنقول منها */}
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

          {/* اختيار الطاولة المنقول إليها (نظام بحث احترافي) */}
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
    // نضمن حفظ الخصم قبل الطباعة
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
            {/* زرار يظهر لو فيه خصم جديد محتاج تأكيد */}
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
            // السر هنا: بنحفظ الخصم الجديد في الداتا بيز فوراً بمجرد نجاح الـ PIN
            upsertOrder({ ...order, discountPct: pendingDiscount });
            toast.success("تم تطبيق الخصم وحفظه في الطلب بنجاح");
          }
          setPinOpen(false);
          setPendingDiscount(null);
        }}
      />
    </>
  );
}

/* ---------------- Checkout (two-step) ---------------- */
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
  // تم استبدال addSaleLine بالدالة الصحيحة addSale
  const { db, deductSubStock, addSale } = useDB();
  const { db: pos, addInvoice, incCustomerOrders } = usePosDB();
  const [confirmed, setConfirmed] = useState(false);

  // السحب المباشر والأمن من الـ Store بناءً على اقتراحك لتجنب ضياع الخصم
  const currentOrder = pos.orders[tableCode] || order;

  // الحسابات المحدثة مبنية كلياً على الـ currentOrder المحفوظ بالخصم بتاعه
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

  function finalize() {
    deductInventory();

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

    const inv: Invoice = {
      id: crypto.randomUUID(),
      invoiceNumber: getNextInvoiceNumber(pos.invoices),
      type: isTakeaway ? "takeaway" : "dinein",
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
      total: totals.total,
      createdAt: Date.now(),
    };

    // 1. الحفظ في جدول الفواتير العادية (الكاشير)
    addInvoice(inv);

    // 2. 🔥 الترحيل التلقائي إلى مبيعات الـ cost-control بالتجميع حسب القسم
    const salesByDept: Record<string, { mealId: string; qty: number }[]> = {};

    for (const line of currentOrder.items) {
      const meal = db.meals.find((m) => m.id === line.mealId);
      if (!meal) continue;
      const dept = meal.department; // مثل "مطبخ" أو "بار"

      if (!salesByDept[dept]) {
        salesByDept[dept] = [];
      }

      // إذا تكرر نفس الصنف في الطلب يتم دمج الكميات معاً
      const existingLine = salesByDept[dept].find(
        (l) => l.mealId === line.mealId,
      );
      if (existingLine) {
        existingLine.qty += line.qty;
      } else {
        salesByDept[dept].push({
          mealId: line.mealId,
          qty: line.qty,
        });
      }
    }

    // ترحيل المبيعات لكل قسم مسجل في الفاتورة الحالية بتوقيت اليوم الحالي YYYY-MM-DD
    const todayStr = new Date().toISOString().slice(0, 10);
    for (const [deptName, deptLines] of Object.entries(salesByDept)) {
      if (deptLines.length > 0) {
        addSale(todayStr, deptName as SubDept, deptLines);
      }
    }

    if (isTakeaway && currentOrder.customerName) {
      const c = pos.customers.find((c) => c.name === currentOrder.customerName);
      if (c) incCustomerOrders(c.id);
    }

    toast.success("تم إنهاء الطلب وترحيله للمبيعات والمخازن بنجاح");
    onDone();
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
