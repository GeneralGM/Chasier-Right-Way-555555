import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { u as usePosDB } from "./pos-store-DecAwJl2.js";
import { A as ActionGate, B as Button, D as Dialog, a as DialogContent, b as DialogHeader, d as DialogTitle, I as Input, e as DialogFooter, g as getApiUrl } from "./router-CvLZBAlt.js";
import { P as PinPrompt } from "./PinPrompt-G0e8UScH.js";
import { Fingerprint, Plus, Users, ShieldAlert, EyeOff, Eye, Lock, Pencil, Trash2 } from "lucide-react";
import "js-sha256";
import "@tanstack/react-query";
import "@tanstack/react-router";
import "@radix-ui/react-dialog";
import "clsx";
import "tailwind-merge";
import "@radix-ui/react-slot";
import "class-variance-authority";
const API_URL = getApiUrl();
const API_BASE_URL = `http://${API_URL}:5000`;
const ROLE_WEIGHTS = {
  مالك: 5,
  owner: 5,
  مبرمج: 4,
  developer: 4,
  مدير: 3,
  manager: 3,
  محاسب: 2,
  accountant: 2,
  كاشير: 1,
  cashier: 1,
  "كابتن صالة": 1,
  waiter: 1
};
function RolesPage() {
  const {
    db,
    addEmployee,
    updateEmployee,
    deleteEmployee
  } = usePosDB();
  const [revealed, setRevealed] = useState({});
  const [pinFor, setPinFor] = useState(null);
  const [editing, setEditing] = useState(null);
  const [currentOperator, setCurrentOperator] = useState(null);
  const [activeTab, setActiveTab] = useState("staff");
  const [serverEmployees, setServerEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    async function fetchEmployeesFromPostgres() {
      try {
        setIsLoading(true);
        const response = await fetch(`http://${API_URL}:5000/api/employees`);
        if (response.ok) {
          const data = await response.json();
          setServerEmployees(data);
        }
      } catch (error) {
        console.error("❌ خطأ أثناء جلب الموظفين من pgAdmin:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchEmployeesFromPostgres();
  }, []);
  const employeesList = useMemo(() => {
    const map = /* @__PURE__ */ new Map();
    db.employees.forEach((e) => map.set(e.name, e));
    serverEmployees.forEach((e) => map.set(e.name, e));
    return Array.from(map.values());
  }, [serverEmployees, db.employees]);
  const displayedEmployees = employeesList.filter((e) => {
    if (activeTab === "staff") {
      return e.role === "كاشير" || e.role === "كابتن صالة" || e.role === "cashier";
    } else {
      return e.role === "محاسب" || e.role === "مدير" || e.role === "مبرمج" || e.role === "مالك" || e.role === "accountant" || e.role === "manager" || e.role === "developer" || e.role === "owner";
    }
  });
  function hidePassword(id) {
    const c = {
      ...revealed
    };
    delete c[id];
    setRevealed(c);
  }
  function showPassword(id) {
    setRevealed({
      ...revealed,
      [id]: true
    });
  }
  const handleSaveEmployee = async (data) => {
    try {
      if (editing === "new") {
        const response = await fetch(`${API_BASE_URL}/api/employees`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            name: data.name,
            role: data.role,
            pin: data.pin
            // 🌟 بعتنا الحقل باسم pin عشان السيرفر يفهمه صح كباسوورد صافي
          })
        });
        if (response.ok) {
          const savedEmp = await response.json();
          await addEmployee(savedEmp.name, savedEmp.role, savedEmp.pin);
          setServerEmployees((prev) => {
            const exists = prev.some((emp) => emp.name === savedEmp.name);
            if (exists) {
              return prev.map((emp) => emp.name === savedEmp.name ? savedEmp : emp);
            }
            return [...prev, savedEmp];
          });
          toast.success("تم إضافة الموظف الجديد في السيرفر والكاش بنجاح");
        } else {
          const errorData = await response.json().catch(() => ({}));
          toast.error(errorData.message || "فشل إضافة الموظف في السيرفر");
        }
      } else {
        const empId = editing.id;
        const response = await fetch(`${API_BASE_URL}/api/employees/${empId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            name: data.name,
            role: data.role,
            pinHash: data.pin || void 0
            // يرسل البين الجديد لو الموظف كتب باسوورد جديد
          })
        });
        if (response.ok) {
          const updatedEmpFromServer = await response.json();
          await updateEmployee(empId, {
            name: data.name,
            role: data.role,
            newPin: data.pin || void 0
          });
          setServerEmployees((prev) => prev.map((emp) => emp.id === empId ? updatedEmpFromServer : emp));
          toast.success("تم تحديث بيانات الموظف في قاعدة البيانات");
        } else {
          const errorData = await response.json().catch(() => ({}));
          toast.error(errorData.message || "فشل تحديث الموظف في السيرفر");
        }
      }
    } catch (err) {
      console.error("Error saving employee:", err);
      toast.error("خطأ في الاتصال بالسيرفر الرئيسي");
    } finally {
      setEditing(null);
      setCurrentOperator(null);
    }
  };
  const handleDeleteEmployee = async (empId) => {
    try {
      const targetEmp = employeesList.find((e) => e.id === empId);
      const response = await fetch(`${API_BASE_URL}/api/employees/${empId}`, {
        method: "DELETE"
      });
      if (response.ok) {
        await deleteEmployee(empId);
        setServerEmployees((prev) => prev.filter((emp) => emp.id !== empId && (targetEmp ? emp.name !== targetEmp.name : true)));
        toast.success("تم حذف الموظف نهائياً واختفائه من الشاشة");
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.message || "فشل حذف الموظف من السيرفر");
      }
    } catch (err) {
      console.error("Error deleting employee:", err);
      toast.error("خطأ في الاتصال بالسيرفر");
    }
  };
  return /* @__PURE__ */ jsxs("div", { dir: "rtl", className: "space-y-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("h1", { className: "text-2xl font-bold flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Fingerprint, { className: "w-6 h-6" }),
          " إدارة الصلاحيات"
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground mt-1", children: "إدارة صلاحيات التشغيل والإدارة والأكواد السرية." })
      ] }),
      /* @__PURE__ */ jsx(ActionGate, { requiredRole: "محاسب", actionName: "إضافة موظف جديد", onSuccess: (operator) => {
        setCurrentOperator(operator);
        setEditing("new");
      }, children: /* @__PURE__ */ jsxs(Button, { className: "gap-2", children: [
        /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4" }),
        " إضافة موظف"
      ] }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex gap-2 p-1 bg-secondary/30 rounded-lg w-fit", children: [
      /* @__PURE__ */ jsxs("button", { onClick: () => setActiveTab("staff"), className: `flex items-center gap-2 px-6 py-2 rounded-md text-sm font-medium transition-all ${activeTab === "staff" ? "bg-primary text-primary-foreground shadow" : "hover:bg-secondary"}`, children: [
        /* @__PURE__ */ jsx(Users, { className: "w-4 h-4" }),
        "التشغيل (كاشير و كابتن)"
      ] }),
      /* @__PURE__ */ jsx(ActionGate, { requiredRole: "محاسب", actionName: "فتح بيانات الإدارة", onSuccess: () => setActiveTab("management"), children: /* @__PURE__ */ jsxs("button", { className: `flex items-center gap-2 px-6 py-2 rounded-md text-sm font-medium transition-all ${activeTab === "management" ? "bg-primary text-primary-foreground shadow" : "hover:bg-secondary"}`, children: [
        /* @__PURE__ */ jsx(ShieldAlert, { className: "w-4 h-4" }),
        "الإدارة العليا (محاسب ومدير)"
      ] }) })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "bg-card border border-border rounded-xl overflow-hidden", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
      /* @__PURE__ */ jsx("thead", { className: "bg-secondary/50 text-xs", children: /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("th", { className: "text-right p-3", children: "اسم الموظف" }),
        /* @__PURE__ */ jsx("th", { className: "text-right p-3", children: "الوظيفة" }),
        /* @__PURE__ */ jsx("th", { className: "text-right p-3", children: "كلمة السر" }),
        /* @__PURE__ */ jsx("th", { className: "text-right p-3", children: "إجراءات" })
      ] }) }),
      /* @__PURE__ */ jsx("tbody", { children: isLoading ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 4, className: "p-8 text-center text-amber-600 font-medium animate-pulse", children: "جاري جلب الموظفين من قاعدة البيانات (pgAdmin)..." }) }) : displayedEmployees.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 4, className: "p-8 text-center text-muted-foreground", children: "لا يوجد موظفون في هذا القسم." }) }) : displayedEmployees.map((e) => /* @__PURE__ */ jsxs("tr", { className: "border-t border-border", children: [
        /* @__PURE__ */ jsx("td", { className: "p-3 font-medium", children: e.name }),
        /* @__PURE__ */ jsx("td", { className: "p-3", children: /* @__PURE__ */ jsx("span", { className: `px-2 py-0.5 rounded text-xs ${e.role === "كاشير" || e.role === "كابتن صالة" ? "bg-primary/10 text-primary" : "bg-red-100 text-red-700 font-bold"}`, children: e.role }) }),
        /* @__PURE__ */ jsx("td", { className: "p-3 font-mono", children: /* @__PURE__ */ jsx("div", { className: "flex items-center gap-2", children: e.role === "مبرمج" || e.role === "developer" || e.role === "مالك" || e.role === "owner" ? /* @__PURE__ */ jsx("span", { className: "tracking-widest text-muted-foreground/60 selection:bg-transparent", children: "••••" }) : /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx("span", { className: "tracking-widest", children: revealed[e.id] ? e.pin || e.pin_hash || "####" : "####" }),
          revealed[e.id] ? (
            // 1. لو الباسوورد ظاهر أصلاً -> زرار عادي للإخفاء بدون طلب باسوورد
            /* @__PURE__ */ jsx("button", { onClick: () => hidePassword(e.id), className: "text-muted-foreground hover:text-foreground", title: "إخفاء الرقم السري", children: /* @__PURE__ */ jsx(EyeOff, { className: "w-4 h-4" }) })
          ) : (
            // 2. لو الباسوورد مخفي -> زرار محمي بـ ActionGate للإظهار
            /* @__PURE__ */ jsx(ActionGate, { requiredRole: "محاسب", actionName: "إظهار الرقم السري للموظف", onSuccess: () => showPassword(e.id), children: /* @__PURE__ */ jsx("button", { className: "text-muted-foreground hover:text-foreground", title: "إظهار الرقم السري", children: /* @__PURE__ */ jsx(Eye, { className: "w-4 h-4" }) }) })
          )
        ] }) }) }),
        /* @__PURE__ */ jsx("td", { className: "p-3", children: e.role === "مبرمج" || e.role === "developer" || e.role === "مالك" || e.role === "owner" ? /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground flex items-center gap-1 font-medium text-amber-600 selection:bg-transparent", children: [
          /* @__PURE__ */ jsx(Lock, { className: "w-3 h-3" }),
          " نظام محمي"
        ] }) : /* @__PURE__ */ jsxs("div", { className: "flex gap-1", children: [
          /* @__PURE__ */ jsx(ActionGate, { requiredRole: "محاسب", actionName: `تعديل بيانات الموظف: ${e.name}`, onSuccess: (operator) => {
            setCurrentOperator(operator);
            setTimeout(() => {
              setEditing(e);
            }, 150);
          }, children: /* @__PURE__ */ jsx("button", { className: "p-1.5 rounded hover:bg-secondary text-blue-600", children: /* @__PURE__ */ jsx(Pencil, { className: "w-4 h-4" }) }) }),
          /* @__PURE__ */ jsx(ActionGate, { requiredRole: "محاسب", actionName: `حذف الموظف: ${e.name} نهائياً`, onSuccess: () => {
            handleDeleteEmployee(e.id);
          }, children: /* @__PURE__ */ jsx("button", { className: "p-1.5 rounded hover:bg-secondary text-destructive", children: /* @__PURE__ */ jsx(Trash2, { className: "w-4 h-4" }) }) })
        ] }) })
      ] }, e.id)) })
    ] }) }),
    /* @__PURE__ */ jsx(PinPrompt, { open: pinFor !== null, title: "عرض كلمة السر", description: "أدخل كلمة مرور المسؤول لعرض الكود السري للموظف.", onClose: () => setPinFor(null), onSuccess: () => {
      if (pinFor) setRevealed((r) => ({
        ...r,
        [pinFor]: true
      }));
      setPinFor(null);
    }, onCancel: () => setPinFor(null) }),
    editing && /* @__PURE__ */ jsx(
      EmployeeDialog,
      {
        employee: editing === "new" ? null : editing,
        activeTab,
        operator: currentOperator,
        onClose: () => {
          setEditing(null);
          setCurrentOperator(null);
        },
        onSave: handleSaveEmployee
      }
    )
  ] });
}
function EmployeeDialog({
  employee,
  activeTab,
  operator,
  onClose,
  onSave
}) {
  const [name, setName] = useState(employee?.name || "");
  const operatorWeight = ROLE_WEIGHTS[operator?.role || "مبرمج"] || 4;
  const baseRoles = activeTab === "staff" ? ["كاشير", "كابتن صالة"] : ["محاسب", "مدير"];
  const availableRoles = baseRoles.filter((r) => (ROLE_WEIGHTS[r] || 0) <= operatorWeight);
  const [role, setRole] = useState(employee?.role || availableRoles[0]);
  const [pin, setPin] = useState("");
  const [pin2, setPin2] = useState("");
  const [err, setErr] = useState("");
  function submit(e) {
    e.preventDefault();
    setErr("");
    if (!name.trim()) return setErr("اسم الموظف مطلوب");
    if (!employee && (!pin || pin.length < 4)) return setErr("كلمة السر يجب أن تكون 4 خانات على الأقل");
    if (pin && pin !== pin2) return setErr("كلمة السر غير متطابقة");
    if ((ROLE_WEIGHTS[role] || 0) > operatorWeight) {
      return setErr("خطأ أمني: لا يمكنك تعيين رتبة أعلى من صلاحياتك الحالية!");
    }
    onSave({
      name,
      role,
      pin: pin || void 0
    });
  }
  return /* @__PURE__ */ jsx(Dialog, { open: true, onOpenChange: (o) => !o && onClose(), children: /* @__PURE__ */ jsxs(DialogContent, { dir: "rtl", className: "max-w-md", children: [
    /* @__PURE__ */ jsx(DialogHeader, { children: /* @__PURE__ */ jsx(DialogTitle, { children: employee ? "تعديل موظف" : "إضافة موظف" }) }),
    /* @__PURE__ */ jsxs("form", { onSubmit: submit, className: "space-y-3", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "text-xs font-medium", children: "اسم الموظف" }),
        /* @__PURE__ */ jsx(Input, { value: name, onChange: (e) => setName(e.target.value) })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "text-xs font-medium", children: "الوظيفة المتاحة برتبتك" }),
        /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2 mt-1", children: availableRoles.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-xs text-destructive font-medium", children: "ليس لديك صلاحية لإضافة موظفين في هذا القسم." }) : availableRoles.map((r) => /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setRole(r), className: `flex-1 min-w-[80px] h-9 rounded-md text-sm transition-colors ${role === r ? "bg-primary text-primary-foreground font-bold" : "bg-secondary hover:bg-secondary/80"}`, children: r }, r)) })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "text-xs font-medium", children: employee ? "كلمة سر جديدة (اختياري)" : "كلمة السر" }),
        /* @__PURE__ */ jsx(Input, { type: "password", inputMode: "numeric", value: pin, onChange: (e) => setPin(e.target.value.replace(/^-+/, "")) })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "text-xs font-medium", children: "تأكيد كلمة السر" }),
        /* @__PURE__ */ jsx(Input, { type: "password", inputMode: "numeric", value: pin2, onChange: (e) => setPin2(e.target.value.replace(/^-+/, "")) })
      ] }),
      err && /* @__PURE__ */ jsx("p", { className: "text-xs text-destructive font-medium", children: err }),
      /* @__PURE__ */ jsxs(DialogFooter, { className: "gap-2", children: [
        /* @__PURE__ */ jsx(Button, { type: "button", variant: "outline", onClick: onClose, children: "إلغاء" }),
        /* @__PURE__ */ jsx(Button, { type: "submit", disabled: availableRoles.length === 0, children: "حفظ" })
      ] })
    ] })
  ] }) });
}
export {
  RolesPage as component
};
