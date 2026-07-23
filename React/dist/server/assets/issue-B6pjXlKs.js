import { jsxs, jsx } from "react/jsx-runtime";
import { useNavigate } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { u as useDB, k as DEPARTMENTS, f as fmt2, h as cleanNumInput } from "./router-DEmB4OpK.js";
import { I as ItemPicker } from "./ItemPicker-CqUuYY58.js";
import { S as SearchableSelect } from "./SearchableSelect-abwGGBxa.js";
import { FileInput, Plus, Download, Trash2, Save, X } from "lucide-react";
import { toast } from "sonner";
import "@tanstack/react-query";
import "@radix-ui/react-dialog";
import "clsx";
import "tailwind-merge";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "js-sha256";
import "./arabic-CnN6FHbg.js";
function IssuePage() {
  const {
    db,
    addIssueVoucher
  } = useDB();
  const navigate = useNavigate();
  const [date, setDate] = useState((/* @__PURE__ */ new Date()).toISOString().slice(0, 10));
  const [department, setDepartment] = useState("مطبخ");
  const [lines, setLines] = useState([{
    id: crypto.randomUUID(),
    itemId: "",
    qty: ""
  }]);
  const [showImport, setShowImport] = useState(false);
  const updateLine = (id, patch) => setLines((ls) => ls.map((l) => l.id === id ? {
    ...l,
    ...patch
  } : l));
  const submit = async (e) => {
    e.preventDefault();
    const valid = lines.filter((l) => l.itemId && parseFloat(l.qty) > 0).map((l) => ({
      itemId: l.itemId,
      qty: parseFloat(l.qty)
    }));
    if (valid.length === 0) {
      toast.error("أضف صنفًا واحدًا على الأقل");
      return;
    }
    try {
      const res = await addIssueVoucher(date, department, valid);
      if (!res.ok) {
        toast.error(res.error || "حدث خطأ أثناء حفظ الإذن");
        return;
      }
      toast.success("تم حفظ إذن الصرف وخصم الكميات من المخزون");
      navigate({
        to: "/history"
      });
    } catch (err) {
      console.error("خطأ أثناء الحفظ:", err);
      toast.error("حدث خطأ غير متوقع أثناء الحفظ.");
    }
  };
  function importFromInvoice(v) {
    const newLines = v.lines.map((ln) => ({
      id: crypto.randomUUID(),
      itemId: ln.itemId,
      qty: ln.qty.toString()
    }));
    if (newLines.length === 0) {
      toast.error("هذه الفاتورة لا تحتوي على أصناف");
      return;
    }
    setLines(newLines);
    setShowImport(false);
    toast.success(`تم استيراد ${newLines.length} صف من فاتورة "${v.supplier}"`);
  }
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4 max-w-5xl", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-start justify-between gap-3", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold", children: "إذن صرف" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground mt-1", children: "صرف أصناف من المخزون إلى الأقسام." })
      ] }),
      /* @__PURE__ */ jsxs("button", { type: "button", onClick: () => setShowImport(true), className: "h-10 px-4 rounded-lg border border-input text-sm font-medium hover:bg-secondary flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(FileInput, { className: "w-4 h-4" }),
        " استيراد فاتورة (من سجل التوريد)"
      ] })
    ] }),
    /* @__PURE__ */ jsxs("form", { onSubmit: submit, className: "bg-card border border-border rounded-xl p-5 space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "grid sm:grid-cols-2 gap-3", children: [
        /* @__PURE__ */ jsxs("label", { className: "block", children: [
          /* @__PURE__ */ jsx("span", { className: "text-xs font-medium text-muted-foreground mb-1 block", children: "التاريخ" }),
          /* @__PURE__ */ jsx("input", { type: "date", value: date, onChange: (e) => setDate(e.target.value), required: true, className: "w-full h-10 px-3 rounded-md border border-input bg-background text-sm" })
        ] }),
        /* @__PURE__ */ jsxs("label", { className: "block", children: [
          /* @__PURE__ */ jsx("span", { className: "text-xs font-medium text-muted-foreground mb-1 block", children: "القسم المصروف له" }),
          /* @__PURE__ */ jsx(SearchableSelect, { options: DEPARTMENTS.map((d) => ({
            value: d,
            label: d
          })), value: department, onChange: (v) => setDepartment(v), placeholder: "اختر القسم..." })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-2", children: [
          /* @__PURE__ */ jsx("h2", { className: "font-semibold text-sm", children: "الأصناف" }),
          /* @__PURE__ */ jsxs("button", { type: "button", onClick: () => setLines([...lines, {
            id: crypto.randomUUID(),
            itemId: "",
            qty: ""
          }]), className: "flex items-center gap-1 text-sm text-primary hover:underline", children: [
            /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4" }),
            " إضافة سطر"
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "space-y-2", children: lines.map((l) => {
          const item = db.items.find((i) => i.id === l.itemId);
          const req = parseFloat(l.qty) || 0;
          const tooMuch = item && req > item.qty;
          return /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-12 gap-2 items-start bg-secondary/30 p-2 rounded-lg", children: [
            /* @__PURE__ */ jsxs("div", { className: "col-span-12 md:col-span-6", children: [
              /* @__PURE__ */ jsx(ItemPicker, { items: db.items, value: l.itemId, onChange: (id) => updateLine(l.id, {
                itemId: id
              }) }),
              item && /* @__PURE__ */ jsxs("div", { className: `text-xs mt-1 px-1 ${tooMuch ? "text-destructive font-semibold" : "text-muted-foreground"}`, children: [
                "الوحدة: ",
                item.unit,
                " • المتاح: ",
                fmt2(item.qty),
                " ",
                tooMuch && "— الكمية المطلوبة تتجاوز المتاح!"
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "col-span-8 md:col-span-3", children: /* @__PURE__ */ jsx("input", { type: "number", step: "any", min: "0", value: l.qty, onChange: (e) => updateLine(l.id, {
              qty: cleanNumInput(e.target.value)
            }), placeholder: "الكمية المطلوبة", className: `w-full h-10 px-3 rounded-md border bg-background text-sm ${tooMuch ? "border-destructive" : "border-input"}` }) }),
            /* @__PURE__ */ jsxs("button", { type: "button", disabled: !item, onClick: () => item && updateLine(l.id, {
              qty: item.qty.toString()
            }), title: "خرج كل الكمية المتاحة", className: "col-span-3 md:col-span-2 h-10 px-2 rounded-md border border-input text-xs flex items-center justify-center gap-1 hover:bg-secondary disabled:opacity-40", children: [
              /* @__PURE__ */ jsx(Download, { className: "w-3 h-3" }),
              " خرج الكل"
            ] }),
            /* @__PURE__ */ jsx("div", { className: "col-span-1 flex justify-center", children: /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setLines(lines.filter((x) => x.id !== l.id)), disabled: lines.length === 1, className: "h-10 w-10 grid place-items-center rounded-md text-destructive hover:bg-destructive/10 disabled:opacity-30", children: /* @__PURE__ */ jsx(Trash2, { className: "w-4 h-4" }) }) })
          ] }, l.id);
        }) })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex items-center justify-end border-t border-border pt-4", children: /* @__PURE__ */ jsxs("button", { type: "submit", className: "flex items-center gap-2 px-5 h-11 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90", children: [
        /* @__PURE__ */ jsx(Save, { className: "w-4 h-4" }),
        " حفظ الإذن"
      ] }) })
    ] }),
    showImport && /* @__PURE__ */ jsx(ImportInvoiceDialog, { onClose: () => setShowImport(false), onPick: importFromInvoice })
  ] });
}
function ImportInvoiceDialog({
  onClose,
  onPick
}) {
  const {
    db
  } = useDB();
  const entries = useMemo(() => db.vouchers.filter((v) => v.type === "entry"), [db.vouchers]);
  const suppliers = useMemo(() => Array.from(new Set(entries.map((v) => v.supplier).filter(Boolean))), [entries]);
  const [supplier, setSupplier] = useState("");
  const supplierEntries = supplier ? entries.filter((v) => v.supplier === supplier) : [];
  return /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 bg-black/50 grid place-items-center p-4", onClick: onClose, children: /* @__PURE__ */ jsxs("div", { className: "bg-card border border-border rounded-xl w-full max-w-2xl p-5 max-h-[90vh] overflow-auto", onClick: (e) => e.stopPropagation(), children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-3", children: [
      /* @__PURE__ */ jsxs("h2", { className: "text-lg font-bold flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(FileInput, { className: "w-5 h-5" }),
        " استيراد فاتورة توريد"
      ] }),
      /* @__PURE__ */ jsx("button", { onClick: onClose, className: "p-1 hover:bg-secondary rounded", children: /* @__PURE__ */ jsx(X, { className: "w-5 h-5" }) })
    ] }),
    /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mb-3", children: "اختر اسم مورد ثم فاتورة لتعبئة سطور الإذن تلقائياً بكمياتها (قابلة للتعديل بعد ذلك)." }),
    /* @__PURE__ */ jsxs("label", { className: "block mb-3", children: [
      /* @__PURE__ */ jsx("span", { className: "text-xs mb-1 block", children: "المورد" }),
      /* @__PURE__ */ jsx(SearchableSelect, { options: suppliers.map((s) => ({
        value: s,
        label: s
      })), value: supplier, onChange: setSupplier, placeholder: "ابحث باسم المورد..." })
    ] }),
    supplier && /* @__PURE__ */ jsx("div", { className: "border border-border rounded-lg overflow-hidden", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
      /* @__PURE__ */ jsx("thead", { className: "bg-secondary/50 text-xs", children: /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("th", { className: "text-right p-2", children: "التاريخ" }),
        /* @__PURE__ */ jsx("th", { className: "text-right p-2", children: "عدد الأصناف" }),
        /* @__PURE__ */ jsx("th", { className: "text-right p-2", children: "الإجمالي" }),
        /* @__PURE__ */ jsx("th", { className: "text-right p-2" })
      ] }) }),
      /* @__PURE__ */ jsx("tbody", { children: supplierEntries.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 4, className: "p-4 text-center text-muted-foreground", children: "لا توجد فواتير لهذا المورد" }) }) : supplierEntries.map((v) => {
        const total = v.lines.reduce((s, l) => s + l.qty * (l.price || 0), 0);
        return /* @__PURE__ */ jsxs("tr", { className: "border-t border-border", children: [
          /* @__PURE__ */ jsx("td", { className: "p-2", children: v.date }),
          /* @__PURE__ */ jsx("td", { className: "p-2", children: v.lines.length }),
          /* @__PURE__ */ jsxs("td", { className: "p-2", children: [
            fmt2(total),
            " ج.م"
          ] }),
          /* @__PURE__ */ jsx("td", { className: "p-2 text-end", children: /* @__PURE__ */ jsx("button", { onClick: () => onPick(v), className: "px-3 h-8 rounded-md bg-primary text-primary-foreground text-xs", children: "استخدام هذه الفاتورة" }) })
        ] }, v.id);
      }) })
    ] }) })
  ] }) });
}
export {
  IssuePage as component
};
