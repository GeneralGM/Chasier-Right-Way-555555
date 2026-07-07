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

  // تأمين فك الأري عشان لو جاية كنص من الداتابيز
  const itemsArray =
    typeof invoice.items === "string"
      ? JSON.parse(invoice.items)
      : invoice.items || [];

  const html = `
    <html>
      <head>
        <title>طباعة الفاتورة</title>
        <style>
          body { font-family: Arial, sans-serif; direction: rtl; text-align: center; padding: 20px; font-size: 14px; }
          .header { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
          .type-title { font-size: 22px; font-weight: bold; margin: 10px 0; border: 2px dashed #000; padding: 5px; text-transform: uppercase; }
          .meta { margin-bottom: 10px; font-size: 12px; border-bottom: 1px dashed #000; padding-bottom: 5px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; text-align: right; }
          th { border-bottom: 1px solid #000; padding: 4px; font-size: 13px; }
          td { padding: 4px; font-size: 13px; vertical-align: top; }
          .totals { margin-top: 10px; border-top: 1px dashed #000; padding-top: 5px; text-align: right; }
          .totals div { display: flex; justify-content: space-between; margin-bottom: 3px; font-size: 13px; }
          .bold { font-weight: bold; font-size: 15px; }
        </style>
      </head>
      <body>
        <div class="header">مجمع الـمـول</div>
        <div class="type-title">ORDER</div>
        
        <div class="meta">
          <div>رقم الفاتورة: ${String(invoice.id).slice(0, 8)}</div>
          <div>التاريخ: ${new Date(invoice.createdAt).toLocaleString("ar-EG")}</div>
          <div>النوع: ${invoice.type === "delivery" ? "توصيل" : invoice.type === "takeaway" ? "تيك أواي" : "صالة"}</div>
        </div>

        <table>
          <thead>
            <tr>
              <th>الصنف</th>
              <th style="text-align:center;">الكمية</th>
              <th style="text-align:left;">الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            ${itemsArray
              .map((line: any) => {
                const exStr =
                  line.extras && line.extras.length
                    ? ` <span style="font-size:11px;color:#555;">(+${line.extras.map((e: any) => e.name || e.label).join(", ")})</span>`
                    : "";

                const displayName =
                  line.mealName || line.name || "صنف غير معروف";
                const lineTotal =
                  (Number(line.unitPrice || line.price) +
                    (line.extras
                      ? line.extras.reduce(
                          (s: number, e: any) => s + Number(e.price),
                          0,
                        )
                      : 0)) *
                  Number(line.qty);

                return `
                <tr>
                  <td>${displayName}${exStr}</td>
                  <td style="text-align:center;">${line.qty}</td>
                  <td style="text-align:left;">${lineTotal.toFixed(2)} ج</td>
                </tr>
                `;
              })
              .join("")}
          </tbody>
        </table>

        <div class="totals">
          <div><span>المجموع الأصلي:</span> <span>${Number(invoice.subtotal).toFixed(2)} ج</span></div>
          ${finalDiscVal > 0 ? `<div><span>الخصم (${invoice.discountPct || 0}%):</span> <span>${finalDiscVal.toFixed(2)} ج</span></div>` : ""}
          ${finalTaxVal > 0 ? `<div><span>الضريبة (${invoice.taxPct || 0}%):</span> <span>${finalTaxVal.toFixed(2)} ج</span></div>` : ""}          
          <div><span>التوصيل:</span> <span class="bold">${dPrice.toFixed(2)} ج</span></div>
          
          <div class="bold" style="border-top:1px solid #000; padding-top:4px; margin-top:4px;">
            <span>الإجمالي النهائي:</span> <span>${computedTotal.toFixed(2)} ج</span>
          </div>
        </div>

        <div style="margin-top:20px; font-size:11px; border-top:1px solid #000; padding-top:5px;">
          شكراً لزيارتكم!
        </div>

        <script>
          window.onload = function() { window.print(); window.close(); }
        </script>
      </body>
    </html>
  `;

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
  const [range, setRange] = useState<Range>("today");
  const [q, setQ] = useState("");

  const [serverInvoices, setServerInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 🔄 جلب كل الفواتير من السيرفر دائماً لضمان عرض الأرشيف
  useEffect(() => {
    async function fetchInvoicesFromPostgres() {
      try {
        setIsLoading(true);
        const response = await fetch(
          "http://192.168.100.195:5000/api/invoices",
        );
        if (response.ok) {
          const data = await response.json();
          setServerInvoices(data);
        }
      } catch (error) {
        console.error(
          "❌ خطأ أثناء جلب الفواتير الاحتياطية من pgAdmin:",
          error,
        );
      } finally {
        setIsLoading(false);
      }
    }

    fetchInvoicesFromPostgres();
  }, []);

  const fromTs = useMemo(() => {
    if (range === "all") return 0;
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    if (range === "week") d.setDate(d.getDate() - 6);
    return d.getTime();
  }, [range]);

  // 🌟 هنا السحر: دمج الفواتير وترتيبها وتطبيق الفلاتر
  const rows: Invoice[] = useMemo(() => {
    // 1. دمج الفواتير من المصدرين بدون تكرار (باستخدام رقم الفاتورة ID)
    const map = new Map<string, Invoice>();
    serverInvoices.forEach((inv) => map.set(inv.id, inv));
    pos.invoices.forEach((inv) => map.set(inv.id, inv));

    // 2. تحويلهم لمصفوفة وترتيبهم من الأحدث للأقدم
    const mergedInvoices = Array.from(map.values()).sort(
      (a, b) => b.createdAt - a.createdAt,
    );

    // 3. تطبيق فلاتر (النوع، الوقت، البحث)
    return mergedInvoices.filter((i) => {
      // فلتر النوع (تيك أواي/دليفري أو صالة)
      if (sub === "takeaway" && i.type !== "takeaway" && i.type !== "delivery")
        return false;
      if (sub === "dinein" && i.type !== "dinein") return false;

      // فلتر الوقت (اليوم، الأسبوع، الكل)
      if (i.createdAt < fromTs) return false;

      // فلتر البحث بالنص
      if (q) {
        const hay =
          `${i.tableCode || ""} ${i.customerName || ""} ${i.customerAddress || ""}`.toLowerCase();
        if (!hay.includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [pos.invoices, serverInvoices, sub, fromTs, q]);

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
              <th className="text-right p-3">نوع الطلب</th>
              <th className="text-right p-3">البيان (الطاولة / العميل)</th>
              <th className="text-right p-3">الكاشير</th>
              <th className="text-right p-3">الأصناف</th>
              <th className="text-right p-3">المجموع</th>
              <th className="text-right p-3">الخصم</th>
              <th className="text-right p-3">الضريبة</th>
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
                  <td className="p-3 text-xs">
                    {new Date(inv.createdAt).toLocaleString("ar-EG")}
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

                  {/* 🌟 خلية الكابتن أو التوصيل حسب حالة الصالة */}
                  {sub === "dinein" ? (
                    <td className="p-3 font-bold text-blue-600">
                      {inv.captainName || "—"}
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
}

function ShiftsTab() {
  const { db: pos } = usePosDB();
  const { db } = useDB();
  const [detailShift, setDetailShift] = useState<ShiftReport | null>(null);

  // 🌟 ولايات جديدة لجلب الشفتات والفواتير من pgAdmin لو الـ LocalStorage اتمسح
  const [serverShifts, setServerShifts] = useState<any[]>([]);
  const [serverInvoices, setServerInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 🔄 جلب البيانات من السيرفر أوتوماتيكياً في حالة مسح الذاكرة المحلية
  useEffect(() => {
    async function fetchShiftsAndInvoices() {
      if (pos.shifts.length > 0) return; // لو الداتا موجودة محلياً مفيش داعي نكلم السيرفر

      try {
        setIsLoading(true);
        const [shiftsRes, invoicesRes] = await Promise.all([
          fetch("http://192.168.100.195:5000/api/shifts"),
          fetch("http://192.168.100.195:5000/api/invoices"),
        ]);

        if (shiftsRes.ok && invoicesRes.ok) {
          const shiftsData = await shiftsRes.json();
          const invoicesData = await invoicesRes.json();
          setServerShifts(shiftsData);
          setServerInvoices(invoicesData);
        }
      } catch (err) {
        console.error("❌ خطأ أثناء جلب الشيفتات الاحتياطية من pgAdmin:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchShiftsAndInvoices();
  }, [pos.shifts.length]);

  const shiftsWithData: ShiftReport[] = useMemo(() => {
    const sourceShifts = pos.shifts.length > 0 ? pos.shifts : serverShifts;
    const sourceInvoices =
      pos.invoices.length > 0 ? pos.invoices : serverInvoices;

    const sortedShifts = [...sourceShifts].sort(
      (a, b) => (b.closedAt || 0) - (a.closedAt || 0),
    );

    return sortedShifts.map((shift) => {
      const shiftInvoices = sourceInvoices.filter((inv) => {
        if (inv.createdAt < shift.openedAt) return false;
        if (shift.closedAt && inv.createdAt > shift.closedAt) return false;
        return true;
      });

      // 🌟 التعديل السحري: نضع القيم المخزنة في السيرفر كقيمة مبدئية بدلاً من الصفر الصريح!
      let kitchen = Number(shift.kitchenSales) || 0;
      let bar = Number(shift.barSales) || 0;
      let shisha = Number(shift.shishaSales) || 0;
      let takeawayOnly = Number(shift.takeawaySales) || 0;
      let deliveryOnly = Number(shift.deliverySales) || 0;
      let tax = Number(shift.taxValue || (shift as any).tax_value) || 0;
      let discount =
        Number(shift.discountValue || (shift as any).discount_value) || 0;

      // حساب الإجمالي الأصلي (الفرعي) إذا لم تتوفر فواتير تفصيلية
      let subtotal = kitchen + bar + shisha;

      // إذا كانت هناك فواتير متوفرة فعلياً، نقوم بالحساب الديناميكي الدقيق منها
      if (shiftInvoices.length > 0 && db.meals && db.meals.length > 0) {
        // إعادة تصفير للحساب التفصيلي فقط لو الفواتير موجودة
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

          for (const line of inv.items) {
            const meal = db.meals.find((m) => m.id === line.mealId);
            if (!meal) continue;

            const extras = line.extras?.reduce((s, e) => s + e.price, 0) || 0;
            const v = (line.unitPrice + extras) * line.qty;

            const isShisha =
              meal.department === "شيشه" ||
              (meal.category || "").trim().replace("ة", "ه") === "شيشه";

            if (isShisha) shisha += v;
            else if (meal.department === "بار") bar += v;
            else kitchen += v;
          }
        }
      }

      // الاعتماد على التوتال المحسوب في السيرفر أو إعادة حسابه مع الضريبة والخصم
      const finalNetCash = shift.totalRevenue
        ? Number(shift.totalRevenue)
        : kitchen + bar + shisha + tax - discount;

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
      };
    });
  }, [pos.shifts, serverShifts, pos.invoices, serverInvoices, db.meals]);

  // 🌟 دالة طباعة تقرير الشيفت (نفس الصورة بالظبط بدون أي زيادات)
  const printShiftReport = (shift: any, shiftInvoices: any[]) => {
    // 1. حسابات التقرير الأساسية
    let totalDineIn = 0;
    let totalTakeaway = 0;
    let totalDelivery = 0;
    let totalStaff = 0;
    let totalHospitality = 0;

    let grossSales = 0;
    let totalDiscount = 0;
    let totalTax = 0;
    let totalDeliveryFee = 0;
    let netSales = 0;

    let cashTotal = 0;
    let visaTotal = 0;

    const depts: Record<string, number> = {};

    shiftInvoices.forEach((inv) => {
      // تفاصيل المبيعات (أنواع الطلبات)
      if (inv.type === "dinein" || inv.type === "dine-in")
        totalDineIn += Number(inv.total) || 0;
      else if (inv.type === "takeaway") totalTakeaway += Number(inv.total) || 0;
      else if (inv.type === "delivery") totalDelivery += Number(inv.total) || 0;
      else if (inv.type === "staff" || inv.type === "موظفين")
        totalStaff += Number(inv.total) || 0;
      else if (inv.type === "hospitality" || inv.type === "ضيافة")
        totalHospitality += Number(inv.total) || 0;

      // الحسابات المالية
      grossSales += Number(inv.subtotal) || 0;
      totalDiscount +=
        Number(inv.discountValue || (inv as any).discount_value) || 0;
      const invDiscount =
        Number(inv.discountValue || (inv as any).discount_value) || 0;
      const invTaxPct = Number(inv.taxPct || (inv as any).tax_pct) || 0;
      totalTax +=
        Number(inv.taxValue || (inv as any).tax_value) ||
        ((Number(inv.subtotal) - invDiscount) * invTaxPct) / 100 ||
        0;
      totalDeliveryFee +=
        Number(inv.deliveryPrice || (inv as any).delivery_price) || 0;
      netSales += Number(inv.total) || 0;

      // طرق الدفع
      if (inv.paymentMethod === "visa") {
        visaTotal += Number(inv.total) || 0;
      } else {
        cashTotal += Number(inv.total) || 0;
      }

      // حساب الأقسام
      const itemsArray =
        typeof inv.items === "string" ? JSON.parse(inv.items) : inv.items || [];
      itemsArray.forEach((item: any) => {
        const extrasPrice =
          item.extras?.reduce((s: number, e: any) => s + Number(e.price), 0) ||
          0;
        const lineTotal =
          (Number(item.unitPrice || item.price) + extrasPrice) *
          Number(item.qty || 1);

        const meal = db.meals?.find((m: any) => m.id === item.mealId);
        let deptName = "أخرى";
        if (meal) {
          const isShisha =
            meal.department === "شيشه" ||
            (meal.category || "").trim().replace("ة", "ه") === "شيشه";
          if (isShisha) deptName = "الشيشة";
          else if (meal.department) deptName = meal.department;
        } else if (item.department) {
          deptName = item.department;
        }

        if (!depts[deptName]) depts[deptName] = 0;
        depts[deptName] += lineTotal;
      });
    });

    // بيانات الهيدر والخزينة
    const shiftOpenTime = shift.openedAt
      ? new Date(shift.openedAt).toLocaleString("ar-EG")
      : "غير محدد";
    const shiftCloseTime = shift.closedAt
      ? new Date(shift.closedAt).toLocaleString("ar-EG")
      : "ما زال مفتوحاً";
    const printTime = new Date().toLocaleString("ar-EG");

    const openingBalance = Number(shift.startingCash) || 0;
    const expectedDrawer = openingBalance + cashTotal; // شلت المصروفات

    // تجهيز صفوف الأقسام ديناميكياً
    const deptRows = Object.entries(depts)
      .map(
        ([dept, amount]) => `
      <tr>
        <td>${dept}</td>
        <td class="bold">${amount.toFixed(2)}</td>
      </tr>
    `,
      )
      .join("");

    // 2. تصميم نافذة الطباعة (HTML/CSS)
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
            .footer-sigs {
              display: flex;
              justify-content: space-between;
              margin-top: 25px;
              font-weight: bold;
              padding: 0 15px;
              font-size: 13px;
            }
            .footer-sigs div {
              text-align: center;
            }
          </style>
        </head>
        <body onload="setTimeout(() => { window.print(); window.close(); }, 500);">
          
          <h2>تقرير وردية</h2>
          
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
              <span>${shift.cashierName || "غير معروف"}</span>
            </div> 
          </div>
            
            <table>
            <tr><td colspan="2" class="table-header">تفاصيل المبيعات</td></tr>
            <tr><td>صالة</td><td class="bold">${totalDineIn.toFixed(2)}</td></tr>
            <tr><td>بار</td><td class="bold">${totalDelivery.toFixed(2)}</td></tr>
            <tr><td>شيشة</td><td class="bold">${totalDelivery.toFixed(2)}</td></tr>
            <tr><td>ضيافة</td><td class="bold">${totalHospitality.toFixed(2)}</td></tr>
            <tr><td>إجمالي الضريبة</td><td class="bold">${totalTax.toFixed(2)}</td></tr>
            <tr><td>تيك اواي</td><td class="bold">${totalTakeaway.toFixed(2)}</td></tr>
            <tr><td>دليفري</td><td class="bold">${totalDelivery.toFixed(2)}</td></tr>
            <tr><td>إجمالي الخصم</td><td class="bold">${totalDiscount.toFixed(2)}</td></tr>
            <tr><td>إجمالي الإيرادات</td><td class="bold">${netSales.toFixed(2)}</td></tr>
            <tr><td>إجمالي الخدمة / التوصيل</td><td class="bold">${totalDeliveryFee.toFixed(2)}</td></tr>
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

            {/* 📊 شبكة الكروت الإحصائية (مطابقة تماماً لصفحة التقارير) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {/* الصف الأول: الإيرادات الأساسية للأقسام */}
              <Card
                icon={DollarSign}
                label="الإيرادات الأساسية"
                value={detailShift.subtotal}
                accent="slate"
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

              {/* الصف الثاني: أنواع الطلبات (إحصائية) */}
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
                icon={Percent}
                label="القيمة المضافة (14%)"
                value={detailShift.tax}
                accent="indigo"
              />

              {/* الصف الثالث: الحسابات الإجمالية والخصومات */}
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
              <Card
                icon={Minus}
                label="الخصم"
                value={detailShift.discount}
                accent="rose"
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
