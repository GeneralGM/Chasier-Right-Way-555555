import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useEffect, useMemo } from "react";
import { u as usePosDB } from "./pos-store-Drg8tCrh.js";
import { I as Input, f as fmt2, B as Button, u as useDB, c as clamp0, D as Dialog, a as DialogContent, b as DialogHeader, d as DialogTitle, e as DialogFooter, g as getApiUrl } from "./router-DvcG6CTK.js";
import { Settings, Receipt, Clock, Download, Printer, Info, ChefHat, Wine, Cloud, ShoppingBag, Bike, DollarSign, Minus, Percent, Wallet } from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import "js-sha256";
import "@tanstack/react-query";
import "@tanstack/react-router";
import "@radix-ui/react-dialog";
import "clsx";
import "tailwind-merge";
import "@radix-ui/react-slot";
import "class-variance-authority";
const FastIcon = ({ size = 24, color = "#FF6B35" }) => {
  return /* @__PURE__ */ jsxs(
    "svg",
    {
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      xmlns: "http://www.w3.org/2000/svg",
      children: [
        /* @__PURE__ */ jsx(
          "path",
          {
            d: "M13 2L3 14H9L11 22L21 10H15L13 2Z",
            fill: color,
            stroke: color,
            strokeWidth: "1",
            strokeLinejoin: "round"
          }
        ),
        /* @__PURE__ */ jsx(
          "circle",
          {
            cx: "12",
            cy: "12",
            r: "10",
            fill: "none",
            stroke: color,
            strokeWidth: "0.5",
            opacity: "0.3"
          }
        )
      ]
    }
  );
};
const TalabatIcon = ({ size = 24, color = "#00A859" }) => {
  return /* @__PURE__ */ jsxs(
    "svg",
    {
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      xmlns: "http://www.w3.org/2000/svg",
      children: [
        /* @__PURE__ */ jsx(
          "path",
          {
            d: "M7 3H17C18.1046 3 19 3.89543 19 5V19C19 20.1046 18.1046 21 17 21H7C5.89543 21 5 20.1046 5 19V5C5 3.89543 5.89543 3 7 3Z",
            stroke: color,
            strokeWidth: "1.5",
            strokeLinejoin: "round"
          }
        ),
        /* @__PURE__ */ jsx(
          "path",
          {
            d: "M8 3C8 1.5 9 1 12 1C15 1 16 1.5 16 3",
            stroke: color,
            strokeWidth: "1.5",
            strokeLinecap: "round"
          }
        ),
        /* @__PURE__ */ jsx(
          "line",
          {
            x1: "8",
            y1: "8",
            x2: "16",
            y2: "8",
            stroke: color,
            strokeWidth: "1",
            opacity: "0.5"
          }
        ),
        /* @__PURE__ */ jsx(
          "line",
          {
            x1: "8",
            y1: "14",
            x2: "16",
            y2: "14",
            stroke: color,
            strokeWidth: "1",
            opacity: "0.5"
          }
        )
      ]
    }
  );
};
const API_URL = getApiUrl();
const printInvoice = (invoice) => {
  const printWindow = window.open("", "_blank", "width=650,height=850");
  if (!printWindow) return;
  const dPrice = Number(invoice.deliveryPrice) || Number(invoice.delivery_price) || 0;
  const taxVal = Number(invoice.taxValue) || Number(invoice.tax_value) || 0;
  const discVal = Number(invoice.discountValue) || Number(invoice.discount_value) || 0;
  const finalDiscVal = discVal || Number(invoice.subtotal || 0) * Number(invoice.discountPct || invoice.discount_pct || 0) / 100 || 0;
  const finalTaxVal = taxVal || (Number(invoice.subtotal || 0) - discVal) * Number(invoice.taxPct || invoice.tax_pct || 0) / 100 || 0;
  const computedTotal = Number(invoice.total) || Number(invoice.subtotal || 0) - discVal + finalTaxVal + dPrice;
  const itemsArray = typeof invoice.items === "string" ? JSON.parse(invoice.items) : invoice.items || [];
  const commVal = Number(invoice.commissionValue) || Number(invoice.commission_value) || 0;
  const orderTypeArabic = invoice.type === "delivery" ? "توصيل (Delivery)" : invoice.type === "takeaway" ? "تيك أواي (Takeaway)" : "صالة (Dine-In)";
  const formattedDate = invoice.createdAt ? new Date(invoice.createdAt).toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }) : (/* @__PURE__ */ new Date()).toLocaleDateString("ar-EG");
  const formattedTime = invoice.createdAt ? new Date(invoice.createdAt).toLocaleTimeString("ar-EG", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  }) : (/* @__PURE__ */ new Date()).toLocaleTimeString("ar-EG", {
    hour: "2-digit",
    minute: "2-digit"
  });
  const cashierName = invoice.cashierName || invoice.cashier_name || "...........";
  const captainName = invoice.captainName || invoice.captain_name || invoice.captain || "—";
  const tableName = invoice.table_name || invoice.tableCode || "...........";
  const html = `
    <!doctype html>
    <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>فاتورة - مول زايد</title>
        <script src="https://cdn.tailwindcss.com"><\/script>
        <style>
          @media print {
            body {
              background: white;
              margin: 0;
              padding: 0;
            }
            .receipt-container {
              box-shadow: none;
              max-width: 100%;
              padding: 10px;
            }
              /* لمنع تكررا راس الجدول  */ 
            thead {
              display: table-row-group !important;
            }
          }
          body {
            background-color: #f5f5f5;
            direction: rtl;
            font-family: Arial, sans-serif;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .separator-line {
            border-top: 1px dashed #333;
            margin: 12px 0;
          }
          .separator-solid {
            border-top: 2px solid #000;
            margin: 16px 0;
          }
        </style>
      </head>
      <body class="p-4">
        <div class="receipt-container bg-white rounded-lg shadow-lg px-8 py-10 max-w-2xl mx-auto">
          
          <div class="mb-6 text-right">
            <div class="flex items-center justify-between mb-4">
              <div class="text-right">
                <div class="text-5xl font-bold text-black mb-1">مول زايد</div>
                <div class="text-sm text-gray-800">عنوان المطعم - مدينة طنطا</div>
              </div>
              <img
                class="h-16 w-16 ml-4"
                src="../.././public/favicon.ico"
                alt="Logo"
              />
            </div>
          </div>

          <div class="separator-solid"></div>

          <div class="text-center mb-6">
            <h2 class="text-2xl font-bold bg-gray-100 py-2 rounded-xl ">
              ${orderTypeArabic}
            </h2>
          </div>

          <div class="grid grid-cols-2 gap-4 mb-6 text-center text-sm">

            <div>
              <div class="text-gray-500 mb-0.5">التاريخ</div>
              <div class="font-bold text-black text-xs">${formattedDate} </div>
            </div>
            <div>
              <div class="text-gray-500 mb-0.5">التاريخ</div>
              <div class="font-bold text-black text-xs">${formattedTime}</div>
            </div>
            <div>
            <div>
              <div class="text-gray-500 mb-0.5">اسم الطاولة / الطلب</div>
              <div class="font-bold text-black border-b border-gray-300 pb-1">
                ${tableName.length > 3 ? tableName.substring(0, 3) + "..." : tableName}
              </div>
            </div>
            </div>
            <div>
              <div class="text-gray-500 mb-0.5">اسم الكاشير</div>
              <div class="font-bold text-black border-b border-gray-300 pb-1">
                ${cashierName}
              </div>
            </div>
          </div>
          <!-- ✨ الجزء الجديد الخاص بالكابتن -->
          ${invoice.type === "dinein" ? `
              <div>
                <div class="text-gray-500 mb-0.5">اسم الكابتن</div>
                <div class="font-bold text-black border-b border-gray-300 pb-1">
                  ${captainName}
                </div>
              </div>
              ` : ""}


          ${(invoice.type === "takeaway" || invoice.type === "delivery") && invoice.orderCategory && invoice.orderCategory !== "normal" ? `
              <div class="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-2.5 text-center text-xs font-bold mb-4">
                منصة التوصيل: 
                <span>
                  ${invoice.orderCategory === "talabat" ? "طلبات (Talabat)" : invoice.orderCategory === "fast" ? "فاست (Fast)" : invoice.orderCategory}
                </span>
              </div>
              ` : ""}

          <div class="separator-line"></div>

          <div class="mb-6">
          <table class="w-full table-fixed text-center text-sm mb-4">
            <thead>
              <tr class="border-b border-gray-300">
                <th class="w-[22%] text-gray-800 font-bold py-3 text-xs text-center whitespace-nowrap">الإجمالي</th>
                <th class="w-[20%] text-gray-800 font-bold py-3 text-xs text-center whitespace-nowrap">السعر</th>
                <th class="w-[13%] text-gray-800 font-bold py-3 text-xs text-center whitespace-nowrap">الكمية</th>
                <th class="w-[45%] text-gray-800 font-bold py-3 text-xs text-center whitespace-nowrap">الصنف</th>
              </tr>
            </thead>
            <tbody>
              ${itemsArray.map((line) => {
    const exStr = line.extras && line.extras.length ? ` <span class="text-xs text-gray-500 block mt-0.5 font-normal break-words whitespace-normal leading-relaxed">(+ ${line.extras.map((e) => e.name || e.label).join(", ")})</span>` : "";
    const displayName = line.mealName || line.name || "صنف غير معروف";
    const singlePrice = Number(line.unitPrice || line.price || 0) + (line.extras ? line.extras.reduce((s, e) => s + Number(e.price || 0), 0) : 0);
    const lineTotal = singlePrice * Number(line.qty || 1);
    return `
                  <tr class="border-b border-gray-200">
                    <td class="py-3 text-gray-700 text-center font-medium whitespace-nowrap">${lineTotal.toFixed(0)}</td>
                    <td class="py-3 text-gray-700 text-center whitespace-nowrap">${singlePrice.toFixed(0)}</td>
                    <td class="py-3 text-gray-700 text-center font-bold whitespace-nowrap">${line.qty}</td>
                    
                    <td class="py-3 text-gray-800 font-bold text-center break-words whitespace-normal pr-1 leading-tight">
                      ${displayName}
                      ${exStr}
                    </td>
                  </tr>
                  `;
  }).join("")}
            </tbody>
          </table>
          </div>

          <div class="separator-solid"></div>

          <div class="mb-6 space-y-2.5 text-sm">
            <div class="flex justify-between items-center">
              <span class="text-gray-800 font-bold">المجموع الأصلي:</span>
              <span class="text-gray-700 font-semibold">${Number(invoice.subtotal || 0).toFixed(2)}</span>
            </div>
            
            ${finalDiscVal > 0 ? `
                <div class="flex justify-between items-center text-red-600 font-bold">
                  <span>الخصم (${invoice.discountPct || 0}%):</span>
                  <span>-${finalDiscVal.toFixed(2)}</span>
                </div>
                ` : ""}
            
            ${finalTaxVal > 0 ? `
                <div class="flex justify-between items-center text-gray-700">
                  <span>الضريبة (${invoice.taxPct || 0}%):</span>
                  <span>${finalTaxVal.toFixed(2)}</span>
                </div>
                ` : ""}

            ${commVal > 0 ? `
                <div class="flex justify-between items-center text-amber-700 font-bold">
                  <span>منصة (${invoice.orderCategory === "talabat" ? "طلبات" : "فاست"}):</span>
                  <span>+${commVal.toFixed(2)}</span>
                </div>
                ` : ""}

            ${dPrice > 0 ? `
                <div class="flex justify-between items-center text-gray-700 font-semibold">
                  <span>خدمة التوصيل:</span>
                  <span>+${dPrice.toFixed(2)}</span>
                </div>
                ` : ""}

            <div class="flex justify-between items-center text-xl font-black border-t border-b border-gray-300 py-3.5 mt-2">
              <span class="text-black">الإجمالي الكلي:</span>
              <span class="text-black text-2xl">${computedTotal.toFixed(2)}</span>
            </div>
          </div>


          <div class="grid grid-cols-1 gap-6 mb-6 text-right text-xs">
            <div>
              <div class="font-bold text-gray-800 mb-2 uppercase">أرقام التواصل</div>
              <div class="space-y-1 text-gray-600">
                <div>☎ +20 123 456 7890</div>
              </div>
            </div>
            
          </div>
          
          <div class="text-center mt-4">
            <div class="text-sm font-black text-gray-800 mb-2">
              شكراً لاختيارك.. نرجو أن نكون قد نلنا اعجابكم 🙏
            </div>
          </div>

          </div>

        <script>
          window.onload = function() {
            setTimeout(() => {
              window.print();
              // نغلق النافذة المنبثقة تلقائياً بعد انتهاء أمر الطباعة أو إلغائه
              window.close();
            }, 300);
          }
        <\/script>
      </body>
    </html>
  `;
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
};
function SettingsPage() {
  const [tab, setTab] = useState("invoices");
  return /* @__PURE__ */ jsxs("div", { dir: "rtl", className: "space-y-4", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsxs("h1", { className: "text-2xl font-bold flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Settings, { className: "w-6 h-6" }),
        " الإعدادات"
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: "أرشيف الفواتير وإعدادات النظام." })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex gap-1 bg-secondary p-1 rounded-lg w-fit", children: [
      /* @__PURE__ */ jsxs("button", { onClick: () => setTab("invoices"), className: `px-4 h-9 rounded-md text-sm font-medium flex items-center gap-2 ${tab === "invoices" ? "bg-card shadow-sm" : "text-muted-foreground"}`, children: [
        /* @__PURE__ */ jsx(Receipt, { className: "w-4 h-4" }),
        " الفواتير"
      ] }),
      /* @__PURE__ */ jsxs("button", { onClick: () => setTab("shifts"), className: `px-4 h-9 rounded-md text-sm font-medium flex items-center gap-2 ${tab === "shifts" ? "bg-card shadow-sm" : "text-muted-foreground"}`, children: [
        /* @__PURE__ */ jsx(Clock, { className: "w-4 h-4" }),
        " الشيفتات"
      ] })
    ] }),
    tab === "invoices" && /* @__PURE__ */ jsx(InvoicesTab, {}),
    tab === "shifts" && /* @__PURE__ */ jsx(ShiftsTab, {})
  ] });
}
function InvoicesTab() {
  const {
    db: pos
  } = usePosDB();
  const [q, setQ] = useState("");
  const [fromDate, setFromDate] = useState((/* @__PURE__ */ new Date()).toISOString().slice(0, 10));
  const [toDate, setToDate] = useState((/* @__PURE__ */ new Date()).toISOString().slice(0, 10));
  const [tableFilter, setTableFilter] = useState("all");
  const [amountFilter, setAmountFilter] = useState("all");
  const [serverInvoices, setServerInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    async function fetchInvoicesFromPostgres() {
      try {
        setIsLoading(true);
        const start = new Date(fromDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        const response = await fetch(`http://${API_URL}:5000/api/invoices?startDate=${start.toISOString()}&endDate=${end.toISOString()}`);
        if (response.ok) {
          const data = await response.json();
          setServerInvoices(data);
        }
      } catch (error) {
        console.error("❌ خطأ أثناء جلب الفواتير من الأرشيف:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchInvoicesFromPostgres();
  }, [fromDate, toDate]);
  const rows = useMemo(() => {
    const map = /* @__PURE__ */ new Map();
    pos.invoices.forEach((inv) => map.set(inv.id, inv));
    serverInvoices.forEach((inv) => map.set(inv.id, inv));
    const mergedInvoices = Array.from(map.values()).sort((a, b) => b.createdAt - a.createdAt);
    return mergedInvoices.filter((inv) => {
      if (tableFilter !== "all") {
        const code = (inv.tableCode || "").trim().toUpperCase();
        const type = inv.type || "";
        if (tableFilter === "takeaway") {
          if (type !== "takeaway" && type !== "delivery" && !code.startsWith("TAK") && !code.startsWith("DEL") && !code.startsWith("T") && !code.startsWith("D")) return false;
        } else if (tableFilter === "X") {
          if (!code.startsWith("X") && type !== "staff" && type !== "hospitality" && inv.zone !== "others") return false;
        } else {
          if (!code.startsWith(tableFilter.toUpperCase())) return false;
        }
      }
      if (amountFilter !== "all") {
        const total = Number(inv.total) || 0;
        if (amountFilter === "lt200" && total >= 200) return false;
        if (amountFilter === "200-500" && (total < 200 || total > 500)) return false;
        if (amountFilter === "500-700" && (total < 500 || total > 700)) return false;
        if (amountFilter === "700-1000" && (total < 700 || total > 1e3)) return false;
        if (amountFilter === "gt1000" && total <= 1e3) return false;
      }
      if (q) {
        const hay = `${inv.invoiceNumber || ""} ${inv.tableCode || ""} ${inv.customerName || ""} ${inv.customerAddress || ""}`.toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [pos.invoices, serverInvoices, tableFilter, amountFilter, q]);
  const stats = useMemo(() => {
    const totalCount = rows.length;
    const totalMoney = rows.reduce((sum, inv) => sum + (Number(inv.total) || 0), 0);
    return {
      count: totalCount,
      sum: totalMoney
    };
  }, [rows]);
  function exportToExcel() {
    const data = rows.map((inv) => {
      const shift = pos.shifts.find((s) => inv.createdAt >= s.openedAt && (!s.closedAt || inv.createdAt <= s.closedAt));
      const soldItems = inv.items?.map((i) => `${i.name}×${i.qty}`).join(" , ") || "";
      return {
        "الأصناف المباعة": soldItems,
        الشيفت: shift ? `${shift.cashierName} (${new Date(shift.openedAt).toLocaleDateString("ar-EG")})` : "—",
        التاريخ: new Date(inv.createdAt).toLocaleString("ar-EG"),
        "المجموع النهائي": fmt2(inv.total),
        "نوع الطلب": inv.type === "staff" ? "موظفين" : inv.type === "hospitality" ? "ضيافة" : inv.type,
        "رقم الطاولة": inv.tableCode || "تيك أواي"
      };
    });
    const ws = XLSX.utils.json_to_sheet(data);
    ws["!cols"] = [{
      wch: 60
    }, {
      wch: 30
    }, {
      wch: 25
    }, {
      wch: 15
    }, {
      wch: 15
    }, {
      wch: 15
    }];
    ws["!dir"] = "rtl";
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "الفواتير");
    const fileName = `فواتير_أرشيف_${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, fileName);
  }
  return /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
    /* @__PURE__ */ jsxs("div", { className: "bg-card p-2.5 rounded-xl border border-border shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5", children: [
      /* @__PURE__ */ jsx("div", { className: "relative flex-1 min-w-[220px]", children: /* @__PURE__ */ jsx(Input, { dir: "rtl", placeholder: "ابحث برقم الفاتورة، الطاولة، العميل...", value: q, onChange: (e) => setQ(e.target.value), className: "pe-9 h-9 text-xs bg-secondary/30 focus:bg-background transition-colors" }) }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
        /* @__PURE__ */ jsxs("select", { value: tableFilter, onChange: (e) => setTableFilter(e.target.value), className: "h-9 px-2.5 rounded-lg border border-input bg-secondary/50 text-xs font-bold text-foreground focus:ring-2 focus:ring-primary outline-none cursor-pointer", children: [
          /* @__PURE__ */ jsx("option", { value: "all", children: "🌐 كل المناطق" }),
          /* @__PURE__ */ jsx("option", { value: "C", children: "🔒 صالة (C)" }),
          /* @__PURE__ */ jsx("option", { value: "O", children: "☀️ صالة (O)" }),
          /* @__PURE__ */ jsx("option", { value: "X", children: "👥 داخلي / موظفين (X)" }),
          /* @__PURE__ */ jsx("option", { value: "K", children: "🧸 أطفال (K)" }),
          /* @__PURE__ */ jsx("option", { value: "ص", children: "🏠 قاعة صغيرة (ص)" }),
          /* @__PURE__ */ jsx("option", { value: "ك", children: "🏛️ قاعة كبيرة (ك)" }),
          /* @__PURE__ */ jsx("option", { value: "takeaway", children: "🛍️ تيك أواي / دليفري" })
        ] }),
        /* @__PURE__ */ jsxs("select", { value: amountFilter, onChange: (e) => setAmountFilter(e.target.value), className: "h-9 px-2.5 rounded-lg border border-input bg-secondary/50 text-xs font-bold text-foreground focus:ring-2 focus:ring-primary outline-none cursor-pointer", children: [
          /* @__PURE__ */ jsx("option", { value: "all", children: "💰 كل المبالغ" }),
          /* @__PURE__ */ jsx("option", { value: "lt200", children: "🔻 أقل من 200 ج.م" }),
          /* @__PURE__ */ jsx("option", { value: "200-500", children: "💵 200 : 500 ج.م" }),
          /* @__PURE__ */ jsx("option", { value: "500-700", children: "💵 500 : 700 ج.م" }),
          /* @__PURE__ */ jsx("option", { value: "700-1000", children: "💵 700 : 1000 ج.م" }),
          /* @__PURE__ */ jsx("option", { value: "gt1000", children: "💎 أكبر من 1000 ج.م" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 bg-secondary/50 rounded-lg p-1 px-2 border border-input", children: [
          /* @__PURE__ */ jsx("span", { className: "text-[11px] font-bold text-muted-foreground", children: "من:" }),
          /* @__PURE__ */ jsx("input", { type: "date", value: fromDate, onChange: (e) => setFromDate(e.target.value), className: "h-7 text-xs rounded bg-background border-none px-1 text-primary font-bold cursor-pointer outline-none" }),
          /* @__PURE__ */ jsx("span", { className: "text-[11px] font-bold text-muted-foreground", children: "إلى:" }),
          /* @__PURE__ */ jsx("input", { type: "date", value: toDate, onChange: (e) => setToDate(e.target.value), className: "h-7 text-xs rounded bg-background border-none px-1 text-primary font-bold cursor-pointer outline-none" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3 bg-secondary/20 p-2 rounded-xl border border-border/60", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 px-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 text-xs", children: [
          /* @__PURE__ */ jsx("span", { className: "text-muted-foreground font-semibold", children: "عدد الفواتير:" }),
          /* @__PURE__ */ jsx("span", { className: "font-extrabold bg-primary/10 text-primary px-2 py-0.5 rounded-md font-mono", children: stats.count })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "h-4 w-[1px] bg-border" }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 text-xs", children: [
          /* @__PURE__ */ jsx("span", { className: "text-muted-foreground font-semibold", children: "الإجمالي النهائي:" }),
          /* @__PURE__ */ jsxs("span", { className: "font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-md font-mono", children: [
            fmt2(stats.sum),
            " ج.م"
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(Button, { variant: "outline", size: "sm", onClick: exportToExcel, className: "gap-1.5 h-8 text-xs font-bold bg-card hover:bg-secondary shadow-sm", children: [
        /* @__PURE__ */ jsx(Download, { className: "w-3.5 h-3.5 text-emerald-600" }),
        " تصدير Excel"
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "bg-card border border-border rounded-xl overflow-hidden shadow-sm", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
      /* @__PURE__ */ jsx("thead", { className: "bg-secondary/60 text-xs", children: /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("th", { className: "text-center p-3", children: "رقم الفاتورة" }),
        /* @__PURE__ */ jsx("th", { className: "text-center p-3", children: "التاريخ والوقت" }),
        /* @__PURE__ */ jsx("th", { className: "text-center p-3", children: "نوع الطلب" }),
        /* @__PURE__ */ jsx("th", { className: "text-center p-3", children: "الطاولة" }),
        /* @__PURE__ */ jsx("th", { className: "text-center p-3", children: "الكاشير" }),
        /* @__PURE__ */ jsx("th", { className: "text-center p-3", children: "الأصناف" }),
        /* @__PURE__ */ jsx("th", { className: "text-center p-3", children: "المجموع" }),
        /* @__PURE__ */ jsx("th", { className: "text-center p-3", children: "الخصم" }),
        /* @__PURE__ */ jsx("th", { className: "text-center p-3 text-purple-600 font-bold", children: "الضريبة / المنصة" }),
        /* @__PURE__ */ jsx("th", { className: "text-center p-3 text-blue-600 font-bold", children: "الكابتن / التوصيل" }),
        /* @__PURE__ */ jsx("th", { className: "text-center p-3 text-emerald-600 font-bold", children: "الإجمالي النهائي" }),
        /* @__PURE__ */ jsx("th", { className: "text-center p-3", children: "طباعة" })
      ] }) }),
      /* @__PURE__ */ jsx("tbody", { children: isLoading ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 12, className: "p-8 text-center text-amber-600 font-medium animate-pulse", children: "جاري جلب الفواتير من الأرشيف (pgAdmin)..." }) }) : rows.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 12, className: "p-8 text-center text-muted-foreground", children: "لا توجد فواتير مطابقة للفلاتر المحددة حالياً." }) }) : rows.map((inv) => /* @__PURE__ */ jsxs("tr", { className: "border-t border-border hover:bg-secondary/30 transition-colors", children: [
        /* @__PURE__ */ jsx("td", { className: "p-3 font-mono text-center text-xs font-bold", children: inv.invoiceNumber || "-" }),
        /* @__PURE__ */ jsx("td", { className: "p-3 font-mono text-center text-xs", dir: "ltr", children: new Date(inv.createdAt).toLocaleString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
          day: "2-digit",
          month: "2-digit"
        }).replace(",", " ||") }),
        /* @__PURE__ */ jsx("td", { className: "p-3 text-right text-xs", children: inv.orderCategory === "talabat" ? /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-amber-100 text-amber-900 font-semibold text-sm border border-amber-300", children: [
          /* @__PURE__ */ jsx(TalabatIcon, { size: 16, color: "#FF5E00" }),
          " طلبات"
        ] }) : inv.orderCategory === "fast" ? /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-amber-100 text-amber-900 font-semibold text-sm border border-amber-300", children: [
          /* @__PURE__ */ jsx(FastIcon, { size: 16, color: "#FF5E00" }),
          " فاست"
        ] }) : inv.type === "delivery" ? /* @__PURE__ */ jsx("span", { className: "px-2 py-1 rounded bg-amber-100 text-amber-800 font-medium", children: "توصيل 🛵" }) : inv.type === "takeaway" ? /* @__PURE__ */ jsx("span", { className: "px-2 py-1 rounded bg-green-100 text-green-800 font-medium", children: "تيك أواي 🛍️" }) : inv.type === "staff" ? /* @__PURE__ */ jsx("span", { className: "px-2 py-1 rounded bg-purple-100 text-purple-800 font-bold", children: "موظفين 👤" }) : inv.type === "hospitality" ? /* @__PURE__ */ jsx("span", { className: "px-2 py-1 rounded bg-pink-100 text-pink-800 font-bold", children: "ضيافة ☕" }) : /* @__PURE__ */ jsx("span", { className: "px-2 py-1 rounded bg-blue-100 text-blue-800 font-medium", children: "صالة 🍽️" }) }),
        /* @__PURE__ */ jsx("td", { className: "p-3 text-center", children: inv.type === "takeaway" || inv.type === "delivery" ? /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("div", { className: "font-medium", children: inv.customerName || "عميل نقدي" }),
          inv.customerAddress && /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground truncate max-w-[150px]", children: inv.customerAddress })
        ] }) : /* @__PURE__ */ jsx("span", { className: "font-mono font-bold text-primary text-base", children: inv.tableCode || "—" }) }),
        /* @__PURE__ */ jsx("td", { className: "p-3 text-center text-muted-foreground text-xs font-medium", children: inv.cashierName || "—" }),
        /* @__PURE__ */ jsx("td", { className: "p-3 text-center font-bold text-center", children: (typeof inv.items === "string" ? JSON.parse(inv.items) : inv.items || []).reduce((sum, item) => sum + (Number(item.qty) || 1), 0) }),
        /* @__PURE__ */ jsx("td", { className: "p-3 text-center font-medium", children: fmt2(inv.subtotal) }),
        /* @__PURE__ */ jsxs("td", { className: "p-3 text-center text-xs", children: [
          Math.floor(+fmt2(inv.discountPct || inv.discount_pct || 0)),
          "% ≈ ",
          /* @__PURE__ */ jsx("span", { className: "text-red-600 font-bold", children: fmt2(inv.discountValue || inv.discount_value || 0) })
        ] }),
        /* @__PURE__ */ jsx("td", { className: "p-3 text-center", children: inv.commissionValue ? /* @__PURE__ */ jsx("span", { className: "text-purple-600 font-bold text-sm", children: fmt2(inv.commissionValue) }) : /* @__PURE__ */ jsx("span", { className: "text-blue-600 font-medium text-sm", children: fmt2(inv.taxValue || inv.tax_value || 0) }) }),
        /* @__PURE__ */ jsx("td", { className: "p-3 text-center font-bold text-xs", children: inv.type === "delivery" || inv.type === "takeaway" ? /* @__PURE__ */ jsx("span", { className: "text-amber-600", children: inv.deliveryPrice && inv.deliveryPrice > 0 ? `+${fmt2(inv.deliveryPrice)} ج.م` : "—" }) : /* @__PURE__ */ jsx("span", { className: "text-blue-600", children: inv.captainName || inv.captain_name || inv.captain || "—" }) }),
        /* @__PURE__ */ jsx("td", { className: "p-3 text-center font-black text-emerald-600 text-base", children: fmt2(inv.total) }),
        /* @__PURE__ */ jsx("td", { className: "p-3 text-center", children: /* @__PURE__ */ jsxs(Button, { variant: "outline", size: "sm", onClick: () => printInvoice(inv), className: "gap-1.5 h-8 font-bold", children: [
          /* @__PURE__ */ jsx(Printer, { className: "w-3.5 h-3.5" }),
          " طباعة"
        ] }) })
      ] }, inv.id)) })
    ] }) })
  ] });
}
function ShiftsTab() {
  const {
    db: pos
  } = usePosDB();
  const {
    db
  } = useDB();
  const [detailShift, setDetailShift] = useState(null);
  const [fromDate, setFromDate] = useState(() => {
    const d = /* @__PURE__ */ new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  });
  const [toDate, setToDate] = useState((/* @__PURE__ */ new Date()).toISOString().slice(0, 10));
  const [serverShifts, setServerShifts] = useState([]);
  const [serverInvoices, setServerInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    async function fetchShiftsAndInvoices() {
      try {
        setIsLoading(true);
        const start = new Date(fromDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        const startIso = start.toISOString();
        const endIso = end.toISOString();
        const [shiftsRes, invoicesRes] = await Promise.all([fetch(`http://${API_URL}:5000/api/shifts?startDate=${startIso}&endDate=${endIso}`), fetch(`http://${API_URL}:5000/api/invoices?startDate=${startIso}&endDate=${endIso}`)]);
        if (shiftsRes.ok && invoicesRes.ok) {
          const shiftsData = await shiftsRes.json();
          const invoicesData = await invoicesRes.json();
          if (Array.isArray(shiftsData)) setServerShifts(shiftsData);
          if (Array.isArray(invoicesData)) setServerInvoices(invoicesData);
        }
      } catch (err) {
        console.error("❌ خطأ أثناء جلب الشيفتات من قاعدة البيانات:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchShiftsAndInvoices();
  }, [fromDate, toDate]);
  const shiftsWithData = useMemo(() => {
    const shiftsMap = /* @__PURE__ */ new Map();
    serverShifts.forEach((s) => shiftsMap.set(s.id, s));
    pos.shifts.forEach((s) => shiftsMap.set(s.id, s));
    const sourceShifts = Array.from(shiftsMap.values());
    const invoicesMap = /* @__PURE__ */ new Map();
    serverInvoices.forEach((i) => invoicesMap.set(i.id, i));
    pos.invoices.forEach((i) => invoicesMap.set(i.id, i));
    const sourceInvoices = Array.from(invoicesMap.values());
    const sortedShifts = [...sourceShifts].sort((a, b) => (b.closedAt || 0) - (a.closedAt || 0));
    return sortedShifts.map((shift) => {
      const shiftInvoices = sourceInvoices.filter((inv) => {
        if (inv.createdAt < shift.openedAt) return false;
        if (shift.closedAt && inv.createdAt > shift.closedAt) return false;
        return true;
      });
      let kitchen = Number(shift.kitchenSales) || 0;
      let bar = Number(shift.barSales) || 0;
      let shisha = Number(shift.shishaSales) || 0;
      let takeawayOnly = Number(shift.takeawaySales) || 0;
      let deliveryOnly = Number(shift.deliverySales) || 0;
      let tax = Number(shift.taxValue || shift.tax_value) || 0;
      let discount = Number(shift.discountValue || shift.discount_value) || 0;
      let subtotal = kitchen + bar + shisha;
      let fastTotal = 0;
      let fastCount = 0;
      let fastCommission = 0;
      let talabatTotal = 0;
      let talabatCount = 0;
      let talabatCommission = 0;
      if (shiftInvoices.length > 0 && db.meals && db.meals.length > 0) {
        kitchen = 0;
        bar = 0;
        shisha = 0;
        takeawayOnly = 0;
        deliveryOnly = 0;
        subtotal = 0;
        discount = 0;
        tax = 0;
        for (const inv of shiftInvoices) {
          subtotal += inv.subtotal;
          discount += Number(inv.discountValue || inv.discount_value) || 0;
          const invDiscount = Number(inv.discountValue || inv.discount_value) || 0;
          const invTaxPct = Number(inv.taxPct || inv.tax_pct) || 0;
          tax += Number(inv.taxValue || inv.tax_value) || (Number(inv.subtotal) - invDiscount) * invTaxPct / 100 || 0;
          const deliveryFee = Number(inv.deliveryPrice) || 0;
          if (inv.type === "takeaway") {
            takeawayOnly += inv.total - deliveryFee;
          } else if (inv.type === "delivery") {
            deliveryOnly += inv.total - deliveryFee;
          }
          const cat = inv.orderCategory || inv.order_category || "normal";
          if (cat === "fast") {
            fastTotal += inv.total;
            fastCount++;
            fastCommission += Number(inv.commissionValue || inv.commission_value || 0);
          } else if (cat === "talabat") {
            talabatTotal += inv.total;
            talabatCount++;
            talabatCommission += Number(inv.commissionValue || inv.commission_value || 0);
          }
          for (const line of inv.items) {
            const meal = db.meals.find((m) => m.id === line.mealId);
            const extras = line.extras?.reduce((s, e) => s + Number(e.price || 0), 0) || 0;
            const v = (Number(line.unitPrice || line.price || 0) + extras) * Number(line.qty || 1);
            let deptName = line.department || "مطبخ";
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
      }
      const finalNetCash = kitchen + bar + shisha + tax - discount;
      return {
        shift,
        invoiceCount: shiftInvoices.length || Number(shift.invoice_count) || 0,
        kitchen: clamp0(kitchen),
        bar: clamp0(bar),
        shisha: clamp0(shisha),
        takeaway: clamp0(takeawayOnly),
        delivery: clamp0(deliveryOnly),
        deliveryFees: clamp0(Number(shift.deliverySales) || 0),
        subtotal: clamp0(subtotal),
        discount: clamp0(discount),
        tax: clamp0(tax),
        total: clamp0(finalNetCash),
        revenues: clamp0(finalNetCash),
        // 🌟 إرسال البيانات المحدثة للمودال
        fastTotal: clamp0(fastTotal),
        fastCount,
        fastCommission: clamp0(fastCommission),
        talabatTotal: clamp0(talabatTotal),
        talabatCount,
        talabatCommission: clamp0(talabatCommission)
      };
    });
  }, [pos.shifts, serverShifts, pos.invoices, serverInvoices, db.meals]);
  const printShiftReport = (shift, shiftInvoices) => {
    let totalDineIn = 0;
    let totalTakeaway = 0;
    let totalDelivery = 0;
    let totalStaff = 0;
    let totalHospitality = 0;
    let grossSales = 0;
    let totalDiscount = 0;
    let totalTax = 0;
    let totalDeliveryFee = 0;
    let cashTotal = 0;
    let visaTotal = 0;
    let kitchenSales = 0;
    let barSales = 0;
    let shishaSales = 0;
    let fastTotal = 0;
    let talabatTotal = 0;
    let talabatCommission = 0;
    shiftInvoices.forEach((inv) => {
      if (inv.type === "dinein" || inv.type === "dine-in") totalDineIn += Number(inv.total) || 0;
      else if (inv.type === "takeaway") totalTakeaway += Number(inv.total) || 0;
      else if (inv.type === "delivery") totalDelivery += Number(inv.total) || 0;
      else if (inv.type === "staff" || inv.type === "موظفين") totalStaff += Number(inv.total) || 0;
      else if (inv.type === "hospitality" || inv.type === "ضيافة") totalHospitality += Number(inv.total) || 0;
      grossSales += Number(inv.subtotal) || 0;
      const invDiscount = Number(inv.discountValue || inv.discount_value) || 0;
      totalDiscount += invDiscount;
      const invTaxPct = Number(inv.taxPct || inv.tax_pct) || 0;
      totalTax += Number(inv.taxValue || inv.tax_value) || (Number(inv.subtotal) - invDiscount) * invTaxPct / 100 || 0;
      totalDeliveryFee += Number(inv.deliveryPrice || inv.delivery_price) || 0;
      const cat = inv.orderCategory || inv.order_category || "normal";
      if (cat === "fast") {
        fastTotal += Number(inv.total) || 0;
      } else if (cat === "talabat") {
        talabatTotal += Number(inv.total) || 0;
        talabatCommission += Number(inv.commissionValue || inv.commission_value || 0);
      }
      if (inv.paymentMethod === "visa" || inv.paymentMethod === "فيزا") {
        visaTotal += Number(inv.total) || 0;
      } else {
        cashTotal += Number(inv.total) || 0;
      }
      const itemsArray = typeof inv.items === "string" ? JSON.parse(inv.items) : inv.items || [];
      itemsArray.forEach((item) => {
        const extrasPrice = item.extras?.reduce((s, e) => s + Number(e.price || 0), 0) || 0;
        const lineTotal = (Number(item.unitPrice || item.price || 0) + extrasPrice) * Number(item.qty || 1);
        const meal = db.meals?.find((m) => m.id === item.mealId);
        let deptName = item.department || "مطبخ";
        if (meal) {
          const isShisha = meal.department === "شيشه" || (meal.category || "").trim().replace("ة", "ه") === "شيشه";
          if (isShisha) deptName = "شيشة";
          else if (meal.department) deptName = meal.department;
        }
        if (deptName.includes("شيش")) shishaSales += lineTotal;
        else if (deptName.includes("بار")) barSales += lineTotal;
        else kitchenSales += lineTotal;
      });
    });
    const finalNetSales = kitchenSales + barSales + shishaSales + talabatCommission + totalTax - totalDiscount;
    const shiftOpenTime = shift.openedAt ? new Date(shift.openedAt).toLocaleString("ar-EG") : "غير محدد";
    const shiftCloseTime = shift.closedAt ? new Date(shift.closedAt).toLocaleString("ar-EG") : "ما زال مفتوحاً";
    const openingBalance = Number(shift.startingCash) || Number(shift.initialCash) || 0;
    const expectedDrawer = openingBalance + cashTotal;
    const printWindow = window.open("", "_blank", "width=600,height=800");
    if (!printWindow) {
      toast.error("يرجى السماح بالنوافذ المنبثقة (Pop-ups) للطباعة");
      return;
    }
    const htmlContent = `
      <html dir="rtl">
        <head>
          <title>تقرير الوردية</title>
          <style>
            @page { margin: 0; size: auto; }
            body { font-family: 'Segoe UI', Tahoma, sans-serif; width: 100%; max-width: 80mm; margin: 0 auto; padding: 10px 5px; color: #000; font-size: 13px; line-height: 1.5; }
            h2 { text-align: center; margin: 0 0 10px 0; font-size: 18px; font-weight: bold; text-decoration: underline; }
            .header-box { border: 1.5px solid #000; padding: 6px; margin-bottom: 12px; font-size: 12px; font-weight: bold; }
            .header-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 13px; }
            th, td { border: 1.5px solid #000; padding: 5px; }
            td:first-child { width: 65%; font-weight: bold; }
            td:last-child { width: 35%; text-align: center; font-family: monospace; font-size: 14px;}
            .table-header { text-align: center !important; background-color: #f0f0f0 !important; font-weight: bold; font-size: 14px; }
            .bold { font-weight: bold; }
          </style>
        </head>
        <body onload="setTimeout(() => { window.print(); window.close(); }, 500);">
          
          <h2>تقرير وردية</h2>
          
          <div class="header-box">
            <div class="header-row"><span>من:</span><span dir="ltr">${shiftOpenTime}</span></div>
            <div class="header-row"><span>إلى:</span><span dir="ltr">${shiftCloseTime}</span></div>
            <div class="header-row"><span>الكاشير:</span><span>${shift.cashierName || shift.cashier_name || "غير معروف"}</span></div> 
          </div>
            
          <table>
            <tr><td colspan="2" class="table-header">إيرادات الأقسام</td></tr>
            <tr><td>إجمالي المطبخ</td><td class="bold">${kitchenSales.toFixed(2)}</td></tr>
            <tr><td>إجمالي البار</td><td class="bold">${barSales.toFixed(2)}</td></tr>
            <tr><td>إجمالي الشيشة</td><td class="bold">${shishaSales.toFixed(2)}</td></tr>
          </table>
            
          <table>
            <tr><td colspan="2" class="table-header">توزيع الطلبات والمنصات</td></tr>
            <tr><td>التيك أواي</td><td class="bold">${totalTakeaway.toFixed(2)}</td></tr>
            <tr><td>الدليفري</td><td class="bold">${totalDelivery.toFixed(2)}</td></tr>
            <tr><td>فاست فود (مبيعات)</td><td class="bold">${fastTotal.toFixed(2)}</td></tr>
            <tr><td>طلبات Talabat (مبيعات)</td><td class="bold">${talabatTotal.toFixed(2)}</td></tr>
            ${totalHospitality > 0 ? `<tr><td>ضيافة</td><td class="bold">${totalHospitality.toFixed(2)}</td></tr>` : ""}
            ${totalStaff > 0 ? `<tr><td>وجبات موظفين</td><td class="bold">${totalStaff.toFixed(2)}</td></tr>` : ""}
            <tr><td>رسوم التوصيل</td><td class="bold">${totalDeliveryFee.toFixed(2)}</td></tr>
          </table>
            
          <table>
            <tr><td colspan="2" class="table-header">المجموع النهائي</td></tr>
            <tr><td>إجمالي الضريبة</td><td class="bold">${totalTax.toFixed(2)}</td></tr>
            <tr><td>إجمالي الخصم</td><td class="bold">${totalDiscount.toFixed(2)}</td></tr>
            <tr><td>نسبة طالبات</td><td class="bold">${talabatCommission.toFixed(2)}</td></tr>
            <tr style="background:#eee;"><td>الإيرادات الصافية (شاملة النسبة)</td><td class="bold">${finalNetSales.toFixed(2)}</td></tr>
          </table>

          <table>
            <tr><td colspan="2" class="table-header">طرق الدفع</td></tr>
            <tr><td>كاش (نقدي)</td><td class="bold">${cashTotal.toFixed(2)}</td></tr>
            <tr><td>فيزا / بطاقة</td><td class="bold">${visaTotal.toFixed(2)}</td></tr>
          </table>

          <table>
            <tr style="background:#000; color:#fff;"><td>الرصيد المتوقع بالدرج</td><td class="bold">${expectedDrawer.toFixed(2)}</td></tr>
          </table>

        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };
  return /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-3 bg-secondary/30 p-2 rounded-xl border border-border w-fit", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx("span", { className: "text-sm font-bold text-primary", children: "من تاريخ:" }),
        /* @__PURE__ */ jsx("input", { type: "date", value: fromDate, onChange: (e) => setFromDate(e.target.value), className: "h-9 text-sm font-bold rounded-md bg-background border border-input px-2 cursor-pointer text-emerald-700" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx("span", { className: "text-sm font-bold text-primary", children: "إلى تاريخ:" }),
        /* @__PURE__ */ jsx("input", { type: "date", value: toDate, onChange: (e) => setToDate(e.target.value), className: "h-9 text-sm font-bold rounded-md bg-background border border-input px-2 cursor-pointer text-emerald-700" })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "bg-card border border-border rounded-xl overflow-hidden", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
      /* @__PURE__ */ jsx("thead", { className: "bg-secondary/50 text-xs", children: /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("th", { className: "text-right p-3", children: "تاريخ ووقت الشيفت" }),
        /* @__PURE__ */ jsx("th", { className: "text-right p-3", children: "الكاشير" }),
        /* @__PURE__ */ jsx("th", { className: "text-right p-3", children: "عدد الفواتير" }),
        /* @__PURE__ */ jsx("th", { className: "text-right p-3", children: "التوتال النهائي (Net Cash)" }),
        /* @__PURE__ */ jsx("th", { className: "text-right p-3", children: "الإجراءات" })
      ] }) }),
      /* @__PURE__ */ jsx("tbody", { children: isLoading ? (
        /* ⏳ مؤشر تحميل من السيرفر */
        /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 5, className: "p-8 text-center text-amber-600 font-medium animate-pulse", children: "جاري استرجاع الورديات والتقارير من السيرفر (pgAdmin)..." }) })
      ) : shiftsWithData.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 5, className: "p-8 text-center text-muted-foreground", children: "لا توجد شيفتات مسجلة." }) }) : shiftsWithData.map((report, idx) => /* @__PURE__ */ jsxs("tr", { className: "border-t border-border", children: [
        /* @__PURE__ */ jsxs("td", { className: "p-3 text-xs", children: [
          /* @__PURE__ */ jsx("div", { children: new Date(Number(report.shift.openedAt)).toLocaleString("ar-EG") }),
          /* @__PURE__ */ jsxs("div", { className: "text-muted-foreground", children: [
            "إلى:",
            " ",
            report.shift.closedAt ? new Date(Number(report.shift.closedAt)).toLocaleTimeString("ar-EG") : "الآن"
          ] })
        ] }),
        /* @__PURE__ */ jsx("td", { className: "p-3 font-medium", children: report.shift.cashierName || report.shift.cashier_name || "Unkonwn يا يوسف" }),
        /* @__PURE__ */ jsx("td", { className: "p-3", children: report.invoiceCount }),
        /* @__PURE__ */ jsxs("td", { className: "p-3 font-bold text-emerald-600", children: [
          fmt2(report.total),
          " ج.م"
        ] }),
        /* @__PURE__ */ jsx("td", { className: "p-3", children: /* @__PURE__ */ jsxs("div", { className: "flex gap-1", children: [
          /* @__PURE__ */ jsxs(Button, { size: "sm", variant: "outline", onClick: () => setDetailShift(report), children: [
            /* @__PURE__ */ jsx(Info, { className: "w-3 h-3" }),
            /* @__PURE__ */ jsx("span", { className: "mr-1", children: "التفاصيل" })
          ] }),
          /* @__PURE__ */ jsxs(Button, { size: "sm", variant: "outline", onClick: () => {
            const sourceInvoices = pos.invoices.length > 0 ? pos.invoices : serverInvoices;
            const shiftInvoices = sourceInvoices.filter((inv) => {
              if (inv.createdAt < report.shift.openedAt) return false;
              if (report.shift.closedAt && inv.createdAt > report.shift.closedAt) return false;
              return true;
            });
            printShiftReport(report.shift, shiftInvoices);
          }, children: [
            /* @__PURE__ */ jsx(Printer, { className: "w-3 h-3" }),
            /* @__PURE__ */ jsx("span", { className: "mr-1", children: "طباعة" })
          ] })
        ] }) })
      ] }, idx)) })
    ] }) }),
    detailShift && /* @__PURE__ */ jsx(Dialog, { open: true, onOpenChange: () => setDetailShift(null), children: /* @__PURE__ */ jsxs(DialogContent, { dir: "rtl", className: "max-w-5xl p-6 overflow-y-auto max-h-[90vh]", children: [
      /* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsxs(DialogTitle, { className: "text-xl font-bold flex items-center gap-2 border-b pb-3 text-primary", children: [
        /* @__PURE__ */ jsx(Clock, { className: "w-5 h-5 text-emerald-600" }),
        /* @__PURE__ */ jsxs("span", { children: [
          "تقرير تفاصيل وردية الكاشير: (",
          detailShift.shift.cashierName,
          ")"
        ] })
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "bg-secondary/40 rounded-xl p-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs mb-4 border border-border", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("span", { className: "font-semibold text-muted-foreground", children: [
            "تاريخ ووقت الفتح:",
            " "
          ] }),
          /* @__PURE__ */ jsx("span", { className: "font-mono text-foreground", children: new Date(Number(detailShift.shift.openedAt)).toLocaleString("ar-EG") })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("span", { className: "font-semibold text-muted-foreground", children: [
            "تاريخ ووقت الإغلاق:",
            " "
          ] }),
          /* @__PURE__ */ jsx("span", { className: "font-mono text-foreground", children: detailShift.shift.closedAt ? new Date(Number(detailShift.shift.closedAt)).toLocaleString("ar-EG") : "لا يزال مفتوحاً الأن" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-3", children: [
        /* @__PURE__ */ jsx(Card, { icon: ChefHat, label: "المطبخ", value: detailShift.kitchen, accent: "orange" }),
        /* @__PURE__ */ jsx(Card, { icon: Wine, label: "البار", value: detailShift.bar, accent: "rose" }),
        /* @__PURE__ */ jsx(Card, { icon: Cloud, label: "الشيشة", value: detailShift.shisha, accent: "purple" }),
        /* @__PURE__ */ jsx(CardWithCommission, { icon: Receipt, label: "فاست (Fast)", value: detailShift.fastTotal, commission: detailShift.fastCommission, count: detailShift.fastCount, accent: "amber" }),
        /* @__PURE__ */ jsx(CardWithCommission, { icon: ShoppingBag, label: "طلبات (Talabat)", value: detailShift.talabatTotal, commission: detailShift.talabatCommission, count: detailShift.talabatCount, accent: "orange" }),
        /* @__PURE__ */ jsx(Card, { icon: ShoppingBag, label: "التيك أواي (إحصائية)", value: detailShift.takeaway, accent: "sky" }),
        /* @__PURE__ */ jsx(Card, { icon: Bike, label: "أوردر التوصيل (إحصائية)", value: detailShift.delivery, accent: "amber" }),
        /* @__PURE__ */ jsx(Card, { icon: DollarSign, label: "رسوم التوصيل", value: detailShift.deliveryFees, accent: "emerald" }),
        /* @__PURE__ */ jsx(Card, { icon: DollarSign, label: "الإيرادات الأساسية", value: detailShift.subtotal, accent: "slate" }),
        /* @__PURE__ */ jsx(Card, { icon: Minus, label: "الخصم", value: detailShift.discount, accent: "rose" }),
        /* @__PURE__ */ jsx(Card, { icon: Percent, label: "القيمة المضافة (14%)", value: detailShift.tax, accent: "indigo" }),
        /* @__PURE__ */ jsx(Card, { icon: Receipt, label: "المجموع الكلي", value: detailShift.subtotal + detailShift.tax + detailShift.deliveryFees, accent: "slate" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-5 bg-emerald-600 text-white rounded-xl p-4 flex items-center justify-between shadow-md", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-lg bg-white/20 grid place-items-center", children: /* @__PURE__ */ jsx(Wallet, { className: "w-6 h-6 text-white" }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "text-sm font-medium text-emerald-100", children: "التوتال النهائي (Net Cash in Drawer)" }),
            /* @__PURE__ */ jsxs("p", { className: "text-xs text-emerald-200 mt-0.5", children: [
              "عدد الفواتير المسجلة: ",
              detailShift.invoiceCount,
              " فاتورة"
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "text-left", children: /* @__PURE__ */ jsxs("p", { className: "text-2xl font-black", children: [
          fmt2(detailShift.total),
          " ",
          /* @__PURE__ */ jsx("span", { className: "text-xs font-normal text-emerald-100", children: "ج.م" })
        ] }) })
      ] }),
      /* @__PURE__ */ jsx(DialogFooter, { className: "mt-4 border-t pt-3 flex gap-2 justify-end", children: /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => setDetailShift(null), children: "إغلاق النافذة" }) })
    ] }) })
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
  return /* @__PURE__ */ jsxs("div", { className: "bg-card border border-border rounded-xl p-4", children: [
    /* @__PURE__ */ jsx("div", { className: `w-10 h-10 rounded-lg grid place-items-center ${colors[accent]}`, children: /* @__PURE__ */ jsx(Icon, { className: "w-5 h-5" }) }),
    /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mt-2", children: label }),
    /* @__PURE__ */ jsxs("p", { className: "text-xl font-bold mt-1", children: [
      fmt2(value),
      " ",
      /* @__PURE__ */ jsx("span", { className: "text-xs font-normal text-muted-foreground", children: "ج.م" })
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
    orange: "bg-orange-50 text-orange-700",
    amber: "bg-amber-50 text-amber-700"
  };
  return /* @__PURE__ */ jsxs("div", { className: "bg-card border rounded-xl p-4 flex flex-col justify-between relative overflow-hidden", children: [
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
  SettingsPage as component
};
