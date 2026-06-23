/* eslint-disable @typescript-eslint/no-explicit-any */

import { createFileRoute } from "@tanstack/react-router";

import { useMemo, useState } from "react";

import { usePosDB, type Invoice, type ShiftState } from "@/lib/pos-store";

import { useDB, SHISHA_CATEGORY } from "@/lib/store";

import { fmt2, clamp0 } from "@/lib/format";

import { Input } from "@/components/ui/input";

import { Button } from "@/components/ui/button";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

import {
  Settings as SettingsIcon,
  Search,
  Receipt,
  Clock,
  Download,
  Printer,
  Info,
  DollarSign,
  ChefHat,
  Wine,
  Cloud,
  ShoppingBag,
  Percent,
  Minus,
  Wallet,
} from "lucide-react";

import * as XLSX from "xlsx";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "الإعدادات - أرشيف الفواتير" }] }),

  component: SettingsPage,
});

type Tab = "invoices" | "shifts";

type InvTab = "takeaway" | "dinein";

type Range = "today" | "week" | "all";

const printInvoice = (invoice: Invoice) => {
  const printWindow = window.open("", "_blank", "width=400,height=600");

  if (!printWindow) return;

  printWindow.document.write(`

    <html dir="rtl">

      <head>

        <title>فاتورة رقم ${invoice.invoiceNumber || "..."}</title>

        <style>

          body {

            width: 75mm;

            margin: 0 auto;

            padding: 5px;

            font-family: 'Tahoma', sans-serif;

            font-size: 12px;

          }

          .header { text-align: center; margin-bottom: 10px; border-bottom: 1px solid #000; padding-bottom: 5px; }

          .header h2 { margin: 0; font-size: 16px; }

          table { width: 100%; border-collapse: collapse; margin-top: 10px; }

          th, td { border-bottom: 1px dashed #ccc; padding: 5px 0; text-align: right; }

          .total { font-weight: bold; font-size: 16px; margin-top: 15px; text-align: center; border-top: 2px solid black; padding-top: 5px;}

          .footer { text-align: center; margin-top: 20px; font-size: 10px; }

        </style>

      </head>

      <body>

        <div class="header">

          <h2>اسم المحل بتاعك</h2>

          <p>فاتورة رقم: <strong>${invoice.invoiceNumber || "---"}</strong></p>

          <p>${new Date(invoice.createdAt).toLocaleString("ar-EG")}</p>

        </div>

        <table>

          <thead>

            <tr><th>الصنف</th><th>الكمية</th><th>السعر</th></tr>

          </thead>

          <tbody>

            ${invoice.items

              .map(
                (item) => `

              <tr>

                <td>${item.name}</td>

                <td>${item.qty}</td>

                <td>${item.unitPrice}</td>

              </tr>

            `,
              )

              .join("")}

          </tbody>

        </table>

        <div class="total">الإجمالي: ${invoice.total} جنيه</div>

        <div class="footer">شكراً لزيارتكم!</div>

      </body>

    </html>

  `);

  printWindow.document.close();

  setTimeout(() => {
    printWindow.print();

    printWindow.close();
  }, 500);
};

function SettingsPage() {
  const [tab, setTab] = useState<Tab>("invoices");

  return (
    <div dir="rtl" className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <SettingsIcon className="w-6 h-6" /> الإعدادات
        </h1>

        <p className="text-sm text-muted-foreground">
          أرشيف الفواتير وإعدادات النظام.
        </p>
      </div>

      <div className="flex gap-1 bg-secondary p-1 rounded-lg w-fit">
        <button
          onClick={() => setTab("invoices")}
          className={`px-4 h-9 rounded-md text-sm font-medium flex items-center gap-2 ${tab === "invoices" ? "bg-card shadow-sm" : "text-muted-foreground"}`}
        >
          <Receipt className="w-4 h-4" /> الفواتير
        </button>

        <button
          onClick={() => setTab("shifts")}
          className={`px-4 h-9 rounded-md text-sm font-medium flex items-center gap-2 ${tab === "shifts" ? "bg-card shadow-sm" : "text-muted-foreground"}`}
        >
          <Clock className="w-4 h-4" /> الشيفتات
        </button>
      </div>

      {tab === "invoices" && <InvoicesTab />}

      {tab === "shifts" && <ShiftsTab />}
    </div>
  );
}

/* =================================================================== */

/* INVOICES TAB + EXCEL EXPORT                                        */

/* =================================================================== */

function InvoicesTab() {
  const { db: pos } = usePosDB();

  const [sub, setSub] = useState<InvTab>("takeaway");

  const [range, setRange] = useState<Range>("today");

  const [q, setQ] = useState("");

  const fromTs = useMemo(() => {
    if (range === "all") return 0;

    const d = new Date();

    d.setHours(0, 0, 0, 0);

    if (range === "week") d.setDate(d.getDate() - 6);

    return d.getTime();
  }, [range]);

  const rows: Invoice[] = useMemo(() => {
    return pos.invoices.filter((i) => {
      if (i.type !== sub) return false;

      if (i.createdAt < fromTs) return false;

      if (q) {
        const hay =
          `${i.tableCode || ""} ${i.customerName || ""} ${i.customerAddress || ""}`.toLowerCase();

        if (!hay.includes(q.toLowerCase())) return false;
      }

      return true;
    });
  }, [pos.invoices, sub, fromTs, q]);

  function exportToExcel() {
    const data = rows.map((inv) => {
      const shift = pos.shifts.find(
        (s) =>
          inv.createdAt >= s.openedAt &&
          (!s.closedAt || inv.createdAt <= s.closedAt),
      );

      const soldItems = inv.items.map((i) => `${i.name}×${i.qty}`).join(" , ");

      return {
        "الأصناف المباعة": soldItems,

        الشيفت: shift
          ? `${shift.cashierName} (${new Date(shift.openedAt).toLocaleDateString("ar-EG")})`
          : "—",

        التاريخ: new Date(inv.createdAt).toLocaleString("ar-EG"),

        "رقم الطاولة": inv.tableCode || "تيك أواي",
      };
    });

    const ws = XLSX.utils.json_to_sheet(data);

    ws["!cols"] = [{ wch: 60 }, { wch: 30 }, { wch: 25 }, { wch: 15 }];

    ws["!dir"] = "rtl";

    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, ws, "الفواتير");

    const fileName = `فواتير_${sub}_${new Date().toISOString().slice(0, 10)}.xlsx`;

    XLSX.writeFile(wb, fileName);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex bg-secondary rounded-lg p-1">
          {(["takeaway", "dinein"] as InvTab[]).map((t) => (
            <button
              key={t}
              onClick={() => setSub(t)}
              className={`px-3 h-8 rounded-md text-sm ${sub === t ? "bg-card shadow-sm" : "text-muted-foreground"}`}
            >
              {t === "takeaway" ? "تيك أواي" : "زبون (صالة)"}
            </button>
          ))}
        </div>

        <div className="flex bg-secondary rounded-lg p-1">
          {(["today", "week", "all"] as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 h-8 rounded-md text-sm ${range === r ? "bg-card shadow-sm" : "text-muted-foreground"}`}
            >
              {r === "today" ? "اليوم" : r === "week" ? "هذا الأسبوع" : "الكل"}
            </button>
          ))}
        </div>

        <div className="relative flex-1 min-w-48">
          <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />

          <Input
            dir="rtl"
            placeholder="ابحث برقم الطاولة أو اسم العميل..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pe-10"
          />
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={exportToExcel}
          className="gap-2"
        >
          <Download className="w-4 h-4" /> تصدير Excel
        </Button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-xs">
            <tr>
              <th className="text-right p-3">رقم الفاتورة</th>

              <th className="text-right p-3">التاريخ</th>

              <th className="text-right p-3">
                {sub === "takeaway" ? "العميل / العنوان" : "الطاولة"}
              </th>

              <th className="text-right p-3">الكاشير</th>

              <th className="text-right p-3">الأصناف</th>

              <th className="text-right p-3">المجموع</th>

              <th className="text-right p-3">الخصم</th>

              <th className="text-right p-3">الضريبة</th>

              <th className="text-right p-3">الإجمالي</th>

              <th className="text-right p-3">طباعة</th>
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="p-8 text-center text-muted-foreground"
                >
                  لا توجد فواتير مطابقة.
                </td>
              </tr>
            ) : (
              rows.map((inv) => (
                <tr key={inv.id} className="border-t border-border">
                  <td className="p-3 font-mono text-xs">
                    {inv.invoiceNumber || "-"}
                  </td>

                  <td className="p-3 text-xs">
                    {new Date(inv.createdAt).toLocaleString("ar-EG")}
                  </td>

                  <td className="p-3">
                    {sub === "takeaway" ? (
                      <div>
                        <div className="font-medium">{inv.customerName}</div>

                        <div className="text-xs text-muted-foreground">
                          {inv.customerAddress}
                        </div>
                      </div>
                    ) : (
                      <span className="font-mono font-bold">
                        {inv.tableCode}
                      </span>
                    )}
                  </td>

                  <td className="p-3 text-muted-foreground">
                    {inv.cashierName || "—"}
                  </td>

                  <td className="p-3">{inv.items.length}</td>

                  <td className="p-3">{fmt2(inv.subtotal)}</td>

                  <td className="p-3">
                    {Math.floor(+fmt2(inv.discountPct))}% &asymp;&nbsp;
                    {fmt2(inv.discountValue)}
                  </td>

                  <td className="p-3">{fmt2(inv.taxValue)}</td>

                  <td className="p-3 font-bold">{fmt2(inv.total)}</td>

                  <td className="p-3 font-bold">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => printInvoice(inv)} // الدالة اللي هنعرفها تحت
                      className="gap-2"
                    >
                      <Printer className="w-4 h-4" />
                      طباعة
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* =================================================================== */

/* SHIFTS TAB (ADVANCED REPORTS UI)                                   */

/* =================================================================== */

interface ShiftReport {
  shift: ShiftState;

  invoiceCount: number;

  kitchen: number;

  bar: number;

  shisha: number;

  takeaway: number;

  subtotal: number;

  discount: number;

  tax: number;

  total: number;

  revenues: number;
}

function ShiftsTab() {
  const { db: pos } = usePosDB();

  const { db } = useDB();

  const [detailShift, setDetailShift] = useState<ShiftReport | null>(null);

  const shiftsWithData: ShiftReport[] = useMemo(() => {
    return pos.shifts.map((shift) => {
      const shiftInvoices = pos.invoices.filter((inv) => {
        if (inv.createdAt < shift.openedAt) return false;

        if (shift.closedAt && inv.createdAt > shift.closedAt) return false;

        return true;
      });

      let kitchen = 0,
        bar = 0,
        shisha = 0,
        takeaway = 0;

      let subtotal = 0,
        discount = 0,
        tax = 0,
        total = 0;

      for (const inv of shiftInvoices) {
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

          const isShisha =
            meal.department === "شيشه" ||
            (meal.category || "").trim().replace("ة", "ه") === "شيشه";

          if (isShisha) shisha += v;
          else if (meal.department === "بار") bar += v;
          else kitchen += v;
        }
      }

      return {
        shift,

        invoiceCount: shiftInvoices.length,

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
    });
  }, [pos.shifts, pos.invoices, db.meals]);

  function printShift(report: ShiftReport) {
    const w = window.open("", "_blank");

    if (!w) return;

    w.document.write(`

      <html dir="rtl">

      <head>

        <title>تقرير الشيفت - ${report.shift.cashierName}</title>

        <style>

          body { font-family: Arial, sans-serif; padding: 20px; }

          h1 { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; }

          table { width: 100%; border-collapse: collapse; margin-top: 20px; }

          th, td { border: 1px solid #ccc; padding: 10px; text-align: right; }

          th { background: #f5f5f5; }

          .total { font-weight: bold; font-size: 1.2em; background: #e0ffe0; }

          .footer { margin-top: 30px; text-align: center; font-size: 0.9em; color: #666; }

        </style>

      </head>

      <body>

        <h1>تقرير الشيفت</h1>

        <table>

          <tr><th colspan="2">معلومات الشيفت الأساسية</th></tr>

          <tr><td>الكاشير</td><td>${report.shift.cashierName}</td></tr>

          <tr><td>تاريخ البدء</td><td>${new Date(report.shift.openedAt).toLocaleString("ar-EG")}</td></tr>

          <tr><td>تاريخ الإغلاق</td><td>${report.shift.closedAt ? new Date(report.shift.closedAt).toLocaleString("ar-EG") : "—"}</td></tr>

          <tr><td>إجمالي عدد الفواتير</td><td>${report.invoiceCount} فاتورة</td></tr>

        </table>

       

        <table>

          <tr><th colspan="2">التفاصيل المالية والمبيعات</th></tr>

          <tr><td>الإيرادات الأساسية</td><td>${fmt2(report.revenues)} ج.م</td></tr>

          <tr><td>مبيعات المطبخ</td><td>${fmt2(report.kitchen)} ج.م</td></tr>

          <tr><td>مبيعات البار</td><td>${fmt2(report.bar)} ج.م</td></tr>

          <tr><td>مبيعات الشيشة</td><td>${fmt2(report.shisha)} ج.م</td></tr>

          <tr><td>مبيعات التيك أواي</td><td>${fmt2(report.takeaway)} ج.م</td></tr>

        </table>



        <table>

          <tr><th colspan="2">الحسابات الختامية</th></tr>

          <tr><td>إجمالي المبيعات</td><td>${fmt2(report.subtotal)} ج.م</td></tr>

          <tr><td>الخصومات</td><td>- ${fmt2(report.discount)} ج.م</td></tr>

          <tr><td>القيمة المضافة (14%)</td><td>+ ${fmt2(report.tax)} ج.م</td></tr>

          <tr class="total"><td>التوتال النهائي (Net Cash)</td><td>${fmt2(report.total)} ج.م</td></tr>

        </table>

        <div class="footer">طُبع بواسطة نظام نقطة البيع بتاريخ: ${new Date().toLocaleString("ar-EG")}</div>

      </body>

      </html>

    `);

    w.document.close();

    w.print();
  }

  return (
    <div className="space-y-3">
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-xs">
            <tr>
              <th className="text-right p-3">تاريخ ووقت الشيفت</th>

              <th className="text-right p-3">الكاشير</th>

              <th className="text-right p-3">عدد الفواتير</th>

              <th className="text-right p-3">التوتال النهائي (Net Cash)</th>

              <th className="text-right p-3">الإجراءات</th>
            </tr>
          </thead>

          <tbody>
            {shiftsWithData.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="p-8 text-center text-muted-foreground"
                >
                  لا توجد شيفتات مسجلة.
                </td>
              </tr>
            ) : (
              shiftsWithData.map((report, idx) => (
                <tr key={idx} className="border-t border-border">
                  <td className="p-3 text-xs">
                    <div>
                      {new Date(report.shift.openedAt).toLocaleString("ar-EG")}
                    </div>

                    <div className="text-muted-foreground">
                      إلى:{" "}
                      {report.shift.closedAt
                        ? new Date(report.shift.closedAt).toLocaleTimeString(
                            "ar-EG",
                          )
                        : "الآن"}
                    </div>
                  </td>

                  <td className="p-3 font-medium">
                    {report.shift.cashierName}
                  </td>

                  <td className="p-3">{report.invoiceCount}</td>

                  <td className="p-3 font-bold text-emerald-600">
                    {fmt2(report.total)} ج.م
                  </td>

                  <td className="p-3">
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDetailShift(report)}
                      >
                        <Info className="w-3 h-3" />

                        <span className="mr-1">معلومات أخرى</span>
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => printShift(report)}
                      >
                        <Printer className="w-3 h-3" />

                        <span className="mr-1">طباعة التقرير</span>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {detailShift && (
        <Dialog open onOpenChange={() => setDetailShift(null)}>
          <DialogContent dir="rtl" className="max-w-4xl p-6">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-xl mb-4">
                <Info className="w-5 h-5 text-primary" /> تفاصيل شيفت (
                {detailShift.shift.cashierName})
              </DialogTitle>
            </DialogHeader>

            {/* نفس تصميم صفحة التقارير بالظبط */}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card
                icon={DollarSign}
                label="الإيرادات"
                value={detailShift.revenues}
                accent="emerald"
              />

              <Card
                icon={ChefHat}
                label="المطبخ"
                value={detailShift.kitchen}
                accent="orange"
              />

              <Card
                icon={Wine}
                label="البار"
                value={detailShift.bar}
                accent="rose"
              />

              <Card
                icon={Cloud}
                label="الشيشة"
                value={detailShift.shisha}
                accent="purple"
              />

              <Card
                icon={ShoppingBag}
                label="التيك أواي"
                value={detailShift.takeaway}
                accent="sky"
              />

              <Card
                icon={Percent}
                label="القيمة المضافة (14%)"
                value={detailShift.tax}
                accent="indigo"
              />

              <Card
                icon={Receipt}
                label="المجموع الكلي"
                value={detailShift.subtotal}
                accent="slate"
              />

              <Card
                icon={Minus}
                label="الخصم"
                value={detailShift.discount}
                accent="amber"
              />
            </div>

            <div className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground rounded-2xl p-6 shadow-lg mt-4">
              <div className="flex items-center gap-3">
                <Wallet className="w-10 h-10 opacity-80" />

                <div className="flex-1">
                  <p className="text-sm opacity-80">
                    التوتال النهائي (Net Cash in Drawer)
                  </p>

                  <p className="text-4xl font-bold mt-1">
                    {fmt2(detailShift.total)}{" "}
                    <span className="text-lg font-normal opacity-80">ج.م</span>
                  </p>
                </div>

                <div className="text-sm opacity-80 text-end">
                  <div>{detailShift.invoiceCount} فاتورة</div>

                  <div>الكاشير: {detailShift.shift.cashierName}</div>
                </div>
              </div>
            </div>

            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setDetailShift(null)}>
                إغلاق
              </Button>

              <Button onClick={() => printShift(detailShift)} className="gap-2">
                <Printer className="w-4 h-4" /> طباعة هذا التقرير
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// Helper Card Component matching Reports page

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
