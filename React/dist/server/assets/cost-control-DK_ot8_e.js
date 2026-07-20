import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useMemo, useRef } from "react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import { A as ActionGate, u as useDB, j as deptKey, c as clamp0, n as SUB_DEPTS, f as fmt2, i as expandMealToBase, r as round2, R as RECIPE_UNITS, S as SHISHA_CATEGORY, h as cleanNumInput, o as convertToBase } from "./router-CvLZBAlt.js";
import { S as SearchableSelect } from "./SearchableSelect-abwGGBxa.js";
import { P as PinPrompt } from "./PinPrompt-G0e8UScH.js";
import { Boxes, ChefHat, ClipboardCheck, Save, FolderPlus, Plus, Upload, ChevronDown, ChevronLeft, Pencil, Copy, Trash2, FileText, X, History, Printer, AlertTriangle } from "lucide-react";
import "@tanstack/react-query";
import "@tanstack/react-router";
import "@radix-ui/react-dialog";
import "clsx";
import "tailwind-merge";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "js-sha256";
import "./arabic-CnN6FHbg.js";
function PrintAuditSheet({
  date,
  department,
  items,
  mealsCount
}) {
  return /* @__PURE__ */ jsxs("div", { className: "print-voucher", children: [
    /* @__PURE__ */ jsxs("div", { className: "text-center border-b border-black pb-2 mb-2", children: [
      /* @__PURE__ */ jsxs("h1", { className: "text-base font-bold", children: [
        "ورقة الجرد اليدوي — قسم ",
        department
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "text-xs", children: [
        "التاريخ: ",
        date,
        " • عدد الأصناف: ",
        items.length,
        " • عدد الوجبات بالقسم:",
        " ",
        mealsCount
      ] })
    ] }),
    /* @__PURE__ */ jsxs("table", { className: "print-table w-full", children: [
      /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("th", { style: { width: "26px" }, children: "#" }),
        /* @__PURE__ */ jsx("th", { style: { width: "60px" }, children: "الكود" }),
        /* @__PURE__ */ jsx("th", { children: "اسم الصنف" }),
        /* @__PURE__ */ jsx("th", { style: { width: "50px" }, children: "الوحدة" }),
        /* @__PURE__ */ jsx("th", { style: { width: "30px" }, children: "تم" }),
        /* @__PURE__ */ jsx("th", { style: { width: "110px" }, children: "الكمية الفعلية" })
      ] }) }),
      /* @__PURE__ */ jsx("tbody", { children: items.map((r, i) => /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("td", { children: i + 1 }),
        /* @__PURE__ */ jsx("td", { style: { fontFamily: "monospace" }, children: r.item.code }),
        /* @__PURE__ */ jsx("td", { children: r.item.name }),
        /* @__PURE__ */ jsx("td", { children: r.item.unit }),
        /* @__PURE__ */ jsx("td", { style: { textAlign: "center" }, children: "◯" }),
        /* @__PURE__ */ jsx("td", { children: "[         ]" })
      ] }, r.item.id)) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex justify-between mt-4 text-xs", children: [
      /* @__PURE__ */ jsx("div", { children: "اسم القائم بالجرد: ____________" }),
      /* @__PURE__ */ jsx("div", { children: "التوقيع: ____________" })
    ] })
  ] });
}
function CostControlPage() {
  const [tab, setTab] = useState("stock");
  const tabs = [{
    id: "stock",
    label: "مخزن الأقسام",
    icon: Boxes
  }, {
    id: "recipes",
    label: "الأصناف والريسبي",
    icon: ChefHat
  }, {
    id: "results",
    label: "النتائج والجرد",
    icon: ClipboardCheck
  }];
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "no-print", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold", children: "مراقبة التكاليف" }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground mt-1", children: "إدارة مخزن الأقسام، الريسبي، المبيعات، والجرد اليومي." })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "no-print flex flex-wrap gap-1 bg-secondary p-1 rounded-lg w-fit", children: tabs.map((t) => {
      const Icon = t.icon;
      const handlePress = () => setTab(t.id);
      if (t.id === "results") {
        return /* @__PURE__ */ jsx(ActionGate, { requiredRole: "مدير", onSuccess: handlePress, children: /* @__PURE__ */ jsxs("button", { className: `px-4 h-9 rounded-md text-sm font-medium flex items-center gap-2 transition ${tab === t.id ? "bg-card shadow-sm" : "text-muted-foreground"}`, children: [
          /* @__PURE__ */ jsx(Icon, { className: "w-4 h-4" }),
          " ",
          t.label
        ] }) }, t.id);
      }
      return /* @__PURE__ */ jsxs("button", { onClick: handlePress, className: `px-4 h-9 rounded-md text-sm font-medium flex items-center gap-2 transition ${tab === t.id ? "bg-card shadow-sm" : "text-muted-foreground"}`, children: [
        /* @__PURE__ */ jsx(Icon, { className: "w-4 h-4" }),
        " ",
        t.label
      ] }, t.id);
    }) }),
    tab === "stock" && /* @__PURE__ */ jsx(DeptStockTab, {}),
    tab === "recipes" && /* @__PURE__ */ jsx(RecipesTab, {}),
    tab === "results" && /* @__PURE__ */ jsx(ResultsTab, {})
  ] });
}
function DeptStockTab() {
  const {
    db = {
      items: [],
      deptStock: {}
    },
    setDeptStockQty
  } = useDB() || {};
  const [dept, setDept] = useState("مطبخ");
  const [pinFor, setPinFor] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editVal, setEditVal] = useState("");
  const rows = useMemo(() => {
    const items = db?.items || [];
    const stock = db?.deptStock || {};
    return items.map((it) => {
      const key = it?.id ? deptKey(dept, it.id) : "";
      return {
        item: it,
        qty: clamp0(stock[key] || 0)
      };
    });
  }, [db, dept]);
  const filled = rows.filter((r) => r.qty > 0);
  clamp0(filled.reduce((s, r) => s + r.qty * r.item.avgPrice, 0));
  function startAdjust(itemId, current) {
    setEditingId(itemId);
    setEditVal(fmt2(current));
  }
  function onPinOk() {
    setEditingId(pinFor);
    setPinFor(null);
  }
  function saveAdjust(itemId) {
    const v = clamp0(parseFloat(editVal) || 0);
    if (setDeptStockQty) setDeptStockQty(dept, itemId, v);
    toast.success("تم تعديل الكمية");
    setEditingId(null);
  }
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4 no-print", dir: "rtl", children: [
    pinFor && /* @__PURE__ */ jsx(
      PinPrompt,
      {
        open: !!pinFor,
        onSuccess: onPinOk,
        onClose: () => setPinFor(null),
        onCancel: () => setPinFor(null)
      }
    ),
    /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2 flex-wrap", children: SUB_DEPTS.map((d) => /* @__PURE__ */ jsx("button", { onClick: () => setDept(d), className: `px-4 h-9 rounded-md text-sm font-medium ${dept === d ? "bg-primary text-primary-foreground" : "bg-secondary"}`, children: d }, d)) }),
    /* @__PURE__ */ jsx("div", { className: "bg-card border border-border rounded-xl overflow-hidden", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
      /* @__PURE__ */ jsx("thead", { className: "bg-secondary/50 text-xs", children: /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("th", { className: "text-right p-3", children: "الكود" }),
        /* @__PURE__ */ jsx("th", { className: "text-right p-3", children: "اسم الصنف" }),
        /* @__PURE__ */ jsxs("th", { className: "text-right p-3", children: [
          "الكمية في ",
          dept
        ] }),
        /* @__PURE__ */ jsx("th", { className: "text-right p-3", children: "إجراء" })
      ] }) }),
      /* @__PURE__ */ jsx("tbody", { children: filled.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 7, className: "p-8 text-center text-muted-foreground", children: "لا توجد أصناف" }) }) : filled.map((r) => /* @__PURE__ */ jsxs("tr", { className: "border-t border-border", children: [
        /* @__PURE__ */ jsx("td", { className: "p-3 font-mono text-xs", children: r.item.code }),
        /* @__PURE__ */ jsx("td", { className: "p-3 font-medium", children: r.item.name }),
        /* @__PURE__ */ jsx("td", { className: "p-3 font-bold", children: editingId === r.item.id ? /* @__PURE__ */ jsx("input", { type: "number", min: "0", step: "any", value: editVal, onChange: (e) => setEditVal(e.target.value), className: "w-24 h-8 px-2 rounded-md border border-input bg-background text-sm" }) : fmt2(r.qty) }),
        /* @__PURE__ */ jsx("td", { className: "p-3", children: editingId === r.item.id ? /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsxs("button", { className: "px-2 h-7 rounded bg-primary text-primary-foreground text-xs flex items-center gap-1", onClick: () => saveAdjust(r.item.id), children: [
            /* @__PURE__ */ jsx(Save, { className: "w-3 h-3" }),
            " حفظ"
          ] }),
          /* @__PURE__ */ jsx("button", { onClick: () => setEditingId(null), className: "px-2 h-7 rounded bg-secondary text-xs", children: "إلغاء" })
        ] }) : (
          /* إذا لم يكن في حالة تعديل، اظهر زرار التعديل محمي بباسوورد المدير */
          /* @__PURE__ */ jsx(ActionGate, { requiredRole: "مدير", onSuccess: () => startAdjust(r.item.id, r.qty), children: /* @__PURE__ */ jsx("button", { className: "px-2 h-7 rounded bg-amber-100 text-xs text-amber-900", children: "تعديل الكمية" }) })
        ) })
      ] }, r.item.id)) })
    ] }) })
  ] });
}
function RecipesTab() {
  const {
    db,
    saveMeal,
    deleteMeal,
    bulkAddMeals
  } = useDB();
  const [editing, setEditing] = useState(null);
  const [newKind, setNewKind] = useState(null);
  const [newCategory, setNewCategory] = useState("");
  const [mealsKind, setMealsKind] = useState("menu");
  const [mealsDept, setMealsDept] = useState("مطبخ");
  const [openCats, setOpenCats] = useState({});
  const fileRef = useRef(null);
  const visibleMeals = useMemo(() => db.meals.filter((m) => (m.kind || "menu") === mealsKind && m.department === mealsDept), [db.meals, mealsKind, mealsDept]);
  const grouped = useMemo(() => {
    const map = /* @__PURE__ */ new Map();
    for (const m of visibleMeals) {
      const c = (m.category || "").trim() || "غير مصنف";
      const arr = map.get(c) || [];
      arr.push(m);
      map.set(c, arr);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0], "ar"));
  }, [visibleMeals]);
  function computeCost(meal) {
    const map = expandMealToBase(meal, db.meals, db.items);
    let c = 0;
    for (const [, info] of map) c += info.cost;
    return round2(clamp0(c));
  }
  function importExcel(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, {
          type: "array"
        });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet, {
          defval: ""
        });
        const groups = /* @__PURE__ */ new Map();
        let skipped = 0;
        for (const row of json) {
          const mealName = String(row["اسم الوجبة"] || row["الوجبة"] || "").trim();
          const ingName = String(row["اسم المكون"] || row["المكون"] || "").trim();
          const qty = clamp0(parseFloat(row["الكمية"]) || 0);
          const unit = String(row["الوحده"] || row["الوحدة"] || "").trim();
          if (!mealName || qty <= 0 || !ingName) {
            skipped++;
            continue;
          }
          const item = db.items.find((i) => i.name.trim() === ingName) || db.items.find((i) => i.name.trim().includes(ingName) || ingName.includes(i.name.trim()));
          if (!item) {
            skipped++;
            continue;
          }
          const useUnit = RECIPE_UNITS.includes(unit) ? unit : item.unit;
          const arr = groups.get(mealName) || [];
          arr.push({
            itemId: item.id,
            qty,
            unit: useUnit,
            refKind: "item"
          });
          groups.set(mealName, arr);
        }
        const meals = [];
        for (const [name, ingredients] of groups) {
          meals.push({
            id: crypto.randomUUID(),
            name,
            department: mealsDept,
            sellingPrice: 0,
            wasteMargin: 0,
            wasteMode: "percent",
            kind: mealsKind,
            category: "",
            ingredients
          });
        }
        if (meals.length === 0) {
          toast.error("لم يتم استيراد أي وجبة.");
          return;
        }
        bulkAddMeals(meals);
        toast.success(`تم استيراد ${meals.length} وجبة. ${skipped > 0 ? `(تخطي ${skipped} صف)` : ""}`);
      } catch (err) {
        toast.error("فشل قراءة الملف: " + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  }
  function cloneMeal(m) {
    setEditing({
      ...m,
      id: crypto.randomUUID(),
      name: m.name + " (نسخة)",
      ingredients: m.ingredients.map((x) => ({
        ...x
      }))
    });
  }
  function addCategory() {
    const name = prompt("اسم القسم الجديد:");
    if (!name?.trim()) return;
    setOpenCats({
      ...openCats,
      [name.trim()]: true
    });
    toast.success("تم إضافة القسم — أضف وجبات إليه باستخدام زر 'إضافة صنف'.");
  }
  function startNewItem(category) {
    setNewKind(mealsKind);
    setNewCategory(category || "");
    setEditing(null);
  }
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4 no-print", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex gap-1 bg-secondary p-1 rounded-lg", children: [
        /* @__PURE__ */ jsx("button", { onClick: () => setMealsKind("menu"), className: `px-3 h-8 rounded-md text-xs font-medium ${mealsKind === "menu" ? "bg-card shadow-sm" : "text-muted-foreground"}`, children: "الأصناف (جاهزة للبيع)" }),
        /* @__PURE__ */ jsx("button", { onClick: () => setMealsKind("processed"), className: `px-3 h-8 rounded-md text-xs font-medium ${mealsKind === "processed" ? "bg-card shadow-sm" : "text-muted-foreground"}`, children: "المواد المصنعة" })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex gap-1 bg-secondary p-1 rounded-lg", children: SUB_DEPTS.map((d) => /* @__PURE__ */ jsx("button", { onClick: () => setMealsDept(d), className: `px-3 h-8 rounded-md text-xs font-medium ${mealsDept === d ? "bg-card shadow-sm" : "text-muted-foreground"}`, children: d }, d)) }),
      /* @__PURE__ */ jsxs("div", { className: "ms-auto flex flex-wrap gap-2", children: [
        /* @__PURE__ */ jsxs("button", { onClick: addCategory, className: "h-9 px-3 rounded-lg border border-input text-sm font-medium hover:bg-secondary flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(FolderPlus, { className: "w-4 h-4" }),
          " إضافة قسم"
        ] }),
        /* @__PURE__ */ jsxs("button", { onClick: () => startNewItem(), className: "h-9 px-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4" }),
          " إضافة صنف"
        ] }),
        /* @__PURE__ */ jsxs("button", { onClick: () => fileRef.current?.click(), className: "h-9 px-3 rounded-lg border border-input text-sm font-medium hover:bg-secondary flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Upload, { className: "w-4 h-4" }),
          " استيراد Excel"
        ] }),
        /* @__PURE__ */ jsx("input", { ref: fileRef, type: "file", accept: ".xlsx,.xls,.csv", className: "hidden", onChange: (e) => {
          const f = e.target.files?.[0];
          if (f) importExcel(f);
          e.target.value = "";
        } })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "space-y-2", children: grouped.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "bg-card border border-border rounded-xl p-8 text-center text-muted-foreground", children: [
      "لا توجد ",
      mealsKind === "menu" ? "أصناف" : "مواد مصنعة",
      " في",
      " ",
      mealsDept,
      ' — استخدم "إضافة صنف" للبدء.'
    ] }) : grouped.map(([cat, meals]) => {
      const isOpen = openCats[cat] !== false;
      return /* @__PURE__ */ jsxs("div", { className: "bg-card border border-border rounded-xl overflow-hidden", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between px-4 h-12 bg-secondary/40", children: [
          /* @__PURE__ */ jsxs("button", { onClick: () => setOpenCats({
            ...openCats,
            [cat]: !isOpen
          }), className: "flex items-center gap-2 font-bold text-sm", children: [
            isOpen ? /* @__PURE__ */ jsx(ChevronDown, { className: "w-4 h-4" }) : /* @__PURE__ */ jsx(ChevronLeft, { className: "w-4 h-4" }),
            "📁 ",
            cat,
            /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground font-normal", children: [
              "(",
              meals.length,
              ")"
            ] })
          ] }),
          /* @__PURE__ */ jsxs("button", { onClick: () => startNewItem(cat === "غير مصنف" ? "" : cat), className: "text-xs text-primary hover:underline flex items-center gap-1", children: [
            /* @__PURE__ */ jsx(Plus, { className: "w-3 h-3" }),
            " إضافة صنف هنا"
          ] })
        ] }),
        isOpen && /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
          /* @__PURE__ */ jsx("thead", { className: "bg-secondary/20 text-xs", children: /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("th", { className: "text-right p-3", children: "الاسم" }),
            /* @__PURE__ */ jsx("th", { className: "text-right p-3", children: "المكونات" }),
            /* @__PURE__ */ jsx("th", { className: "text-right p-3", children: "سعر التصنيع" }),
            /* @__PURE__ */ jsx("th", { className: "text-right p-3", children: "سعر البيع" }),
            /* @__PURE__ */ jsx("th", { className: "text-right p-3", children: "إجراءات" })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { children: meals.map((m) => {
            const cost = computeCost(m);
            const profit = m.sellingPrice - cost;
            return /* @__PURE__ */ jsxs("tr", { className: "border-t border-border", children: [
              /* @__PURE__ */ jsx("td", { className: "p-3 font-medium", children: m.name }),
              /* @__PURE__ */ jsx("td", { className: "p-3", children: m.ingredients.length }),
              /* @__PURE__ */ jsx("td", { className: "p-3", children: fmt2(cost) }),
              /* @__PURE__ */ jsxs("td", { className: "p-3", children: [
                fmt2(m.sellingPrice),
                m.kind === "menu" && /* @__PURE__ */ jsxs("span", { className: `text-xs ms-1 ${profit >= 0 ? "text-success" : "text-destructive"}`, children: [
                  "(",
                  fmt2(profit),
                  ")"
                ] })
              ] }),
              /* @__PURE__ */ jsx("td", { className: "p-3", children: /* @__PURE__ */ jsxs("div", { className: "flex gap-1", children: [
                /* @__PURE__ */ jsx("button", { onClick: () => setEditing(m), title: "تعديل", className: "p-1.5 rounded hover:bg-secondary", children: /* @__PURE__ */ jsx(Pencil, { className: "w-4 h-4" }) }),
                /* @__PURE__ */ jsx("button", { onClick: () => cloneMeal(m), title: "نسخ", className: "p-1.5 rounded hover:bg-secondary text-primary", children: /* @__PURE__ */ jsx(Copy, { className: "w-4 h-4" }) }),
                /* @__PURE__ */ jsx("button", { onClick: () => {
                  if (confirm(`حذف "${m.name}"؟`)) deleteMeal(m.id);
                }, title: "حذف", className: "p-1.5 rounded hover:bg-destructive/10 text-destructive", children: /* @__PURE__ */ jsx(Trash2, { className: "w-4 h-4" }) })
              ] }) })
            ] }, m.id);
          }) })
        ] })
      ] }, cat);
    }) }),
    (newKind !== null || editing) && /* @__PURE__ */ jsx(MealDialog, { initial: editing, defaultKind: newKind || mealsKind, defaultDept: mealsDept, defaultCategory: newCategory, onClose: () => {
      setNewKind(null);
      setEditing(null);
      setNewCategory("");
    }, onSave: (m) => {
      saveMeal(m);
      setNewKind(null);
      setEditing(null);
      setNewCategory("");
    } })
  ] });
}
function MealDialog({
  initial,
  defaultKind,
  defaultDept,
  defaultCategory,
  onClose,
  onSave
}) {
  const {
    db
  } = useDB();
  const [name, setName] = useState(initial?.name || "");
  const [dept, setDept] = useState(initial?.department || defaultDept);
  const [kind, setKind] = useState(initial?.kind || defaultKind);
  const [category, setCategory] = useState(initial?.category || defaultCategory);
  const [price, setPrice] = useState(initial?.sellingPrice?.toString() || "0");
  const [waste, setWaste] = useState(initial?.wasteMargin?.toString() || "0");
  const [wasteMode, setWasteMode] = useState(initial?.wasteMode || "percent");
  const [ings, setIngs] = useState(initial?.ingredients.map((x) => ({
    ...x,
    refKind: x.refKind || "item"
  })) || []);
  const [hasModifiers, setHasModifiers] = useState(!!initial?.hasModifiers);
  const [modGroups, setModGroups] = useState(initial?.modifierGroups || []);
  const isShishaCat = (category || "").trim() === SHISHA_CATEGORY;
  function addGroup() {
    setModGroups([...modGroups, {
      id: crypto.randomUUID(),
      name: "",
      required: true,
      options: []
    }]);
  }
  function updateGroup(gid, patch) {
    setModGroups(modGroups.map((g) => g.id === gid ? {
      ...g,
      ...patch
    } : g));
  }
  function removeGroup(gid) {
    setModGroups(modGroups.filter((g) => g.id !== gid));
  }
  function addOption(gid) {
    updateGroup(gid, {
      options: [...modGroups.find((g) => g.id === gid)?.options || [], {
        id: crypto.randomUUID(),
        label: "",
        extraPrice: 0
      }]
    });
  }
  function updateOption(gid, oid, patch) {
    const g = modGroups.find((x) => x.id === gid);
    if (!g) return;
    updateGroup(gid, {
      options: g.options.map((o) => o.id === oid ? {
        ...o,
        ...patch
      } : o)
    });
  }
  function removeOption(gid, oid) {
    const g = modGroups.find((x) => x.id === gid);
    if (!g) return;
    updateGroup(gid, {
      options: g.options.filter((o) => o.id !== oid)
    });
  }
  const cost = useMemo(() => {
    const tmpMeal = {
      id: initial?.id || "tmp",
      sellingPrice: clamp0(price),
      wasteMargin: clamp0(waste),
      ingredients: ings.filter((i) => i.itemId && i.qty > 0)
    };
    const map = expandMealToBase(tmpMeal, db.meals, db.items);
    let c = 0;
    for (const [, info] of map) c += info.cost;
    return round2(clamp0(c));
  }, [ings, db.items, db.meals, name, dept, price, waste, wasteMode, kind, category, initial?.id]);
  const ingredientOptions = useMemo(() => {
    const items = db.items.map((i) => ({
      value: `item:${i.id}`,
      label: i.name,
      hint: i.unit,
      group: i.kind === "processed" ? "مصنع (مخزن)" : "مكونات المخزن"
    }));
    const processed = db.meals.filter((m) => m.id !== initial?.id && (m.kind || "menu") === "processed").map((m) => ({
      value: `meal:${m.id}`,
      label: "🍳 " + m.name,
      hint: m.department,
      group: "مواد مصنعة (وصفات)"
    }));
    const menus = db.meals.filter((m) => m.id !== initial?.id && (m.kind || "menu") === "menu").map((m) => ({
      value: `meal:${m.id}`,
      label: "🍽 " + m.name,
      hint: m.department,
      group: "أصناف جاهزة"
    }));
    return [...items, ...processed, ...menus];
  }, [db.items, db.meals, initial?.id]);
  return /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 bg-black/50 grid place-items-center p-4", onClick: onClose, children: /* @__PURE__ */ jsxs("div", { className: "bg-card border border-border rounded-xl w-full max-w-5xl p-5 max-h-[90vh] overflow-auto", onClick: (e) => e.stopPropagation(), children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-4", children: [
      /* @__PURE__ */ jsxs("h2", { className: "text-lg font-bold", children: [
        initial ? "تعديل" : "جديد",
        " —",
        " ",
        kind === "menu" ? "صنف للبيع" : "مادة مصنعة"
      ] }),
      /* @__PURE__ */ jsx("button", { onClick: onClose, className: "p-1 hover:bg-secondary rounded", children: /* @__PURE__ */ jsx(X, { className: "w-5 h-5" }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-3 mb-4", children: [
      /* @__PURE__ */ jsxs("label", { className: "block col-span-2", children: [
        /* @__PURE__ */ jsx("span", { className: "text-xs mb-1 block", children: "الاسم" }),
        /* @__PURE__ */ jsx("input", { value: name, onChange: (e) => setName(e.target.value), className: "w-full h-10 px-3 rounded-md border border-input bg-background text-sm" })
      ] }),
      /* @__PURE__ */ jsxs("label", { className: "block", children: [
        /* @__PURE__ */ jsx("span", { className: "text-xs mb-1 block", children: "النوع" }),
        /* @__PURE__ */ jsxs("select", { value: kind, onChange: (e) => setKind(e.target.value), className: "w-full h-10 px-2 rounded-md border border-input bg-background text-sm", children: [
          /* @__PURE__ */ jsx("option", { value: "menu", children: "صنف للبيع" }),
          /* @__PURE__ */ jsx("option", { value: "processed", children: "مادة مصنعة" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("label", { className: "block", children: [
        /* @__PURE__ */ jsx("span", { className: "text-xs mb-1 block", children: "القسم" }),
        /* @__PURE__ */ jsx("select", { value: dept, onChange: (e) => setDept(e.target.value), className: "w-full h-10 px-2 rounded-md border border-input bg-background text-sm", children: SUB_DEPTS.map((d) => /* @__PURE__ */ jsx("option", { value: d, children: d }, d)) })
      ] }),
      /* @__PURE__ */ jsxs("label", { className: "block col-span-2", children: [
        /* @__PURE__ */ jsx("span", { className: "text-xs mb-1 block", children: "القسم (مجلد/فئة)" }),
        /* @__PURE__ */ jsx("input", { value: category, onChange: (e) => setCategory(e.target.value), placeholder: "مثلاً: مشاوي، بيتزا، عصائر", className: "w-full h-10 px-3 rounded-md border border-input bg-background text-sm" })
      ] }),
      kind === "menu" && /* @__PURE__ */ jsxs("label", { className: "block", children: [
        /* @__PURE__ */ jsx("span", { className: "text-xs mb-1 block", children: "سعر البيع" }),
        /* @__PURE__ */ jsx("input", { type: "number", min: "0", step: "any", value: price, onChange: (e) => setPrice(cleanNumInput(e.target.value)), className: "w-full h-10 px-3 rounded-md border border-input bg-background text-sm" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "block col-span-2 md:col-span-4 text-xs bg-secondary/40 rounded-md px-3 py-2 text-muted-foreground", children: [
        "حدّد",
        " ",
        /* @__PURE__ */ jsx("strong", { className: "text-foreground", children: "هامش الخطأ المسموح (جرام)" }),
        " ",
        "يدوياً لكل مكون أدناه. يُستخدم في صفحة الجرد لاحتساب الهدر المسموح به فقط للأصناف التي بِيعت اليوم."
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-2", children: [
      /* @__PURE__ */ jsx("h3", { className: "font-semibold text-sm", children: "المكونات (مخزون، مواد مصنعة، أو وجبات)" }),
      /* @__PURE__ */ jsxs("button", { onClick: () => setIngs([...ings, {
        itemId: "",
        qty: 0,
        unit: "كيلوجرام",
        refKind: "item"
      }]), className: "text-sm text-primary flex items-center gap-1 hover:underline", children: [
        /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4" }),
        " إضافة مكون"
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "space-y-2", children: ings.map((ing, idx) => {
      const isMeal = ing.refKind === "meal";
      const it = !isMeal ? db.items.find((i) => i.id === ing.itemId) : void 0;
      const ml = isMeal ? db.meals.find((m) => m.id === ing.itemId) : void 0;
      const base = it ? convertToBase(ing.qty, ing.unit, it.unit, it.conversionFactor, it.subUnitType) : 0;
      const currentValue = ing.itemId ? `${isMeal ? "meal" : "item"}:${ing.itemId}` : "";
      return /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-12 gap-2 items-start bg-secondary/30 p-2 rounded-lg", children: [
        /* @__PURE__ */ jsxs("div", { className: "col-span-12 md:col-span-6", children: [
          /* @__PURE__ */ jsx(SearchableSelect, { options: ingredientOptions, value: currentValue, placeholder: "ابحث عن مكون أو وصفة...", onChange: (v) => {
            const [refKind, id] = v.split(":");
            const c = [...ings];
            if (refKind === "meal") c[idx] = {
              itemId: id,
              qty: c[idx].qty || 1,
              unit: "قطعة",
              refKind: "meal"
            };
            else {
              const it2 = db.items.find((i) => i.id === id);
              c[idx] = {
                itemId: id,
                qty: c[idx].qty,
                unit: it2?.unit || "كيلوجرام",
                refKind: "item"
              };
            }
            setIngs(c);
          } }),
          it && /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground mt-1 px-1", children: [
            "وحدة المخزن: ",
            it.unit,
            " ",
            it.subUnitQty ? `(1 ${it.unit} = ${it.subUnitQty} ${it.subUnitType})` : "",
            " ",
            "• سعر: ",
            fmt2(it.avgPrice)
          ] }),
          ml && /* @__PURE__ */ jsxs("div", { className: "text-xs text-muted-foreground mt-1 px-1", children: [
            "من قسم: ",
            ml.department,
            " • ",
            ml.ingredients.length,
            " مكون"
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "col-span-5 md:col-span-3", children: /* @__PURE__ */ jsx("input", { type: "number", min: "0", step: "any", value: ing.qty || "", placeholder: isMeal ? "العدد" : "الكمية", onChange: (e) => {
          const c = [...ings];
          c[idx] = {
            ...c[idx],
            qty: clamp0(cleanNumInput(e.target.value))
          };
          setIngs(c);
        }, className: "w-full h-10 px-3 rounded-md border border-input bg-background text-sm" }) }),
        /* @__PURE__ */ jsx("div", { className: "col-span-5 md:col-span-2", children: isMeal ? /* @__PURE__ */ jsx("div", { className: "h-10 grid place-items-center text-xs text-muted-foreground bg-background border border-input rounded-md", children: "وحدة" }) : /* @__PURE__ */ jsx("select", { value: ing.unit, onChange: (e) => {
          const c = [...ings];
          c[idx] = {
            ...c[idx],
            unit: e.target.value
          };
          setIngs(c);
        }, className: "w-full h-10 px-2 rounded-md border border-input bg-background text-sm", children: RECIPE_UNITS.map((u) => /* @__PURE__ */ jsx("option", { value: u, children: u }, u)) }) }),
        /* @__PURE__ */ jsx("div", { className: "col-span-2 md:col-span-1 flex justify-center", children: /* @__PURE__ */ jsx("button", { onClick: () => setIngs(ings.filter((_, i) => i !== idx)), className: "h-10 w-10 grid place-items-center rounded-md text-destructive hover:bg-destructive/10", children: /* @__PURE__ */ jsx(Trash2, { className: "w-4 h-4" }) }) }),
        it && base > 0 && /* @__PURE__ */ jsxs("div", { className: "col-span-12 text-xs text-muted-foreground px-1", children: [
          "يعادل: ",
          fmt2(base),
          " ",
          it.unit
        ] }),
        !isMeal && /* @__PURE__ */ jsxs("div", { className: "col-span-12 md:col-span-6 flex items-center gap-2 px-1", children: [
          /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground whitespace-nowrap", children: "هامش الخطأ المسموح (جرام):" }),
          /* @__PURE__ */ jsx("input", { type: "number", min: "0", step: "any", value: ing.errorMargin ?? "", placeholder: "0", onChange: (e) => {
            const c = [...ings];
            c[idx] = {
              ...c[idx],
              errorMargin: clamp0(cleanNumInput(e.target.value))
            };
            setIngs(c);
          }, className: "w-28 h-8 px-2 rounded-md border border-input bg-background text-xs" })
        ] })
      ] }, idx);
    }) }),
    isShishaCat && kind === "menu" && /* @__PURE__ */ jsxs("div", { className: "mt-4 p-3 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900 text-xs text-purple-800 dark:text-purple-200", children: [
      "✨ هذا الصنف ضمن فئة ",
      /* @__PURE__ */ jsx("strong", { children: "الشيشة" }),
      ' — لن يتم خصمه من المخزن الفرعي ولن يظهر "العدد الممكن تصنيعه" في شاشة الطلبات.'
    ] }),
    kind === "menu" && /* @__PURE__ */ jsxs("div", { className: "mt-4 border-t border-border pt-4", children: [
      /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-2 text-sm font-medium cursor-pointer", children: [
        /* @__PURE__ */ jsx("input", { type: "checkbox", checked: hasModifiers, onChange: (e) => setHasModifiers(e.target.checked) }),
        "هل توجد خيارات أو إضافات لهذا المنتج؟"
      ] }),
      hasModifiers && /* @__PURE__ */ jsxs("div", { className: "mt-3 space-y-3", children: [
        modGroups.map((g) => /* @__PURE__ */ jsxs("div", { className: "border border-border rounded-lg p-3 bg-secondary/30 space-y-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("input", { value: g.name, onChange: (e) => updateGroup(g.id, {
              name: e.target.value
            }), placeholder: "اسم المجموعة (مثلاً: نوع البن)", className: "flex-1 h-9 px-3 rounded-md border border-input bg-background text-sm" }),
            /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-1 text-xs", children: [
              /* @__PURE__ */ jsx("input", { type: "checkbox", checked: g.required, onChange: (e) => updateGroup(g.id, {
                required: e.target.checked
              }) }),
              "مطلوب"
            ] }),
            /* @__PURE__ */ jsx("button", { onClick: () => removeGroup(g.id), className: "p-2 text-destructive hover:bg-destructive/10 rounded", children: /* @__PURE__ */ jsx(Trash2, { className: "w-4 h-4" }) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-1", children: [
            g.options.map((o) => /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-12 gap-2 items-center", children: [
              /* @__PURE__ */ jsx("input", { value: o.label, onChange: (e) => updateOption(g.id, o.id, {
                label: e.target.value
              }), placeholder: "الخيار (مثلاً: سادة)", className: "col-span-7 h-9 px-3 rounded-md border border-input bg-background text-sm" }),
              /* @__PURE__ */ jsx("input", { type: "number", min: "0", step: "any", value: o.extraPrice || "", onChange: (e) => updateOption(g.id, o.id, {
                extraPrice: clamp0(parseFloat(cleanNumInput(e.target.value)) || 0)
              }), placeholder: "سعر إضافي", className: "col-span-4 h-9 px-3 rounded-md border border-input bg-background text-sm" }),
              /* @__PURE__ */ jsx("button", { onClick: () => removeOption(g.id, o.id), className: "col-span-1 p-2 text-destructive hover:bg-destructive/10 rounded", children: /* @__PURE__ */ jsx(X, { className: "w-4 h-4" }) })
            ] }, o.id)),
            /* @__PURE__ */ jsxs("button", { onClick: () => addOption(g.id), className: "text-xs text-primary flex items-center gap-1 hover:underline mt-1", children: [
              /* @__PURE__ */ jsx(Plus, { className: "w-3 h-3" }),
              " إضافة خيار"
            ] })
          ] })
        ] }, g.id)),
        /* @__PURE__ */ jsxs("button", { onClick: addGroup, className: "px-3 h-9 rounded-md bg-secondary text-sm flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4" }),
          " إضافة مجموعة خيارات"
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between border-t border-border pt-4 mt-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "text-sm", children: [
        "سعر التصنيع:",
        " ",
        /* @__PURE__ */ jsx("strong", { className: "text-primary text-lg", children: fmt2(cost) }),
        " ج.م"
      ] }),
      /* @__PURE__ */ jsxs("button", { onClick: () => {
        if (!name.trim()) {
          toast.error("أدخل الاسم");
          return;
        }
        const cleanIngs = ings.filter((i) => i.itemId && i.qty > 0);
        if (cleanIngs.length === 0 && !isShishaCat) {
          toast.error("أضف مكون واحدًا على الأقل");
          return;
        }
        const cleanGroups = hasModifiers ? modGroups.map((g) => ({
          ...g,
          name: g.name.trim(),
          options: g.options.filter((o) => o.label.trim())
        })).filter((g) => g.name && g.options.length > 0) : [];
        onSave({
          id: initial?.id || crypto.randomUUID(),
          name: name.trim(),
          department: dept,
          kind,
          category: category.trim(),
          sellingPrice: kind === "menu" ? clamp0(price) : 0,
          wasteMargin: clamp0(waste),
          wasteMode,
          ingredients: cleanIngs,
          hasModifiers: hasModifiers && cleanGroups.length > 0,
          modifierGroups: cleanGroups
        });
      }, className: "px-5 h-11 rounded-lg bg-primary text-primary-foreground font-medium flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Save, { className: "w-4 h-4" }),
        " حفظ"
      ] })
    ] })
  ] }) });
}
function aggregateDailySales(sales, date, dept, meals) {
  const map = /* @__PURE__ */ new Map();
  for (const s of sales) {
    const cleanSaleDate = new Date(s.createdAt || s.date).toLocaleDateString("en-CA");
    if (cleanSaleDate !== date || s.department !== dept) continue;
    for (const ln of s.lines) {
      const m = meals.find((x) => x.id === ln.mealId);
      if (!m) continue;
      const cur = map.get(m.id) || {
        name: m.name,
        qty: 0,
        price: m.sellingPrice,
        total: 0
      };
      cur.qty += ln.qty;
      cur.total += m.sellingPrice * ln.qty;
      map.set(m.id, cur);
    }
  }
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, "ar"));
}
function ResultsTab() {
  const {
    db
  } = useDB();
  const [view, setView] = useState("all");
  const [range, setRange] = useState("7d");
  const [printing, setPrinting] = useState(null);
  const [enddayDate, setEnddayDate] = useState((/* @__PURE__ */ new Date()).toISOString().slice(0, 10));
  const rangeDays = range === "1d" ? 1 : range === "3d" ? 3 : range === "7d" ? 7 : range === "30d" ? 30 : 90;
  const filteredSales = useMemo(() => {
    const cutoff = /* @__PURE__ */ new Date();
    cutoff.setHours(0, 0, 0, 0);
    cutoff.setDate(cutoff.getDate() - rangeDays + 1);
    const cutoffTime = cutoff.getTime();
    return db.sales.filter((s) => {
      const saleDate = new Date(s.date);
      saleDate.setHours(0, 0, 0, 0);
      if (saleDate.getTime() < cutoffTime) return false;
      if (view === "kitchen" && s.department !== "مطبخ") return false;
      if (view === "bar" && s.department !== "بار") return false;
      return true;
    });
  }, [db.sales, rangeDays, view]);
  const aggregatedItems = useMemo(() => {
    const map = /* @__PURE__ */ new Map();
    filteredSales.forEach((sale) => {
      sale.lines.forEach((line) => {
        const meal = db.meals.find((m) => m.id === line.mealId);
        if (meal) {
          const expandMap = expandMealToBase(meal, db.meals, db.items);
          let c = 0;
          for (const [, info] of expandMap) c += info.cost;
          const cost = round2(clamp0(c));
          const existing = map.get(meal.id);
          if (existing) {
            existing.qty += line.qty;
          } else {
            map.set(meal.id, {
              meal,
              qty: line.qty,
              cost,
              price: meal.sellingPrice,
              dept: sale.department
              // حفظ القسم عشان نعرضه في الجدول للتمييز
            });
          }
        }
      });
    });
    return Array.from(map.values()).sort((a, b) => a.meal.name.localeCompare(b.meal.name, "ar"));
  }, [filteredSales, db.meals, db.items]);
  const totalSales = clamp0(aggregatedItems.reduce((s, x) => s + x.price * x.qty, 0));
  const totalCost = clamp0(aggregatedItems.reduce((s, x) => s + x.cost * x.qty, 0));
  const profit = totalSales - totalCost;
  function printEndOfDay() {
    setPrinting("endday");
    setTimeout(() => {
      window.print();
      setTimeout(() => setPrinting(null), 500);
    }, 100);
  }
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "no-print flex flex-wrap items-center gap-2", children: [
      /* @__PURE__ */ jsx("div", { className: "flex gap-1 bg-secondary p-1 rounded-lg", children: [{
        id: "all",
        label: "الكل"
      }, {
        id: "kitchen",
        label: "المطبخ"
      }, {
        id: "bar",
        label: "البار"
      }, {
        id: "audit",
        label: "الجرد"
      }].map((t) => /* @__PURE__ */ jsx("button", { onClick: () => setView(t.id), className: `px-3 h-8 rounded-md text-xs font-medium ${view === t.id ? "bg-card shadow-sm" : "text-muted-foreground"}`, children: t.label }, t.id)) }),
      view !== "audit" && /* @__PURE__ */ jsxs("select", { value: range, onChange: (e) => setRange(e.target.value), className: "h-9 px-3 rounded-md border border-input bg-background text-sm", children: [
        /* @__PURE__ */ jsx("option", { value: "1d", children: "آخر يوم" }),
        /* @__PURE__ */ jsx("option", { value: "3d", children: "آخر 3 أيام" }),
        /* @__PURE__ */ jsx("option", { value: "7d", children: "آخر أسبوع" }),
        /* @__PURE__ */ jsx("option", { value: "30d", children: "آخر شهر" }),
        /* @__PURE__ */ jsx("option", { value: "90d", children: "آخر 3 أشهر" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "ms-auto flex gap-2", children: [
        /* @__PURE__ */ jsx("input", { type: "date", value: enddayDate, onChange: (e) => setEnddayDate(e.target.value), className: "h-9 px-3 rounded-md border border-input bg-background text-sm" }),
        /* @__PURE__ */ jsxs("button", { onClick: printEndOfDay, className: "h-9 px-3 rounded-md bg-primary text-primary-foreground text-sm flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(FileText, { className: "w-4 h-4" }),
          " تقفيل اليوم (PDF)"
        ] })
      ] })
    ] }),
    view !== "audit" && /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsxs("div", { className: "no-print grid grid-cols-2 md:grid-cols-4 gap-3", children: [
        /* @__PURE__ */ jsx(Stat, { label: "إجمالي المبيعات", value: fmt2(totalSales) + " ج.م" }),
        /* @__PURE__ */ jsx(Stat, { label: "إجمالي التكلفة (تصنيع)", value: fmt2(totalCost) + " ج.م" }),
        /* @__PURE__ */ jsx(Stat, { label: "صافي الربح", value: fmt2(profit) + " ج.م", highlight: profit >= 0 ? "text-success" : "text-destructive" }),
        /* @__PURE__ */ jsx(Stat, { label: "عدد الأصناف المباعة", value: aggregatedItems.length.toString() })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "no-print bg-card border border-border rounded-xl overflow-hidden mt-4", children: [
        /* @__PURE__ */ jsx("div", { className: "p-4 border-b border-border bg-secondary/20", children: /* @__PURE__ */ jsx("h2", { className: "font-bold text-sm", children: "تفاصيل المبيعات والتكاليف (بناءً على الريسبي)" }) }),
        /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
          /* @__PURE__ */ jsx("thead", { className: "bg-secondary/50 text-xs", children: /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("th", { className: "text-right p-3", children: "الصنف" }),
            /* @__PURE__ */ jsx("th", { className: "text-right p-3", children: "القسم" }),
            /* @__PURE__ */ jsx("th", { className: "text-right p-3", children: "الكمية المباعة" }),
            /* @__PURE__ */ jsx("th", { className: "text-right p-3", children: "سعر التصنيع (للوحدة)" }),
            /* @__PURE__ */ jsx("th", { className: "text-right p-3", children: "سعر البيع (للوحدة)" }),
            /* @__PURE__ */ jsx("th", { className: "text-right p-3", children: "إجمالي التكلفة" }),
            /* @__PURE__ */ jsx("th", { className: "text-right p-3", children: "إجمالي المبيعات" }),
            /* @__PURE__ */ jsx("th", { className: "text-right p-3", children: "الربح" })
          ] }) }),
          /* @__PURE__ */ jsx("tbody", { children: aggregatedItems.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 8, className: "p-8 text-center text-muted-foreground", children: "لا توجد بيانات مبيعات في هذه الفترة" }) }) : aggregatedItems.map((row) => {
            const totalRowCost = row.cost * row.qty;
            const totalRowSales = row.price * row.qty;
            const rowProfit = totalRowSales - totalRowCost;
            return /* @__PURE__ */ jsxs("tr", { className: "border-t border-border hover:bg-secondary/10", children: [
              /* @__PURE__ */ jsx("td", { className: "p-3 font-medium", children: row.meal.name }),
              /* @__PURE__ */ jsx("td", { className: "p-3 text-xs text-muted-foreground", children: row.dept }),
              /* @__PURE__ */ jsx("td", { className: "p-3 font-bold", children: fmt2(row.qty) }),
              /* @__PURE__ */ jsx("td", { className: "p-3 text-destructive", children: fmt2(row.cost) }),
              /* @__PURE__ */ jsx("td", { className: "p-3 text-primary", children: fmt2(row.price) }),
              /* @__PURE__ */ jsx("td", { className: "p-3", children: fmt2(totalRowCost) }),
              /* @__PURE__ */ jsx("td", { className: "p-3", children: fmt2(totalRowSales) }),
              /* @__PURE__ */ jsx("td", { className: `p-3 font-bold ${rowProfit >= 0 ? "text-success" : "text-destructive"}`, children: fmt2(rowProfit) })
            ] }, row.meal.id);
          }) })
        ] }) })
      ] })
    ] }),
    view === "audit" && /* @__PURE__ */ jsx(AuditView, {}),
    printing === "endday" && /* @__PURE__ */ jsx("div", { className: "print-area", children: /* @__PURE__ */ jsx(EndOfDayPrint, { date: enddayDate }) })
  ] });
}
function AuditView() {
  const {
    db,
    addAudit
  } = useDB();
  const [date, setDate] = useState((/* @__PURE__ */ new Date()).toISOString().slice(0, 10));
  const [dept, setDept] = useState("مطبخ");
  const [actuals, setActuals] = useState({});
  const [pendingOverwrite, setPendingOverwrite] = useState(null);
  const [printChecklist, setPrintChecklist] = useState(false);
  const [printReceipt, setPrintReceipt] = useState(null);
  const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
  const isPast = date < today;
  const existing = useMemo(() => db.audits.find((a) => a.date === date && a.department === dept), [db.audits, date, dept]);
  const allowedWasteMap = useMemo(() => {
    const map = /* @__PURE__ */ new Map();
    function walk(mealId, multiplier, visited) {
      const mealStrId = String(mealId);
      if (visited.has(mealStrId)) return;
      visited.add(mealStrId);
      const meal = db.meals.find((m) => String(m.id) === mealStrId);
      if (!meal) return;
      if (!meal.ingredients) return;
      for (const ing of meal.ingredients) {
        if (ing.refKind === "meal") {
          const ingQty = ing.qty ?? 1;
          walk(ing.itemId, multiplier * ingQty, new Set(visited));
        } else {
          const grams = clamp0(ing.errorMargin || 0) * multiplier;
          if (grams > 0) {
            const itemStrId = String(ing.itemId);
            map.set(itemStrId, (map.get(itemStrId) || 0) + grams);
          }
        }
      }
    }
    for (const s of db.sales) {
      if (!s.date) continue;
      const cleanSaleDate = new Date(s.date).toLocaleDateString("en-CA");
      if (cleanSaleDate !== date) continue;
      if (!s.lines) continue;
      for (const ln of s.lines) {
        const q = clamp0(ln.qty);
        if (q <= 0) continue;
        const meal = db.meals.find((m) => String(m.id) === String(ln.mealId));
        if (meal && meal.department === dept) {
          walk(ln.mealId, q, /* @__PURE__ */ new Set());
        }
      }
    }
    return map;
  }, [db.sales, db.meals, date, dept]);
  const rows = useMemo(() => db.items.map((it) => ({
    item: it,
    expected: clamp0(db.deptStock[deptKey(dept, it.id)] || 0)
  })).filter((r) => r.expected > 0 || (allowedWasteMap.get(r.item.id) || 0) > 0), [db.items, db.deptStock, dept, allowedWasteMap]);
  const soldCount = useMemo(() => {
    let n = 0;
    for (const s of db.sales) {
      if (s.date !== date || s.department !== dept) continue;
      for (const ln of s.lines) n += clamp0(ln.qty);
    }
    return n;
  }, [db.sales, date, dept]);
  function allowedInInvUnits(unit, grams) {
    if (unit === "كيلوجرام" || unit === "لتر") return grams / 1e3;
    if (unit === "جرام" || unit === "جم" || unit === "مللي" || unit === "مل") return grams;
    return 0;
  }
  const {
    shortageValue,
    totalAllowedValue,
    totalItemShortageMoney
  } = useMemo(() => {
    let sv = 0;
    let av = 0;
    let rv = 0;
    for (const r of rows) {
      const inputVal = actuals[r.item.id];
      const actual = inputVal === void 0 || inputVal === "" ? r.expected : clamp0(inputVal);
      if (actual >= r.expected) continue;
      const rawShort = r.expected - actual;
      const totalItemShortageMoney2 = rawShort * r.item.avgPrice;
      const allowedG = allowedWasteMap.get(r.item.id) || 0;
      const unitClean = String(r.item.unit || "").trim().toLowerCase();
      const isBigUnit = unitClean.includes("كيلو") || unitClean.includes("كجم") || unitClean.includes("لتر") || unitClean.includes("كيس") || unitClean.includes("kg") || unitClean.includes("l");
      const allowedPricePerGram = isBigUnit ? r.item.avgPrice / 1e3 : r.item.avgPrice;
      const allowedMoneyValue = allowedG * allowedPricePerGram;
      const finalItemShortageMoney = Math.max(0, totalItemShortageMoney2 - allowedMoneyValue);
      rv += totalItemShortageMoney2;
      sv += finalItemShortageMoney;
      av += Math.min(allowedMoneyValue, totalItemShortageMoney2);
    }
    return {
      shortageValue: sv,
      totalAllowedValue: av,
      totalItemShortageMoney: rv
    };
  }, [actuals, rows, allowedWasteMap]);
  const penalty = Math.max(0, shortageValue);
  function buildAudit() {
    const auditRows = rows.map((r) => {
      const inputVal = actuals[r.item.id];
      const actual = inputVal === void 0 || inputVal === "" ? r.expected : clamp0(inputVal);
      return {
        itemId: r.item.id,
        expected: r.expected,
        actual,
        // تم إلغاء السقف الافتراضي هنا عشان لو فيه زيادة تتسجل في الـ الرو صح والمخزن يتعدل بها
        match: actual === r.expected
      };
    });
    return {
      id: crypto.randomUUID(),
      date,
      department: dept,
      rows: auditRows,
      shortageValue: round2(shortageValue),
      penaltyValue: round2(penalty),
      createdAt: Date.now()
    };
  }
  async function doSave(audit, overwrite) {
    try {
      const res = await addAudit(audit, {
        overwrite,
        deduct: true
      });
      if (!res.ok) {
        if (res.error === "duplicate") {
          setPendingOverwrite(audit);
          return;
        }
        toast.error(res.error || "حدث خطأ أثناء حفظ الجرد");
        return;
      }
      toast.success("تم حفظ الجرد وخصم العجز من المخزون");
      setActuals({});
      setPrintReceipt(audit);
      setTimeout(() => {
        window.print();
        setTimeout(() => setPrintReceipt(null), 500);
      }, 150);
    } catch (err) {
      console.error(err);
      toast.error("فشل الاتصال بالسيرفر لحفظ الجرد");
    }
  }
  function saveNew() {
    if (isPast) {
      toast.error("لا يمكن حفظ جرد لتاريخ سابق.");
      return;
    }
    const audit = buildAudit();
    doSave(audit, false);
  }
  function printChecklistNow() {
    setPrintChecklist(true);
    setTimeout(() => {
      window.print();
      setTimeout(() => setPrintChecklist(false), 500);
    }, 100);
  }
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "no-print bg-card border border-border rounded-xl p-4 flex flex-wrap items-end gap-3", children: [
      /* @__PURE__ */ jsxs("label", { className: "block", children: [
        /* @__PURE__ */ jsx("span", { className: "text-xs mb-1 block", children: "تاريخ الجرد" }),
        /* @__PURE__ */ jsx("input", { type: "date", value: date, onChange: (e) => {
          setDate(e.target.value);
          setActuals({});
        }, className: "h-10 px-3 rounded-md border border-input bg-background text-sm" })
      ] }),
      /* @__PURE__ */ jsxs("label", { className: "block min-w-[160px]", children: [
        /* @__PURE__ */ jsx("span", { className: "text-xs mb-1 block", children: "القسم" }),
        /* @__PURE__ */ jsx(SearchableSelect, { options: SUB_DEPTS.map((d) => ({
          value: d,
          label: d
        })), value: dept, onChange: (v) => {
          setDept(v);
          setActuals({});
        } })
      ] }),
      isPast && existing && /* @__PURE__ */ jsxs("div", { className: "text-xs px-3 py-2 rounded-md bg-secondary flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(History, { className: "w-4 h-4" }),
        " عرض جرد سابق محفوظ بتاريخ ",
        date
      ] }),
      /* @__PURE__ */ jsx("div", { className: "ms-auto flex gap-2", children: /* @__PURE__ */ jsxs("button", { onClick: printChecklistNow, disabled: isPast, className: "h-10 px-4 rounded-md border border-input text-sm flex items-center gap-2 hover:bg-secondary disabled:opacity-40", children: [
        /* @__PURE__ */ jsx(Printer, { className: "w-4 h-4" }),
        " طباعة قائمة الجرد"
      ] }) })
    ] }),
    isPast && existing ? /* @__PURE__ */ jsx(PastAuditView, { audit: existing, items: db.items }) : isPast && !existing ? /* @__PURE__ */ jsxs("div", { className: "bg-card border border-border rounded-xl p-8 text-center text-muted-foreground", children: [
      "لا يوجد جرد محفوظ بتاريخ ",
      date,
      " لقسم ",
      dept,
      "."
    ] }) : /* @__PURE__ */ jsxs("div", { className: "bg-card border border-border rounded-xl p-4 space-y-3", children: [
      existing && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 rounded-md text-xs", children: [
        /* @__PURE__ */ jsx(AlertTriangle, { className: "w-4 h-4" }),
        " تم عمل جرد مسبقاً اليوم لـ",
        " ",
        dept,
        ". الحفظ سيستبدل الجرد القديم."
      ] }),
      /* @__PURE__ */ jsxs("h2", { className: "font-bold text-sm", children: [
        "الجرد الإلكتروني — ",
        dept
      ] }),
      /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
        /* @__PURE__ */ jsx("thead", { className: "bg-secondary/50 text-xs", children: /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("th", { className: "text-right p-2", children: "الكود" }),
          /* @__PURE__ */ jsx("th", { className: "text-right p-2", children: "الصنف" }),
          /* @__PURE__ */ jsx("th", { className: "text-right p-2", children: "القيمة الافتراضية" }),
          /* @__PURE__ */ jsx("th", { className: "text-right p-2", children: "القيمة الفعلية" }),
          /* @__PURE__ */ jsx("th", { className: "text-right p-2", children: "الهدر المسموح به (جرام)" }),
          /* @__PURE__ */ jsx("th", { className: "text-right p-2", children: "العجز" }),
          /* @__PURE__ */ jsx("th", { className: "text-right p-2", children: "قيمة العجز" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { children: rows.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsxs("td", { colSpan: 7, className: "p-6 text-center text-muted-foreground", children: [
          "لا توجد مخزون في ",
          dept
        ] }) }) : rows.map((r) => {
          const rawActual = actuals[r.item.id];
          const actualNum = clamp0(rawActual ?? r.expected.toString());
          const exceeds = actualNum > r.expected;
          const rawShortage = Math.max(0, r.expected - actualNum);
          const allowedG = allowedWasteMap.get(r.item.id) || 0;
          const allowedUnits = Math.min(allowedInInvUnits(r.item.unit, allowedG), rawShortage);
          const effShortage = Math.max(0, rawShortage - allowedUnits);
          const shortageVal = effShortage * r.item.avgPrice;
          return /* @__PURE__ */ jsxs("tr", { className: "border-t border-border", children: [
            /* @__PURE__ */ jsx("td", { className: "p-2 font-mono text-xs", children: r.item.code }),
            /* @__PURE__ */ jsx("td", { className: "p-2", children: r.item.name }),
            /* @__PURE__ */ jsxs("td", { className: "p-2 text-muted-foreground", children: [
              fmt2(r.expected),
              " ",
              r.item.unit
            ] }),
            /* @__PURE__ */ jsx("td", { className: "p-2", children: /* @__PURE__ */ jsx("input", { type: "number", min: "0", step: "any", value: rawActual ?? "", placeholder: fmt2(r.expected), onChange: (e) => {
              const v = cleanNumInput(e.target.value);
              const num = parseFloat(v);
              if (!isNaN(num) && num > r.expected) {
                toast.error(`الكمية الفعلية يجب ألا تتجاوز الكمية الافتراضية (${fmt2(r.expected)})`);
                setActuals({
                  ...actuals,
                  [r.item.id]: r.expected.toString()
                });
                return;
              }
              setActuals({
                ...actuals,
                [r.item.id]: v
              });
            }, className: `w-28 h-8 px-2 rounded-md border bg-background text-xs ${exceeds ? "border-destructive" : "border-input"}` }) }),
            /* @__PURE__ */ jsx("td", { className: "p-2", children: /* @__PURE__ */ jsx("span", { className: allowedG > 0 ? "text-emerald-600 dark:text-emerald-400 font-medium" : "text-muted-foreground", children: fmt2(allowedG) }) }),
            /* @__PURE__ */ jsx("td", { className: "p-2", children: effShortage > 0 ? /* @__PURE__ */ jsx("span", { className: "text-destructive font-medium", children: fmt2(effShortage) }) : "—" }),
            /* @__PURE__ */ jsx("td", { className: "p-2", children: shortageVal > 0 ? /* @__PURE__ */ jsx("span", { className: "text-destructive", children: fmt2(shortageVal) }) : "—" })
          ] }, r.item.id);
        }) })
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-6 border-t border-border pt-4 text-sm", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          "العجز الكلي:",
          " ",
          /* @__PURE__ */ jsxs("strong", { className: "text-destructive font-bold text-base", children: [
            fmt2(totalItemShortageMoney),
            " ج.م"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          "مسموح ب:",
          " ",
          /* @__PURE__ */ jsxs("strong", { className: "text-green-600 font-bold text-base", children: [
            fmt2(totalAllowedValue),
            " ج.م"
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "text-muted-foreground", children: [
          "مبيعات اليوم:",
          " ",
          /* @__PURE__ */ jsxs("strong", { className: "text-foreground", children: [
            soldCount,
            " صنف"
          ] })
        ] }),
        penalty > 0 && /* @__PURE__ */ jsxs("div", { className: "px-3 py-1.5 rounded-md bg-destructive/10 text-destructive font-bold border border-destructive/20 animate-pulse", children: [
          "⚠️ الغرامة المطلوبة: ",
          fmt2(penalty),
          " ج.م"
        ] }),
        /* @__PURE__ */ jsxs("button", { onClick: saveNew, className: "ms-auto h-10 px-5 rounded-md bg-primary hover:bg-primary/95 text-primary-foreground text-sm font-semibold flex items-center gap-2 transition-colors shadow-sm", children: [
          /* @__PURE__ */ jsx(Save, { className: "w-4 h-4" }),
          " ترحيل وحفظ الجرد"
        ] })
      ] })
    ] }),
    pendingOverwrite && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 bg-black/50 grid place-items-center p-4", onClick: () => setPendingOverwrite(null), children: /* @__PURE__ */ jsxs("div", { className: "bg-card border border-border rounded-xl max-w-md w-full p-5 space-y-3", onClick: (e) => e.stopPropagation(), children: [
      /* @__PURE__ */ jsxs("h3", { className: "font-bold flex items-center gap-2 text-amber-600", children: [
        /* @__PURE__ */ jsx(AlertTriangle, { className: "w-5 h-5" }),
        " تم عمل جرد مسبقاً اليوم"
      ] }),
      /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground", children: [
        "يوجد جرد محفوظ لتاريخ ",
        pendingOverwrite.date,
        " لقسم",
        " ",
        pendingOverwrite.department,
        ". هل تريد استبداله؟"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-2 pt-2", children: [
        /* @__PURE__ */ jsx("button", { onClick: () => setPendingOverwrite(null), className: "flex-1 h-10 rounded-md border border-input text-sm", children: "إلغاء" }),
        /* @__PURE__ */ jsx("button", { onClick: () => {
          const a = pendingOverwrite;
          setPendingOverwrite(null);
          doSave(a, true);
        }, className: "flex-1 h-10 rounded-md bg-destructive text-destructive-foreground text-sm", children: "اعتماد الجرد الجديد" })
      ] })
    ] }) }),
    printChecklist && /* @__PURE__ */ jsx("div", { className: "print-area", children: /* @__PURE__ */ jsx(PrintAuditSheet, { date, department: dept, items: rows, mealsCount: db.meals.filter((m) => m.department === dept).length }) }),
    printReceipt && /* @__PURE__ */ jsx("div", { className: "print-area", children: /* @__PURE__ */ jsx(AuditReceiptPrint, { audit: printReceipt, items: db.items }) })
  ] });
}
function PastAuditView({
  audit,
  items
}) {
  return /* @__PURE__ */ jsxs("div", { className: "bg-card border border-border rounded-xl p-4 space-y-3", children: [
    /* @__PURE__ */ jsxs("h2", { className: "font-bold text-sm", children: [
      "جرد محفوظ — ",
      audit.department,
      " • ",
      audit.date
    ] }),
    /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
      /* @__PURE__ */ jsx("thead", { className: "bg-secondary/50 text-xs", children: /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("th", { className: "text-right p-2", children: "الصنف" }),
        /* @__PURE__ */ jsx("th", { className: "text-right p-2", children: "القيمة الافتراضية" }),
        /* @__PURE__ */ jsx("th", { className: "text-right p-2", children: "القيمة الفعلية" }),
        /* @__PURE__ */ jsx("th", { className: "text-right p-2", children: "العجز" })
      ] }) }),
      /* @__PURE__ */ jsx("tbody", { children: audit.rows.map((r) => {
        const it = items.find((x) => x.id === r.itemId);
        const short = Math.max(0, r.expected - r.actual);
        return /* @__PURE__ */ jsxs("tr", { className: "border-t border-border", children: [
          /* @__PURE__ */ jsx("td", { className: "p-2", children: it?.name || r.itemId }),
          /* @__PURE__ */ jsx("td", { className: "p-2", children: fmt2(r.expected) }),
          /* @__PURE__ */ jsx("td", { className: "p-2", children: fmt2(r.actual) }),
          /* @__PURE__ */ jsx("td", { className: "p-2", children: short > 0 ? /* @__PURE__ */ jsx("span", { className: "text-destructive", children: fmt2(short) }) : "—" })
        ] }, r.itemId);
      }) })
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "flex gap-4 text-sm border-t border-border pt-3", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        "قيمة العجز:",
        " ",
        /* @__PURE__ */ jsxs("strong", { className: "text-destructive", children: [
          fmt2(audit.shortageValue),
          " ج.م"
        ] })
      ] }),
      audit.penaltyValue > 0 && /* @__PURE__ */ jsxs("div", { children: [
        "غرامة:",
        " ",
        /* @__PURE__ */ jsxs("strong", { className: "text-destructive", children: [
          fmt2(audit.penaltyValue),
          " ج.م"
        ] })
      ] })
    ] })
  ] });
}
function AuditReceiptPrint({
  audit,
  items
}) {
  const shortRows = audit.rows.filter((r) => r.expected > r.actual);
  return /* @__PURE__ */ jsxs("div", { className: "print-voucher", children: [
    /* @__PURE__ */ jsxs("div", { className: "text-center border-b border-black pb-2 mb-2", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-base font-bold", children: "إيصال عجز الجرد" }),
      /* @__PURE__ */ jsxs("div", { className: "text-xs", children: [
        "القسم: ",
        audit.department,
        " • التاريخ: ",
        audit.date
      ] })
    ] }),
    shortRows.length === 0 ? /* @__PURE__ */ jsx("div", { className: "text-center text-sm py-4", children: "لا يوجد عجز — الجرد مطابق تماماً." }) : /* @__PURE__ */ jsxs("table", { className: "print-table w-full", children: [
      /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("th", { style: {
          width: "26px"
        }, children: "#" }),
        /* @__PURE__ */ jsx("th", { children: "اسم الصنف" }),
        /* @__PURE__ */ jsx("th", { style: {
          width: "60px"
        }, children: "المتوقع" }),
        /* @__PURE__ */ jsx("th", { style: {
          width: "60px"
        }, children: "الفعلي" }),
        /* @__PURE__ */ jsx("th", { style: {
          width: "60px"
        }, children: "العجز" }),
        /* @__PURE__ */ jsx("th", { style: {
          width: "80px"
        }, children: "قيمة العجز" })
      ] }) }),
      /* @__PURE__ */ jsxs("tbody", { children: [
        shortRows.map((r, i) => {
          const it = items.find((x) => x.id === r.itemId);
          const short = r.expected - r.actual;
          return /* @__PURE__ */ jsxs("tr", { children: [
            /* @__PURE__ */ jsx("td", { children: i + 1 }),
            /* @__PURE__ */ jsx("td", { children: it?.name || r.itemId }),
            /* @__PURE__ */ jsx("td", { children: fmt2(r.expected) }),
            /* @__PURE__ */ jsx("td", { children: fmt2(r.actual) }),
            /* @__PURE__ */ jsx("td", { children: fmt2(short) }),
            /* @__PURE__ */ jsx("td", { children: fmt2(short * (it?.avgPrice || 0)) })
          ] }, r.itemId);
        }),
        /* @__PURE__ */ jsxs("tr", { style: {
          fontWeight: "bold",
          background: "#eee"
        }, children: [
          /* @__PURE__ */ jsx("td", { colSpan: 5, children: "إجمالي قيمة العجز" }),
          /* @__PURE__ */ jsx("td", { children: fmt2(audit.shortageValue) })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-3 text-xs", children: [
      "ملاحظة: تم خصم كميات العجز تلقائياً من مخزون القسم.",
      audit.penaltyValue > 0 && /* @__PURE__ */ jsxs(Fragment, { children: [
        " ",
        "• هذا القسم يتحمل غرامة قدرها",
        " ",
        /* @__PURE__ */ jsx("strong", { children: fmt2(audit.penaltyValue) }),
        " جنيه."
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex justify-between mt-4 text-xs", children: [
      /* @__PURE__ */ jsx("div", { children: "اسم المسؤول: ____________" }),
      /* @__PURE__ */ jsx("div", { children: "التوقيع: ____________" })
    ] })
  ] });
}
function EndOfDayPrint({
  date
}) {
  const {
    db
  } = useDB();
  const todaySales = db.sales.filter((s) => {
    const cleanDate = new Date(s.createdAt || s.date).toLocaleDateString("en-CA");
    return cleanDate === date;
  });
  const sumS = clamp0(todaySales.reduce((s, x) => s + x.totalSales, 0));
  const sumC = clamp0(todaySales.reduce((s, x) => s + x.totalCost, 0));
  const net = sumS - sumC;
  const todayAudits = db.audits.filter((a) => {
    const cleanAuditDate = new Date(a.createdAt || a.date).toLocaleDateString("en-CA");
    return cleanAuditDate === date || a.date === date;
  });
  const kRows = aggregateDailySales(db.sales, date, "مطبخ", db.meals);
  const bRows = aggregateDailySales(db.sales, date, "بار", db.meals);
  const sRows = aggregateDailySales(db.sales, date, "شيشه", db.meals);
  return /* @__PURE__ */ jsxs("div", { className: "print-voucher", children: [
    /* @__PURE__ */ jsxs("div", { className: "text-center border-b-2 border-black pb-2 mb-3", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-lg font-bold", children: "تقرير تقفيل اليوم" }),
      /* @__PURE__ */ jsxs("div", { className: "text-xs", children: [
        "التاريخ: ",
        date
      ] })
    ] }),
    /* @__PURE__ */ jsx("table", { className: "print-table w-full", style: {
      marginBottom: "10px"
    }, children: /* @__PURE__ */ jsxs("tbody", { children: [
      /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("td", { style: {
          width: "50%"
        }, children: /* @__PURE__ */ jsx("strong", { children: "إجمالي المبيعات" }) }),
        /* @__PURE__ */ jsxs("td", { children: [
          fmt2(sumS),
          " ج.م"
        ] })
      ] }),
      /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("strong", { children: "إجمالي التكلفة" }) }),
        /* @__PURE__ */ jsxs("td", { children: [
          fmt2(sumC),
          " ج.م"
        ] })
      ] }),
      /* @__PURE__ */ jsxs("tr", { style: {
        background: "#eee"
      }, children: [
        /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsx("strong", { children: "صافي الربح/الخسارة" }) }),
        /* @__PURE__ */ jsx("td", { children: /* @__PURE__ */ jsxs("strong", { children: [
          fmt2(net),
          " ج.م"
        ] }) })
      ] })
    ] }) }),
    /* @__PURE__ */ jsx(SalesPdfSection, { title: "مبيعات المطبخ", rows: kRows }),
    /* @__PURE__ */ jsx("div", { style: {
      borderTop: "2px solid #000",
      margin: "10px 0"
    } }),
    /* @__PURE__ */ jsx(SalesPdfSection, { title: "مبيعات البار", rows: bRows }),
    /* @__PURE__ */ jsx("div", { style: {
      borderTop: "2px solid #000",
      margin: "10px 0"
    } }),
    /* @__PURE__ */ jsx(SalesPdfSection, { title: "مبيعات الشيشة", rows: sRows }),
    /* @__PURE__ */ jsx("h2", { className: "text-sm font-bold mt-3 mb-1", children: "نتائج الجرد" }),
    todayAudits.length === 0 ? /* @__PURE__ */ jsx("div", { className: "text-xs", children: "لم يتم إجراء جرد لهذا اليوم" }) : /* @__PURE__ */ jsxs("table", { className: "print-table w-full", children: [
      /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("th", { children: "القسم" }),
        /* @__PURE__ */ jsx("th", { children: "قيمة العجز" }),
        /* @__PURE__ */ jsx("th", { children: "قيمة الغرامة" })
      ] }) }),
      /* @__PURE__ */ jsx("tbody", { children: todayAudits.map((a) => /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("td", { children: a.department }),
        /* @__PURE__ */ jsxs("td", { children: [
          fmt2(a.shortageValue),
          " ج.م"
        ] }),
        /* @__PURE__ */ jsxs("td", { children: [
          fmt2(a.penaltyValue),
          " ج.م"
        ] })
      ] }, a.id)) })
    ] })
  ] });
}
function SalesPdfSection({
  title,
  rows
}) {
  const totalQty = rows.reduce((s, r) => s + r.qty, 0);
  const totalVal = rows.reduce((s, r) => s + r.total, 0);
  return /* @__PURE__ */ jsxs("div", { className: "my-2", children: [
    /* @__PURE__ */ jsx("h3", { className: "text-xs font-bold mb-1", children: title }),
    rows.length === 0 ? /* @__PURE__ */ jsx("div", { className: "text-[10px] text-muted-foreground", children: "لا توجد مبيعات" }) : /* @__PURE__ */ jsxs("table", { className: "print-table w-full text-[11px]", children: [
      /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("th", { children: "الصنف" }),
        /* @__PURE__ */ jsx("th", { children: "السعر" }),
        /* @__PURE__ */ jsx("th", { children: "الكمية" }),
        /* @__PURE__ */ jsx("th", { children: "الإجمالي" })
      ] }) }),
      /* @__PURE__ */ jsxs("tbody", { children: [
        rows.map((r, idx) => /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("td", { children: r.name }),
          /* @__PURE__ */ jsx("td", { children: fmt2(r.price) }),
          /* @__PURE__ */ jsx("td", { children: fmt2(r.qty) }),
          /* @__PURE__ */ jsx("td", { children: fmt2(r.total) })
        ] }, idx)),
        /* @__PURE__ */ jsxs("tr", { style: {
          fontWeight: "bold",
          background: "#f5f5f5"
        }, children: [
          /* @__PURE__ */ jsx("td", { colSpan: 2, children: "الإجمالي" }),
          /* @__PURE__ */ jsx("td", { children: fmt2(totalQty) }),
          /* @__PURE__ */ jsx("td", { children: fmt2(totalVal) })
        ] })
      ] })
    ] })
  ] });
}
function Stat({
  label,
  value,
  highlight
}) {
  return /* @__PURE__ */ jsxs("div", { className: "bg-card border border-border rounded-xl p-4", children: [
    /* @__PURE__ */ jsx("div", { className: `text-2xl font-bold ${highlight || ""}`, children: value }),
    /* @__PURE__ */ jsx("div", { className: "text-xs text-muted-foreground mt-1", children: label })
  ] });
}
export {
  CostControlPage as component
};
