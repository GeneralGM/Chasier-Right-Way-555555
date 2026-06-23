/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useDB } from "@/lib/store";
import { usePosDB } from "@/lib/pos-store.ts";
import { fmt2, clamp0 } from "@/lib/format";
import { SHISHA_CATEGORY } from "@/lib/store";
import { Button } from "@/components/ui/button";
import {
  DollarSign,
  ChefHat,
  Wine,
  Cloud,
  ShoppingBag,
  Percent,
  Receipt,
  Minus,
  Wallet,
  Printer,
  LogOut,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [{ title: "التقارير - تقفيل الشيفت" }] }),
  component: ReportsPage,
});

type Range = "today" | "week";

function ReportsPage() {
  const { db } = useDB();
  const { db: pos, closeShift } = usePosDB();
  const [range, setRange] = useState<Range>("today");

  const fromTs = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    if (range === "week") d.setDate(d.getDate() - 6);
    return d.getTime();
  }, [range]);

  const invoices = pos.invoices.filter((i) => i.createdAt >= fromTs);

  const stats = useMemo(() => {
    let kitchen = 0,
      bar = 0,
      shisha = 0,
      takeaway = 0;
    let subtotal = 0,
      discount = 0,
      tax = 0,
      total = 0;

    for (const inv of invoices) {
      subtotal += inv.subtotal;
      discount += inv.discountValue;
      tax += inv.taxValue;
      total += inv.total;

      if (inv.type === "takeaway") {
        takeaway += inv.total;
        continue;
      }

      for (const line of inv.items) {
        const meal = db.meals.find((m) => m.id === line.mealId);
        if (!meal) continue;

        const extras = line.extras.reduce((s, e) => s + e.price, 0);
        const v = (line.unitPrice + extras) * line.qty;

        // --- التعديل هنا: تصحيح المنطق ---
        // بنشوف الـ category بتاع الوجبة ونقارنه بـ SHISHA_CATEGORY
        // إذا كان يساويه، نضيف للشيشة
        const isShisha =
          meal.department === "شيشه" ||
          (meal.category || "").trim().replace("ة", "ه") === "شيشه";

        if (isShisha) {
          shisha += v;
        } else if (meal.department === "بار") {
          bar += v;
        } else {
          kitchen += v;
        }
        if (line.mealId) {
          const meal = db.meals.find((m) => m.id === line.mealId);
          if (meal) {
            console.log(
              `الوجبة: ${meal.name} | التصنيف في الداتابيز: "${meal.category}" | المطلوب: "${SHISHA_CATEGORY}"`,
            );
          }
        }
      }
    }

    return {
      kitchen: clamp0(kitchen),
      bar: clamp0(bar),
      shisha: clamp0(shisha),
      takeaway: clamp0(takeaway),
      subtotal: clamp0(subtotal),
      discount: clamp0(discount),
      tax: clamp0(tax),
      total: clamp0(total),
      revenues: clamp0(kitchen + bar + shisha + takeaway),
    };
  }, [invoices, db.meals]);

  function closeShiftAndLogout() {
    window.print();
    closeShift();
    toast.success("تم تقفيل الشيفت — الطاولات النشطة محفوظة للشيفت القادم");
  }

  return (
    <div dir="rtl" className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2 no-print">
        <div>
          <h1 className="text-2xl font-bold">التقارير</h1>
          <p className="text-sm text-muted-foreground">
            تقفيلة الشيفت اليومية ومتابعة المبيعات.
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex bg-secondary rounded-lg p-1">
            {(["today", "week"] as Range[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`px-3 h-8 rounded-md text-sm ${range === r ? "bg-card shadow-sm" : "text-muted-foreground"}`}
              >
                {r === "today" ? "اليوم" : "هذا الأسبوع"}
              </button>
            ))}
          </div>
          {pos.shift && (
            <Button
              onDoubleClick={closeShiftAndLogout}
              variant="destructive"
              className="gap-2"
            >
              <Printer className="w-4 h-4" /> 'طباعة وتقفيل الشيفت'{" "}
              <LogOut className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card
          icon={DollarSign}
          label="الإيرادات"
          value={stats.revenues}
          accent="emerald"
        />
        <Card
          icon={ChefHat}
          label="المطبخ"
          value={stats.kitchen}
          accent="orange"
        />
        <Card icon={Wine} label="البار" value={stats.bar} accent="rose" />
        <Card
          icon={Cloud}
          label="الشيشة"
          value={stats.shisha}
          accent="purple"
        />
        <Card
          icon={ShoppingBag}
          label="التيك أواي"
          value={stats.takeaway}
          accent="sky"
        />
        <Card
          icon={Percent}
          label="القيمة المضافة (14%)"
          value={stats.tax}
          accent="indigo"
        />
        <Card
          icon={Receipt}
          label="المجموع الكلي"
          value={stats.subtotal}
          accent="slate"
        />
        <Card
          icon={Minus}
          label="الخصم"
          value={stats.discount}
          accent="amber"
        />
      </div>

      <div className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground rounded-2xl p-6 shadow-lg">
        <div className="flex items-center gap-3">
          <Wallet className="w-10 h-10 opacity-80" />
          <div className="flex-1">
            <p className="text-sm opacity-80">
              التوتال النهائي (Net Cash in Drawer)
            </p>
            <p className="text-4xl font-bold mt-1">
              {fmt2(stats.total)}{" "}
              <span className="text-lg font-normal opacity-80">ج.م</span>
            </p>
          </div>
          <div className="text-sm opacity-80 text-end">
            <div>{invoices.length} فاتورة</div>
            {pos.shift && <div>الكاشير: {pos.shift.cashierName}</div>}
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-3 border-b border-border bg-secondary/40 text-sm font-medium">
          آخر الفواتير
        </div>
        <table className="w-full text-sm">
          <thead className="bg-secondary/20 text-xs">
            <tr>
              <th className="text-right p-2">الوقت</th>
              <th className="text-right p-2">النوع</th>
              <th className="text-right p-2">طاولة/عميل</th>
              <th className="text-right p-2">الأصناف</th>
              <th className="text-right p-2">الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            {invoices.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="p-6 text-center text-muted-foreground"
                >
                  لا توجد فواتير في هذه الفترة.
                </td>
              </tr>
            ) : (
              invoices.slice(0, 20).map((inv) => (
                <tr key={inv.id} className="border-t border-border">
                  <td className="p-2 text-xs text-muted-foreground">
                    {new Date(inv.createdAt).toLocaleTimeString("ar-EG")}
                  </td>
                  <td className="p-2">
                    {inv.type === "takeaway" ? "تيك أواي" : "صالة"}
                  </td>
                  <td className="p-2 font-mono">
                    {inv.tableCode || inv.customerName}
                  </td>
                  <td className="p-2">{inv.items.length}</td>
                  <td className="p-2 font-bold">{fmt2(inv.total)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Card({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: any;
  label: string;
  value: number;
  accent: string;
}) {
  const colors: Record<string, string> = {
    emerald:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
    orange:
      "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300",
    rose: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
    purple:
      "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300",
    sky: "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300",
    indigo:
      "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300",
    slate:
      "bg-slate-50 text-slate-700 dark:bg-slate-950/40 dark:text-slate-300",
    amber:
      "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  };
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div
        className={`w-10 h-10 rounded-lg grid place-items-center ${colors[accent]}`}
      >
        <Icon className="w-5 h-5" />
      </div>
      <p className="text-xs text-muted-foreground mt-2">{label}</p>
      <p className="text-xl font-bold mt-1">
        {fmt2(value)}{" "}
        <span className="text-xs font-normal text-muted-foreground">ج.م</span>
      </p>
    </div>
  );
}
