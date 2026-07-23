import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useEffect, useMemo } from "react";
import { u as useDB, g as getApiUrl } from "./router-DEmB4OpK.js";
import { ArrowDownToLine, ArrowUpFromLine, CalendarDays, CalendarRange, Printer } from "lucide-react";
import "@tanstack/react-query";
import "@tanstack/react-router";
import "@radix-ui/react-dialog";
import "clsx";
import "tailwind-merge";
import "sonner";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "js-sha256";
function PrintVoucher({ voucher }) {
  const isEntry = voucher.type === "entry";
  return /* @__PURE__ */ jsxs("div", { className: "print-voucher border border-black p-3 mb-3", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center border-b border-black pb-2 mb-2", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-base font-bold", children: isEntry ? "إذن توريد / دخول" : "إذن صرف" }),
      /* @__PURE__ */ jsxs("div", { className: "text-xs", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          "التاريخ: ",
          voucher.date
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          "رقم الإذن: ",
          voucher.id.slice(0, 8).toUpperCase()
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "text-xs mb-2", children: isEntry ? /* @__PURE__ */ jsxs("span", { children: [
      "المورد: ",
      /* @__PURE__ */ jsx("strong", { children: voucher.supplier || "—" })
    ] }) : /* @__PURE__ */ jsxs("span", { children: [
      "القسم: ",
      /* @__PURE__ */ jsx("strong", { children: voucher.department })
    ] }) }),
    /* @__PURE__ */ jsxs("table", { className: "print-table w-full", children: [
      /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("th", { style: { width: "30px" }, children: "#" }),
        /* @__PURE__ */ jsx("th", { children: "اسم الصنف" }),
        /* @__PURE__ */ jsx("th", { style: { width: "60px" }, children: "الوحدة" }),
        /* @__PURE__ */ jsx("th", { style: { width: "60px" }, children: "الكمية" }),
        isEntry && /* @__PURE__ */ jsx("th", { style: { width: "70px" }, children: "السعر" }),
        isEntry && /* @__PURE__ */ jsx("th", { style: { width: "80px" }, children: "الإجمالي" })
      ] }) }),
      /* @__PURE__ */ jsx("tbody", { children: voucher.lines.map((l, i) => /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("td", { children: i + 1 }),
        /* @__PURE__ */ jsx("td", { children: l.itemName }),
        /* @__PURE__ */ jsx("td", { children: l.unit }),
        /* @__PURE__ */ jsx("td", { children: l.qty }),
        isEntry && /* @__PURE__ */ jsx("td", { children: l.price?.toFixed(2) }),
        isEntry && /* @__PURE__ */ jsx("td", { children: ((l.price || 0) * l.qty).toFixed(2) })
      ] }, i)) }),
      isEntry && /* @__PURE__ */ jsx("tfoot", { children: /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("td", { colSpan: 5, style: { textAlign: "left", fontWeight: "bold" }, children: "الإجمالي الكلي:" }),
        /* @__PURE__ */ jsx("td", { style: { fontWeight: "bold" }, children: voucher.lines.reduce((s, l) => s + (l.price || 0) * l.qty, 0).toFixed(2) })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex justify-between mt-4 text-xs", children: [
      /* @__PURE__ */ jsx("div", { children: "توقيع المستلم: ____________" }),
      /* @__PURE__ */ jsx("div", { children: "توقيع المسؤول: ____________" })
    ] })
  ] });
}
function aggregate(vouchers) {
  const map = /* @__PURE__ */ new Map();
  for (const v of vouchers) {
    for (const l of v.lines) {
      const key = l.itemName + "|" + l.unit;
      const cur = map.get(key) || {
        itemName: l.itemName,
        unit: l.unit,
        qty: 0,
        totalValue: 0,
        count: 0
      };
      cur.qty += l.qty;
      cur.totalValue += (l.price || 0) * l.qty;
      cur.count += 1;
      map.set(key, cur);
    }
  }
  return Array.from(map.values()).sort(
    (a, b) => a.itemName.localeCompare(b.itemName, "ar")
  );
}
function EntryTable({
  lines,
  vouchersCount
}) {
  const totalQty = lines.reduce((s, l) => s + l.qty, 0);
  const totalValue = lines.reduce((s, l) => s + l.totalValue, 0);
  return /* @__PURE__ */ jsxs("table", { className: "print-table w-full", children: [
    /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { children: [
      /* @__PURE__ */ jsx("th", { style: { width: "30px" }, children: "#" }),
      /* @__PURE__ */ jsx("th", { children: "اسم الصنف" }),
      /* @__PURE__ */ jsx("th", { style: { width: "60px" }, children: "الوحدة" }),
      /* @__PURE__ */ jsx("th", { style: { width: "70px" }, children: "إجمالي الكمية" }),
      /* @__PURE__ */ jsx("th", { style: { width: "50px" }, children: "عدد الأذونات" }),
      /* @__PURE__ */ jsx("th", { style: { width: "90px" }, children: "الإجمالي (قيمة)" })
    ] }) }),
    /* @__PURE__ */ jsx("tbody", { children: lines.map((l, i) => /* @__PURE__ */ jsxs("tr", { children: [
      /* @__PURE__ */ jsx("td", { children: i + 1 }),
      /* @__PURE__ */ jsx("td", { children: l.itemName }),
      /* @__PURE__ */ jsx("td", { children: l.unit }),
      /* @__PURE__ */ jsx("td", { children: l.qty }),
      /* @__PURE__ */ jsx("td", { children: l.count }),
      /* @__PURE__ */ jsx("td", { children: l.totalValue.toFixed(2) })
    ] }, i)) }),
    /* @__PURE__ */ jsx("tfoot", { children: /* @__PURE__ */ jsxs("tr", { children: [
      /* @__PURE__ */ jsx("td", { colSpan: 3, style: { textAlign: "left", fontWeight: "bold" }, children: "الإجماليات:" }),
      /* @__PURE__ */ jsx("td", { style: { fontWeight: "bold" }, children: totalQty }),
      /* @__PURE__ */ jsx("td", { style: { fontWeight: "bold" }, children: vouchersCount }),
      /* @__PURE__ */ jsx("td", { style: { fontWeight: "bold" }, children: totalValue.toFixed(2) })
    ] }) })
  ] });
}
function IssueDeptBlock({
  dept,
  vouchers
}) {
  const lines = aggregate(vouchers);
  if (lines.length === 0) return null;
  const totalQty = lines.reduce((s, l) => s + l.qty, 0);
  return /* @__PURE__ */ jsxs("div", { style: { marginBottom: "6px" }, children: [
    /* @__PURE__ */ jsxs(
      "div",
      {
        style: { fontWeight: "bold", fontSize: "12px", margin: "4px 0 2px" },
        children: [
          "القسم: ",
          dept,
          " — عدد الأذونات: ",
          vouchers.length
        ]
      }
    ),
    /* @__PURE__ */ jsxs("table", { className: "print-table w-full", children: [
      /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("th", { style: { width: "30px" }, children: "#" }),
        /* @__PURE__ */ jsx("th", { children: "اسم الصنف" }),
        /* @__PURE__ */ jsx("th", { style: { width: "60px" }, children: "الوحدة" }),
        /* @__PURE__ */ jsx("th", { style: { width: "70px" }, children: "إجمالي الكمية" }),
        /* @__PURE__ */ jsx("th", { style: { width: "60px" }, children: "عدد الأذونات" })
      ] }) }),
      /* @__PURE__ */ jsx("tbody", { children: lines.map((l, i) => /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("td", { children: i + 1 }),
        /* @__PURE__ */ jsx("td", { children: l.itemName }),
        /* @__PURE__ */ jsx("td", { children: l.unit }),
        /* @__PURE__ */ jsx("td", { children: l.qty }),
        /* @__PURE__ */ jsx("td", { children: l.count })
      ] }, i)) }),
      /* @__PURE__ */ jsx("tfoot", { children: /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsxs("td", { colSpan: 3, style: { textAlign: "left", fontWeight: "bold" }, children: [
          "إجمالي ",
          dept,
          ":"
        ] }),
        /* @__PURE__ */ jsx("td", { style: { fontWeight: "bold" }, children: totalQty }),
        /* @__PURE__ */ jsx("td", { style: { fontWeight: "bold" }, children: vouchers.length })
      ] }) })
    ] })
  ] });
}
const DEPT_ORDER = ["مطبخ", "بار", "صالة"];
function PrintReport({
  vouchers,
  title,
  subtitle
}) {
  if (vouchers.length === 0) return null;
  const isEntry = vouchers[0].type === "entry";
  const parties = isEntry ? Array.from(new Set(vouchers.map((v) => v.supplier))).join("، ") : Array.from(new Set(vouchers.map((v) => v.department))).join(
    "، "
  );
  return /* @__PURE__ */ jsxs("div", { className: "print-voucher", children: [
    /* @__PURE__ */ jsxs("div", { className: "text-center border-b border-black pb-2 mb-2", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-base font-bold", children: title }),
      /* @__PURE__ */ jsx("div", { className: "text-xs", children: subtitle }),
      /* @__PURE__ */ jsxs("div", { className: "text-xs mt-1", children: [
        "نوع التقرير:",
        " ",
        /* @__PURE__ */ jsx("strong", { children: isEntry ? "أذونات توريد" : "أذونات صرف" }),
        " • عدد الأذونات: ",
        /* @__PURE__ */ jsx("strong", { children: vouchers.length }),
        " •",
        isEntry ? " الموردون: " : " الأقسام: ",
        /* @__PURE__ */ jsx("strong", { children: parties || "—" })
      ] })
    ] }),
    isEntry ? /* @__PURE__ */ jsx(
      EntryTable,
      {
        lines: aggregate(vouchers),
        vouchersCount: vouchers.length
      }
    ) : /* @__PURE__ */ jsx(Fragment, { children: DEPT_ORDER.map((dept, idx) => {
      const deptVouchers = vouchers.filter(
        (v) => v.department === dept
      );
      if (deptVouchers.length === 0) return null;
      const isLastWithData = DEPT_ORDER.slice(idx + 1).every(
        (d) => vouchers.filter((v) => v.department === d).length === 0
      );
      return /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx(IssueDeptBlock, { dept, vouchers: deptVouchers }),
        !isLastWithData && /* @__PURE__ */ jsx(
          "hr",
          {
            style: {
              border: "none",
              borderTop: "2px solid #000",
              margin: "6px 0"
            }
          }
        )
      ] }, dept);
    }) })
  ] });
}
const API_URL = getApiUrl();
const AR_DAYS = ["الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت", "الأحد"];
function getISOWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 864e5 + 1) / 7);
  return {
    year: d.getUTCFullYear(),
    week
  };
}
function pad(n) {
  return n < 10 ? "0" + n : "" + n;
}
function fmtDate(d) {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}
function getDatesOfISOWeek(year, week) {
  const simple = new Date(Date.UTC(year, 0, 1 + (week - 1) * 7));
  const dow = simple.getUTCDay();
  const start = new Date(simple);
  if (dow <= 4) start.setUTCDate(simple.getUTCDate() - simple.getUTCDay() + 1);
  else start.setUTCDate(simple.getUTCDate() + 8 - simple.getUTCDay());
  return Array.from({
    length: 7
  }, (_, i) => {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    return fmtDate(d);
  });
}
function HistoryPage() {
  const {
    db
  } = useDB();
  const [tab, setTab] = useState("entry");
  const [serverVouchers, setServerVouchers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    async function fetchVouchersFromDB() {
      try {
        const response = await fetch(`http://${API_URL}:5000/api/vouchers`);
        if (response.ok) {
          const data = await response.json();
          setServerVouchers(data);
        }
      } catch (error) {
        console.error("❌ خطأ أثناء جلب الأذونات:", error);
      }
    }
    fetchVouchersFromDB();
  }, []);
  const activeVouchers = useMemo(() => {
    const allVouchers = /* @__PURE__ */ new Map();
    serverVouchers.forEach((v) => allVouchers.set(v.id, v));
    (db.vouchers || []).forEach((v) => allVouchers.set(v.id, v));
    return Array.from(allVouchers.values()).sort((a, b) => b.createdAt - a.createdAt);
  }, [db.vouchers, serverVouchers]);
  const today = /* @__PURE__ */ new Date();
  const currentISO = getISOWeek(today);
  const year = currentISO.year;
  const [week, setWeek] = useState(currentISO.week);
  const [day, setDay] = useState("all");
  const [printing, setPrinting] = useState(null);
  const weekDates = useMemo(() => getDatesOfISOWeek(year, week), [year, week]);
  const tabVouchers = useMemo(() => activeVouchers.filter((v) => v.type === tab).sort((a, b) => b.createdAt - a.createdAt), [activeVouchers, tab]);
  const weekVouchers = useMemo(() => tabVouchers.filter((v) => weekDates.includes(v.date)), [tabVouchers, weekDates]);
  const filtered = useMemo(() => day === "all" ? weekVouchers : weekVouchers.filter((v) => v.date === day), [weekVouchers, day]);
  const triggerPrint = (payload) => {
    setPrinting(payload);
    setTimeout(() => {
      window.print();
      setTimeout(() => setPrinting(null), 500);
    }, 100);
  };
  const printOne = (v) => triggerPrint({
    vouchers: [v],
    mode: "single",
    label: v.date
  });
  const printDaily = () => {
    if (day === "all" || filtered.length === 0) return;
    triggerPrint({
      vouchers: filtered,
      mode: "daily",
      label: day
    });
  };
  const printWeekly = () => {
    if (weekVouchers.length === 0) return;
    triggerPrint({
      vouchers: weekVouchers,
      mode: "weekly",
      label: `الأسبوع ${week} - ${year}`
    });
  };
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "no-print", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold", children: "سجل العمليات والتقارير" }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground mt-1", children: "تنظيم الحركات بحسب أسابيع وأيام السنة، مع تقارير يومية وأسبوعية." })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "no-print flex gap-1 bg-secondary p-1 rounded-lg w-fit", children: [
      /* @__PURE__ */ jsxs("button", { onClick: () => setTab("entry"), className: `px-4 h-9 rounded-md text-sm font-medium flex items-center gap-2 transition ${tab === "entry" ? "bg-card shadow-sm" : "text-muted-foreground"}`, children: [
        /* @__PURE__ */ jsx(ArrowDownToLine, { className: "w-4 h-4" }),
        " أذونات التوريد"
      ] }),
      /* @__PURE__ */ jsxs("button", { onClick: () => setTab("issue"), className: `px-4 h-9 rounded-md text-sm font-medium flex items-center gap-2 transition ${tab === "issue" ? "bg-card shadow-sm" : "text-muted-foreground"}`, children: [
        /* @__PURE__ */ jsx(ArrowUpFromLine, { className: "w-4 h-4" }),
        " أذونات الصرف"
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "no-print bg-card border border-border rounded-xl p-4 flex flex-wrap items-end gap-3", children: [
      /* @__PURE__ */ jsxs("label", { className: "block", children: [
        /* @__PURE__ */ jsxs("span", { className: "text-xs font-medium text-muted-foreground mb-1 block", children: [
          "الأسبوع (ISO) — سنة ",
          year
        ] }),
        /* @__PURE__ */ jsx("select", { value: week, onChange: (e) => {
          setWeek(parseInt(e.target.value));
          setDay("all");
        }, className: "h-10 px-3 rounded-md border border-input bg-background text-sm min-w-40", children: Array.from({
          length: currentISO.week
        }, (_, i) => currentISO.week - i).map((w) => /* @__PURE__ */ jsxs("option", { value: w, children: [
          "الأسبوع ",
          w
        ] }, w)) })
      ] }),
      /* @__PURE__ */ jsxs("label", { className: "block", children: [
        /* @__PURE__ */ jsx("span", { className: "text-xs font-medium text-muted-foreground mb-1 block", children: "اليوم" }),
        /* @__PURE__ */ jsxs("select", { value: day, onChange: (e) => setDay(e.target.value), className: "h-10 px-3 rounded-md border border-input bg-background text-sm min-w-52", children: [
          /* @__PURE__ */ jsx("option", { value: "all", children: "كل أيام الأسبوع" }),
          weekDates.map((d, i) => {
            const count = tabVouchers.filter((v) => v.date === d).length;
            return /* @__PURE__ */ jsxs("option", { value: d, children: [
              AR_DAYS[i],
              " — ",
              d,
              " (",
              count,
              ")"
            ] }, d);
          })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-end gap-2 ms-auto", children: [
        /* @__PURE__ */ jsxs("button", { onClick: printDaily, disabled: day === "all" || filtered.length === 0, className: "h-10 px-4 rounded-md border border-input text-sm font-medium hover:bg-secondary flex items-center gap-2 disabled:opacity-50", title: day === "all" ? "اختر يوماً محدداً" : "طباعة التقرير اليومي", children: [
          /* @__PURE__ */ jsx(CalendarDays, { className: "w-4 h-4" }),
          "طباعة التقرير اليومي"
        ] }),
        /* @__PURE__ */ jsxs("button", { onClick: printWeekly, disabled: weekVouchers.length === 0, className: "h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 flex items-center gap-2 disabled:opacity-50", children: [
          /* @__PURE__ */ jsx(CalendarRange, { className: "w-4 h-4" }),
          "طباعة التقرير الأسبوعي"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "no-print text-xs text-muted-foreground bg-accent/30 border border-accent rounded-lg p-3", children: [
      /* @__PURE__ */ jsx("strong", { children: "تنبيه:" }),
      " جميع التقارير اليومية والأسبوعية تعرض فقط حركات من نوع",
      /* @__PURE__ */ jsxs("strong", { children: [
        " ",
        tab === "entry" ? "التوريد" : "الصرف",
        " "
      ] }),
      "— لا يُسمح بدمج التوريد والصرف في تقرير واحد."
    ] }),
    /* @__PURE__ */ jsx("div", { className: "no-print space-y-2", children: isLoading ? /* @__PURE__ */ jsx("div", { className: "bg-card border border-border rounded-xl p-10 text-center text-amber-600 font-bold animate-pulse", children: "جاري تحميل الأذونات من قاعدة البيانات..." }) : filtered.length === 0 ? /* @__PURE__ */ jsx("div", { className: "bg-card border border-border rounded-xl p-10 text-center text-muted-foreground", children: "لا توجد أذونات ضمن هذا التصفية" }) : filtered.map((v, idx) => /* @__PURE__ */ jsxs("div", { className: "bg-card border border-border rounded-xl p-4 flex flex-wrap items-center gap-3", children: [
      /* @__PURE__ */ jsx("div", { className: "w-10 h-10 grid place-items-center rounded-lg bg-primary/10 text-primary font-bold text-sm", children: idx + 1 }),
      /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
        /* @__PURE__ */ jsx("div", { className: "font-semibold text-sm", children: v.type === "entry" ? `توريد من: ${v.supplier}` : `صرف إلى: ${v.department}` }),
        /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground mt-0.5", children: [
          v.date,
          " • ",
          v.lines.length,
          " أصناف",
          v.type === "entry" && /* @__PURE__ */ jsxs(Fragment, { children: [
            " ",
            "• الإجمالي:",
            " ",
            v.lines.reduce((s, l) => s + (l.price || 0) * l.qty, 0).toFixed(2)
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("button", { onClick: () => printOne(v), className: "px-3 h-9 rounded-md border border-input text-sm hover:bg-secondary flex items-center gap-1.5", children: [
        /* @__PURE__ */ jsx(Printer, { className: "w-4 h-4" }),
        " طباعة الإذن"
      ] })
    ] }, v.id)) }),
    printing && /* @__PURE__ */ jsxs("div", { className: "print-area", children: [
      printing.mode === "single" && printing.vouchers.map((v) => /* @__PURE__ */ jsx(PrintVoucher, { voucher: v }, v.id)),
      printing.mode === "daily" && /* @__PURE__ */ jsx(PrintReport, { vouchers: printing.vouchers, title: `التقرير اليومي — ${tab === "entry" ? "أذونات التوريد" : "أذونات الصرف"}`, subtitle: `اليوم: ${printing.label} • تاريخ الطباعة: ${(/* @__PURE__ */ new Date()).toLocaleDateString("ar-EG")}` }),
      printing.mode === "weekly" && /* @__PURE__ */ jsx(PrintReport, { vouchers: printing.vouchers, title: `التقرير الأسبوعي — ${tab === "entry" ? "أذونات التوريد" : "أذونات الصرف"}`, subtitle: `${printing.label} • من ${weekDates[0]} إلى ${weekDates[6]} • تاريخ الطباعة: ${(/* @__PURE__ */ new Date()).toLocaleDateString("ar-EG")}` })
    ] })
  ] });
}
export {
  HistoryPage as component
};
