/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import {
  useDB,
  SUB_DEPTS,
  RECIPE_UNITS,
  deptKey,
  convertToBase,
  expandMealToBase,
  SHISHA_CATEGORY,
  type SubDept,
  type Meal,
  type MealKind,
  type RecipeIngredient,
  type RecipeUnit,
  type SaleLine,
  type AuditEntry,
  type ModifierGroup,
  type ModifierOption,
} from "@/lib/store";
import { fmt2, round2, cleanNumInput, clamp0 } from "@/lib/format";
import { SearchableSelect } from "@/components/SearchableSelect";
import { PrintAuditSheet } from "@/components/PrintAudit";
import { PinPrompt } from "@/components/PinPrompt";
import {
  Plus,
  Trash2,
  Save,
  Upload,
  Printer,
  Pencil,
  X,
  ShoppingCart,
  ClipboardCheck,
  ChefHat,
  Boxes,
  Copy,
  FileText,
  FolderPlus,
  ChevronDown,
  ChevronLeft,
  AlertTriangle,
  History,
  ShieldAlert,
} from "lucide-react";

export const Route = createFileRoute("/cost-control")({
  head: () => ({ meta: [{ title: "مراقبة التكاليف - نظام المخزون" }] }),
  component: CostControlPage,
});

type TabId = "stock" | "recipes" | "sales" | "results";

function CostControlPage() {
  const [tab, setTab] = useState<TabId>("stock");
  const tabs: { id: TabId; label: string; icon: any }[] = [
    { id: "stock", label: "مخزن الأقسام", icon: Boxes },
    { id: "recipes", label: "الأصناف والريسبي", icon: ChefHat },
    { id: "sales", label: "المبيعات", icon: ShoppingCart },
    { id: "results", label: "النتائج والجرد", icon: ClipboardCheck },
  ];
  return (
    <div className="space-y-4">
      <div className="no-print">
        <h1 className="text-2xl font-bold">مراقبة التكاليف</h1>
        <p className="text-sm text-muted-foreground mt-1">
          إدارة مخزن الأقسام، الريسبي، المبيعات، والجرد اليومي.
        </p>
      </div>
      <div className="no-print flex flex-wrap gap-1 bg-secondary p-1 rounded-lg w-fit">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 h-9 rounded-md text-sm font-medium flex items-center gap-2 transition ${tab === t.id ? "bg-card shadow-sm" : "text-muted-foreground"}`}
            >
              <Icon className="w-4 h-4" /> {t.label}
            </button>
          );
        })}
      </div>
      {tab === "stock" && <DeptStockTab />}
      {tab === "recipes" && <RecipesTab />}
      {tab === "sales" && <SalesTab />}
      {tab === "results" && <ResultsTab />}
    </div>
  );
}

/* ============== TAB 1: Department Inventory ============== */
function DeptStockTab() {
  const { db, setDeptStockQty } = useDB();
  const [dept, setDept] = useState<SubDept>("مطبخ");
  const [pinFor, setPinFor] = useState<string | null>(null); // itemId awaiting PIN
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editVal, setEditVal] = useState<string>("");

  const rows = useMemo(
    () =>
      db.items.map((it) => ({
        item: it,
        qty: clamp0(db.deptStock[deptKey(dept, it.id)] || 0),
      })),
    [db.items, db.deptStock, dept],
  );
  const filled = rows.filter((r) => r.qty > 0);
  const totalValue = clamp0(
    filled.reduce((s, r) => s + r.qty * r.item.avgPrice, 0),
  );

  function startAdjust(itemId: string, current: number) {
    setPinFor(itemId);
    setEditVal(fmt2(current));
  }
  function onPinOk() {
    setEditingId(pinFor);
    setPinFor(null);
  }
  function saveAdjust(itemId: string) {
    const v = clamp0(parseFloat(editVal) || 0);
    setDeptStockQty(dept, itemId, v);
    toast.success("تم تعديل الكمية");
    setEditingId(null);
  }

  return (
    <div className="space-y-4 no-print" dir="rtl">
      <div className="flex items-center gap-2 flex-wrap">
        {SUB_DEPTS.map((d) => (
          <button
            key={d}
            onClick={() => setDept(d)}
            className={`px-4 h-9 rounded-md text-sm font-medium ${dept === d ? "bg-primary text-primary-foreground" : "bg-secondary"}`}
          >
            {d}
          </button>
        ))}
        <div className="ms-auto text-sm text-muted-foreground">
          إجمالي القيمة في {dept}:{" "}
          <strong className="text-foreground">{fmt2(totalValue)} ج.م</strong>
        </div>
      </div>
      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg p-2">
        <ShieldAlert className="w-4 h-4 text-amber-600" />
        تعديل الكميات يدوياً يتطلب إدخال كلمة مرور المسؤول. يُستخدم فقط لتصحيح
        أخطاء الإدخال.
      </div>
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-xs">
            <tr>
              <th className="text-right p-3">الكود</th>
              <th className="text-right p-3">اسم الصنف</th>
              <th className="text-right p-3">الوحدة</th>
              <th className="text-right p-3">الكمية في {dept}</th>
              <th className="text-right p-3">متوسط السعر</th>
              <th className="text-right p-3">القيمة</th>
              <th className="text-right p-3">إجراء</th>
            </tr>
          </thead>
          <tbody>
            {filled.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="p-8 text-center text-muted-foreground"
                >
                  لا توجد مخزون في هذا القسم — يزداد عند صرف أذونات إليه.
                </td>
              </tr>
            ) : (
              filled.map((r) => {
                const isEditing = editingId === r.item.id;
                return (
                  <tr key={r.item.id} className="border-t border-border">
                    <td className="p-3 font-mono text-xs">{r.item.code}</td>
                    <td className="p-3 font-medium">{r.item.name}</td>
                    <td className="p-3 text-muted-foreground">{r.item.unit}</td>
                    <td className="p-3 font-bold">
                      {isEditing ? (
                        <input
                          type="number"
                          step="any"
                          min="0"
                          autoFocus
                          value={editVal}
                          onChange={(e) =>
                            setEditVal(cleanNumInput(e.target.value))
                          }
                          className="w-28 h-8 px-2 rounded border border-input bg-background text-sm"
                        />
                      ) : (
                        fmt2(r.qty)
                      )}
                    </td>
                    <td className="p-3">{fmt2(r.item.avgPrice)}</td>
                    <td className="p-3">{fmt2(r.qty * r.item.avgPrice)}</td>
                    <td className="p-3">
                      {isEditing ? (
                        <div className="flex gap-1">
                          <button
                            onClick={() => saveAdjust(r.item.id)}
                            className="px-2 h-7 rounded bg-primary text-primary-foreground text-xs font-medium"
                          >
                            حفظ
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-2 h-7 rounded bg-secondary text-xs"
                          >
                            إلغاء
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startAdjust(r.item.id, r.qty)}
                          className="px-2 h-7 rounded bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-xs font-medium flex items-center gap-1"
                        >
                          <ShieldAlert className="w-3 h-3" />
                          تعديل واضحة الكمية
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <PinPrompt
        open={pinFor !== null}
        title="تعديل واضحة الكمية"
        description="يتطلب هذا الإجراء كلمة مرور المسؤول لتصحيح كمية مادة خام في المخزن الفرعي."
        onClose={() => setPinFor(null)}
        onSuccess={onPinOk}
      />
    </div>
  );
}

/* ============== TAB 2: Recipes (Menu / Processed + folders) ============== */
function RecipesTab() {
  const { db, saveMeal, deleteMeal, bulkAddMeals } = useDB();
  const [editing, setEditing] = useState<Meal | null>(null);
  const [newKind, setNewKind] = useState<MealKind | null>(null);
  const [newCategory, setNewCategory] = useState<string>("");
  const [mealsKind, setMealsKind] = useState<MealKind>("menu");
  const [mealsDept, setMealsDept] = useState<SubDept>("مطبخ");
  const [openCats, setOpenCats] = useState<Record<string, boolean>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  const visibleMeals = useMemo(
    () =>
      db.meals.filter(
        (m) => (m.kind || "menu") === mealsKind && m.department === mealsDept,
      ),
    [db.meals, mealsKind, mealsDept],
  );

  // Group by category
  const grouped = useMemo(() => {
    const map = new Map<string, Meal[]>();
    for (const m of visibleMeals) {
      const c = (m.category || "").trim() || "غير مصنف";
      const arr = map.get(c) || [];
      arr.push(m);
      map.set(c, arr);
    }
    return Array.from(map.entries()).sort((a, b) =>
      a[0].localeCompare(b[0], "ar"),
    );
  }, [visibleMeals]);

  function computeCost(meal: Meal): number {
    const map = expandMealToBase(meal, db.meals, db.items);
    let c = 0;
    for (const [, info] of map) c += info.cost;
    return round2(clamp0(c));
  }

  function importExcel(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const json: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });
        const groups = new Map<string, RecipeIngredient[]>();
        let skipped = 0;
        for (const row of json) {
          const mealName = String(
            row["اسم الوجبة"] || row["الوجبة"] || "",
          ).trim();
          const ingName = String(
            row["اسم المكون"] || row["المكون"] || "",
          ).trim();
          const qty = clamp0(parseFloat(row["الكمية"]) || 0);
          const unit = String(
            row["الوحده"] || row["الوحدة"] || "",
          ).trim() as RecipeUnit;
          if (!mealName || qty <= 0 || !ingName) {
            skipped++;
            continue;
          }
          const item =
            db.items.find((i) => i.name.trim() === ingName) ||
            db.items.find(
              (i) =>
                i.name.trim().includes(ingName) ||
                ingName.includes(i.name.trim()),
            );
          if (!item) {
            skipped++;
            continue;
          }
          const useUnit: RecipeUnit = (RECIPE_UNITS as string[]).includes(unit)
            ? unit
            : item.unit;
          const arr = groups.get(mealName) || [];
          arr.push({ itemId: item.id, qty, unit: useUnit, refKind: "item" });
          groups.set(mealName, arr);
        }
        const meals: Meal[] = [];
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
            ingredients,
          });
        }
        if (meals.length === 0) {
          toast.error("لم يتم استيراد أي وجبة.");
          return;
        }
        bulkAddMeals(meals);
        toast.success(
          `تم استيراد ${meals.length} وجبة. ${skipped > 0 ? `(تخطي ${skipped} صف)` : ""}`,
        );
      } catch (err: any) {
        toast.error("فشل قراءة الملف: " + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  }

  function cloneMeal(m: Meal) {
    setEditing({
      ...m,
      id: crypto.randomUUID(),
      name: m.name + " (نسخة)",
      ingredients: m.ingredients.map((x) => ({ ...x })),
    });
  }

  function addCategory() {
    const name = prompt("اسم القسم الجديد:");
    if (!name?.trim()) return;
    setOpenCats({ ...openCats, [name.trim()]: true });
    toast.success("تم إضافة القسم — أضف وجبات إليه باستخدام زر 'إضافة صنف'.");
  }

  function startNewItem(category?: string) {
    setNewKind(mealsKind);
    setNewCategory(category || "");
    setEditing(null);
  }

  return (
    <div className="space-y-4 no-print">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1 bg-secondary p-1 rounded-lg">
          <button
            onClick={() => setMealsKind("menu")}
            className={`px-3 h-8 rounded-md text-xs font-medium ${mealsKind === "menu" ? "bg-card shadow-sm" : "text-muted-foreground"}`}
          >
            الأصناف (جاهزة للبيع)
          </button>
          <button
            onClick={() => setMealsKind("processed")}
            className={`px-3 h-8 rounded-md text-xs font-medium ${mealsKind === "processed" ? "bg-card shadow-sm" : "text-muted-foreground"}`}
          >
            المواد المصنعة
          </button>
        </div>
        <div className="flex gap-1 bg-secondary p-1 rounded-lg">
          {SUB_DEPTS.map((d) => (
            <button
              key={d}
              onClick={() => setMealsDept(d)}
              className={`px-3 h-8 rounded-md text-xs font-medium ${mealsDept === d ? "bg-card shadow-sm" : "text-muted-foreground"}`}
            >
              {d}
            </button>
          ))}
        </div>
        <div className="ms-auto flex flex-wrap gap-2">
          <button
            onClick={addCategory}
            className="h-9 px-3 rounded-lg border border-input text-sm font-medium hover:bg-secondary flex items-center gap-2"
          >
            <FolderPlus className="w-4 h-4" /> إضافة قسم
          </button>
          <button
            onClick={() => startNewItem()}
            className="h-9 px-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> إضافة صنف
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="h-9 px-3 rounded-lg border border-input text-sm font-medium hover:bg-secondary flex items-center gap-2"
          >
            <Upload className="w-4 h-4" /> استيراد Excel
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) importExcel(f);
              e.target.value = "";
            }}
          />
        </div>
      </div>

      <div className="space-y-2">
        {grouped.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground">
            لا توجد {mealsKind === "menu" ? "أصناف" : "مواد مصنعة"} في{" "}
            {mealsDept} — استخدم "إضافة صنف" للبدء.
          </div>
        ) : (
          grouped.map(([cat, meals]) => {
            const isOpen = openCats[cat] !== false;
            return (
              <div
                key={cat}
                className="bg-card border border-border rounded-xl overflow-hidden"
              >
                <div className="flex items-center justify-between px-4 h-12 bg-secondary/40">
                  <button
                    onClick={() => setOpenCats({ ...openCats, [cat]: !isOpen })}
                    className="flex items-center gap-2 font-bold text-sm"
                  >
                    {isOpen ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronLeft className="w-4 h-4" />
                    )}
                    📁 {cat}
                    <span className="text-xs text-muted-foreground font-normal">
                      ({meals.length})
                    </span>
                  </button>
                  <button
                    onClick={() => startNewItem(cat === "غير مصنف" ? "" : cat)}
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> إضافة صنف هنا
                  </button>
                </div>
                {isOpen && (
                  <table className="w-full text-sm">
                    <thead className="bg-secondary/20 text-xs">
                      <tr>
                        <th className="text-right p-3">الاسم</th>
                        <th className="text-right p-3">المكونات</th>
                        <th className="text-right p-3">سعر التصنيع</th>
                        <th className="text-right p-3">سعر البيع</th>
                        <th className="text-right p-3">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {meals.map((m) => {
                        const cost = computeCost(m);
                        const profit = m.sellingPrice - cost;
                        return (
                          <tr key={m.id} className="border-t border-border">
                            <td className="p-3 font-medium">{m.name}</td>
                            <td className="p-3">{m.ingredients.length}</td>
                            <td className="p-3">{fmt2(cost)}</td>
                            <td className="p-3">
                              {fmt2(m.sellingPrice)}
                              {m.kind === "menu" && (
                                <span
                                  className={`text-xs ms-1 ${profit >= 0 ? "text-success" : "text-destructive"}`}
                                >
                                  ({fmt2(profit)})
                                </span>
                              )}
                            </td>
                            <td className="p-3">
                              <div className="flex gap-1">
                                <button
                                  onClick={() => setEditing(m)}
                                  title="تعديل"
                                  className="p-1.5 rounded hover:bg-secondary"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => cloneMeal(m)}
                                  title="نسخ"
                                  className="p-1.5 rounded hover:bg-secondary text-primary"
                                >
                                  <Copy className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm(`حذف "${m.name}"؟`))
                                      deleteMeal(m.id);
                                  }}
                                  title="حذف"
                                  className="p-1.5 rounded hover:bg-destructive/10 text-destructive"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            );
          })
        )}
      </div>

      {(newKind !== null || editing) && (
        <MealDialog
          initial={editing}
          defaultKind={newKind || mealsKind}
          defaultDept={mealsDept}
          defaultCategory={newCategory}
          onClose={() => {
            setNewKind(null);
            setEditing(null);
            setNewCategory("");
          }}
          onSave={(m) => {
            saveMeal(m);
            setNewKind(null);
            setEditing(null);
            setNewCategory("");
          }}
        />
      )}
    </div>
  );
}

function MealDialog({
  initial,
  defaultKind,
  defaultDept,
  defaultCategory,
  onClose,
  onSave,
}: {
  initial: Meal | null;
  defaultKind: MealKind;
  defaultDept: SubDept;
  defaultCategory: string;
  onClose: () => void;
  onSave: (m: Meal) => void;
}) {
  const { db } = useDB();
  const [name, setName] = useState(initial?.name || "");
  const [dept, setDept] = useState<SubDept>(initial?.department || defaultDept);
  const [kind, setKind] = useState<MealKind>(initial?.kind || defaultKind);
  const [category, setCategory] = useState(
    initial?.category || defaultCategory,
  );
  const [price, setPrice] = useState(initial?.sellingPrice?.toString() || "0");
  const [waste, setWaste] = useState(initial?.wasteMargin?.toString() || "0");
  const [wasteMode, setWasteMode] = useState<"percent" | "fixed">(
    initial?.wasteMode || "percent",
  );
  const [ings, setIngs] = useState<RecipeIngredient[]>(
    initial?.ingredients.map((x) => ({ ...x, refKind: x.refKind || "item" })) ||
      [],
  );
  const [hasModifiers, setHasModifiers] = useState<boolean>(
    !!initial?.hasModifiers,
  );
  const [modGroups, setModGroups] = useState<ModifierGroup[]>(
    initial?.modifierGroups || [],
  );
  const isShishaCat = (category || "").trim() === SHISHA_CATEGORY;

  function addGroup() {
    setModGroups([
      ...modGroups,
      { id: crypto.randomUUID(), name: "", required: true, options: [] },
    ]);
  }
  function updateGroup(gid: string, patch: Partial<ModifierGroup>) {
    setModGroups(modGroups.map((g) => (g.id === gid ? { ...g, ...patch } : g)));
  }
  function removeGroup(gid: string) {
    setModGroups(modGroups.filter((g) => g.id !== gid));
  }
  function addOption(gid: string) {
    updateGroup(gid, {
      options: [
        ...(modGroups.find((g) => g.id === gid)?.options || []),
        { id: crypto.randomUUID(), label: "", extraPrice: 0 },
      ],
    });
  }
  function updateOption(
    gid: string,
    oid: string,
    patch: Partial<ModifierOption>,
  ) {
    const g = modGroups.find((x) => x.id === gid);
    if (!g) return;
    updateGroup(gid, {
      options: g.options.map((o) => (o.id === oid ? { ...o, ...patch } : o)),
    });
  }
  function removeOption(gid: string, oid: string) {
    const g = modGroups.find((x) => x.id === gid);
    if (!g) return;
    updateGroup(gid, { options: g.options.filter((o) => o.id !== oid) });
  }

  const cost = useMemo(() => {
    const tmpMeal: Meal = {
      id: initial?.id || "tmp",
      name,
      department: dept,
      sellingPrice: clamp0(price),
      wasteMargin: clamp0(waste),
      wasteMode,
      kind,
      category,
      ingredients: ings.filter((i) => i.itemId && i.qty > 0),
    };
    const map = expandMealToBase(tmpMeal, db.meals, db.items);
    let c = 0;
    for (const [, info] of map) c += info.cost;
    return round2(clamp0(c));
  }, [
    ings,
    db.items,
    db.meals,
    name,
    dept,
    price,
    waste,
    wasteMode,
    kind,
    category,
    initial?.id,
  ]);

  // Options for ingredient picker: items + meals (both menu & processed), excluding self
  const ingredientOptions = useMemo(() => {
    const items = db.items.map((i) => ({
      value: `item:${i.id}`,
      label: i.name,
      hint: i.unit,
      group: i.kind === "processed" ? "مصنع (مخزن)" : "مكونات المخزن",
    }));
    const processed = db.meals
      .filter((m) => m.id !== initial?.id && (m.kind || "menu") === "processed")
      .map((m) => ({
        value: `meal:${m.id}`,
        label: "🍳 " + m.name,
        hint: m.department,
        group: "مواد مصنعة (وصفات)",
      }));
    const menus = db.meals
      .filter((m) => m.id !== initial?.id && (m.kind || "menu") === "menu")
      .map((m) => ({
        value: `meal:${m.id}`,
        label: "🍽 " + m.name,
        hint: m.department,
        group: "أصناف جاهزة",
      }));
    return [...items, ...processed, ...menus];
  }, [db.items, db.meals, initial?.id]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 grid place-items-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-xl w-full max-w-5xl p-5 max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">
            {initial ? "تعديل" : "جديد"} —{" "}
            {kind === "menu" ? "صنف للبيع" : "مادة مصنعة"}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-secondary rounded">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <label className="block col-span-2">
            <span className="text-xs mb-1 block">الاسم</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
            />
          </label>
          <label className="block">
            <span className="text-xs mb-1 block">النوع</span>
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as MealKind)}
              className="w-full h-10 px-2 rounded-md border border-input bg-background text-sm"
            >
              <option value="menu">صنف للبيع</option>
              <option value="processed">مادة مصنعة</option>
            </select>
          </label>
          <label className="block">
            <span className="text-xs mb-1 block">القسم</span>
            <select
              value={dept}
              onChange={(e) => setDept(e.target.value as SubDept)}
              className="w-full h-10 px-2 rounded-md border border-input bg-background text-sm"
            >
              {SUB_DEPTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
          <label className="block col-span-2">
            <span className="text-xs mb-1 block">القسم (مجلد/فئة)</span>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="مثلاً: مشاوي، بيتزا، عصائر"
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
            />
          </label>
          {kind === "menu" && (
            <label className="block">
              <span className="text-xs mb-1 block">سعر البيع</span>
              <input
                type="number"
                min="0"
                step="any"
                value={price}
                onChange={(e) => setPrice(cleanNumInput(e.target.value))}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              />
            </label>
          )}
          <div className="block col-span-2 md:col-span-4 text-xs bg-secondary/40 rounded-md px-3 py-2 text-muted-foreground">
            حدّد{" "}
            <strong className="text-foreground">
              هامش الخطأ المسموح (جرام)
            </strong>{" "}
            يدوياً لكل مكون أدناه. يُستخدم في صفحة الجرد لاحتساب الهدر المسموح
            به فقط للأصناف التي بِيعت اليوم.
          </div>
        </div>

        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-sm">
            المكونات (مخزون، مواد مصنعة، أو وجبات)
          </h3>
          <button
            onClick={() =>
              setIngs([
                ...ings,
                { itemId: "", qty: 0, unit: "كيلوجرام", refKind: "item" },
              ])
            }
            className="text-sm text-primary flex items-center gap-1 hover:underline"
          >
            <Plus className="w-4 h-4" /> إضافة مكون
          </button>
        </div>
        <div className="space-y-2">
          {ings.map((ing, idx) => {
            const isMeal = ing.refKind === "meal";
            const it = !isMeal
              ? db.items.find((i) => i.id === ing.itemId)
              : undefined;
            const ml = isMeal
              ? db.meals.find((m) => m.id === ing.itemId)
              : undefined;
            const base = it
              ? convertToBase(
                  ing.qty,
                  ing.unit,
                  it.unit,
                  it.conversionFactor,
                  it.subUnitType,
                )
              : 0;
            const currentValue = ing.itemId
              ? `${isMeal ? "meal" : "item"}:${ing.itemId}`
              : "";
            return (
              <div
                key={idx}
                className="grid grid-cols-12 gap-2 items-start bg-secondary/30 p-2 rounded-lg"
              >
                <div className="col-span-12 md:col-span-6">
                  <SearchableSelect
                    options={ingredientOptions}
                    value={currentValue}
                    placeholder="ابحث عن مكون أو وصفة..."
                    onChange={(v) => {
                      const [refKind, id] = v.split(":");
                      const c = [...ings];
                      if (refKind === "meal")
                        c[idx] = {
                          itemId: id,
                          qty: c[idx].qty || 1,
                          unit: "قطعة",
                          refKind: "meal",
                        };
                      else {
                        const it2 = db.items.find((i) => i.id === id);
                        c[idx] = {
                          itemId: id,
                          qty: c[idx].qty,
                          unit: it2?.unit || "كيلوجرام",
                          refKind: "item",
                        };
                      }
                      setIngs(c);
                    }}
                  />
                  {it && (
                    <div className="text-xs text-muted-foreground mt-1 px-1">
                      وحدة المخزن: {it.unit}{" "}
                      {it.subUnitQty
                        ? `(1 ${it.unit} = ${it.subUnitQty} ${it.subUnitType})`
                        : ""}{" "}
                      • سعر: {fmt2(it.avgPrice)}
                    </div>
                  )}
                  {ml && (
                    <div className="text-xs text-muted-foreground mt-1 px-1">
                      من قسم: {ml.department} • {ml.ingredients.length} مكون
                    </div>
                  )}
                </div>
                <div className="col-span-5 md:col-span-3">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={ing.qty || ""}
                    placeholder={isMeal ? "العدد" : "الكمية"}
                    onChange={(e) => {
                      const c = [...ings];
                      c[idx] = {
                        ...c[idx],
                        qty: clamp0(cleanNumInput(e.target.value)),
                      };
                      setIngs(c);
                    }}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                  />
                </div>
                <div className="col-span-5 md:col-span-2">
                  {isMeal ? (
                    <div className="h-10 grid place-items-center text-xs text-muted-foreground bg-background border border-input rounded-md">
                      وحدة
                    </div>
                  ) : (
                    <select
                      value={ing.unit}
                      onChange={(e) => {
                        const c = [...ings];
                        c[idx] = {
                          ...c[idx],
                          unit: e.target.value as RecipeUnit,
                        };
                        setIngs(c);
                      }}
                      className="w-full h-10 px-2 rounded-md border border-input bg-background text-sm"
                    >
                      {RECIPE_UNITS.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <div className="col-span-2 md:col-span-1 flex justify-center">
                  <button
                    onClick={() => setIngs(ings.filter((_, i) => i !== idx))}
                    className="h-10 w-10 grid place-items-center rounded-md text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                {it && base > 0 && (
                  <div className="col-span-12 text-xs text-muted-foreground px-1">
                    يعادل: {fmt2(base)} {it.unit}
                  </div>
                )}
                {!isMeal && (
                  <div className="col-span-12 md:col-span-6 flex items-center gap-2 px-1">
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      هامش الخطأ المسموح (جرام):
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={ing.errorMargin ?? ""}
                      placeholder="0"
                      onChange={(e) => {
                        const c = [...ings];
                        c[idx] = {
                          ...c[idx],
                          errorMargin: clamp0(cleanNumInput(e.target.value)),
                        };
                        setIngs(c);
                      }}
                      className="w-28 h-8 px-2 rounded-md border border-input bg-background text-xs"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Shisha hint */}
        {isShishaCat && kind === "menu" && (
          <div className="mt-4 p-3 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900 text-xs text-purple-800 dark:text-purple-200">
            ✨ هذا الصنف ضمن فئة <strong>الشيشة</strong> — لن يتم خصمه من المخزن
            الفرعي ولن يظهر "العدد الممكن تصنيعه" في شاشة الطلبات.
          </div>
        )}

        {/* Modifiers */}
        {kind === "menu" && (
          <div className="mt-4 border-t border-border pt-4">
            <label className="flex items-center gap-2 text-sm font-medium cursor-pointer">
              <input
                type="checkbox"
                checked={hasModifiers}
                onChange={(e) => setHasModifiers(e.target.checked)}
              />
              هل توجد خيارات أو إضافات لهذا المنتج؟
            </label>
            {hasModifiers && (
              <div className="mt-3 space-y-3">
                {modGroups.map((g) => (
                  <div
                    key={g.id}
                    className="border border-border rounded-lg p-3 bg-secondary/30 space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        value={g.name}
                        onChange={(e) =>
                          updateGroup(g.id, { name: e.target.value })
                        }
                        placeholder="اسم المجموعة (مثلاً: نوع البن)"
                        className="flex-1 h-9 px-3 rounded-md border border-input bg-background text-sm"
                      />
                      <label className="flex items-center gap-1 text-xs">
                        <input
                          type="checkbox"
                          checked={g.required}
                          onChange={(e) =>
                            updateGroup(g.id, { required: e.target.checked })
                          }
                        />
                        مطلوب
                      </label>
                      <button
                        onClick={() => removeGroup(g.id)}
                        className="p-2 text-destructive hover:bg-destructive/10 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="space-y-1">
                      {g.options.map((o) => (
                        <div
                          key={o.id}
                          className="grid grid-cols-12 gap-2 items-center"
                        >
                          <input
                            value={o.label}
                            onChange={(e) =>
                              updateOption(g.id, o.id, {
                                label: e.target.value,
                              })
                            }
                            placeholder="الخيار (مثلاً: سادة)"
                            className="col-span-7 h-9 px-3 rounded-md border border-input bg-background text-sm"
                          />
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={o.extraPrice || ""}
                            onChange={(e) =>
                              updateOption(g.id, o.id, {
                                extraPrice: clamp0(
                                  parseFloat(cleanNumInput(e.target.value)) ||
                                    0,
                                ),
                              })
                            }
                            placeholder="سعر إضافي"
                            className="col-span-4 h-9 px-3 rounded-md border border-input bg-background text-sm"
                          />
                          <button
                            onClick={() => removeOption(g.id, o.id)}
                            className="col-span-1 p-2 text-destructive hover:bg-destructive/10 rounded"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => addOption(g.id)}
                        className="text-xs text-primary flex items-center gap-1 hover:underline mt-1"
                      >
                        <Plus className="w-3 h-3" /> إضافة خيار
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  onClick={addGroup}
                  className="px-3 h-9 rounded-md bg-secondary text-sm flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> إضافة مجموعة خيارات
                </button>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between border-t border-border pt-4 mt-4">
          <div className="text-sm">
            سعر التصنيع:{" "}
            <strong className="text-primary text-lg">{fmt2(cost)}</strong> ج.م
          </div>
          <button
            onClick={() => {
              if (!name.trim()) {
                toast.error("أدخل الاسم");
                return;
              }
              const cleanIngs = ings.filter((i) => i.itemId && i.qty > 0);
              if (cleanIngs.length === 0 && !isShishaCat) {
                toast.error("أضف مكون واحدًا على الأقل");
                return;
              }
              const cleanGroups = hasModifiers
                ? modGroups
                    .map((g) => ({
                      ...g,
                      name: g.name.trim(),
                      options: g.options.filter((o) => o.label.trim()),
                    }))
                    .filter((g) => g.name && g.options.length > 0)
                : [];
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
                modifierGroups: cleanGroups,
              });
            }}
            className="px-5 h-11 rounded-lg bg-primary text-primary-foreground font-medium flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> حفظ
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============== TAB 3: Sales ============== */
function SalesTab() {
  const { db, addSale } = useDB();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [dept, setDept] = useState<SubDept>("مطبخ");
  const [lines, setLines] = useState<SaleLine[]>([]);
  const [printing, setPrinting] = useState<"depts" | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const deptMeals = db.meals.filter(
    (m) => m.department === dept && (m.kind || "menu") === "menu",
  );

  function setQty(mealId: string, qty: number) {
    const q = clamp0(qty);
    setLines((ls) => {
      const others = ls.filter((l) => l.mealId !== mealId);
      if (q > 0) return [...others, { mealId, qty: q }];
      return others;
    });
  }

  function submit() {
    const valid = lines.filter((l) => l.qty > 0);
    if (valid.length === 0) {
      toast.error("أدخل كمية مبيعات واحدة على الأقل");
      return;
    }
    const res = addSale(date, dept, valid);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    toast.success(`تم الحفظ. الإجمالي: ${fmt2(res.sale.totalSales)} ج.م`);
    setLines([]);
  }

  function importExcel(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const json: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });
        const newLines: SaleLine[] = [];
        let skipped = 0;
        for (const row of json) {
          const itemName = String(
            row["الصنف"] || row["اسم الصنف"] || row["الوجبة"] || "",
          ).trim();
          const qty = clamp0(parseFloat(row["الكمية"]) || 0);
          if (!itemName || qty <= 0) {
            skipped++;
            continue;
          }
          const meal =
            deptMeals.find((m) => m.name.trim() === itemName) ||
            deptMeals.find(
              (m) =>
                m.name.trim().includes(itemName) ||
                itemName.includes(m.name.trim()),
            );
          if (!meal) {
            skipped++;
            continue;
          }
          const existing = newLines.find((l) => l.mealId === meal.id);
          if (existing) existing.qty += qty;
          else newLines.push({ mealId: meal.id, qty });
        }
        if (newLines.length === 0) {
          toast.error("لم يتم استيراد أي صف.");
          return;
        }
        setLines(newLines);
        toast.success(
          `تم تحميل ${newLines.length} صف ${skipped > 0 ? `(تخطي ${skipped})` : ""}.`,
        );
      } catch (err: any) {
        toast.error("فشل قراءة الملف: " + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  }

  const totalSales = clamp0(
    lines.reduce((s, l) => {
      const m = db.meals.find((x) => x.id === l.mealId);
      return s + (m?.sellingPrice || 0) * l.qty;
    }, 0),
  );

  function printDepts() {
    setPrinting("depts");
    setTimeout(() => {
      window.print();
      setTimeout(() => setPrinting(null), 500);
    }, 100);
  }

  return (
    <div className="space-y-4">
      <div className="no-print bg-card border border-border rounded-xl p-4 flex flex-wrap items-end gap-3">
        <label className="block">
          <span className="text-xs mb-1 block">التاريخ</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-10 px-3 rounded-md border border-input bg-background text-sm"
          />
        </label>
        <label className="block min-w-[180px]">
          <span className="text-xs mb-1 block">القسم</span>
          <SearchableSelect
            options={SUB_DEPTS.map((d) => ({ value: d, label: d }))}
            value={dept}
            onChange={(v) => {
              setDept(v as SubDept);
              setLines([]);
            }}
          />
        </label>
        <button
          onClick={() => fileRef.current?.click()}
          className="h-10 px-3 rounded-md border border-input text-sm flex items-center gap-2 hover:bg-secondary"
        >
          <Upload className="w-4 h-4" /> استيراد Excel (الصنف، الكمية)
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) importExcel(f);
            e.target.value = "";
          }}
        />
        <button
          onClick={printDepts}
          className="h-10 px-3 rounded-md border border-input text-sm flex items-center gap-2 hover:bg-secondary"
        >
          <Printer className="w-4 h-4" /> طباعة مبيعات الأقسام (PDF)
        </button>
        <div className="ms-auto text-sm">
          إجمالي المبيعات:{" "}
          <strong className="text-primary text-lg">{fmt2(totalSales)}</strong>{" "}
          ج.م
        </div>
      </div>

      <div className="no-print bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-xs">
            <tr>
              <th className="text-right p-3">اسم الصنف</th>
              <th className="text-right p-3">سعر البيع</th>

              <th className="text-right p-3">الكمية المباعة</th>
              <th className="text-right p-3">الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            {deptMeals.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="p-8 text-center text-muted-foreground"
                >
                  لا توجد أصناف للبيع في {dept}
                </td>
              </tr>
            ) : (
              deptMeals.map((m) => {
                const ln = lines.find((l) => l.mealId === m.id);
                const qty = ln?.qty || 0;
                return (
                  <tr key={m.id} className="border-t border-border">
                    <td className="p-3 font-medium">{m.name}</td>
                    <td className="p-3">{fmt2(m.sellingPrice)}</td>

                    <td className="p-3">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={qty || ""}
                        onChange={(e) =>
                          setQty(m.id, clamp0(cleanNumInput(e.target.value)))
                        }
                        className="w-24 h-9 px-2 rounded-md border border-input bg-background text-sm"
                      />
                    </td>
                    <td className="p-3 font-bold">
                      {fmt2(m.sellingPrice * qty)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="no-print flex justify-end">
        <button
          onClick={submit}
          className="px-5 h-11 rounded-lg bg-primary text-primary-foreground font-medium flex items-center gap-2"
        >
          <Save className="w-4 h-4" /> حفظ المبيعات وخصم المخزون
        </button>
      </div>

      {printing === "depts" && (
        <div className="print-area">
          <DeptsSalesPrint date={date} />
        </div>
      )}
    </div>
  );
}

function DeptsSalesPrint({ date }: { date: string }) {
  const { db } = useDB();

  // 👈 غيرنا "مطبخ" لـ "kitchen" و "بار" لـ "bar"
  const dayKitchen = aggregateDailySales(db.sales, date, "مطبخ", db.meals);
  const dayBar = aggregateDailySales(db.sales, date, "بار", db.meals);
  const dayShisha = aggregateDailySales(db.sales, date, "شيشه", db.meals);

  return (
    <div>
      <SalesSection
        title="مبيعات المطبخ (الطعام)"
        date={date}
        rows={dayKitchen}
      />
      <div style={{ pageBreakBefore: "always" }} />
      <SalesSection
        title="مبيعات البار (المشروبات)"
        date={date}
        rows={dayBar}
      />
      <div style={{ pageBreakBefore: "always" }} />
      <SalesSection title="مبيعات الشيشة" date={date} rows={dayShisha} />
    </div>
  );
}

function SalesSection({
  title,
  date,
  rows,
}: {
  title: string;
  date: string;
  rows: { name: string; qty: number; price: number; total: number }[];
}) {
  const totalQty = rows.reduce((s, r) => s + r.qty, 0);
  const totalVal = clamp0(rows.reduce((s, r) => s + r.total, 0));
  return (
    <div className="print-voucher">
      <div className="text-center border-b border-black pb-2 mb-2">
        <h1 className="text-base font-bold">{title}</h1>
        <div className="text-xs">التاريخ: {date}</div>
      </div>
      {rows.length === 0 ? (
        <div className="text-center text-sm py-6">
          لا توجد مبيعات لهذا القسم في هذا التاريخ
        </div>
      ) : (
        <table className="print-table w-full">
          <thead>
            <tr>
              <th style={{ width: "30px" }}>#</th>
              <th>اسم الصنف</th>
              <th style={{ width: "70px" }}>سعر الوحدة</th>
              <th style={{ width: "70px" }}>الكمية</th>
              <th style={{ width: "100px" }}>الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                <td>{r.name}</td>
                <td>{fmt2(r.price)}</td>
                <td>{fmt2(r.qty)}</td>
                <td>{fmt2(r.total)}</td>
              </tr>
            ))}
            <tr style={{ fontWeight: "bold", background: "#eee" }}>
              <td colSpan={3}>الإجمالي</td>
              <td>{fmt2(totalQty)}</td>
              <td>{fmt2(totalVal)}</td>
            </tr>
          </tbody>
        </table>
      )}
    </div>
  );
}

function aggregateDailySales(
  sales: any[],
  date: string,
  dept: SubDept,
  meals: Meal[],
) {
  const map = new Map<
    string,
    { name: string; qty: number; price: number; total: number }
  >();
  for (const s of sales) {
    if (s.date !== date || s.department !== dept) continue;
    for (const ln of s.lines) {
      const m = meals.find((x) => x.id === ln.mealId);
      if (!m) continue;
      const cur = map.get(m.id) || {
        name: m.name,
        qty: 0,
        price: m.sellingPrice,
        total: 0,
      };
      cur.qty += ln.qty;
      cur.total += m.sellingPrice * ln.qty;
      map.set(m.id, cur);
    }
  }
  return Array.from(map.values()).sort((a, b) =>
    a.name.localeCompare(b.name, "ar"),
  );
}

/* ============== TAB 4: Results & Audit ============== */
type ResultsView = "all" | "kitchen" | "bar" | "audit" | "shisha";
type TimeRange = "1d" | "3d" | "7d" | "30d" | "90d";

function ResultsTab() {
  const { db } = useDB();
  const [view, setView] = useState<ResultsView>("all");
  const [range, setRange] = useState<TimeRange>("7d");
  const [printing, setPrinting] = useState<"endday" | null>(null);
  const [enddayDate, setEnddayDate] = useState(
    new Date().toISOString().slice(0, 10),
  );

  const rangeDays =
    range === "1d"
      ? 1
      : range === "3d"
        ? 3
        : range === "7d"
          ? 7
          : range === "30d"
            ? 30
            : 90;

  const filteredSales = useMemo(() => {
    const cutoff = new Date();
    cutoff.setHours(0, 0, 0, 0);
    cutoff.setDate(cutoff.getDate() - rangeDays + 1);
    const cs = cutoff.toISOString().slice(0, 10);
    return db.sales.filter((s) => {
      if (s.date < cs) return false;
      if (view === "kitchen" && s.department !== "مطبخ") return false;
      if (view === "bar" && s.department !== "بار") return false;
      if (view === "shisha" && s.department !== "شيشه") return false; // دي هتشتغل دلوقتي بعد ما عدلنا الـ store.ts      return true;
    });
  }, [db.sales, rangeDays, view]);

  const totalSales = clamp0(
    filteredSales.reduce((s, x) => s + x.totalSales, 0),
  );
  const totalCost = clamp0(filteredSales.reduce((s, x) => s + x.totalCost, 0));
  const profit = totalSales - totalCost; // can be negative

  const chartData = useMemo(() => {
    const days: { date: string; profit: number; sales: number }[] = [];
    for (let i = rangeDays - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().slice(0, 10);
      const list = filteredSales.filter((s) => s.date === ds);
      const sumS = list.reduce((a, b) => a + b.totalSales, 0);
      const sumC = list.reduce((a, b) => a + b.totalCost, 0);
      days.push({ date: ds, profit: sumS - sumC, sales: sumS });
    }
    return days;
  }, [filteredSales, rangeDays]);
  const maxAbs = Math.max(1, ...chartData.map((d) => Math.abs(d.profit)));

  function printEndOfDay() {
    setPrinting("endday");
    setTimeout(() => {
      window.print();
      setTimeout(() => setPrinting(null), 500);
    }, 100);
  }

  return (
    <div className="space-y-4">
      <div className="no-print flex flex-wrap items-center gap-2">
        <div className="flex gap-1 bg-secondary p-1 rounded-lg">
          {(
            [
              { id: "all", label: "الكل" },
              { id: "kitchen", label: "المطبخ" },
              { id: "bar", label: "البار" },
              { id: "shisha", label: "الشيشة" },
              { id: "audit", label: "الجرد" },
            ] as { id: ResultsView; label: string }[]
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setView(t.id)}
              className={`px-3 h-8 rounded-md text-xs font-medium ${view === t.id ? "bg-card shadow-sm" : "text-muted-foreground"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        {view !== "audit" && (
          <select
            value={range}
            onChange={(e) => setRange(e.target.value as TimeRange)}
            className="h-9 px-3 rounded-md border border-input bg-background text-sm"
          >
            <option value="1d">آخر يوم</option>
            <option value="3d">آخر 3 أيام</option>
            <option value="7d">آخر أسبوع</option>
            <option value="30d">آخر شهر</option>
            <option value="90d">آخر 3 أشهر</option>
          </select>
        )}
        <div className="ms-auto flex gap-2">
          <input
            type="date"
            value={enddayDate}
            onChange={(e) => setEnddayDate(e.target.value)}
            className="h-9 px-3 rounded-md border border-input bg-background text-sm"
          />
          <button
            onClick={printEndOfDay}
            className="h-9 px-3 rounded-md bg-primary text-primary-foreground text-sm flex items-center gap-2"
          >
            <FileText className="w-4 h-4" /> تقفيل اليوم (PDF)
          </button>
        </div>
      </div>

      {view !== "audit" && (
        <>
          <div className="no-print grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat label="إجمالي المبيعات" value={fmt2(totalSales) + " ج.م"} />
            <Stat label="إجمالي التكلفة" value={fmt2(totalCost) + " ج.م"} />
            <Stat
              label="صافي الربح/الخسارة"
              value={fmt2(profit) + " ج.م"}
              highlight={profit >= 0 ? "text-success" : "text-destructive"}
            />
            <Stat
              label="عدد عمليات البيع"
              value={filteredSales.length.toString()}
            />
          </div>
          <div className="no-print bg-card border border-border rounded-xl p-4">
            <h2 className="font-bold text-sm mb-3">
              الربح اليومي خلال الفترة المختارة
            </h2>
            <div className="flex items-end gap-1 h-40 overflow-x-auto">
              {chartData.map((d) => {
                const h = (Math.abs(d.profit) / maxAbs) * 100;
                const pos = d.profit >= 0;
                return (
                  <div
                    key={d.date}
                    className="flex-1 min-w-[28px] flex flex-col items-center gap-1"
                  >
                    <div className="text-[10px] font-medium">
                      {fmt2(d.profit)}
                    </div>
                    <div
                      className={`w-full rounded-t ${pos ? "bg-primary" : "bg-destructive"}`}
                      style={{ height: `${h}%`, minHeight: "2px" }}
                    />
                    <div className="text-[10px] text-muted-foreground rotate-45 origin-top-right whitespace-nowrap mt-2">
                      {d.date.slice(5)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {view === "audit" && <AuditView />}

      {printing === "endday" && (
        <div className="print-area">
          <EndOfDayPrint date={enddayDate} />
        </div>
      )}
    </div>
  );
}

/* --- Audit View (history + new audit per dept/date) --- */
function AuditView() {
  const { db, addAudit } = useDB();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [dept, setDept] = useState<SubDept>("مطبخ");
  const [actuals, setActuals] = useState<Record<string, string>>({});
  const [pendingOverwrite, setPendingOverwrite] = useState<AuditEntry | null>(
    null,
  );
  const [printChecklist, setPrintChecklist] = useState(false);
  const [printReceipt, setPrintReceipt] = useState<AuditEntry | null>(null);

  const today = new Date().toISOString().slice(0, 10);
  const isPast = date < today;

  const existing = useMemo(
    () => db.audits.find((a) => a.date === date && a.department === dept),
    [db.audits, date, dept],
  );

  const rows = useMemo(
    () =>
      db.items
        .map((it) => ({
          item: it,
          expected: clamp0(db.deptStock[deptKey(dept, it.id)] || 0),
        }))
        .filter((r) => r.expected > 0),
    [db.items, db.deptStock, dept],
  );

  // Per-ingredient allowed waste in GRAMS, derived ONLY from items inside meals actually sold today
  // for this department. Formula: allowed[itemId] = Σ (saleQty * ingredient.errorMargin) across all
  // sold meals' recipes (recursive through sub-meals, scaled by sub-meal qty multiplier).
  const allowedWasteMap = useMemo(() => {
    const map = new Map<string, number>();
    function walk(mealId: string, multiplier: number, visited: Set<string>) {
      if (visited.has(mealId)) return;
      visited.add(mealId);
      const meal = db.meals.find((m) => m.id === mealId);
      if (!meal) return;
      for (const ing of meal.ingredients) {
        if (ing.refKind === "meal") {
          walk(ing.itemId, multiplier * (ing.qty || 1), new Set(visited));
        } else {
          const grams = clamp0(ing.errorMargin || 0) * multiplier;
          if (grams > 0)
            map.set(ing.itemId, (map.get(ing.itemId) || 0) + grams);
        }
      }
    }
    for (const s of db.sales) {
      if (s.date !== date || s.department !== dept) continue;
      for (const ln of s.lines) {
        const q = clamp0(ln.qty);
        if (q <= 0) continue;
        walk(ln.mealId, q, new Set());
      }
    }
    return map;
  }, [db.sales, db.meals, date, dept]);

  const soldCount = useMemo(() => {
    let n = 0;
    for (const s of db.sales) {
      if (s.date !== date || s.department !== dept) continue;
      for (const ln of s.lines) n += clamp0(ln.qty);
    }
    return n;
  }, [db.sales, date, dept]);

  // Convert allowed grams → allowed in inventory units (only meaningful for weight/volume items).
  function allowedInInvUnits(unit: string, grams: number): number {
    if (unit === "كيلوجرام" || unit === "لتر") return grams / 1000;
    return 0; // pieces/packs: no gram-based waste allowance
  }

  const { shortageValue, totalAllowedValue } = useMemo(() => {
    let sv = 0;
    let av = 0;
    for (const r of rows) {
      const actual = clamp0(actuals[r.item.id] ?? r.expected.toString());
      if (actual > r.expected) continue;
      const rawShort = r.expected - actual;
      if (rawShort <= 0) continue;
      const allowedG = allowedWasteMap.get(r.item.id) || 0;
      const allowedUnits = Math.min(
        allowedInInvUnits(r.item.unit, allowedG),
        rawShort,
      );
      const effShort = Math.max(0, rawShort - allowedUnits);
      sv += effShort * r.item.avgPrice;
      av += allowedUnits * r.item.avgPrice;
    }
    return { shortageValue: sv, totalAllowedValue: av };
  }, [actuals, rows, allowedWasteMap]);

  const penalty = Math.max(0, shortageValue);

  function buildAudit(): AuditEntry {
    const auditRows = rows.map((r) => {
      let actual = clamp0(actuals[r.item.id] ?? r.expected.toString());
      if (actual > r.expected) actual = r.expected;
      return {
        itemId: r.item.id,
        expected: r.expected,
        actual,
        match: actual === r.expected,
      };
    });
    return {
      id: crypto.randomUUID(),
      date,
      department: dept,
      rows: auditRows,
      shortageValue: round2(shortageValue),
      penaltyValue: round2(penalty),
      createdAt: Date.now(),
    };
  }

  function doSave(audit: AuditEntry, overwrite: boolean) {
    const res = addAudit(audit, { overwrite, deduct: true });
    if (!res.ok) {
      if (res.error === "duplicate") {
        setPendingOverwrite(audit);
        return;
      }
    }
    toast.success("تم حفظ الجرد وخصم العجز من المخزون");
    setActuals({});
    setPrintReceipt(audit);
    setTimeout(() => {
      window.print();
      setTimeout(() => setPrintReceipt(null), 500);
    }, 150);
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

  return (
    <div className="space-y-4">
      <div className="no-print bg-card border border-border rounded-xl p-4 flex flex-wrap items-end gap-3">
        <label className="block">
          <span className="text-xs mb-1 block">تاريخ الجرد</span>
          <input
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              setActuals({});
            }}
            className="h-10 px-3 rounded-md border border-input bg-background text-sm"
          />
        </label>
        <label className="block min-w-[160px]">
          <span className="text-xs mb-1 block">القسم</span>
          <SearchableSelect
            options={SUB_DEPTS.map((d) => ({ value: d, label: d }))}
            value={dept}
            onChange={(v) => {
              setDept(v as SubDept);
              setActuals({});
            }}
          />
        </label>
        {isPast && existing && (
          <div className="text-xs px-3 py-2 rounded-md bg-secondary flex items-center gap-2">
            <History className="w-4 h-4" /> عرض جرد سابق محفوظ بتاريخ {date}
          </div>
        )}
        <div className="ms-auto flex gap-2">
          <button
            onClick={printChecklistNow}
            disabled={isPast}
            className="h-10 px-4 rounded-md border border-input text-sm flex items-center gap-2 hover:bg-secondary disabled:opacity-40"
          >
            <Printer className="w-4 h-4" /> طباعة قائمة الجرد
          </button>
        </div>
      </div>

      {isPast && existing ? (
        <PastAuditView audit={existing} items={db.items} />
      ) : isPast && !existing ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground">
          لا يوجد جرد محفوظ بتاريخ {date} لقسم {dept}.
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          {existing && (
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 rounded-md text-xs">
              <AlertTriangle className="w-4 h-4" /> تم عمل جرد مسبقاً اليوم لـ{" "}
              {dept}. الحفظ سيستبدل الجرد القديم.
            </div>
          )}
          <h2 className="font-bold text-sm">الجرد الإلكتروني — {dept}</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 text-xs">
                <tr>
                  <th className="text-right p-2">الكود</th>
                  <th className="text-right p-2">الصنف</th>
                  <th className="text-right p-2">القيمة الافتراضية</th>
                  <th className="text-right p-2">القيمة الفعلية</th>
                  <th className="text-right p-2">الهدر المسموح به (جرام)</th>
                  <th className="text-right p-2">العجز</th>
                  <th className="text-right p-2">قيمة العجز</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="p-6 text-center text-muted-foreground"
                    >
                      لا توجد مخزون في {dept}
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => {
                    const rawActual = actuals[r.item.id];
                    const actualNum = clamp0(
                      rawActual ?? r.expected.toString(),
                    );
                    const exceeds = actualNum > r.expected;
                    const rawShortage = Math.max(0, r.expected - actualNum);
                    const allowedG = allowedWasteMap.get(r.item.id) || 0;
                    const allowedUnits = Math.min(
                      allowedInInvUnits(r.item.unit, allowedG),
                      rawShortage,
                    );
                    const effShortage = Math.max(0, rawShortage - allowedUnits);
                    const shortageVal = effShortage * r.item.avgPrice;
                    return (
                      <tr key={r.item.id} className="border-t border-border">
                        <td className="p-2 font-mono text-xs">{r.item.code}</td>
                        <td className="p-2">{r.item.name}</td>
                        <td className="p-2 text-muted-foreground">
                          {fmt2(r.expected)} {r.item.unit}
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={rawActual ?? ""}
                            placeholder={fmt2(r.expected)}
                            onChange={(e) => {
                              const v = cleanNumInput(e.target.value);
                              const num = parseFloat(v);
                              if (!isNaN(num) && num > r.expected) {
                                toast.error(
                                  `الكمية الفعلية يجب ألا تتجاوز الكمية الافتراضية (${fmt2(r.expected)})`,
                                );
                                setActuals({
                                  ...actuals,
                                  [r.item.id]: r.expected.toString(),
                                });
                                return;
                              }
                              setActuals({ ...actuals, [r.item.id]: v });
                            }}
                            className={`w-28 h-8 px-2 rounded-md border bg-background text-xs ${exceeds ? "border-destructive" : "border-input"}`}
                          />
                        </td>
                        <td className="p-2">
                          <span
                            className={
                              allowedG > 0
                                ? "text-emerald-600 dark:text-emerald-400 font-medium"
                                : "text-muted-foreground"
                            }
                          >
                            {fmt2(allowedG)}
                          </span>
                        </td>
                        <td className="p-2">
                          {effShortage > 0 ? (
                            <span className="text-destructive font-medium">
                              {fmt2(effShortage)}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="p-2">
                          {shortageVal > 0 ? (
                            <span className="text-destructive">
                              {fmt2(shortageVal)}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center gap-4 border-t border-border pt-3 text-sm">
            <div>
              قيمة العجز (بعد خصم الهدر المسموح):{" "}
              <strong className="text-destructive">
                {fmt2(shortageValue)} ج.م
              </strong>
            </div>
            <div>
              الأصناف المباعة اليوم: <strong>{soldCount}</strong> • قيمة الهدر
              المسموح المُحتسبة: <strong>{fmt2(totalAllowedValue)} ج.م</strong>
            </div>
            {penalty > 0 && (
              <div className="px-3 py-1.5 rounded-md bg-destructive/10 text-destructive font-bold">
                هذا القسم يتحمل غرامة قدرها {fmt2(penalty)} جنيه
              </div>
            )}
            <button
              onClick={saveNew}
              className="ms-auto h-10 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2"
            >
              <Save className="w-4 h-4" /> حفظ الجرد وخصم العجز
            </button>
          </div>
        </div>
      )}

      {pendingOverwrite && (
        <div
          className="fixed inset-0 z-50 bg-black/50 grid place-items-center p-4"
          onClick={() => setPendingOverwrite(null)}
        >
          <div
            className="bg-card border border-border rounded-xl max-w-md w-full p-5 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold flex items-center gap-2 text-amber-600">
              <AlertTriangle className="w-5 h-5" /> تم عمل جرد مسبقاً اليوم
            </h3>
            <p className="text-sm text-muted-foreground">
              يوجد جرد محفوظ لتاريخ {pendingOverwrite.date} لقسم{" "}
              {pendingOverwrite.department}. هل تريد استبداله؟
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setPendingOverwrite(null)}
                className="flex-1 h-10 rounded-md border border-input text-sm"
              >
                إلغاء
              </button>
              <button
                onClick={() => {
                  const a = pendingOverwrite;
                  setPendingOverwrite(null);
                  doSave(a, true);
                }}
                className="flex-1 h-10 rounded-md bg-destructive text-destructive-foreground text-sm"
              >
                اعتماد الجرد الجديد
              </button>
            </div>
          </div>
        </div>
      )}

      {printChecklist && (
        <div className="print-area">
          <PrintAuditSheet
            date={date}
            department={dept}
            items={rows}
            mealsCount={db.meals.filter((m) => m.department === dept).length}
          />
        </div>
      )}
      {printReceipt && (
        <div className="print-area">
          <AuditReceiptPrint audit={printReceipt} items={db.items} />
        </div>
      )}
    </div>
  );
}

function PastAuditView({ audit, items }: { audit: AuditEntry; items: any[] }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <h2 className="font-bold text-sm">
        جرد محفوظ — {audit.department} • {audit.date}
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-xs">
            <tr>
              <th className="text-right p-2">الصنف</th>
              <th className="text-right p-2">القيمة الافتراضية</th>
              <th className="text-right p-2">القيمة الفعلية</th>
              <th className="text-right p-2">العجز</th>
            </tr>
          </thead>
          <tbody>
            {audit.rows.map((r) => {
              const it = items.find((x) => x.id === r.itemId);
              const short = Math.max(0, r.expected - r.actual);
              return (
                <tr key={r.itemId} className="border-t border-border">
                  <td className="p-2">{it?.name || r.itemId}</td>
                  <td className="p-2">{fmt2(r.expected)}</td>
                  <td className="p-2">{fmt2(r.actual)}</td>
                  <td className="p-2">
                    {short > 0 ? (
                      <span className="text-destructive">{fmt2(short)}</span>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex gap-4 text-sm border-t border-border pt-3">
        <div>
          قيمة العجز:{" "}
          <strong className="text-destructive">
            {fmt2(audit.shortageValue)} ج.م
          </strong>
        </div>
        {audit.penaltyValue > 0 && (
          <div>
            غرامة:{" "}
            <strong className="text-destructive">
              {fmt2(audit.penaltyValue)} ج.م
            </strong>
          </div>
        )}
      </div>
    </div>
  );
}

/* --- Auto-downloaded PDF Audit Receipt --- */
function AuditReceiptPrint({
  audit,
  items,
}: {
  audit: AuditEntry;
  items: any[];
}) {
  const shortRows = audit.rows.filter((r) => r.expected > r.actual);
  return (
    <div className="print-voucher">
      <div className="text-center border-b border-black pb-2 mb-2">
        <h1 className="text-base font-bold">إيصال عجز الجرد</h1>
        <div className="text-xs">
          القسم: {audit.department} • التاريخ: {audit.date}
        </div>
      </div>
      {shortRows.length === 0 ? (
        <div className="text-center text-sm py-4">
          لا يوجد عجز — الجرد مطابق تماماً.
        </div>
      ) : (
        <table className="print-table w-full">
          <thead>
            <tr>
              <th style={{ width: "26px" }}>#</th>
              <th>اسم الصنف</th>
              <th style={{ width: "60px" }}>المتوقع</th>
              <th style={{ width: "60px" }}>الفعلي</th>
              <th style={{ width: "60px" }}>العجز</th>
              <th style={{ width: "80px" }}>قيمة العجز</th>
            </tr>
          </thead>
          <tbody>
            {shortRows.map((r, i) => {
              const it = items.find((x) => x.id === r.itemId);
              const short = r.expected - r.actual;
              return (
                <tr key={r.itemId}>
                  <td>{i + 1}</td>
                  <td>{it?.name || r.itemId}</td>
                  <td>{fmt2(r.expected)}</td>
                  <td>{fmt2(r.actual)}</td>
                  <td>{fmt2(short)}</td>
                  <td>{fmt2(short * (it?.avgPrice || 0))}</td>
                </tr>
              );
            })}
            <tr style={{ fontWeight: "bold", background: "#eee" }}>
              <td colSpan={5}>إجمالي قيمة العجز</td>
              <td>{fmt2(audit.shortageValue)}</td>
            </tr>
          </tbody>
        </table>
      )}
      <div className="mt-3 text-xs">
        ملاحظة: تم خصم كميات العجز تلقائياً من مخزون القسم.
        {audit.penaltyValue > 0 && (
          <>
            {" "}
            • هذا القسم يتحمل غرامة قدرها{" "}
            <strong>{fmt2(audit.penaltyValue)}</strong> جنيه.
          </>
        )}
      </div>
      <div className="flex justify-between mt-4 text-xs">
        <div>اسم المسؤول: ____________</div>
        <div>التوقيع: ____________</div>
      </div>
    </div>
  );
}

/* --- End of Day PDF (Kitchen | Bar split) --- */
function EndOfDayPrint({ date }: { date: string }) {
  const { db } = useDB();
  const todaySales = db.sales.filter((s) => s.date === date);
  const sumS = clamp0(todaySales.reduce((s, x) => s + x.totalSales, 0));
  const sumC = clamp0(todaySales.reduce((s, x) => s + x.totalCost, 0));
  const net = sumS - sumC;
  const todayAudits = db.audits.filter((a) => a.date === date);
  const kRows = aggregateDailySales(db.sales, date, "مطبخ", db.meals);
  const bRows = aggregateDailySales(db.sales, date, "بار", db.meals);
  const sRows = aggregateDailySales(db.sales, date, "شيشه", db.meals);

  return (
    <div className="print-voucher">
      <div className="text-center border-b-2 border-black pb-2 mb-3">
        <h1 className="text-lg font-bold">تقرير تقفيل اليوم</h1>
        <div className="text-xs">التاريخ: {date}</div>
      </div>
      <table className="print-table w-full" style={{ marginBottom: "10px" }}>
        <tbody>
          <tr>
            <td style={{ width: "50%" }}>
              <strong>إجمالي المبيعات</strong>
            </td>
            <td>{fmt2(sumS)} ج.م</td>
          </tr>
          <tr>
            <td>
              <strong>إجمالي التكلفة</strong>
            </td>
            <td>{fmt2(sumC)} ج.م</td>
          </tr>
          <tr style={{ background: "#eee" }}>
            <td>
              <strong>صافي الربح/الخسارة</strong>
            </td>
            <td>
              <strong>{fmt2(net)} ج.م</strong>
            </td>
          </tr>
        </tbody>
      </table>
      <SalesPdfSection title="مبيعات المطبخ" rows={kRows} />
      <div style={{ borderTop: "2px solid #000", margin: "10px 0" }} />
      <SalesPdfSection title="مبيعات البار" rows={bRows} />
      <SalesPdfSection title="مبيعات المطبخ" rows={kRows} />
      <div style={{ borderTop: "2px solid #000", margin: "10px 0" }} />
      <SalesPdfSection title="مبيعات البار" rows={bRows} />
      <div style={{ borderTop: "2px solid #000", margin: "10px 0" }} />
      <SalesPdfSection title="مبيعات الشيشة" rows={sRows} /> {/* 👈 الشيشة */}
      <h2 className="text-sm font-bold mt-3 mb-1">نتائج الجرد</h2>
      {todayAudits.length === 0 ? (
        <div className="text-xs">لم يتم إجراء جرد لهذا اليوم</div>
      ) : (
        <table className="print-table w-full">
          <thead>
            <tr>
              <th>القسم</th>
              <th>قيمة العجز</th>
              <th>قيمة الغرامة</th>
            </tr>
          </thead>
          <tbody>
            {todayAudits.map((a) => (
              <tr key={a.id}>
                <td>{a.department}</td>
                <td>{fmt2(a.shortageValue)}</td>
                <td>{fmt2(a.penaltyValue)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <div className="flex justify-between mt-4 text-xs">
        <div>اعتماد المسؤول: ____________</div>
        <div>التوقيع: ____________</div>
      </div>
    </div>
  );
}

function SalesPdfSection({
  title,
  rows,
}: {
  title: string;
  rows: { name: string; qty: number; price: number; total: number }[];
}) {
  const totalVal = clamp0(rows.reduce((s, r) => s + r.total, 0));
  return (
    <div>
      <h2 className="text-sm font-bold mt-2 mb-1">{title}</h2>
      {rows.length === 0 ? (
        <div className="text-xs">لا توجد مبيعات</div>
      ) : (
        <table className="print-table w-full">
          <thead>
            <tr>
              <th style={{ width: "24px" }}>#</th>
              <th>اسم الصنف</th>
              <th style={{ width: "60px" }}>سعر الوحدة</th>
              <th style={{ width: "60px" }}>الكمية</th>
              <th style={{ width: "80px" }}>الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td>{i + 1}</td>
                <td>{r.name}</td>
                <td>{fmt2(r.price)}</td>
                <td>{fmt2(r.qty)}</td>
                <td>{fmt2(r.total)}</td>
              </tr>
            ))}
            <tr style={{ fontWeight: "bold", background: "#eee" }}>
              <td colSpan={4}>إجمالي {title}</td>
              <td>{fmt2(totalVal)}</td>
            </tr>
          </tbody>
        </table>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: string;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className={`text-2xl font-bold ${highlight || ""}`}>{value}</div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  );
}
