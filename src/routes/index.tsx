import { createFileRoute, Link } from "@tanstack/react-router";
import { useDB } from "@/lib/store";
import {
  Package,
  AlertTriangle,
  TrendingUp,
  ArrowDownToLine,
  ArrowUpFromLine,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "لوحة التحكم - نظام المخزون" },
      {
        name: "description",
        content: "نظرة عامة على المخزون وتنبيهات نقص الأصناف.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { db } = useDB();
  const items = db.items;
  const lowStock = items.filter((i) => i.qty <= i.critical);
  const totalValue = items.reduce((s, i) => s + i.qty * i.avgPrice, 0);

  const stats = [
    {
      label: "إجمالي الأصناف",
      value: items.length,
      icon: Package,
      color: "bg-primary/10 text-primary",
    },
    {
      label: "تنبيهات نقص المخزون",
      value: lowStock.length,
      icon: AlertTriangle,
      color: "bg-destructive/10 text-destructive",
    },
    {
      label: "إجمالي قيمة المخزون",
      value: totalValue.toFixed(2) + " ج.م",
      icon: TrendingUp,
      color: "bg-success/10 text-success",
    },
    {
      label: "إجمالي الأذونات",
      value: db.vouchers.length,
      icon: ArrowDownToLine,
      color: "bg-accent text-accent-foreground",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">لوحة التحكم</h1>
        <p className="text-sm text-muted-foreground mt-1">
          نظرة عامة على حالة المخزون
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="bg-card border border-border rounded-xl p-4"
            >
              <div
                className={`w-10 h-10 rounded-lg grid place-items-center ${s.color} mb-3`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {s.label}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              تنبيهات نقص المخزون
            </h2>
            <Link
              to="/inventory"
              className="text-xs text-primary hover:underline"
            >
              عرض المخزون
            </Link>
          </div>
          {lowStock.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              لا توجد تنبيهات. جميع الأصناف بكميات كافية ✓
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="text-right py-2 font-medium">اسم الصنف</th>
                    <th className="text-right py-2 font-medium">
                      الكمية الحالية
                    </th>
                    <th className="text-right py-2 font-medium">
                      النقطة الحرجة
                    </th>
                    <th className="text-right py-2 font-medium">الوحدة</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStock.map((i) => (
                    <tr
                      key={i.id}
                      className="border-b border-border/50 bg-destructive/5"
                    >
                      <td className="py-2 font-medium">{i.name}</td>
                      <td className="py-2 text-destructive font-bold">
                        {i.qty}
                      </td>
                      <td className="py-2">{i.critical}</td>
                      <td className="py-2 text-muted-foreground">{i.unit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="font-bold text-lg mb-4">إجراءات سريعة</h2>
          <div className="space-y-2">
            <Link
              to="/entry"
              className="flex items-center gap-3 p-3 rounded-lg bg-secondary hover:bg-secondary/70 transition"
            >
              <ArrowDownToLine className="w-5 h-5 text-primary" />
              <span className="font-medium text-sm">إذن توريد جديد</span>
            </Link>
            <Link
              to="/issue"
              className="flex items-center gap-3 p-3 rounded-lg bg-secondary hover:bg-secondary/70 transition"
            >
              <ArrowUpFromLine className="w-5 h-5 text-primary" />
              <span className="font-medium text-sm">إذن صرف جديد</span>
            </Link>
            <Link
              to="/inventory"
              className="flex items-center gap-3 p-3 rounded-lg bg-secondary hover:bg-secondary/70 transition"
            >
              <Package className="w-5 h-5 text-primary" />
              <span className="font-medium text-sm">إدارة المخزون</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
