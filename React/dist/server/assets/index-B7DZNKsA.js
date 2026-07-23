import { jsxs, jsx } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import { u as useDB } from "./router-DEmB4OpK.js";
import { Package, AlertTriangle, TrendingUp, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import "@tanstack/react-query";
import "react";
import "@radix-ui/react-dialog";
import "clsx";
import "tailwind-merge";
import "sonner";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "js-sha256";
function Dashboard() {
  const {
    db
  } = useDB();
  const items = db.items;
  const lowStock = items.filter((i) => i.qty <= i.critical);
  const totalValue = items.reduce((s, i) => s + i.qty * i.avgPrice, 0);
  const stats = [{
    label: "إجمالي الأصناف",
    value: items.length,
    icon: Package,
    color: "bg-primary/10 text-primary"
  }, {
    label: "تنبيهات نقص المخزون",
    value: lowStock.length,
    icon: AlertTriangle,
    color: "bg-destructive/10 text-destructive"
  }, {
    label: "إجمالي قيمة المخزون",
    value: totalValue.toFixed(2) + " ج.م",
    icon: TrendingUp,
    color: "bg-success/10 text-success"
  }, {
    label: "إجمالي الأذونات",
    value: db.vouchers.length,
    icon: ArrowDownToLine,
    color: "bg-accent text-accent-foreground"
  }];
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold", children: "لوحة التحكم" }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground mt-1", children: "نظرة عامة على حالة المخزون" })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 lg:grid-cols-4 gap-4", children: stats.map((s) => {
      const Icon = s.icon;
      return /* @__PURE__ */ jsxs("div", { className: "bg-card border border-border rounded-xl p-4", children: [
        /* @__PURE__ */ jsx("div", { className: `w-10 h-10 rounded-lg grid place-items-center ${s.color} mb-3`, children: /* @__PURE__ */ jsx(Icon, { className: "w-5 h-5" }) }),
        /* @__PURE__ */ jsx("div", { className: "text-2xl font-bold", children: s.value }),
        /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground mt-1", children: s.label })
      ] }, s.label);
    }) }),
    /* @__PURE__ */ jsxs("div", { className: "grid lg:grid-cols-3 gap-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "lg:col-span-2 bg-card border border-border rounded-xl p-5", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-4", children: [
          /* @__PURE__ */ jsxs("h2", { className: "font-bold text-lg flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(AlertTriangle, { className: "w-5 h-5 text-destructive" }),
            "تنبيهات نقص المخزون"
          ] }),
          /* @__PURE__ */ jsx(Link, { to: "/inventory", className: "text-xs text-primary hover:underline", children: "عرض المخزون" })
        ] }),
        lowStock.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground text-center py-8", children: "لا توجد تنبيهات. جميع الأصناف بكميات كافية ✓" }) : /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
          /* @__PURE__ */ jsx("thead", { className: "text-xs text-muted-foreground", children: /* @__PURE__ */ jsxs("tr", { className: "border-b border-border", children: [
            /* @__PURE__ */ jsx("th", { className: "text-right py-2 font-medium", children: "اسم الصنف" }),
            /* @__PURE__ */ jsx("th", { className: "text-right py-2 font-medium", children: "الكمية الحالية" }),
            /* @__PURE__ */ jsx("th", { className: "text-right py-2 font-medium", children: "النقطة الحرجة" }),
            /* @__PURE__ */ jsx("th", { className: "text-right py-2 font-medium", children: "الوحدة" })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { children: lowStock.map((i) => /* @__PURE__ */ jsxs("tr", { className: "border-b border-border/50 bg-destructive/5", children: [
            /* @__PURE__ */ jsx("td", { className: "py-2 font-medium", children: i.name }),
            /* @__PURE__ */ jsx("td", { className: "py-2 text-destructive font-bold", children: i.qty }),
            /* @__PURE__ */ jsx("td", { className: "py-2", children: i.critical }),
            /* @__PURE__ */ jsx("td", { className: "py-2 text-muted-foreground", children: i.unit })
          ] }, i.id)) })
        ] }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-card border border-border rounded-xl p-5", children: [
        /* @__PURE__ */ jsx("h2", { className: "font-bold text-lg mb-4", children: "إجراءات سريعة" }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-2", children: [
          /* @__PURE__ */ jsxs(Link, { to: "/entry", className: "flex items-center gap-3 p-3 rounded-lg bg-secondary hover:bg-secondary/70 transition", children: [
            /* @__PURE__ */ jsx(ArrowDownToLine, { className: "w-5 h-5 text-primary" }),
            /* @__PURE__ */ jsx("span", { className: "font-medium text-sm", children: "إذن توريد جديد" })
          ] }),
          /* @__PURE__ */ jsxs(Link, { to: "/issue", className: "flex items-center gap-3 p-3 rounded-lg bg-secondary hover:bg-secondary/70 transition", children: [
            /* @__PURE__ */ jsx(ArrowUpFromLine, { className: "w-5 h-5 text-primary" }),
            /* @__PURE__ */ jsx("span", { className: "font-medium text-sm", children: "إذن صرف جديد" })
          ] }),
          /* @__PURE__ */ jsxs(Link, { to: "/inventory", className: "flex items-center gap-3 p-3 rounded-lg bg-secondary hover:bg-secondary/70 transition", children: [
            /* @__PURE__ */ jsx(Package, { className: "w-5 h-5 text-primary" }),
            /* @__PURE__ */ jsx("span", { className: "font-medium text-sm", children: "إدارة المخزون" })
          ] })
        ] })
      ] })
    ] })
  ] });
}
export {
  Dashboard as component
};
