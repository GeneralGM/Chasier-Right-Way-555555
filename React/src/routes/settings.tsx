/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
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
  Bike,
} from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { getApiUrl } from "@/api";
const API_URL = getApiUrl();

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "الإعدادات - أرشيف الفواتير" }] }),
  component: SettingsPage,
});

type Tab = "invoices" | "shifts";
type InvTab = "takeaway" | "dinein";
type Range = "today" | "week" | "all";

const printInvoice = (invoice: Invoice) => {
  const printWindow = window.open("", "_blank", "width=650,height=850");
  if (!printWindow) return;

  // 1. الحسابات والتعامل الذكي مع القيم الرقمية من الداتابيز أو الفرونت إند
  const dPrice =
    Number(invoice.deliveryPrice) ||
    Number((invoice as any).delivery_price) ||
    0;
  const taxVal =
    Number(invoice.taxValue) || Number((invoice as any).tax_value) || 0;
  const discVal =
    Number(invoice.discountValue) ||
    Number((invoice as any).discount_value) ||
    0;
  const finalDiscVal =
    discVal ||
    (Number(invoice.subtotal || 0) *
      Number(invoice.discountPct || (invoice as any).discount_pct || 0)) /
      100 ||
    0;

  // حساب الضريبة لو مش موجودة
  const finalTaxVal =
    taxVal ||
    ((Number(invoice.subtotal || 0) - discVal) *
      Number(invoice.taxPct || (invoice as any).tax_pct || 0)) /
      100 ||
    0;

  // حساب الإجمالي النهائي
  const computedTotal =
    Number(invoice.total) ||
    Number(invoice.subtotal || 0) - discVal + finalTaxVal + dPrice;

  // تأمين فك المصفوفة (Items) لو جاية كـ String من قاعدة البيانات
  const itemsArray =
    typeof invoice.items === "string"
      ? JSON.parse(invoice.items)
      : invoice.items || [];

  // جلب قيمة عمولة المنصة
  const commVal =
    Number(invoice.commissionValue) ||
    Number((invoice as any).commission_value) ||
    0;

  // تحضير اسم ونوع الطلب باللغة العربية
  const orderTypeArabic =
    invoice.type === "delivery"
      ? "توصيل (Delivery)"
      : invoice.type === "takeaway"
        ? "تيك أواي (Takeaway)"
        : "صالة (Dine-In)";

  // تنسيق التاريخ والوقت بشكل مريح للعين
  const formattedDate = invoice.createdAt
    ? new Date(invoice.createdAt).toLocaleDateString("ar-EG", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
    : new Date().toLocaleDateString("ar-EG");

  const formattedTime = invoice.createdAt
    ? new Date(invoice.createdAt).toLocaleTimeString("ar-EG", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : new Date().toLocaleTimeString("ar-EG", {
        hour: "2-digit",
        minute: "2-digit",
      });

  const cashierName =
    (invoice as any).cashierName ||
    (invoice as any).cashier_name ||
    "...........";
  const tableName =
    (invoice as any).table_name || invoice.tableCode || "...........";

  // 2. دمج هيكل الـ HTML الأنيق بالتصميم الـ Static وحقن البيانات ديناميكياً
  const html = `
    <!doctype html>
    <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>فاتورة - مول زايد</title>
        <script src="https://cdn.tailwindcss.com"></script>
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

          ${
            (invoice.type === "takeaway" || invoice.type === "delivery") &&
            invoice.orderCategory &&
            invoice.orderCategory !== "normal"
              ? `
              <div class="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-2.5 text-center text-xs font-bold mb-4">
                منصة التوصيل: 
                <span>
                  ${
                    invoice.orderCategory === "talabat"
                      ? "طلبات (Talabat)"
                      : invoice.orderCategory === "fast"
                        ? "فاست (Fast)"
                        : invoice.orderCategory
                  }
                </span>
              </div>
              `
              : ""
          }

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
              ${itemsArray
                .map((line: any) => {
                  // تجميع وعرض الإضافات (Extras) إن وجدت
                  const exStr =
                    line.extras && line.extras.length
                      ? ` <span class="text-xs text-gray-500 block mt-0.5 font-normal break-words whitespace-normal leading-relaxed">(+ ${line.extras.map((e: any) => e.name || e.label).join(", ")})</span>`
                      : "";

                  const displayName =
                    line.mealName || line.name || "صنف غير معروف";

                  // حساب السعر الفردي شامل الإضافات
                  const singlePrice =
                    Number(line.unitPrice || line.price || 0) +
                    (line.extras
                      ? line.extras.reduce(
                          (s: number, e: any) => s + Number(e.price || 0),
                          0,
                        )
                      : 0);

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
                })
                .join("")}
            </tbody>
          </table>
          </div>

          <div class="separator-solid"></div>

          <div class="mb-6 space-y-2.5 text-sm">
            <div class="flex justify-between items-center">
              <span class="text-gray-800 font-bold">المجموع الأصلي:</span>
              <span class="text-gray-700 font-semibold">${Number(invoice.subtotal || 0).toFixed(2)}</span>
            </div>
            
            ${
              finalDiscVal > 0
                ? `
                <div class="flex justify-between items-center text-red-600 font-bold">
                  <span>الخصم (${invoice.discountPct || 0}%):</span>
                  <span>-${finalDiscVal.toFixed(2)}</span>
                </div>
                `
                : ""
            }
            
            ${
              finalTaxVal > 0
                ? `
                <div class="flex justify-between items-center text-gray-700">
                  <span>الضريبة (${invoice.taxPct || 0}%):</span>
                  <span>${finalTaxVal.toFixed(2)}</span>
                </div>
                `
                : ""
            }

            ${
              commVal > 0
                ? `
                <div class="flex justify-between items-center text-amber-700 font-bold">
                  <span>منصة (${invoice.orderCategory === "talabat" ? "طلبات" : "فاست"}):</span>
                  <span>+${commVal.toFixed(2)}</span>
                </div>
                `
                : ""
            }

            ${
              dPrice > 0
                ? `
                <div class="flex justify-between items-center text-gray-700 font-semibold">
                  <span>خدمة التوصيل:</span>
                  <span>+${dPrice.toFixed(2)}</span>
                </div>
                `
                : ""
            }

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
        </script>
      </body>
    </html>
  `;

  // كتابة محتوى الـ HTML المشكّل ديناميكياً وعرضه
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
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
function InvoicesTab() {
  const { db: pos } = usePosDB();
  const [sub, setSub] = useState<InvTab>("takeaway");
  const [q, setQ] = useState("");

  // 🌟 فلاتر التاريخ الجديدة (الافتراضي: اليوم الحالي)
  const [fromDate, setFromDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [toDate, setToDate] = useState(new Date().toISOString().slice(0, 10));

  const [serverInvoices, setServerInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 🔄 جلب الفواتير بناءً على التاريخ المختار
  useEffect(() => {
    async function fetchInvoicesFromPostgres() {
      try {
        setIsLoading(true);
        // تظبيط الساعات عشان يجيب اليوم من أوله لآخره
        const start = new Date(fromDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);

        const response = await fetch(
          `http://${API_URL}:5000/api/invoices?startDate=${start.toISOString()}&endDate=${end.toISOString()}`,
        );
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
  }, [fromDate, toDate]); // 👈 هتتحدث تلقائي لما تغير التاريخ

  // 🌟 دمج الفواتير وتطبيق فلاتر النص والنوع
  const rows: Invoice[] = useMemo(() => {
    const map = new Map<string, Invoice>();
    pos.invoices.forEach((inv) => map.set(inv.id, inv));
    serverInvoices.forEach((inv) => map.set(inv.id, inv));

    const mergedInvoices = Array.from(map.values()).sort(
      (a, b) => b.createdAt - a.createdAt,
    );

    return mergedInvoices.filter((i) => {
      if (sub === "takeaway" && i.type !== "takeaway" && i.type !== "delivery")
        return false;
      if (sub === "dinein" && i.type !== "dinein") return false;

      // شلنا فلتر الوقت من هنا لأن السيرفر بقى يجيب المتفلتر جاهز!

      if (q) {
        const hay =
          `${i.invoiceNumber || ""} ${i.tableCode || ""} ${i.customerName || ""} ${i.customerAddress || ""}`.toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [pos.invoices, serverInvoices, sub, q]);

  function exportToExcel() {
    const data = rows.map((inv) => {
      const shift = pos.shifts.find(
        (s) =>
          inv.createdAt >= s.openedAt &&
          (!s.closedAt || inv.createdAt <= s.closedAt),
      );
      const soldItems =
        inv.items?.map((i) => `${i.name}×${i.qty}`).join(" , ") || "";
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
              {t === "takeaway" ? "تيك أواي / دليفري" : "زبون (صالة)"}
            </button>
          ))}
        </div>
        {/* 🌟 فلاتر التاريخ (من - إلى) للفواتير */}
        <div className="flex items-center gap-2 bg-secondary rounded-lg p-1 px-2 border border-border">
          <span className="text-xs font-bold text-muted-foreground">من:</span>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="h-7 text-xs rounded bg-background border-none px-1 text-primary font-bold cursor-pointer"
          />
          <span className="text-xs font-bold text-muted-foreground">إلى:</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="h-7 text-xs rounded bg-background border-none px-1 text-primary font-bold cursor-pointer"
          />
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
              <th className="text-right p-3">نوع الطلب</th>
              <th className="text-right p-3">البيان (الطاولة / العميل)</th>
              <th className="text-right p-3">الكاشير</th>
              <th className="text-right p-3">الأصناف</th>
              <th className="text-right p-3">المجموع</th>
              <th className="text-right p-3">الخصم</th>
              {/* 🌟 الشرط الجديد: لو صالة يظهر الضريبة، لو تيك أواي أو دليفري تظهر قيمة المنصة */}
              {sub === "dinein" ? (
                <th className="text-right p-3 w-16 text-purple-600">الضريبة</th>
              ) : (
                <th className="text-right p-3 w-20 text-amber-600 font-bold">
                  منصة توصيل
                </th>
              )}
              {/* 🌟 تعديل ديناميكي لعمود الكابتن والتوصيل */}
              {sub === "dinein" ? (
                <th className="text-right p-3 text-blue-600 font-bold">
                  كابتن
                </th>
              ) : (
                <th className="text-right p-3">التوصيل</th>
              )}
              <th className="text-right p-3">الإجمالي</th>
              <th className="text-right p-3">طباعة</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td
                  colSpan={12}
                  className="p-8 text-center text-amber-600 font-medium animate-pulse"
                >
                  جاري جلب الفواتير من الأرشيف (pgAdmin)...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td
                  colSpan={12}
                  className="p-8 text-center text-muted-foreground"
                >
                  لا توجد فواتير مطابقة للفلاتر المحددة.
                </td>
              </tr>
            ) : (
              rows.map((inv) => (
                <tr key={inv.id} className="border-t border-border">
                  <td className="p-3 font-mono text-xs">
                    {inv.invoiceNumber || "-"}
                  </td>
                  {/* 🌟 عرض الوقت فقط بدون ثواني بناءً على طلبك السابق */}
                  <td className="p-3 font-mono">
                    {new Date(inv.createdAt).toLocaleTimeString("ar-EG", {
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })}
                  </td>
                  <td className="p-3 text-xs">
                    {inv.type === "delivery" ? (
                      <span className="px-2 py-1 rounded bg-amber-100 text-amber-800 font-medium">
                        توصيل 🛵
                      </span>
                    ) : inv.type === "takeaway" ? (
                      <span className="px-2 py-1 rounded bg-green-100 text-green-800 font-medium">
                        تيك أواي 🛍️
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded bg-blue-100 text-blue-800 font-medium">
                        صالة 🍽️
                      </span>
                    )}
                  </td>
                  <td className="p-3">
                    {inv.type === "takeaway" || inv.type === "delivery" ? (
                      <div>
                        <div className="font-medium">
                          {inv.customerName || "عميل نقدي"}
                        </div>
                        {inv.customerAddress && (
                          <div className="text-xs text-muted-foreground">
                            {inv.customerAddress}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="font-mono font-bold text-blue-600">
                        {inv.tableCode || "—"}
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-muted-foreground">
                    {inv.cashierName || "—"}
                  </td>
                  <td className="p-3">
                    {(typeof inv.items === "string"
                      ? JSON.parse(inv.items)
                      : inv.items || []
                    ).reduce(
                      (sum: number, item: any) => sum + (Number(item.qty) || 1),
                      0,
                    )}
                  </td>
                  <td className="p-3">{fmt2(inv.subtotal)}</td>
                  <td className="p-3">
                    {Math.floor(
                      +fmt2(inv.discountPct || (inv as any).discount_pct || 0),
                    )}
                    % &asymp;&nbsp;
                    {fmt2(
                      inv.discountValue || (inv as any).discount_value || 0,
                    )}
                  </td>
                  {sub === "dinein" ? (
                    <td className="p-3">
                      {fmt2(
                        inv.taxValue ||
                          (inv as any).tax_value ||
                          ((Number(inv.subtotal) -
                            Number(
                              inv.discountValue ||
                                (inv as any).discount_value ||
                                0,
                            )) *
                            Number(inv.taxPct || (inv as any).tax_pct || 0)) /
                            100 ||
                          0,
                      )}
                    </td>
                  ) : (
                    <td className="p-3 font-bold">
                      {inv.orderCategory === "talabat" ? (
                        <span className="px-2 py-0.5 rounded bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-200">
                          طلبات
                        </span>
                      ) : inv.orderCategory === "fast" ? (
                        <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200">
                          فاست
                        </span>
                      ) : (
                        <span className="text-muted-foreground font-normal">
                          عادي
                        </span>
                      )}
                    </td>
                  )}
                  {/* 🌟 خلية الكابتن أو التوصيل حسب حالة الصالة */}
                  {sub === "dinein" ? (
                    <td className="p-3 font-bold text-blue-600">
                      {inv.captainName || inv.captain_name || "—"}
                    </td>
                  ) : (
                    <td className="p-3 font-medium text-amber-600">
                      {inv.deliveryPrice && inv.deliveryPrice > 0
                        ? `${fmt2(inv.deliveryPrice)} ج.م`
                        : "—"}
                    </td>
                  )}
                  <td className="p-3 font-bold text-emerald-600">
                    {fmt2(
                      inv.total ||
                        Number(inv.subtotal || 0) -
                          Number(
                            inv.discountValue ||
                              (inv as any).discount_value ||
                              0,
                          ) +
                          Number(
                            inv.taxValue ||
                              (inv as any).tax_value ||
                              ((Number(inv.subtotal || 0) -
                                Number(
                                  inv.discountValue ||
                                    (inv as any).discount_value ||
                                    0,
                                )) *
                                Number(
                                  inv.taxPct || (inv as any).tax_pct || 0,
                                )) /
                                100 ||
                              0,
                          ) +
                          Number(
                            inv.deliveryPrice ||
                              (inv as any).delivery_price ||
                              0,
                          ),
                    )}
                  </td>
                  <td className="p-3 font-bold">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => printInvoice(inv)}
                      className="gap-2"
                    >
                      <Printer className="w-4 h-4" /> طباعة
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

interface ShiftReport {
  shift: ShiftState;
  invoiceCount: number;
  kitchen: number;
  bar: number;
  shisha: number;
  takeaway: number;
  delivery: number;
  deliveryFees: number;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  revenues: number;
  // 🌟 الحقول الجديدة لدعم فاست وطلبات
  fastTotal: number;
  fastCount: number;
  fastCommission: number;
  talabatTotal: number;
  talabatCount: number;
  talabatCommission: number;
}

function ShiftsTab() {
  const { db: pos } = usePosDB();
  const { db } = useDB();
  const [detailShift, setDetailShift] = useState<ShiftReport | null>(null);

  // 🌟 فلاتر التاريخ الجديدة (الافتراضي: من أمس لليوم = آخر 24 ساعة تقريباً)
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1); // من إمبارح
    return d.toISOString().slice(0, 10);
  });
  const [toDate, setToDate] = useState(new Date().toISOString().slice(0, 10));

  const [serverShifts, setServerShifts] = useState<any[]>([]);
  const [serverInvoices, setServerInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchShiftsAndInvoices() {
      try {
        setIsLoading(true);
        // تجهيز التواريخ للباك إند
        const start = new Date(fromDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        const startIso = start.toISOString();
        const endIso = end.toISOString();

        // التعديل هنا: بنضمن إننا بنجيب الشيفتات الشاملة للمحل كله من السيرفر المركزي
        const [shiftsRes, invoicesRes] = await Promise.all([
          fetch(
            `http://${API_URL}:5000/api/shifts?startDate=${startIso}&endDate=${endIso}`,
          ),
          fetch(
            `http://${API_URL}:5000/api/invoices?startDate=${startIso}&endDate=${endIso}`,
          ),
        ]);

        if (shiftsRes.ok && invoicesRes.ok) {
          const shiftsData = await shiftsRes.json();
          const invoicesData = await invoicesRes.json();

          // حفظ الداتا القادمة من السيرفر مباشرة في الـ States المخصصة لها بدون تغيير أسامي
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
  }, [fromDate, toDate]); // 👈 تتحدث فوراً لو اخترت تاريخ مختلف

  const shiftsWithData: ShiftReport[] = useMemo(() => {
    const shiftsMap = new Map();
    serverShifts.forEach((s) => shiftsMap.set(s.id, s));
    pos.shifts.forEach((s) => shiftsMap.set(s.id, s));
    const sourceShifts = Array.from(shiftsMap.values());

    const invoicesMap = new Map();
    serverInvoices.forEach((i) => invoicesMap.set(i.id, i));
    pos.invoices.forEach((i) => invoicesMap.set(i.id, i));
    const sourceInvoices = Array.from(invoicesMap.values());

    const sortedShifts = [...sourceShifts].sort(
      (a, b) => (b.closedAt || 0) - (a.closedAt || 0),
    );

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
      let tax = Number(shift.taxValue || (shift as any).tax_value) || 0;
      let discount =
        Number(shift.discountValue || (shift as any).discount_value) || 0;

      let subtotal = kitchen + bar + shisha;

      // 🌟 متغيرات تتبع المنصات لكل شيفت بشكل منفصل
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
        let deliveryFeesOnly = 0;
        subtotal = 0;
        discount = 0;
        tax = 0;

        for (const inv of shiftInvoices) {
          subtotal += inv.subtotal;
          discount +=
            Number(inv.discountValue || (inv as any).discount_value) || 0;
          const invDiscount =
            Number(inv.discountValue || (inv as any).discount_value) || 0;
          const invTaxPct = Number(inv.taxPct || (inv as any).tax_pct) || 0;
          tax +=
            Number(inv.taxValue || (inv as any).tax_value) ||
            ((Number(inv.subtotal) - invDiscount) * invTaxPct) / 100 ||
            0;

          const deliveryFee = Number(inv.deliveryPrice) || 0;
          deliveryFeesOnly += deliveryFee;

          if (inv.type === "takeaway") {
            takeawayOnly += inv.total - deliveryFee;
          } else if (inv.type === "delivery") {
            deliveryOnly += inv.total - deliveryFee;
          }

          // 🌟 فرز وحساب منصات فاست وطلبات للشيفتات المجمعة لأرشيف التفاصيل
          const cat =
            inv.orderCategory || (inv as any).order_category || "normal";
          if (cat === "fast") {
            fastTotal += inv.total;
            fastCount++;
            fastCommission += Number(
              inv.commissionValue || (inv as any).commission_value || 0,
            );
          } else if (cat === "talabat") {
            talabatTotal += inv.total;
            talabatCount++;
            talabatCommission += Number(
              inv.commissionValue || (inv as any).commission_value || 0,
            );
          }

          for (const line of inv.items) {
            const meal = db.meals.find((m) => m.id === line.mealId);
            const extras =
              line.extras?.reduce(
                (s: any, e: any) => s + Number(e.price || 0),
                0,
              ) || 0;
            const v =
              (Number(line.unitPrice || line.price || 0) + extras) *
              Number(line.qty || 1);

            let deptName = line.department || "مطبخ";
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
      }

      // المعادلة النهائية المتناسقة
      const finalNetCash = kitchen + bar + shisha + tax - discount;

      return {
        shift,
        invoiceCount:
          shiftInvoices.length || Number((shift as any).invoice_count) || 0,
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
        talabatCommission: clamp0(talabatCommission),
      };
    });
  }, [pos.shifts, serverShifts, pos.invoices, serverInvoices, db.meals]);

  // 🌟 دالة طباعة تقرير الشيفت المحدثة بالكامل (مطابقة للشاشة والتقارير)
  const printShiftReport = (shift: any, shiftInvoices: any[]) => {
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

    // 🌟 متغيرات المنصات المضافة حديثاً للطباعة
    let fastTotal = 0;
    let talabatTotal = 0;
    let talabatCommission = 0;

    shiftInvoices.forEach((inv) => {
      if (inv.type === "dinein" || inv.type === "dine-in")
        totalDineIn += Number(inv.total) || 0;
      else if (inv.type === "takeaway") totalTakeaway += Number(inv.total) || 0;
      else if (inv.type === "delivery") totalDelivery += Number(inv.total) || 0;
      else if (inv.type === "staff" || inv.type === "موظفين")
        totalStaff += Number(inv.total) || 0;
      else if (inv.type === "hospitality" || inv.type === "ضيافة")
        totalHospitality += Number(inv.total) || 0;

      grossSales += Number(inv.subtotal) || 0;
      const invDiscount =
        Number(inv.discountValue || (inv as any).discount_value) || 0;
      totalDiscount += invDiscount;

      const invTaxPct = Number(inv.taxPct || (inv as any).tax_pct) || 0;
      totalTax +=
        Number(inv.taxValue || (inv as any).tax_value) ||
        ((Number(inv.subtotal) - invDiscount) * invTaxPct) / 100 ||
        0;

      totalDeliveryFee +=
        Number(inv.deliveryPrice || (inv as any).delivery_price) || 0;

      // 🌟 تجميع حسابات فاست وطلبات جوه لوب الطباعة
      const cat = inv.orderCategory || (inv as any).order_category || "normal";
      if (cat === "fast") {
        fastTotal += Number(inv.total) || 0;
      } else if (cat === "talabat") {
        talabatTotal += Number(inv.total) || 0;
        talabatCommission += Number(
          inv.commissionValue || (inv as any).commission_value || 0,
        );
      }

      if (inv.paymentMethod === "visa" || inv.paymentMethod === "فيزا") {
        visaTotal += Number(inv.total) || 0;
      } else {
        cashTotal += Number(inv.total) || 0;
      }

      const itemsArray =
        typeof inv.items === "string" ? JSON.parse(inv.items) : inv.items || [];
      itemsArray.forEach((item: any) => {
        const extrasPrice =
          item.extras?.reduce(
            (s: number, e: any) => s + Number(e.price || 0),
            0,
          ) || 0;
        const lineTotal =
          (Number(item.unitPrice || item.price || 0) + extrasPrice) *
          Number(item.qty || 1);

        const meal = db.meals?.find((m: any) => m.id === item.mealId);
        let deptName = item.department || "مطبخ";
        if (meal) {
          const isShisha =
            meal.department === "شيشه" ||
            (meal.category || "").trim().replace("ة", "ه") === "شيشه";
          if (isShisha) deptName = "شيشة";
          else if (meal.department) deptName = meal.department;
        }

        if (deptName.includes("شيش")) shishaSales += lineTotal;
        else if (deptName.includes("بار")) barSales += lineTotal;
        else kitchenSales += lineTotal;
      });
    });

    // 🌟 المعادلة الموحدة والنهائية للتوتال الصافي تطابق شاشة الـ Reports تماماً
    const finalNetSales =
      kitchenSales + barSales + shishaSales + totalTax - totalDiscount;

    const shiftOpenTime = shift.openedAt
      ? new Date(shift.openedAt).toLocaleString("ar-EG")
      : "غير محدد";
    const shiftCloseTime = shift.closedAt
      ? new Date(shift.closedAt).toLocaleString("ar-EG")
      : "ما زال مفتوحاً";
    const openingBalance =
      Number(shift.startingCash) || Number(shift.initialCash) || 0;
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

  return (
    <div className="space-y-3">
      {/* 🌟 فلاتر التاريخ (من - إلى) للشيفتات */}
      <div className="flex flex-wrap items-center gap-3 bg-secondary/30 p-2 rounded-xl border border-border w-fit">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-primary">من تاريخ:</span>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="h-9 text-sm font-bold rounded-md bg-background border border-input px-2 cursor-pointer text-emerald-700"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-primary">إلى تاريخ:</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="h-9 text-sm font-bold rounded-md bg-background border border-input px-2 cursor-pointer text-emerald-700"
          />
        </div>
      </div>
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
            {isLoading ? (
              /* ⏳ مؤشر تحميل من السيرفر */
              <tr>
                <td
                  colSpan={5}
                  className="p-8 text-center text-amber-600 font-medium animate-pulse"
                >
                  جاري استرجاع الورديات والتقارير من السيرفر (pgAdmin)...
                </td>
              </tr>
            ) : shiftsWithData.length === 0 ? (
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
                      {new Date(Number(report.shift.openedAt)).toLocaleString(
                        "ar-EG",
                      )}
                    </div>
                    <div className="text-muted-foreground">
                      إلى:{" "}
                      {report.shift.closedAt
                        ? new Date(
                            Number(report.shift.closedAt),
                          ).toLocaleTimeString("ar-EG")
                        : "الآن"}
                    </div>
                  </td>
                  <td className="p-3 font-medium">
                    {report.shift.cashierName ||
                      report.shift.cashier_name ||
                      "Unkonwn يا يوسف"}
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
                        <span className="mr-1">التفاصيل</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          // 🌟 تجميع فواتير الشيفت ده مخصوص عشان نبعتها لدالة الطباعة الجديدة
                          const sourceInvoices =
                            pos.invoices.length > 0
                              ? pos.invoices
                              : serverInvoices;
                          const shiftInvoices = sourceInvoices.filter((inv) => {
                            if (inv.createdAt < report.shift.openedAt)
                              return false;
                            if (
                              report.shift.closedAt &&
                              inv.createdAt > report.shift.closedAt
                            )
                              return false;
                            return true;
                          });

                          // 🌟 نداء الدالة باسمها الجديد (printShiftReport) وبِعَتْنَالها الشيفت وفواتيره
                          printShiftReport(report.shift, shiftInvoices);
                        }}
                      >
                        <Printer className="w-3 h-3" />
                        <span className="mr-1">طباعة</span>
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
          <DialogContent
            dir="rtl"
            className="max-w-5xl p-6 overflow-y-auto max-h-[90vh]"
          >
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2 border-b pb-3 text-primary">
                <Clock className="w-5 h-5 text-emerald-600" />
                <span>
                  تقرير تفاصيل وردية الكاشير: ({detailShift.shift.cashierName})
                </span>
              </DialogTitle>
            </DialogHeader>

            {/* 📅 الميتا داتا الخاصة بالوردية */}
            <div className="bg-secondary/40 rounded-xl p-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs mb-4 border border-border">
              <div>
                <span className="font-semibold text-muted-foreground">
                  تاريخ ووقت الفتح:{" "}
                </span>
                <span className="font-mono text-foreground">
                  {new Date(Number(detailShift.shift.openedAt)).toLocaleString(
                    "ar-EG",
                  )}
                </span>
              </div>
              <div>
                <span className="font-semibold text-muted-foreground">
                  تاريخ ووقت الإغلاق:{" "}
                </span>
                <span className="font-mono text-foreground">
                  {detailShift.shift.closedAt
                    ? new Date(
                        Number(detailShift.shift.closedAt),
                      ).toLocaleString("ar-EG")
                    : "لا يزال مفتوحاً الأن"}
                </span>
              </div>
            </div>

            {/* 📊 شبكة الكروت الإحصائية الموحدة وشاملة المنصات والعمولة */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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

              {/* 🌟 إضافة كروت المنصات والنسبة بالجنيه بشكل مطابق تماماً لصفحة التقرير */}
              <CardWithCommission
                icon={Receipt}
                label="فاست (Fast)"
                value={detailShift.fastTotal}
                commission={detailShift.fastCommission}
                count={detailShift.fastCount}
                accent="amber"
              />
              <CardWithCommission
                icon={ShoppingBag}
                label="طلبات (Talabat)"
                value={detailShift.talabatTotal}
                commission={detailShift.talabatCommission}
                count={detailShift.talabatCount}
                accent="orange"
              />

              <Card
                icon={ShoppingBag}
                label="التيك أواي (إحصائية)"
                value={detailShift.takeaway}
                accent="sky"
              />
              <Card
                icon={Bike}
                label="أوردر التوصيل (إحصائية)"
                value={detailShift.delivery}
                accent="amber"
              />
              <Card
                icon={DollarSign}
                label="رسوم التوصيل"
                value={detailShift.deliveryFees}
                accent="emerald"
              />

              
              <Card
                icon={DollarSign}
                label="الإيرادات الأساسية"
                value={detailShift.subtotal}
                accent="slate"
              />
              <Card
                icon={Minus}
                label="الخصم"
                value={detailShift.discount}
                accent="rose"
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
                value={
                  detailShift.subtotal +
                  detailShift.tax +
                  detailShift.deliveryFees
                }
                accent="slate"
              />
            </div>

            {/* 💰 الشريط السفلي العريض للتوتال النهائي الصافي (Net Cash) */}
            <div className="mt-5 bg-emerald-600 text-white rounded-xl p-4 flex items-center justify-between shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-white/20 grid place-items-center">
                  <Wallet className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-emerald-100">
                    التوتال النهائي (Net Cash in Drawer)
                  </p>
                  <p className="text-xs text-emerald-200 mt-0.5">
                    عدد الفواتير المسجلة: {detailShift.invoiceCount} فاتورة
                  </p>
                </div>
              </div>
              <div className="text-left">
                <p className="text-2xl font-black">
                  {fmt2(detailShift.total)}{" "}
                  <span className="text-xs font-normal text-emerald-100">
                    ج.م
                  </span>
                </p>
              </div>
            </div>

            <DialogFooter className="mt-4 border-t pt-3 flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setDetailShift(null)}>
                إغلاق النافذة
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
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
// 🌟 الكومبوننت المساعد لعرض كروت فاست وطلبات شاملة النسبة المضافة بالجنيه
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
    orange: "bg-orange-50 text-orange-700",
    amber: "bg-amber-50 text-amber-700",
  };
  return (
    <div className="bg-card border rounded-xl p-4 flex flex-col justify-between relative overflow-hidden">
      <div className="flex justify-between items-start">
        <div
          className={`w-10 h-10 rounded-lg grid place-items-center ${colors[accent] || colors.orange}`}
        >
          <Icon className="w-5 h-5" />
        </div>
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
