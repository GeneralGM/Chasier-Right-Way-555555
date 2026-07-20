import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useMemo } from "react";
import { u as useDB, f as fmt2, c as clamp0, y as yieldToSubUnit, r as round2, U as UNITS, h as cleanNumInput, l as SUB_UNIT_TYPES, Y as YIELD_UNITS, m as BASIC_UNITS } from "./router-CvLZBAlt.js";
import { S as SearchableSelect } from "./SearchableSelect-abwGGBxa.js";
import { a as arabicMatch } from "./arabic-CnN6FHbg.js";
import { Plus, Search, Pencil, Trash2, X, Sparkles } from "lucide-react";
import { toast } from "sonner";
import "@tanstack/react-query";
import "@tanstack/react-router";
import "@radix-ui/react-dialog";
import "clsx";
import "tailwind-merge";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "js-sha256";
function InventoryPage() {
  const {
    db,
    addItem,
    updateItem,
    deleteItem
  } = useDB();
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const filtered = useMemo(() => db.items.filter((i) => arabicMatch(i.name, q) || (i.code || "").toLowerCase().includes(q.toLowerCase())), [db.items, q]);
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold", children: "المخزون" }),
        /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground mt-1", children: [
          db.items.length,
          " صنف مسجل"
        ] })
      ] }),
      /* @__PURE__ */ jsxs("button", { onClick: () => setShowAdd(true), className: "flex items-center gap-2 px-4 h-10 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90", children: [
        /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4" }),
        " إضافة صنف"
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "bg-card border border-border rounded-xl overflow-hidden", children: [
      /* @__PURE__ */ jsx("div", { className: "p-4 border-b border-border", children: /* @__PURE__ */ jsxs("div", { className: "relative max-w-md", children: [
        /* @__PURE__ */ jsx(Search, { className: "absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" }),
        /* @__PURE__ */ jsx("input", { type: "text", value: q, onChange: (e) => setQ(e.target.value), placeholder: "ابحث بالاسم أو الكود...", className: "w-full h-10 ps-9 pe-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" })
      ] }) }),
      /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
        /* @__PURE__ */ jsx("thead", { className: "bg-secondary/50 text-xs", children: /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("th", { className: "text-right p-3 font-semibold", children: "الكود" }),
          /* @__PURE__ */ jsx("th", { className: "text-right p-3 font-semibold", children: "اسم الصنف" }),
          /* @__PURE__ */ jsx("th", { className: "text-right p-3 font-semibold", children: "النوع" }),
          /* @__PURE__ */ jsx("th", { className: "text-right p-3 font-semibold", children: "الوحدة" }),
          /* @__PURE__ */ jsx("th", { className: "text-right p-3 font-semibold", children: "الكمية" }),
          /* @__PURE__ */ jsx("th", { className: "text-right p-3 font-semibold", children: "متوسط السعر" }),
          /* @__PURE__ */ jsx("th", { className: "text-right p-3 font-semibold", children: "حرج" }),
          /* @__PURE__ */ jsx("th", { className: "text-right p-3 font-semibold", children: "إجراءات" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { children: filtered.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 8, className: "p-8 text-center text-muted-foreground", children: "لا توجد أصناف" }) }) : filtered.map((i) => {
          const low = i.qty <= i.critical;
          const kindLabel = i.kind === "processed" ? "مصنع" : "عادي";
          return /* @__PURE__ */ jsxs("tr", { className: `border-t border-border ${low ? "bg-destructive/10" : ""}`, children: [
            /* @__PURE__ */ jsx("td", { className: "p-3 font-mono text-xs", children: i.code }),
            /* @__PURE__ */ jsx("td", { className: "p-3 font-medium", children: i.name }),
            /* @__PURE__ */ jsx("td", { className: "p-3 text-xs", children: /* @__PURE__ */ jsx("span", { className: `px-2 py-0.5 rounded-full ${i.kind === "processed" ? "bg-blue-500/15 text-blue-700 dark:text-blue-400" : "bg-secondary"}`, children: kindLabel }) }),
            /* @__PURE__ */ jsxs("td", { className: "p-3 text-muted-foreground", children: [
              i.unit,
              i.subUnitQty ? ` (1=${fmt2(i.subUnitQty)} ${i.subUnitType})` : ""
            ] }),
            /* @__PURE__ */ jsx("td", { className: `p-3 font-bold ${low ? "text-destructive" : ""}`, children: fmt2(i.qty) }),
            /* @__PURE__ */ jsx("td", { className: "p-3", children: fmt2(i.avgPrice) }),
            /* @__PURE__ */ jsx("td", { className: "p-3", children: fmt2(i.critical) }),
            /* @__PURE__ */ jsx("td", { className: "p-3", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
              /* @__PURE__ */ jsx("button", { onClick: () => setEditing(i), className: "p-1.5 rounded hover:bg-secondary text-muted-foreground", title: "تعديل", children: /* @__PURE__ */ jsx(Pencil, { className: "w-4 h-4" }) }),
              /* @__PURE__ */ jsx("button", { onClick: () => {
                if (confirm(`حذف "${i.name}"؟`)) deleteItem(i.id);
              }, className: "p-1.5 rounded hover:bg-destructive/10 text-destructive", title: "حذف", children: /* @__PURE__ */ jsx(Trash2, { className: "w-4 h-4" }) })
            ] }) })
          ] }, i.id);
        }) })
      ] }) })
    ] }),
    (showAdd || editing) && /* @__PURE__ */ jsx(ItemDialog, { initial: editing, allItems: db.items, onClose: () => {
      setShowAdd(false);
      setEditing(null);
    }, onSave: (data) => {
      if (editing) updateItem(editing.id, data);
      else addItem(data);
      setShowAdd(false);
      setEditing(null);
    } })
  ] });
}
function ItemDialog({
  initial,
  allItems,
  onClose,
  onSave
}) {
  const [code, setCode] = useState(initial?.code || "");
  const [name, setName] = useState(initial?.name || "");
  const [unit, setUnit] = useState(initial?.unit || "كيلوجرام");
  const [qty, setQty] = useState(initial?.qty?.toString() || "0");
  const [avgPrice, setAvg] = useState(initial?.avgPrice?.toString() || "0");
  const [critical, setCritical] = useState(initial?.critical?.toString() || "0");
  const [subQty, setSubQty] = useState(initial?.subUnitQty?.toString() || "");
  const [subType, setSubType] = useState(initial?.subUnitType || "كيلوجرام");
  const [notes, setNotes] = useState(initial?.notes || "");
  const [kind, setKind] = useState(initial?.kind || "standard");
  const [yieldComps, setYieldComps] = useState(initial?.yieldDef?.components.map((c) => ({
    ...c,
    unit: c.unit || "كيلوجرام"
  })) || []);
  const [wasteQty, setWasteQty] = useState(initial?.yieldDef?.wasteQty?.toString() || "0");
  const [wasteMode, setWasteMode] = useState(initial?.yieldDef?.wasteMode || "fixed");
  const isBasic = BASIC_UNITS.includes(unit);
  const showSub = !isBasic;
  const subQtyNum = clamp0(subQty);
  const pieces = clamp0(qty);
  const capacityPerPiece = showSub ? subQtyNum : 1;
  const capacityUnit = showSub ? subType : unit;
  const compTotal = useMemo(() => {
    let s = 0;
    let invalid = false;
    for (const c of yieldComps) {
      if (!c.itemId || !c.qty) continue;
      const v = yieldToSubUnit(c.qty, c.unit, capacityUnit);
      if (v == null) {
        invalid = true;
        continue;
      }
      s += v;
    }
    return {
      total: s,
      invalid
    };
  }, [yieldComps, capacityUnit]);
  const wasteInCapacity = useMemo(() => {
    const w = clamp0(wasteQty);
    if (wasteMode === "percent") return capacityPerPiece * (w / 100);
    return w;
  }, [wasteQty, wasteMode, capacityPerPiece]);
  const remaining = round2(capacityPerPiece - compTotal.total - wasteInCapacity);
  const remainingOk = kind !== "processed" || Math.abs(remaining) < 1e-3 && !compTotal.invalid && capacityPerPiece > 0;
  const itemOptions = allItems.filter((x) => x.id !== initial?.id).map((x) => ({
    value: x.id,
    label: x.name,
    hint: x.unit,
    group: x.kind === "processed" ? "مصنع" : "عادي"
  }));
  return /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 bg-black/50 grid place-items-center p-4", onClick: onClose, children: /* @__PURE__ */ jsxs("div", { className: "bg-card border border-border rounded-xl w-full max-w-4xl p-5 max-h-[90vh] overflow-auto", onClick: (e) => e.stopPropagation(), children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-4", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-lg font-bold", children: initial ? "تعديل صنف" : "إضافة صنف جديد" }),
      /* @__PURE__ */ jsx("button", { onClick: onClose, className: "p-1 hover:bg-secondary rounded", children: /* @__PURE__ */ jsx(X, { className: "w-5 h-5" }) })
    ] }),
    /* @__PURE__ */ jsxs("form", { onSubmit: (e) => {
      e.preventDefault();
      if (!name.trim()) return;
      if (kind === "processed") {
        if (capacityPerPiece <= 0) {
          toast.error("حدد السعة الفرعية للقطعة الواحدة أولاً");
          return;
        }
        if (compTotal.invalid) {
          toast.error("تحقق من توحيد وحدات المكونات المستخرجة");
          return;
        }
        if (Math.abs(remaining) > 1e-3) {
          toast.error(`المتبقي من سعة القطعة الواحدة يجب أن يساوي صفر (متبقي حالياً ${fmt2(remaining)} ${capacityUnit})`);
          return;
        }
      }
      const subQ = showSub ? clamp0(subQtyNum) : 0;
      const data = {
        code: code.trim(),
        name: name.trim(),
        unit,
        qty: clamp0(qty),
        avgPrice: clamp0(avgPrice),
        critical: clamp0(critical),
        conversionFactor: showSub && subQ > 0 ? subQ : 1,
        subUnitQty: showSub && subQ > 0 ? subQ : void 0,
        subUnitType: showSub && subQ > 0 ? subType : void 0,
        notes: notes.trim() || void 0,
        kind,
        lastYieldDeltas: initial?.lastYieldDeltas,
        department: ""
      };
      if (kind === "processed") {
        data.yieldDef = {
          components: yieldComps.filter((c) => c.itemId && c.qty > 0).map((c) => ({
            itemId: c.itemId,
            qty: round2(clamp0(c.qty)),
            unit: c.unit
          })),
          wasteQty: round2(clamp0(wasteQty)),
          wasteMode,
          sourceName: name.trim()
        };
      }
      onSave(data);
    }, className: "space-y-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 md:grid-cols-3 gap-3", children: [
        /* @__PURE__ */ jsx(Field, { label: "كود المكون", children: /* @__PURE__ */ jsx("input", { value: code, onChange: (e) => setCode(e.target.value), placeholder: "تلقائي ING-XXX", className: "w-full h-10 px-3 rounded-md border border-input bg-background text-sm pointer-events-none", readOnly: true }) }),
        /* @__PURE__ */ jsx(Field, { label: "اسم الصنف", children: /* @__PURE__ */ jsx("input", { value: name, onChange: (e) => setName(e.target.value), required: true, className: "w-full h-10 px-3 rounded-md border border-input bg-background text-sm" }) }),
        /* @__PURE__ */ jsx(Field, { label: "نوع الصنف", children: /* @__PURE__ */ jsxs("select", { value: kind, onChange: (e) => setKind(e.target.value), className: "w-full h-10 px-2 rounded-md border border-input bg-background text-sm", children: [
          /* @__PURE__ */ jsx("option", { value: "standard", children: "عادي" }),
          /* @__PURE__ */ jsx("option", { value: "processed", children: "مصنع (تفكيك)" })
        ] }) }),
        /* @__PURE__ */ jsx(Field, { label: "وحدة التعبئة", children: /* @__PURE__ */ jsx("select", { value: unit, onChange: (e) => setUnit(e.target.value), className: "w-full h-10 px-2 rounded-md border border-input bg-background text-sm", children: UNITS.map((u) => /* @__PURE__ */ jsx("option", { value: u, children: u }, u)) }) }),
        /* @__PURE__ */ jsx(Field, { label: "الكمية الحالية (عدد القطع)", children: /* @__PURE__ */ jsx("input", { type: "number", min: "0", step: "any", value: qty, onChange: (e) => setQty(cleanNumInput(e.target.value)), className: "w-full h-10 px-3 rounded-md border border-input bg-background text-sm" }) }),
        /* @__PURE__ */ jsx(Field, { label: "النقطة الحرجة", children: /* @__PURE__ */ jsx("input", { type: "number", min: "0", step: "any", value: critical, onChange: (e) => setCritical(cleanNumInput(e.target.value)), className: "w-full h-10 px-3 rounded-md border border-input bg-background text-sm" }) }),
        showSub && /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx(Field, { label: "السعة الفرعية للقطعة الواحدة", children: /* @__PURE__ */ jsx("input", { type: "number", min: "0", step: "any", value: subQty, onChange: (e) => setSubQty(cleanNumInput(e.target.value)), placeholder: "مثلاً 5", className: "w-full h-10 px-3 rounded-md border border-input bg-background text-sm" }) }),
          /* @__PURE__ */ jsx(Field, { label: "الوحدة الفرعية", children: /* @__PURE__ */ jsx("select", { value: subType, onChange: (e) => setSubType(e.target.value), className: "w-full h-10 px-2 rounded-md border border-input bg-background text-sm", children: SUB_UNIT_TYPES.map((u) => /* @__PURE__ */ jsx("option", { value: u, children: u }, u)) }) }),
          /* @__PURE__ */ jsx(Field, { label: "متوسط السعر", children: /* @__PURE__ */ jsx("input", { type: "number", min: "0", step: "any", value: avgPrice, onChange: (e) => setAvg(cleanNumInput(e.target.value)), className: "w-full h-10 px-3 rounded-md border border-input bg-background text-sm" }) }),
          subQtyNum > 0 && /* @__PURE__ */ jsxs("div", { className: "col-span-full text-xs bg-secondary/40 rounded-md px-3 py-2 text-muted-foreground", children: [
            "1 ",
            unit,
            " =",
            " ",
            /* @__PURE__ */ jsxs("strong", { className: "text-foreground", children: [
              fmt2(subQtyNum),
              " ",
              subType
            ] })
          ] })
        ] }),
        !showSub && /* @__PURE__ */ jsx(Field, { label: "متوسط السعر", children: /* @__PURE__ */ jsx("input", { type: "number", min: "0", step: "any", value: avgPrice, onChange: (e) => setAvg(cleanNumInput(e.target.value)), className: "w-full h-10 px-3 rounded-md border border-input bg-background text-sm" }) })
      ] }),
      kind === "processed" && /* @__PURE__ */ jsxs("div", { className: "border border-amber-500/40 rounded-lg p-3 bg-amber-500/5 space-y-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("h3", { className: "font-bold text-sm flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Sparkles, { className: "w-4 h-4 text-amber-600" }),
            " المكونات المستخرجة من القطعة الواحدة (Yield)"
          ] }),
          /* @__PURE__ */ jsxs("button", { type: "button", onClick: () => setYieldComps([...yieldComps, {
            itemId: "",
            qty: 0,
            unit: "كيلوجرام"
          }]), className: "text-xs text-primary flex items-center gap-1 hover:underline", children: [
            /* @__PURE__ */ jsx(Plus, { className: "w-3 h-3" }),
            " إضافة مكون"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("p", { className: "text-xs text-muted-foreground", children: [
          "أدخل المكونات المستخرجة من ",
          /* @__PURE__ */ jsx("strong", { children: "قطعة واحدة" }),
          " فقط. عند الحفظ سيتم ضرب القيم في عدد القطع (",
          fmt2(pieces),
          ") وإضافتها إلى مخزون الأصناف المستهدفة، مع تسجيل ملاحظة آلية في حقل ملاحظات الصنف الهدف."
        ] }),
        yieldComps.length === 0 && /* @__PURE__ */ jsx("div", { className: "text-xs text-center py-3 text-muted-foreground", children: "لم تتم إضافة مكونات بعد" }),
        yieldComps.map((c, idx) => /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-12 gap-2 items-center", children: [
          /* @__PURE__ */ jsx("div", { className: "col-span-12 md:col-span-5", children: /* @__PURE__ */ jsx(SearchableSelect, { options: itemOptions, value: c.itemId, onChange: (v) => {
            const cp = [...yieldComps];
            cp[idx] = {
              ...cp[idx],
              itemId: v
            };
            setYieldComps(cp);
          }, placeholder: "ابحث عن صنف..." }) }),
          /* @__PURE__ */ jsx("div", { className: "col-span-7 md:col-span-3", children: /* @__PURE__ */ jsx("input", { type: "number", min: "0", step: "any", value: c.qty || "", placeholder: "الكمية / قطعة", onChange: (e) => {
            const cp = [...yieldComps];
            cp[idx] = {
              ...cp[idx],
              qty: clamp0(cleanNumInput(e.target.value))
            };
            setYieldComps(cp);
          }, className: "w-full h-10 px-3 rounded-md border border-input bg-background text-sm" }) }),
          /* @__PURE__ */ jsx("div", { className: "col-span-3 md:col-span-3", children: /* @__PURE__ */ jsx("select", { value: c.unit, onChange: (e) => {
            const cp = [...yieldComps];
            cp[idx] = {
              ...cp[idx],
              unit: e.target.value
            };
            setYieldComps(cp);
          }, className: "w-full h-10 px-2 rounded-md border border-input bg-background text-sm", children: YIELD_UNITS.map((u) => /* @__PURE__ */ jsx("option", { value: u, children: u }, u)) }) }),
          /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setYieldComps(yieldComps.filter((_, i) => i !== idx)), className: "col-span-2 md:col-span-1 h-10 grid place-items-center rounded-md text-destructive hover:bg-destructive/10", children: /* @__PURE__ */ jsx(Trash2, { className: "w-4 h-4" }) })
        ] }, idx)),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-12 gap-2 items-end border-t border-amber-500/30 pt-2", children: [
          /* @__PURE__ */ jsx("div", { className: "col-span-7", children: /* @__PURE__ */ jsx(Field, { label: "الهدر للقطعة الواحدة", children: /* @__PURE__ */ jsx("input", { type: "number", min: "0", step: "any", value: wasteQty, onChange: (e) => setWasteQty(cleanNumInput(e.target.value)), className: "w-full h-10 px-3 rounded-md border border-input bg-background text-sm" }) }) }),
          /* @__PURE__ */ jsx("div", { className: "col-span-5", children: /* @__PURE__ */ jsx(Field, { label: "النوع", children: /* @__PURE__ */ jsxs("div", { className: "flex gap-1 h-10", children: [
            /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setWasteMode("fixed"), className: `flex-1 rounded-md text-xs ${wasteMode === "fixed" ? "bg-primary text-primary-foreground" : "bg-secondary"}`, children: capacityUnit }),
            /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setWasteMode("percent"), className: `flex-1 rounded-md text-xs ${wasteMode === "percent" ? "bg-primary text-primary-foreground" : "bg-secondary"}`, children: "نسبة %" })
          ] }) }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: `rounded-md px-3 py-2 text-sm font-medium ${remainingOk ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400" : "bg-destructive/15 text-destructive"}`, children: [
          "المتبقي من سعة القطعة الواحدة:",
          " ",
          /* @__PURE__ */ jsxs("strong", { children: [
            fmt2(remaining),
            " ",
            capacityUnit
          ] }),
          !remainingOk && /* @__PURE__ */ jsx("span", { className: "text-xs ms-2", children: "(لا يمكن الحفظ — يجب أن يساوي 0)" }),
          compTotal.invalid && /* @__PURE__ */ jsx("span", { className: "text-xs ms-2 block", children: "⚠ بعض المكونات لها وحدة لا تتوافق مع وحدة السعة" })
        ] })
      ] }),
      /* @__PURE__ */ jsx(Field, { label: "حقل الملاحظات", children: /* @__PURE__ */ jsx("textarea", { value: notes, onChange: (e) => setNotes(e.target.value), rows: 3, placeholder: "ملاحظات تلقائية وملاحظات إضافية...", className: "w-full px-3 py-2 rounded-md border border-input bg-background text-sm" }) }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-2 pt-2", children: [
        /* @__PURE__ */ jsx("button", { type: "button", onClick: onClose, className: "flex-1 h-10 rounded-md border border-input text-sm font-medium hover:bg-secondary", children: "إلغاء" }),
        /* @__PURE__ */ jsx("button", { type: "submit", disabled: kind === "processed" && !remainingOk, className: "flex-1 h-10 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed", children: "حفظ" })
      ] })
    ] })
  ] }) });
}
function Field({
  label,
  children
}) {
  return /* @__PURE__ */ jsxs("label", { className: "block", children: [
    /* @__PURE__ */ jsx("span", { className: "text-xs font-medium text-muted-foreground mb-1 block", children: label }),
    children
  ] });
}
export {
  InventoryPage as component
};
