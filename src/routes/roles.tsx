import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { usePosDB, type Employee, type EmployeeRole } from "@/lib/pos-store.ts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { PinPrompt } from "@/components/PinPrompt";
import { Plus, Eye, EyeOff, Pencil, Trash2, Fingerprint } from "lucide-react";

export const Route = createFileRoute("/roles")({
  head: () => ({ meta: [{ title: "بصمات الموظفين - الصلاحيات" }] }),
  component: RolesPage,
});

function RolesPage() {
  const { db, addEmployee, updateEmployee, deleteEmployee } = usePosDB();
  const [revealed, setRevealed] = useState<Record<string, string>>({}); // id -> displayed pin (only set if admin pin verified — but we never store the raw pin server-side; we just allow viewing the masked entry as "****" + actual value if user enters it on creation; in this MVP we show "(محفوظ)" after verification)
  const [pinFor, setPinFor] = useState<string | null>(null);
  const [editing, setEditing] = useState<Employee | "new" | null>(null);

  function toggleEye(id: string) {
    if (revealed[id]) {
      const c = { ...revealed };
      delete c[id];
      setRevealed(c);
    } else {
      setPinFor(id);
    }
  }

  return (
    <div dir="rtl" className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Fingerprint className="w-6 h-6" /> بصمات الموظفين
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            إدارة الكاشيرين وكباتن الصالة والأكواد السرية.
          </p>
        </div>
        <Button onClick={() => setEditing("new")} className="gap-2">
          <Plus className="w-4 h-4" /> إضافة موظف
        </Button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-secondary/50 text-xs">
            <tr>
              <th className="text-right p-3">اسم الموظف</th>
              <th className="text-right p-3">الوظيفة</th>
              <th className="text-right p-3">كلمة السر</th>
              <th className="text-right p-3">إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {db.employees.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="p-8 text-center text-muted-foreground"
                >
                  لا يوجد موظفون — أضف أول كاشير للبدء.
                </td>
              </tr>
            ) : (
              db.employees.map((e) => (
                <tr key={e.id} className="border-t border-border">
                  <td className="p-3 font-medium">{e.name}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${e.role === "كاشير" ? "bg-primary/10 text-primary" : "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"}`}
                    >
                      {e.role}
                    </span>
                  </td>
                  <td className="p-3 font-mono">
                    <div className="flex items-center gap-2">
                      <span className="tracking-widest">
                        {revealed[e.id] ? revealed[e.id] : "####"}
                      </span>
                      <button
                        onClick={() => toggleEye(e.id)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        {revealed[e.id] ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      <button
                        onClick={() => setEditing(e)}
                        className="p-1.5 rounded hover:bg-secondary"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`حذف ${e.name}؟`)) {
                            deleteEmployee(e.id);
                            toast.success("تم الحذف");
                          }
                        }}
                        className="p-1.5 rounded hover:bg-destructive/10 text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <PinPrompt
        open={pinFor !== null}
        title="عرض كلمة السر"
        description="أدخل كلمة مرور المسؤول لعرض الكود السري للموظف."
        onClose={() => setPinFor(null)}
        onSuccess={() => {
          if (pinFor)
            setRevealed((r) => ({ ...r, [pinFor]: "(تم التحقق — مُشفّر)" }));
          setPinFor(null);
        }}
      />

      {editing && (
        <EmployeeDialog
          employee={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSave={async (data) => {
            if (editing === "new") {
              await addEmployee(data.name, data.role, data.pin!);
              toast.success("تم إضافة الموظف");
            } else {
              await updateEmployee((editing as Employee).id, {
                name: data.name,
                role: data.role,
                newPin: data.pin || undefined,
              });
              toast.success("تم التحديث");
            }
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function EmployeeDialog({
  employee,
  onClose,
  onSave,
}: {
  employee: Employee | null;
  onClose: () => void;
  onSave: (d: { name: string; role: EmployeeRole; pin?: string }) => void;
}) {
  const [name, setName] = useState(employee?.name || "");
  const [role, setRole] = useState<EmployeeRole>(employee?.role || "كاشير");
  const [pin, setPin] = useState("");
  const [pin2, setPin2] = useState("");
  const [err, setErr] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    if (!name.trim()) return setErr("اسم الموظف مطلوب");
    if (!employee && (!pin || pin.length < 4))
      return setErr("كلمة السر يجب أن تكون 4 خانات على الأقل");
    if (pin && pin !== pin2) return setErr("كلمة السر غير متطابقة");
    onSave({ name, role, pin: pin || undefined });
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent dir="rtl" className="max-w-md">
        <DialogHeader>
          <DialogTitle>{employee ? "تعديل موظف" : "إضافة موظف"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <label className="text-xs font-medium">اسم الموظف</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium">الوظيفة</label>
            <div className="flex gap-2 mt-1">
              {(["كاشير", "كابتن صالة"] as EmployeeRole[]).map((r) => (
                <button
                  type="button"
                  key={r}
                  onClick={() => setRole(r)}
                  className={`flex-1 h-9 rounded-md text-sm ${role === r ? "bg-primary text-primary-foreground" : "bg-secondary"}`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-medium">
              {employee ? "كلمة سر جديدة (اختياري)" : "كلمة السر"}
            </label>
            <Input
              type="password"
              inputMode="numeric"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/^-+/, ""))}
            />
          </div>
          <div>
            <label className="text-xs font-medium">تأكيد كلمة السر</label>
            <Input
              type="password"
              inputMode="numeric"
              value={pin2}
              onChange={(e) => setPin2(e.target.value.replace(/^-+/, ""))}
            />
          </div>
          {err && <p className="text-xs text-destructive">{err}</p>}
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              إلغاء
            </Button>
            <Button type="submit">حفظ</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
