import { jsxs, jsx } from "react/jsx-runtime";
import { useMemo } from "react";
import { u as useDB, c as clamp0, B as Button, f as fmt2 } from "./router-DvcG6CTK.js";
import { u as usePosDB } from "./pos-store-Drg8tCrh.js";
import { Printer, LogOut, ChefHat, Wine, Cloud, ShoppingBag, Zap, Store, Bike, DollarSign, Percent, Minus, Receipt, Wallet } from "lucide-react";
import "@tanstack/react-query";
import "@tanstack/react-router";
import "@radix-ui/react-dialog";
import "clsx";
import "tailwind-merge";
import "sonner";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "js-sha256";
function ReportsPage() {
  const {
    db
  } = useDB();
  const {
    db: pos,
    closeShift
  } = usePosDB();
  const currentShiftInvoices = useMemo(() => {
    if (!pos.shift) return [];
    const isSecCashier = localStorage.getItem("isSecCashierDevice") === "true";
    const currentTerminalId = isSecCashier ? "Sub-1" : "Main";
    return pos.invoices.filter((inv) => inv.createdAt >= pos.shift.openedAt && (inv.terminalId === currentTerminalId || inv.terminal_id === currentTerminalId));
  }, [pos.invoices, pos.shift]);
  const stats = useMemo(() => {
    let kitchen = 0, bar = 0, shisha = 0;
    let takeawayOnly = 0, deliveryOnly = 0, deliveryFeesOnly = 0;
    let subtotal = 0, discount = 0, tax = 0;
    let fastTotal = 0, fastCount = 0, totalFastCommission = 0;
    let talabatTotal = 0, talabatCount = 0;
    let totalTalabatCommission = 0;
    for (const inv of currentShiftInvoices) {
      subtotal += inv.subtotal;
      discount += inv.discountValue;
      tax += inv.taxValue || 0;
      const deliveryFee = Number(inv.deliveryPrice) || Number(inv.delivery_price) || 0;
      deliveryFeesOnly += deliveryFee;
      if (inv.type === "takeaway") {
        takeawayOnly += inv.total - deliveryFee;
      } else if (inv.type === "delivery") {
        deliveryOnly += inv.total - deliveryFee;
      }
      const cat = inv.orderCategory || inv.order_category || "normal";
      if (cat === "fast") {
        fastTotal += inv.total;
        fastCount++;
        totalFastCommission += Number(inv.commissionValue || inv.commission_value || 0);
      } else if (cat === "talabat") {
        talabatTotal += inv.total;
        talabatCount++;
        totalTalabatCommission += Number(inv.commissionValue || inv.commission_value || 0);
      }
      for (const line of inv.items) {
        const extras = line.extras?.reduce((s, e) => s + Number(e.price || 0), 0) || 0;
        const v = (Number(line.unitPrice || line.price || 0) + extras) * Number(line.qty || 1);
        let deptName = line.department || "مطبخ";
        const meal = db.meals.find((m) => m.id === line.mealId);
        if (meal) {
          const isShisha = meal.department === "شيشه" || (meal.category || "").trim().replace("ة", "ه") === "شيشه";
          if (isShisha) deptName = "شيشة";
          else if (meal.department) deptName = meal.department;
        }
        if (deptName.includes("شيش")) shisha += v;
        else if (deptName.includes("بار")) bar += v;
        else kitchen += v;
      }
    }
    const finalNetCash = kitchen + bar + totalTalabatCommission + shisha + tax - discount;
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
      talabatCommission: clamp0(totalTalabatCommission)
      // 🌟 النسبة المضافة بالجنيه
    };
  }, [currentShiftInvoices, db.meals]);
  async function closeShiftAndLogout() {
    const userCashInput = prompt("برجاء إدخال مبلغ الكاش الفعلي الموجود بالدرج حالياً لتسوية العهدة:");
    if (userCashInput === null) return;
    const actualCash = Number(userCashInput) || 0;
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
      fastSales: stats.fastTotal,
      talabatSales: stats.talabatTotal,
      talabatCommission: stats.talabatCommission,
      // 🌟 إرسال النسبة المضافة الكلية للباك إند
      terminalId: currentTerminalId,
      actualCash
    });
    if (responseData) {
      if (responseData.auditReport) {
        const report = responseData.auditReport;
        const variance = report.variance;
        let varianceStatus = "متطابق 🟢";
        if (variance < 0) varianceStatus = `عجز: ${Math.abs(variance).toFixed(2)} ج.م 🔴`;
        else if (variance > 0) varianceStatus = `زيادة: ${variance.toFixed(2)} ج.م 🔵`;
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
        const shiftOpenTime = new Date(pos.shift.openedAt).toLocaleString("ar-EG");
        const shiftCloseTime = (/* @__PURE__ */ new Date()).toLocaleString("ar-EG");
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
  return /* @__PURE__ */ jsxs("div", { dir: "rtl", className: "space-y-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between flex-wrap gap-2 no-print", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold", children: "إيراد الشيفت الحالي" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: pos.shift ? `مفتوح بواسطة: ${pos.shift.cashierName}` : "لا يوجد شيفت مفتوح" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex gap-2", children: pos.shift && /* @__PURE__ */ jsxs(Button, { onDoubleClick: closeShiftAndLogout, variant: "destructive", className: "gap-2", children: [
        /* @__PURE__ */ jsx(Printer, { className: "w-4 h-4" }),
        " طباعة وتقفيل الشيفت",
        " ",
        /* @__PURE__ */ jsx(LogOut, { className: "w-4 h-4" })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 md:grid-cols-6 gap-3", children: [
      /* @__PURE__ */ jsx(Card, { icon: ChefHat, label: "المطبخ", value: stats.kitchen, accent: "orange" }),
      /* @__PURE__ */ jsx(Card, { icon: Wine, label: "البار", value: stats.bar, accent: "rose" }),
      /* @__PURE__ */ jsx(Card, { icon: Cloud, label: "الشيشة", value: stats.shisha, accent: "purple" }),
      /* @__PURE__ */ jsx(Card, { icon: ShoppingBag, label: "التيك أواي (إحصائية)", value: stats.takeaway, accent: "sky" }),
      /* @__PURE__ */ jsx(CardWithCommission, { icon: Zap, label: "فاست(Fast)", value: stats.fastTotal, commission: stats.fastComission, count: stats.fastCount, accent: "amber" }),
      /* @__PURE__ */ jsx(CardWithCommission, { icon: Store, label: "طلبات (Talabat)", value: stats.talabatTotal, commission: stats.talabatCommission, count: stats.talabatCount, accent: "orange" }),
      /* @__PURE__ */ jsx(Card, { icon: Bike, label: "أوردر التوصيل (إحصائية)", value: stats.deliveryTotal, accent: "orange" }),
      /* @__PURE__ */ jsx(Card, { icon: DollarSign, label: "رسوم التوصيل", value: stats.deliveryFees, accent: "emerald" }),
      /* @__PURE__ */ jsx(Card, { icon: DollarSign, label: "الإيرادات", value: stats.revenues, accent: "emerald" }),
      /* @__PURE__ */ jsx(Card, { icon: Percent, label: "القيمة المضافة (14%)", value: stats.tax, accent: "indigo" }),
      /* @__PURE__ */ jsx(Card, { icon: Minus, label: "الخصم", value: stats.discount, accent: "amber" }),
      /* @__PURE__ */ jsx(Card, { icon: Receipt, label: "المجموع الكلي", value: stats.subtotal, accent: "slate" })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "bg-gradient-to-br from-primary to-primary/70 text-primary-foreground rounded-2xl p-6 shadow-lg", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
      /* @__PURE__ */ jsx(Wallet, { className: "w-10 h-10 opacity-80" }),
      /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm opacity-80", children: "التوتال النهائي للشيفت (شامل إجمالي نسبة طلبات المضافة)" }),
        /* @__PURE__ */ jsxs("p", { className: "text-4xl font-bold mt-1", children: [
          fmt2(stats.total),
          " ",
          /* @__PURE__ */ jsx("span", { className: "text-lg font-normal opacity-80", children: "ج.م" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "text-sm opacity-80 text-end", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          currentShiftInvoices.length,
          " فاتورة"
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "text-xs text-emerald-300 font-bold mt-1", children: [
          "مضاف عوائد طلبات: +",
          fmt2(stats.talabatCommission),
          " ج.م"
        ] }),
        pos.shift && /* @__PURE__ */ jsxs("div", { className: "mt-1", children: [
          "الكاشير: ",
          pos.shift.cashierName
        ] })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "bg-card border border-border rounded-xl overflow-hidden", children: [
      /* @__PURE__ */ jsx("div", { className: "p-3 border-b border-border bg-secondary/40 text-sm font-medium", children: "فواتير الشيفت الحالي" }),
      /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
        /* @__PURE__ */ jsx("thead", { className: "bg-secondary/20 text-xs", children: /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("th", { className: "text-right p-2", children: "الوقت" }),
          /* @__PURE__ */ jsx("th", { className: "text-right p-2", children: "النوع / المنصة" }),
          /* @__PURE__ */ jsx("th", { className: "text-right p-2", children: "طاولة/عميل" }),
          /* @__PURE__ */ jsx("th", { className: "text-right p-2", children: "الأصناف" }),
          /* @__PURE__ */ jsx("th", { className: "text-right p-2", children: "الإجمالي" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { children: currentShiftInvoices.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 5, className: "p-6 text-center text-muted-foreground", children: "لا توجد فواتير في هذا الشيفت." }) }) : currentShiftInvoices.slice(0, 50).map((inv) => {
          const cat = inv.orderCategory || inv.order_category || "normal";
          return /* @__PURE__ */ jsxs("tr", { className: "border-t border-border", children: [
            /* @__PURE__ */ jsx("td", { className: "p-2 text-xs text-muted-foreground", children: new Date(inv.createdAt).toLocaleTimeString("ar-EG") }),
            /* @__PURE__ */ jsx("td", { className: "p-2", children: cat === "fast" ? /* @__PURE__ */ jsx("span", { className: "text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded text-xs border border-amber-200", children: "⚡ فاست فود" }) : cat === "talabat" ? /* @__PURE__ */ jsx("span", { className: "text-pink-600 font-bold bg-pink-50 px-2 py-0.5 rounded text-xs border border-pink-200", children: "🛍️ طلبات (+15%)" }) : inv.type === "delivery" ? /* @__PURE__ */ jsx("span", { className: "text-amber-600 font-medium", children: "توصيل 🛵" }) : inv.type === "takeaway" ? /* @__PURE__ */ jsx("span", { className: "text-green-600 font-medium", children: "تيك أواي 🛍️" }) : /* @__PURE__ */ jsx("span", { className: "text-blue-600 font-medium", children: "صالة 🍽️" }) }),
            /* @__PURE__ */ jsx("td", { className: "p-2 font-mono", children: inv.tableCode || inv.customerName }),
            /* @__PURE__ */ jsx("td", { className: "p-2", children: inv.items.length }),
            /* @__PURE__ */ jsx("td", { className: "p-2 font-bold", children: fmt2(inv.total) })
          ] }, inv.id);
        }) })
      ] })
    ] })
  ] });
}
function Card({
  icon: Icon,
  label,
  value,
  accent
}) {
  const colors = {
    emerald: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
    orange: "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300",
    rose: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
    purple: "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300",
    sky: "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300",
    indigo: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300",
    slate: "bg-slate-50 text-slate-700 dark:bg-slate-950/40 dark:text-slate-300",
    amber: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
  };
  return /* @__PURE__ */ jsxs("div", { className: "bg-card border border-border rounded-xl p-4 flex flex-col justify-between", children: [
    /* @__PURE__ */ jsx("div", { className: `w-10 h-10 rounded-lg grid place-items-center ${colors[accent]}`, children: /* @__PURE__ */ jsx(Icon, { className: "w-5 h-5" }) }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mt-2", children: label }),
      /* @__PURE__ */ jsxs("p", { className: "text-xl font-bold mt-1", children: [
        fmt2(value),
        " ",
        /* @__PURE__ */ jsx("span", { className: "text-xs font-normal text-muted-foreground", children: "ج.م" })
      ] })
    ] })
  ] });
}
function CardWithCommission({
  icon: Icon,
  label,
  value,
  commission,
  count,
  accent
}) {
  const colors = {
    orange: "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300"
  };
  return /* @__PURE__ */ jsxs("div", { className: "bg-card border-1 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-start", children: [
      /* @__PURE__ */ jsx("div", { className: `w-10 h-10 rounded-lg grid place-items-center ${colors[accent] || colors.orange}`, children: /* @__PURE__ */ jsx(Icon, { className: "w-5 h-5" }) }),
      /* @__PURE__ */ jsx("span", { className: "text-[11px] font-extrabold bg-pink-50 text-pink-700 px-2 py-1 rounded-md border border-pink-200", children: fmt2(commission) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-2", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-baseline", children: [
        /* @__PURE__ */ jsx("p", { className: "text-xs font-bold text-foreground", children: label }),
        /* @__PURE__ */ jsxs("span", { className: "text-[10px] text-muted-foreground", children: [
          "(",
          count,
          " أوردر)"
        ] })
      ] }),
      /* @__PURE__ */ jsxs("p", { className: "text-xl font-black mt-1 text-primary", children: [
        fmt2(value),
        " ",
        /* @__PURE__ */ jsx("span", { className: "text-xs font-normal text-muted-foreground", children: "ج.م" })
      ] })
    ] })
  ] });
}
export {
  ReportsPage as component
};
