/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react"; // 👈 شلنا الـ useState لأننا مش محتاجين range
import { useDB } from "@/lib/store";
import { usePosDB } from "@/lib/pos-store.ts";
import { fmt2, clamp0, round2 } from "@/lib/format";
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
import { toast } from "sonner";
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

  // 🌟 الحسابات الذكية بناءً على الفواتير المكتملة والمظبوطة
  const stats = useMemo(() => {
    let kitchen = 0,
      bar = 0,
      shisha = 0;
    let takeawayOnly = 0,
      deliveryOnly = 0,
      deliveryFeesOnly = 0;
    let subtotal = 0,
      discount = 0,
      tax = 0; // 👈 هتمثل القيمة المضافة/الخدمة (14%)

    for (const inv of currentShiftInvoices) {
      subtotal += inv.subtotal;
      discount += inv.discountValue;

      // نعتمد على القيمة المحسوبة والمحفوظة في الفاتورة (عشان منكررش الحساب)
      tax += inv.taxValue || 0;

      const deliveryFee =
        Number(inv.deliveryPrice) || Number((inv as any).delivery_price) || 0;
      deliveryFeesOnly += deliveryFee;

      // 🌟 تجميع الإحصائيات حسب نوع الأوردر (للعرض فقط وليس للتجميع النهائي)
      if (inv.type === "takeaway") {
        takeawayOnly += inv.total - deliveryFee;
      } else if (inv.type === "delivery") {
        deliveryOnly += inv.total - deliveryFee;
      }

      // تجميع مبيعات الأقسام من الأصناف
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

    // 🌟 المعادلة النهائية المظبوطة: بدون إضافة رسوم التوصيل للدرج
    const finalNetCash = kitchen + bar + shisha + tax - discount;

    return {
      kitchen: clamp0(kitchen),
      bar: clamp0(bar),
      shisha: clamp0(shisha),
      takeaway: clamp0(takeawayOnly), // إحصائية للعرض بس
      deliveryTotal: clamp0(deliveryOnly), // إحصائية للعرض بس
      deliveryFees: clamp0(deliveryFeesOnly), // إحصائية للعرض بس
      subtotal: clamp0(subtotal),
      discount: clamp0(discount),
      tax: clamp0(tax),
      total: clamp0(finalNetCash),
      revenues: clamp0(finalNetCash),
    };
  }, [currentShiftInvoices, db.meals]);
  // 🌟 دالة طباعة تقرير الوردية بدون تقفيل (X-Report)
  const printCurrentReport = () => {
    if (!pos.shift) {
      toast.error("لا يوجد وردية مفتوحة للطباعة");
      return;
    }

    const printWindow = window.open("", "_blank", "width=600,height=800");
    if (!printWindow) {
      toast.error("يرجى السماح بالنوافذ المنبثقة (Pop-ups) للطباعة");
      return;
    }

    // 💡 تجهيز المتغيرات للطباعة من الـ stats
    const shiftOpenTime = new Date(pos.shift.openedAt).toLocaleString("ar-EG");
    const shiftCloseTime = new Date().toLocaleString("ar-EG"); // الوقت الحالي لأن الشيفت لسه مفتوح
    const cashierName = pos.shift.cashierName;

    // حسابات الأقسام
    const totalDineIn = stats.revenues - stats.takeaway - stats.deliveryTotal; // الصالة بس
    const totalBar = stats.bar;
    const totalShisha = stats.shisha;
    const totalTakeaway = stats.takeaway;
    const totalDelivery = stats.deliveryTotal;

    const totalHospitality = 0; // لو عندك ضيافة مستقبلا
    const totalTax = stats.tax;
    const totalDiscount = stats.discount;
    const netSales = stats.revenues;
    const totalDeliveryFee = stats.deliveryFees; // رسوم التوصيل والخدمة

    // طرق الدفع (مؤقتاً بنعتبر كله كاش لحد ما تفصلهم في السيستم)
    const cashTotal = stats.total;
    const visaTotal = 0;
    const expectedDrawer = stats.total;

    const htmlContent = `
      <html dir="rtl">
        <head>
          <title>تقرير الوردية</title>
          <style>
            @page { margin: 0; size: auto; }
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              width: 100%;
              max-width: 80mm;
              margin: 0 auto;
              padding: 10px 5px;
              color: #000;
              background: #fff;
              font-size: 13px;
              line-height: 1.5;
              box-sizing: border-box;
            }
            h2 { text-align: center; margin: 0 0 10px 0; font-size: 18px; font-weight: bold; text-decoration: underline; }
            .header-box {
              border: 1.5px solid #000;
              padding: 6px;
              margin-bottom: 12px;
              font-size: 12px;
              font-weight: bold;
            }
            .header-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 4px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 12px;
              font-size: 13px;
            }
            th, td {
              border: 1.5px solid #000;
              padding: 5px;
            }
            td:first-child { width: 65%; font-weight: bold; }
            td:last-child { width: 35%; text-align: center; font-family: monospace; font-size: 14px;}
            .table-header {
              text-align: center !important;
              background-color: #f0f0f0 !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              font-weight: bold;
              font-size: 14px;
            }
            .bold { font-weight: bold; }
          </style>
        </head>
        <body onload="setTimeout(() => { window.print(); window.close(); }, 500);">
          
          <h2>تقرير وردية (مؤقت)</h2>
          
          <div class="header-box">
            <div class="header-row">
              <span>من:</span>
              <span dir="ltr">${shiftOpenTime}</span>
            </div>
            <div class="header-row">
              <span>إلى:</span>
              <span dir="ltr">${shiftCloseTime}</span>
            </div>
            <div class="header-row">
              <span>الكاشير:</span>
              <span>${cashierName || "غير معروف"}</span>
            </div> 
          </div>
            
          <table>
            <tr><td colspan="2" class="table-header">تفاصيل المبيعات</td></tr>
            <tr><td>صالة</td><td class="bold">${totalDineIn.toFixed(2)}</td></tr>
            <tr><td>بار</td><td class="bold">${totalBar.toFixed(2)}</td></tr>
            <tr><td>شيشة</td><td class="bold">${totalShisha.toFixed(2)}</td></tr>
            <tr><td>ضيافة</td><td class="bold">${totalHospitality.toFixed(2)}</td></tr>
            <tr><td>إجمالي الضريبة</td><td class="bold">${totalTax.toFixed(2)}</td></tr>
            <tr><td>تيك اواي</td><td class="bold">${totalTakeaway.toFixed(2)}</td></tr>
            <tr><td>دليفري</td><td class="bold">${totalDelivery.toFixed(2)}</td></tr>
            <tr><td>إجمالي الخصم</td><td class="bold">${totalDiscount.toFixed(2)}</td></tr>
            <tr><td>إجمالي الإيرادات</td><td class="bold">${netSales.toFixed(2)}</td></tr>
            <tr><td>إجمالي الخدمة/التوصيل</td><td class="bold">${totalDeliveryFee.toFixed(2)}</td></tr>
          </table>

          <table>
            <tr><td colspan="2" class="table-header">طرق الدفع</td></tr>
            <tr><td>نقدي</td><td class="bold">${cashTotal.toFixed(2)}</td></tr>
            <tr><td>فيزا</td><td class="bold">${visaTotal.toFixed(2)}</td></tr>
          </table>

          <table>
            <tr><td>الرصيد النهائي بالدرج</td><td class="bold">${expectedDrawer.toFixed(2)}</td></tr>
          </table>

        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  async function closeShiftAndLogout() {
    // 1. طلب الفلوس الفعلية من الكاشير لعد الخزنة
    const userCashInput = prompt(
      "برجاء إدخال مبلغ الكاش الفعلي الموجود بالدرج حالياً لتسوية العهدة:",
    );
    if (userCashInput === null) return;
    const actualCash = Number(userCashInput) || 0;

    const isSecCashier = localStorage.getItem("isSecCashierDevice") === "true";
    const currentTerminalId = isSecCashier ? "Sub-1" : "Main";

    // 2. إرسال البيانات للسيرفر
    const responseData = await closeShift({
      kitchenSales: stats.kitchen,
      barSales: stats.bar,
      shishaSales: stats.shisha,
      taxValue: stats.tax,
      discountValue: stats.discount,
      dineinSales: stats.revenues - stats.takeaway - stats.deliveryTotal,
      takeawaySales: stats.takeaway,
      deliverySales: stats.deliveryTotal,
      terminalId: currentTerminalId,
      actualCash: actualCash,
    } as any);

    if (responseData) {
      // 3. طباعة بون حراري Z-Report بالتصميم الجديد المدمج
      if (responseData.auditReport) {
        const report = responseData.auditReport;
        const variance = report.variance;
        let varianceStatus = "متطابق 🟢";
        if (variance < 0) varianceStatus = `عجز: ${Math.abs(variance)} ج.م 🔴`;
        else if (variance > 0) varianceStatus = `زيادة: ${variance} ج.م 🔵`;

        // تجهيز متغيرات الأقسام للطباعة
        const totalDineIn =
          stats.revenues - stats.takeaway - stats.deliveryTotal;
        const totalBar = stats.bar;
        const totalShisha = stats.shisha;
        const totalTakeaway = stats.takeaway;
        const totalDelivery = stats.deliveryTotal;
        const totalTax = stats.tax;
        const totalDiscount = stats.discount;
        const netSales = stats.revenues;
        const totalDeliveryFee = stats.deliveryFees;
        const shiftOpenTime = new Date(pos.shift!.openedAt).toLocaleString(
          "ar-EG",
        );
        const shiftCloseTime = new Date().toLocaleString("ar-EG");

        const printWindow = window.open("", "_blank", "width=600,height=800");
        if (printWindow) {
          printWindow.document.write(`
            <html dir="rtl">
              <head>
                <title>تقرير تقفيل وردية نهائي</title>
                <style>
                  @page { margin: 0; size: auto; }
                  body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    width: 100%;
                    max-width: 80mm;
                    margin: 0 auto;
                    padding: 10px 5px;
                    color: #000;
                    background: #fff;
                    font-size: 13px;
                    line-height: 1.5;
                    box-sizing: border-box;
                  }
                  h2 { text-align: center; margin: 0 0 10px 0; font-size: 18px; font-weight: bold; text-decoration: underline; }
                  .header-box {
                    border: 1.5px solid #000;
                    padding: 6px;
                    margin-bottom: 12px;
                    font-size: 12px;
                    font-weight: bold;
                  }
                  .header-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 4px;
                  }
                  table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 12px;
                    font-size: 13px;
                  }
                  th, td {
                    border: 1.5px solid #000;
                    padding: 5px;
                  }
                  td:first-child { width: 65%; font-weight: bold; }
                  td:last-child { width: 35%; text-align: center; font-family: monospace; font-size: 14px;}
                  .table-header {
                    text-align: center !important;
                    background-color: #f0f0f0 !important;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                    font-weight: bold;
                    font-size: 14px;
                  }
                  .bold { font-weight: bold; }
                  .variance-row td { background-color: #eee; -webkit-print-color-adjust: exact; }
                </style>
              </head>
              <body onload="setTimeout(() => { window.print(); window.close(); }, 500);">
                
                <h2>Z-Report تقرير وردية</h2>
                
                <div class="header-box">
                  <div class="header-row">
                    <span>الجهاز:</span>
                    <span dir="ltr">${currentTerminalId}</span>
                  </div>
                  <div class="header-row">
                    <span>من:</span>
                    <span dir="ltr">${shiftOpenTime}</span>
                  </div>
                  <div class="header-row">
                    <span>إلى:</span>
                    <span dir="ltr">${shiftCloseTime}</span>
                  </div>
                  <div class="header-row">
                    <span>الكاشير:</span>
                    <span>${pos.shift?.cashierName || "غير معروف"}</span>
                  </div> 
                </div>
                  
                <table>
                  <tr><td colspan="2" class="table-header">تفاصيل المبيعات</td></tr>
                  <tr><td>صالة</td><td class="bold">${totalDineIn.toFixed(2)}</td></tr>
                  <tr><td>بار</td><td class="bold">${totalBar.toFixed(2)}</td></tr>
                  <tr><td>شيشة</td><td class="bold">${totalShisha.toFixed(2)}</td></tr>
                  <tr><td>إجمالي الضريبة</td><td class="bold">${totalTax.toFixed(2)}</td></tr>
                  <tr><td>تيك اواي</td><td class="bold">${totalTakeaway.toFixed(2)}</td></tr>
                  <tr><td>دليفري</td><td class="bold">${totalDelivery.toFixed(2)}</td></tr>
                  <tr><td>إجمالي الخصم</td><td class="bold">${totalDiscount.toFixed(2)}</td></tr>
                  <tr><td>إجمالي الإيرادات</td><td class="bold">${netSales.toFixed(2)}</td></tr>
                  <tr><td>إجمالي الخدمة / التوصيل</td><td class="bold">${totalDeliveryFee.toFixed(2)}</td></tr>
                </table>

                <table>
                  <tr><td colspan="2" class="table-header">طرق الدفع</td></tr>
                  <tr><td>نقدي (المدخل فعلياً)</td><td class="bold">${report.actualCashReceived.toFixed(2)}</td></tr>
                  <tr><td>فيزا</td><td class="bold">0.00</td></tr>
                </table>

                <table>
                  <tr><td colspan="2" class="table-header">تسوية العهدة (الجرد)</td></tr>
                  <tr><td>إجمالي السيستم المطلوب</td><td class="bold">${report.databaseTotalSales.toFixed(2)}</td></tr>
                  <tr><td>الكاش الفعلي بالدرج</td><td class="bold">${report.actualCashReceived.toFixed(2)}</td></tr>
                  <tr class="variance-row"><td>نتيجة الجرد</td><td class="bold" style="font-size: 12px;">${varianceStatus}</td></tr>
                </table>

              </body>
            </html>
          `);
          printWindow.document.close();
        }
      } else {
        window.print();
      }

      setTimeout(() => {
        window.location.reload();
      }, 1500);
    }
  }

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
