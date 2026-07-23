import { jsxs, jsx } from "react/jsx-runtime";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { u as useDB } from "./router-DEmB4OpK.js";
import { I as ItemPicker } from "./ItemPicker-CqUuYY58.js";
import { Plus, Trash2, Save } from "lucide-react";
import { toast } from "sonner";
import "@tanstack/react-query";
import "@radix-ui/react-dialog";
import "clsx";
import "tailwind-merge";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "js-sha256";
import "./arabic-CnN6FHbg.js";
function EntryPage() {
  const {
    db,
    addEntryVoucher
  } = useDB();
  const navigate = useNavigate();
  const [date, setDate] = useState((/* @__PURE__ */ new Date()).toISOString().slice(0, 10));
  const [supplier, setSupplier] = useState("");
  const [lines, setLines] = useState([{
    id: crypto.randomUUID(),
    itemId: "",
    qty: "",
    price: ""
  }]);
  const updateLine = (id, patch) => setLines((ls) => ls.map((l) => l.id === id ? {
    ...l,
    ...patch
  } : l));
  const total = lines.reduce((s, l) => s + (parseFloat(l.qty) || 0) * (parseFloat(l.price) || 0), 0);
  const submit = (e) => {
    e.preventDefault();
    const valid = lines.filter((l) => l.itemId && parseFloat(l.qty) > 0 && parseFloat(l.price) >= 0).map((l) => ({
      itemId: l.itemId,
      qty: parseFloat(l.qty),
      price: parseFloat(l.price)
    }));
    if (valid.length === 0) {
      toast.error("أضف صنفًا واحدًا على الأقل");
      return;
    }
    if (!supplier.trim()) {
      toast.error("أدخل اسم المورد");
      return;
    }
    addEntryVoucher(date, supplier.trim(), valid);
    toast.success("تم حفظ إذن التوريد وتحديث المخزون");
    navigate({
      to: "/history"
    });
  };
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4 max-w-5xl", children: [
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold", children: "إذن توريد / دخول" }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground mt-1", children: "إضافة أصناف جديدة للمخزون. يتم احتساب متوسط السعر تلقائيًا." })
    ] }),
    /* @__PURE__ */ jsxs("form", { onSubmit: submit, className: "bg-card border border-border rounded-xl p-5 space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "grid sm:grid-cols-2 gap-3", children: [
        /* @__PURE__ */ jsxs("label", { className: "block", children: [
          /* @__PURE__ */ jsx("span", { className: "text-xs font-medium text-muted-foreground mb-1 block", children: "التاريخ" }),
          /* @__PURE__ */ jsx("input", { type: "date", value: date, onChange: (e) => setDate(e.target.value), required: true, className: "w-full h-10 px-3 rounded-md border border-input bg-background text-sm" })
        ] }),
        /* @__PURE__ */ jsxs("label", { className: "block", children: [
          /* @__PURE__ */ jsx("span", { className: "text-xs font-medium text-muted-foreground mb-1 block", children: "اسم المورد" }),
          /* @__PURE__ */ jsx("input", { value: supplier, onChange: (e) => setSupplier(e.target.value), required: true, placeholder: "مثال: شركة الفجر", className: "w-full h-10 px-3 rounded-md border border-input bg-background text-sm" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-2", children: [
          /* @__PURE__ */ jsx("h2", { className: "font-semibold text-sm", children: "الأصناف" }),
          /* @__PURE__ */ jsxs("button", { type: "button", onClick: () => setLines([...lines, {
            id: crypto.randomUUID(),
            itemId: "",
            qty: "",
            price: ""
          }]), className: "flex items-center gap-1 text-sm text-primary hover:underline", children: [
            /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4" }),
            " إضافة سطر"
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "space-y-2", children: lines.map((l, idx) => {
          const item = db.items.find((i) => i.id === l.itemId);
          return /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-12 gap-2 items-start bg-secondary/30 p-2 rounded-lg", children: [
            /* @__PURE__ */ jsxs("div", { className: "col-span-12 md:col-span-5", children: [
              /* @__PURE__ */ jsx(ItemPicker, { items: db.items, value: l.itemId, onChange: (id) => updateLine(l.id, {
                itemId: id
              }) }),
              item && /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground mt-1 px-1", children: [
                "الوحدة: ",
                item.unit,
                " • المتاح: ",
                item.qty,
                " • متوسط حالي:",
                " ",
                item.avgPrice.toFixed(2)
              ] })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "col-span-5 md:col-span-3", children: /* @__PURE__ */ jsx("input", { type: "number", step: "any", min: "0", value: l.qty, onChange: (e) => updateLine(l.id, {
              qty: e.target.value.replace(/^-/, "")
            }), placeholder: "الكمية المضافة", className: "w-full h-10 px-3 rounded-md border border-input bg-background text-sm" }) }),
            /* @__PURE__ */ jsx("div", { className: "col-span-5 md:col-span-3", children: /* @__PURE__ */ jsx("input", { type: "number", step: "any", min: "0", value: l.price, onChange: (e) => updateLine(l.id, {
              price: e.target.value.replace(/^-/, "")
            }), placeholder: "السعر الجديد", className: "w-full h-10 px-3 rounded-md border border-input bg-background text-sm" }) }),
            /* @__PURE__ */ jsx("div", { className: "col-span-2 md:col-span-1 flex justify-center", children: /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setLines(lines.filter((x) => x.id !== l.id)), disabled: lines.length === 1, className: "h-10 w-10 grid place-items-center rounded-md text-destructive hover:bg-destructive/10 disabled:opacity-30", children: /* @__PURE__ */ jsx(Trash2, { className: "w-4 h-4" }) }) }),
            /* @__PURE__ */ jsxs("div", { className: "col-span-12 text-xs text-muted-foreground px-1", children: [
              "سطر ",
              idx + 1,
              " • الإجمالي:",
              " ",
              ((parseFloat(l.qty) || 0) * (parseFloat(l.price) || 0)).toFixed(2)
            ] })
          ] }, l.id);
        }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between border-t border-border pt-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "text-sm", children: [
          /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: "الإجمالي الكلي: " }),
          /* @__PURE__ */ jsx("span", { className: "font-bold text-lg text-primary", children: total.toFixed(2) })
        ] }),
        /* @__PURE__ */ jsxs("button", { type: "submit", className: "flex items-center gap-2 px-5 h-11 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90", children: [
          /* @__PURE__ */ jsx(Save, { className: "w-4 h-4" }),
          "حفظ الإذن"
        ] })
      ] })
    ] })
  ] });
}
export {
  EntryPage as component
};
