/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
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
  Zap,
  Store,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [{ title: "التقارير - تقفيل الشيفت" }] }),
  component: ReportsPage,
});

function ReportsPage() {
  const { db } = useDB();
  const { db: pos, closeShift } = usePosDB();

  // 🌟 فلترة الفواتير لتعرض مبيعات الجهاز الحالي فقط (سواء Main أو Sub-1)
  const currentShiftInvoices = useMemo(() => {
    if (!pos.shift) return [];

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
      tax = 0;

    // متغيرات الأقسام والمنصات
    let fastTotal = 0,
      fastCount = 0,
      totalFastCommission = 0;
    let talabatTotal = 0,
      talabatCount = 0;
    let totalTalabatCommission = 0; // 🌟 إجمالي عمولة طلبات المضافة بالجنيه للشيفت ده

    for (const inv of currentShiftInvoices) {
      subtotal += inv.subtotal;
      discount += inv.discountValue;
      tax += inv.taxValue || 0;

      const deliveryFee =
        Number(inv.deliveryPrice) || Number((inv as any).delivery_price) || 0;
      deliveryFeesOnly += deliveryFee;

      if (inv.type === "takeaway") {
        takeawayOnly += inv.total - deliveryFee;
      } else if (inv.type === "delivery") {
        deliveryOnly += inv.total - deliveryFee;
      }

      // تصنيف المنصات
      const cat = inv.orderCategory || (inv as any).order_category || "normal";
      if (cat === "fast") {
        fastTotal += inv.total;
        fastCount++;
        // 🌟 سحب قيمة النسبة المضافة بالجنيه من الفاتورة مباشرة

        totalFastCommission += Number(
          inv.commissionValue || (inv as any).commission_value || 0,
        );
      } else if (cat === "talabat") {
        talabatTotal += inv.total;
        talabatCount++;
        // 🌟 سحب قيمة النسبة المضافة بالجنيه من الفاتورة مباشرة
        totalTalabatCommission += Number(
          inv.commissionValue || (inv as any).commission_value || 0,
        );
      }

      // تجميع مبيعات الأقسام من الأصناف
      for (const line of inv.items) {
        const extras =
          line.extras?.reduce((s, e) => s + Number(e.price || 0), 0) || 0;
        const v =
          (Number(line.unitPrice || line.price || 0) + extras) *
          Number(line.qty || 1);

        let deptName = line.department || "مطبخ";
        const meal = db.meals.find((m) => m.id === line.mealId);
        if (meal) {
          const isShisha =
            meal.department === "شيشه" ||
            (meal.category || "").trim().replace("ة", "ه") === "شيشه";
          if (isShisha) deptName = "شيشة";
          else if (meal.department) deptName = meal.department;
        }

        if (deptName.includes("شيش")) shisha += v;
        else if (deptName.includes("بار")) bar += v;
        else kitchen += v;
      }
    }

    // 🌟 المعادلة النهائية: الإيراد الأساسي للأقسام + الضريبة والخدمة - الخصم
    // بما إن الـ subtotal والـ total بتوع الفاتورة في pos-store مضاف عليهم العمولة جاهز، فالتوتال النهائي مظبوط
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
      // مبيعات المنصات
      fastTotal: clamp0(fastTotal),
      fastCount,
      fastComission: clamp0(totalFastCommission),
      talabatTotal: clamp0(talabatTotal),
      talabatCount,
      talabatCommission: clamp0(totalTalabatCommission), // 🌟 النسبة المضافة بالجنيه
    };
  }, [currentShiftInvoices, db.meals]);

  async function closeShiftAndLogout() {
    const userCashInput = prompt(
      "برجاء إدخال مبلغ الكاش الفعلي الموجود بالدرج حالياً لتسوية العهدة:",
    );
    if (userCashInput === null) return;
    const actualCash = Number(userCashInput) || 0;

    const isSecCashier = localStorage.getItem("isSecCashierDevice") === "true";
    const currentTerminalId = isSecCashier ? "Sub-1" : "Main";

    // 🌟 إرسال البيانات للسيرفر شاملة نسبة طلبات الكلية
    const responseData = await closeShift({
      kitchenSales: stats.kitchen,
      barSales: stats.bar,
      shishaSales: stats.shisha,
      taxValue: stats.tax,
      discountValue: stats.discount,
      dineinSales: stats.revenues - stats.takeaway - stats.deliveryTotal,
      takeawaySales: stats.takeaway,
      deliverySales: stats.deliveryTotal,
      fastSales: stats.fastTotal,
      talabatSales: stats.talabatTotal,
      talabatCommission: stats.talabatCommission, // 🌟 إرسال النسبة المضافة الكلية للباك إند
      terminalId: currentTerminalId,
      actualCash: actualCash,
    } as any);

    if (responseData) {
      if (responseData.auditReport) {
        const report = responseData.auditReport;
        const variance = report.variance;
        let varianceStatus = "متطابق 🟢";
        if (variance < 0)
          varianceStatus = `عجز: ${Math.abs(variance).toFixed(2)} ج.م 🔴`;
        else if (variance > 0)
          varianceStatus = `زيادة: ${variance.toFixed(2)} ج.م 🔵`;

        const totalDineIn =
          stats.revenues - stats.takeaway - stats.deliveryTotal;
        const kitchenSales = stats.kitchen;
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
                    width: 100%; max-width: 80mm; margin: 0 auto; padding: 10px 5px;
                    color: #000; background: #fff; font-size: 13px; line-height: 1.5; box-sizing: border-box;
                  }
                  h2 { text-align: center; margin: 0 0 10px 0; font-size: 18px; font-weight: bold; text-decoration: underline; }
                  .header-box { border: 1.5px solid #000; padding: 6px; margin-bottom: 12px; font-size: 12px; font-weight: bold; }
                  .header-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
                  table { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 13px; }
                  th, td { border: 1.5px solid #000; padding: 5px; }
                  td:first-child { width: 65%; font-weight: bold; }
                  td:last-child { width: 35%; text-align: center; font-family: monospace; font-size: 14px;}
                  .table-header { text-align: center !important; background-color: #f0f0f0 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; font-weight: bold; font-size: 14px; }
                  .bold { font-weight: bold; }
                  .variance-row td { background-color: #eee; -webkit-print-color-adjust: exact; }
                </style>
              </head>
              <body onload="setTimeout(() => { window.print(); window.close(); }, 500);">
                
                <h2>Z-Report تقرير وردية</h2>
                
                <div class="header-box">
                  <div class="header-row"><span>الجهاز:</span><span dir="ltr">${currentTerminalId}</span></div>
                  <div class="header-row"><span>من:</span><span dir="ltr">${shiftOpenTime}</span></div>
                  <div class="header-row"><span>إلى:</span><span dir="ltr">${shiftCloseTime}</span></div>
                  <div class="header-row"><span>الكاشير:</span><span>${pos.shift?.cashierName || "غير معروف"}</span></div> 
                </div>
                  
                <table>
                  <tr><td colspan="2" class="table-header">تفاصيل المبيعات</td></tr>
                  <tr><td>المطبخ</td><td class="bold">${kitchenSales.toFixed(2)}</td></tr>
                  <tr><td>بار</td><td class="bold">${totalBar.toFixed(2)}</td></tr>
                  <tr><td>شيشة</td><td class="bold">${totalShisha.toFixed(2)}</td></tr>
                </table>
                  
                <table>
                  <tr><td colspan="2" class="table-header">توزيع الطلبات والمنصات</td></tr>
                  <tr><td>تيك اواي</td><td class="bold">${totalTakeaway.toFixed(2)}</td></tr>
                  <tr><td>دليفري</td><td class="bold">${totalDelivery.toFixed(2)}</td></tr>
                  <tr><td>فاست فود (مبيعات)</td><td class="bold">${stats.fastTotal.toFixed(2)}</td></tr>
                  <tr><td>طلبات Talabat (مبيعات)</td><td class="bold">${stats.talabatTotal.toFixed(2)}</td></tr>
                  <tr style="background-color: #fdf2f8;"><td>إجمالي نسبة طلبات المضافة (+15%)</td><td class="bold" style="color: #db2777;">${stats.talabatCommission.toFixed(2)}</td></tr>
                  <tr><td>إجمالي الخدمة / التوصيل</td><td class="bold">${totalDeliveryFee.toFixed(2)}</td></tr>
                </table>
                  
                <table>
                  <tr><td colspan="2" class="table-header">المجموع النهائي</td></tr>
                  <tr><td>إجمالي الضريبة</td><td class="bold">${totalTax.toFixed(2)}</td></tr>
                  <tr><td>إجمالي الخصم</td><td class="bold">${totalDiscount.toFixed(2)}</td></tr>
                  <tr><td>إجمالي الإيرادات (شامل النسبة)</td><td class="bold">${netSales.toFixed(2)}</td></tr>
                </table>

                <table>
                  <tr><td colspan="2" class="table-header">طرق الدفع</td></tr>
                  <tr><td>نقدي (المدخل فعلياً)</td><td class="bold">${report.actualCashReceived.toFixed(2)}</td></tr>
                  <tr><td>فيزا / منصات</td><td class="bold">0.00</td></tr>
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

      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
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

        <CardWithCommission
          icon={Zap}
          label="فاست(Fast)"
          value={stats.fastTotal}
          commission={stats.fastComission}
          count={stats.fastCount}
          accent="amber"
        />
        {/* 🌟 كارت طلبات المطور: يعرض إجمالي مبيعات طلبات + بادج إجمالي النسبة المضافة بالجنيه (+15%) */}
        <CardWithCommission
          icon={Store}
          label="طلبات (Talabat)"
          value={stats.talabatTotal}
          commission={stats.talabatCommission}
          count={stats.talabatCount}
          accent="orange"
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
          icon={DollarSign}
          label="الإيرادات"
          value={stats.revenues}
          accent="emerald"
        />
        <Card
          icon={Percent}
          label="القيمة المضافة (14%)"
          value={stats.tax}
          accent="indigo"
        />
        <Card
          icon={Minus}
          label="الخصم"
          value={stats.discount}
          accent="amber"
        />
        <Card
          icon={Receipt}
          label="المجموع الكلي"
          value={stats.subtotal}
          accent="slate"
        />
      </div>

      {/* 🌟 البوكس الكبير للتقفيلة الكلية: مضاف جواه نسبة طلبات جاهز لأن التوتال معتمد على حسابات السيرفر الفردية */}
      <div className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground rounded-2xl p-6 shadow-lg">
        <div className="flex items-center gap-3">
          <Wallet className="w-10 h-10 opacity-80" />
          <div className="flex-1">
            <p className="text-sm opacity-80">
              التوتال النهائي للشيفت (شامل إجمالي نسبة طلبات المضافة)
            </p>
            <p className="text-4xl font-bold mt-1">
              {fmt2(stats.total)}{" "}
              <span className="text-lg font-normal opacity-80">ج.م</span>
            </p>
          </div>
          <div className="text-sm opacity-80 text-end">
            <div>{currentShiftInvoices.length} فاتورة</div>
            <div className="text-xs text-emerald-300 font-bold mt-1">
              مضاف عوائد طلبات: +{fmt2(stats.talabatCommission)} ج.م
            </div>
            {pos.shift && (
              <div className="mt-1">الكاشير: {pos.shift.cashierName}</div>
            )}
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
              <th className="text-right p-2">النوع / المنصة</th>
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
              currentShiftInvoices.slice(0, 50).map((inv) => {
                const cat =
                  inv.orderCategory || (inv as any).order_category || "normal";
                return (
                  <tr key={inv.id} className="border-t border-border">
                    <td className="p-2 text-xs text-muted-foreground">
                      {new Date(inv.createdAt).toLocaleTimeString("ar-EG")}
                    </td>
                    <td className="p-2">
                      {cat === "fast" ? (
                        <span className="text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded text-xs border border-amber-200">
                          ⚡ فاست فود
                        </span>
                      ) : cat === "talabat" ? (
                        <span className="text-pink-600 font-bold bg-pink-50 px-2 py-0.5 rounded text-xs border border-pink-200">
                          🛍️ طلبات (+15%)
                        </span>
                      ) : inv.type === "delivery" ? (
                        <span className="text-amber-600 font-medium">
                          توصيل 🛵
                        </span>
                      ) : inv.type === "takeaway" ? (
                        <span className="text-green-600 font-medium">
                          تيك أواي 🛍️
                        </span>
                      ) : (
                        <span className="text-blue-600 font-medium">
                          صالة 🍽️
                        </span>
                      )}
                    </td>
                    <td className="p-2 font-mono">
                      {inv.tableCode || inv.customerName}
                    </td>
                    <td className="p-2">{inv.items.length}</td>
                    <td className="p-2 font-bold">{fmt2(inv.total)}</td>
                  </tr>
                );
              })
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
    <div className="bg-card border border-border rounded-xl p-4 flex flex-col justify-between">
      <div
        className={`w-10 h-10 rounded-lg grid place-items-center ${colors[accent]}`}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground mt-2">{label}</p>
        <p className="text-xl font-bold mt-1">
          {fmt2(value)}{" "}
          <span className="text-xs font-normal text-muted-foreground">ج.م</span>
        </p>
      </div>
    </div>
  );
}

// 🌟 الكومبوننت الجديد الخاص بـ طلبات: بيعرض إجمالي الفلوس + بادج النسبة المضافة الكلية بالجنيه
function CardWithCommission({
  icon: Icon,
  label,
  value,
  commission,
  count,
  accent,
}: {
  icon: any;
  label: string;
  value: number;
  commission: number;
  count: number;
  accent: string;
}) {
  const colors: Record<string, string> = {
    orange:
      "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300",
  };
  return (
    <div className="bg-card border-1 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden">
      <div className="flex justify-between items-start">
        <div
          className={`w-10 h-10 rounded-lg grid place-items-center ${colors[accent] || colors.orange}`}
        >
          <Icon className="w-5 h-5" />
        </div>
        {/* بادج يعرض النسبة المضافة بالجنيه مباشرة لطلبك */}
        <span className="text-[11px] font-extrabold bg-pink-50 text-pink-700 px-2 py-1 rounded-md border border-pink-200">
          {fmt2(commission)}
        </span>
      </div>
      <div className="mt-2">
        <div className="flex justify-between items-baseline">
          <p className="text-xs font-bold text-foreground">{label}</p>
          <span className="text-[10px] text-muted-foreground">
            ({count} أوردر)
          </span>
        </div>
        <p className="text-xl font-black mt-1 text-primary">
          {fmt2(value)}{" "}
          <span className="text-xs font-normal text-muted-foreground">ج.م</span>
        </p>
      </div>
    </div>
  );
}
