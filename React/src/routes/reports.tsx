/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react"; // 👈 شلنا الـ useState لأننا مش محتاجين range
import { useDB } from "@/lib/store";
import { usePosDB } from "@/lib/pos-store.ts";
import { fmt2, clamp0 } from "@/lib/format";
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
  Bike,
} from "lucide-react";
// شلنا الـ toast لو مش مستخدمة تحت

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [{ title: "التقارير - تقفيل الشيفت" }] }),
  component: ReportsPage,
});

function ReportsPage() {
  const { db } = useDB();
  const { db: pos, closeShift } = usePosDB();

  // 🌟 تعديل الفلترة لتعرض مبيعات الجهاز الحالي فقط (سواء Main أو Sub-1)
  const currentShiftInvoices = useMemo(() => {
    if (!pos.shift) return [];

    // معرفة جهاز الكاشير الحالي
    const isSecCashier = localStorage.getItem("isSecCashierDevice") === "true";
    const currentTerminalId = isSecCashier ? "Sub-1" : "Main";

    return pos.invoices.filter(
      (inv) =>
        inv.createdAt >= pos.shift!.openedAt &&
        (inv.terminalId === currentTerminalId ||
          inv.terminal_id === currentTerminalId),
    );
  }, [pos.invoices, pos.shift]);

  // 🌟 الحل السحري 2: الحسابات بتتم على فواتير الشيفت الحالي فقط
  const stats = useMemo(() => {
    let kitchen = 0,
      bar = 0,
      shisha = 0;
    let takeawayOnly = 0,
      deliveryOnly = 0,
      deliveryFeesOnly = 0;
    let subtotal = 0,
      discount = 0,
      tax = 0;

    for (const inv of currentShiftInvoices) {
      subtotal += inv.subtotal;
      discount += inv.discountValue;
      tax += inv.taxValue;

      const deliveryFee =
        Number(inv.deliveryPrice) || Number((inv as any).delivery_price) || 0;

      deliveryFeesOnly += deliveryFee;

      if (inv.type === "takeaway") {
        takeawayOnly += inv.total - deliveryFee;
      } else if (inv.type === "delivery") {
        deliveryOnly += inv.total - deliveryFee;
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

    const finalNetCash = kitchen + bar + shisha + tax - discount;

    return {
      kitchen: clamp0(kitchen),
      bar: clamp0(bar),
      shisha: clamp0(shisha),
      takeaway: clamp0(takeawayOnly),
      deliveryTotal: clamp0(deliveryOnly),
      deliveryFees: clamp0(deliveryFeesOnly),
      subtotal: clamp0(subtotal),
      discount: clamp0(discount),
      tax: clamp0(tax),
      total: clamp0(finalNetCash),
      revenues: clamp0(finalNetCash),
    };
  }, [currentShiftInvoices, db.meals]); // 👈 ربطنا الـ useMemo بالـ currentShiftInvoices

  async function closeShiftAndLogout() {
    // 1. طلب الفلوس الفعلية من الكاشير
    const userCashInput = prompt(
      "برجاء إدخال مبلغ الكاش الفعلي الموجود بالدرج حالياً لتسوية العهدة:",
    );
    if (userCashInput === null) return; // المستخدم داس Cancel
    const actualCash = Number(userCashInput) || 0;

    // 2. إرسال البيانات المجمعة زي ما إنت كنت عامل بالظبط، بس ضفنا الفلوس الفعلية ورقم الجهاز
    const isSecCashier = localStorage.getItem("isSecCashierDevice") === "true";
    const currentTerminalId = isSecCashier ? "Sub-1" : "Main";

    const responseData = await closeShift({
      kitchenSales: stats.kitchen,
      barSales: stats.bar,
      shishaSales: stats.shisha,
      taxValue: stats.tax,
      discountValue: stats.discount,
      dineinSales: stats.revenues - stats.takeaway - stats.deliveryTotal,
      takeawaySales: stats.takeaway,
      deliverySales: stats.deliveryTotal,
      terminalId: currentTerminalId, // 🌟 بنبعت الجهاز الحالي
      actualCash: actualCash, // 🌟 بنبعت الفلوس اللي في الدرج
    });

    if (responseData) {
      // 3. طباعة بون الـ Z-Report اللي راجع من الداتابيز
      if (responseData.auditReport) {
        printZReport(
          responseData.auditReport,
          pos.shift?.cashierName || "كاشير",
          currentTerminalId,
        );
      } else {
        window.print(); // لو التقرير مارجعش، اطبع الصفحة العادية زي ما كنت بتعمل
      }

      setTimeout(() => {
        window.location.reload();
      }, 1500);
    }
  }

  // 🌟 دالة طباعة البون المخصصة للتقفيل (Z-Report) نضيفها جوه الكومبوننت أو براه
  const printZReport = (
    report: any,
    cashierName: string,
    terminalId: string,
  ) => {
    const variance = report.variance;
    let varianceStatus = "متطابق 🟢";
    if (variance < 0) varianceStatus = `عجز: ${Math.abs(variance)} ج.م 🔴`;
    else if (variance > 0) varianceStatus = `زيادة: ${variance} ج.م 🔵`;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <html dir="rtl">
        <head>
          <title>تقرير تقفيل وردية</title>
          <style>
            body { font-family: 'Courier New', Courier, monospace; text-align: center; padding: 10px; width: 280px; margin: 0 auto; font-size: 13px; }
            .title { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
            .divider { border-top: 1px dashed #000; margin: 8px 0; }
            .row { display: flex; justify-content: space-between; margin: 4px 0; }
            .bold { font-weight: bold; }
            .status { font-size: 14px; margin-top: 8px; background: #eee; padding: 5px; font-weight: bold; border: 1px solid #ccc; }
          </style>
        </head>
        <body>
          <div class="title">مجمع المول - Z Report</div>
          <div>جهاز: ${terminalId}</div>
          <div>الكاشير: ${cashierName}</div>
          <div>التاريخ: ${new Date().toLocaleDateString("ar-EG")}</div>
          <div>الوقت: ${new Date().toLocaleTimeString("ar-EG")}</div>
          
          <div class="divider"></div>
          
          <div class="row bold"><span>نوع المبيعات</span><span>المبلغ</span></div>
          <div class="divider"></div>
          <div class="row"><span>صالة</span><span>${report.dineinTotal} ج</span></div>
          <div class="row"><span>تيك أواي</span><span>${report.takeawayTotal} ج</span></div>
          <div class="row"><span>دليفري</span><span>${report.deliveryTotal} ج</span></div>
          
          <div class="divider"></div>
          
          <div class="row bold"><span>إجمالي السيستم:</span><span>${report.databaseTotalSales} ج</span></div>
          <div class="row bold"><span>الكاش بالدرج:</span><span>${report.actualCashReceived} ج</span></div>
          
          <div class="status">التسوية: ${varianceStatus}</div>
          
          <div class="divider"></div>
          <p style="font-size: 11px;">تم الجرد آلياً من قاعدة البيانات للجهاز الحالي فقط</p>
          
          <script>window.onload = function() { window.print(); window.close(); };</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div dir="rtl" className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2 no-print">
        <div>
          <h1 className="text-2xl font-bold">إيراد الشيفت الحالي</h1>
          <p className="text-sm text-muted-foreground">
            {pos.shift
              ? `مفتوح بواسطة: ${pos.shift.cashierName}`
              : "لا يوجد شيفت مفتوح"}
          </p>
        </div>
        <div className="flex gap-2">
          {/* 👈 شلنا زراير اليوم والأسبوع لأنها بتلخبط منطق الشيفتات */}
          {pos.shift && (
            <Button
              onDoubleClick={closeShiftAndLogout}
              variant="destructive"
              className="gap-2"
            >
              <Printer className="w-4 h-4" /> طباعة وتقفيل الشيفت{" "}
              <LogOut className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {/* الكروت زي ما هي بالضبط بتعرض الداتا الصح دلوقتي */}
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
          label="التيك أواي (إحصائية)"
          value={stats.takeaway}
          accent="sky"
        />
        <Card
          icon={Bike}
          label="أوردر التوصيل (إحصائية)"
          value={stats.deliveryTotal}
          accent="orange"
        />
        <Card
          icon={DollarSign}
          label="رسوم التوصيل"
          value={stats.deliveryFees}
          accent="emerald"
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
              التوتال النهائي للشيفت (Net Cash in Drawer)
            </p>
            <p className="text-4xl font-bold mt-1">
              {fmt2(stats.total)}{" "}
              <span className="text-lg font-normal opacity-80">ج.م</span>
            </p>
          </div>
          <div className="text-sm opacity-80 text-end">
            <div>{currentShiftInvoices.length} فاتورة</div>{" "}
            {/* 👈 بنعد فواتير الشيفت بس */}
            {pos.shift && <div>الكاشير: {pos.shift.cashierName}</div>}
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-3 border-b border-border bg-secondary/40 text-sm font-medium">
          فواتير الشيفت الحالي
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
            {currentShiftInvoices.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="p-6 text-center text-muted-foreground"
                >
                  لا توجد فواتير في هذا الشيفت.
                </td>
              </tr>
            ) : (
              // 🌟 الحل السحري 3: الجدول بيعرض فواتير الشيفت الحالي فقط!
              currentShiftInvoices.slice(0, 50).map((inv) => (
                <tr key={inv.id} className="border-t border-border">
                  <td className="p-2 text-xs text-muted-foreground">
                    {new Date(inv.createdAt).toLocaleTimeString("ar-EG")}
                  </td>
                  <td className="p-2">
                    {inv.type === "delivery" ? (
                      <span className="text-amber-600 font-medium">
                        توصيل 🛵
                      </span>
                    ) : inv.type === "takeaway" ? (
                      <span className="text-green-600 font-medium">
                        تيك أواي 🛍️
                      </span>
                    ) : (
                      <span className="text-blue-600 font-medium">صالة 🍽️</span>
                    )}
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

// دالة Card ثابتة زي ما هي متعدلش فيها حاجة
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
