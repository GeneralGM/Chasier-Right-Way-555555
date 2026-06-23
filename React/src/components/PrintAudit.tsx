import type { SubDept, Item, Meal } from "@/lib/store";

export function PrintAuditSheet({
  date, department, items, mealsCount,
}: {
  date: string;
  department: SubDept;
  items: { item: Item; expected: number }[];
  mealsCount: number;
}) {
  return (
    <div className="print-voucher">
      <div className="text-center border-b border-black pb-2 mb-2">
        <h1 className="text-base font-bold">ورقة الجرد اليدوي — قسم {department}</h1>
        <div className="text-xs">التاريخ: {date} • عدد الأصناف: {items.length} • عدد الوجبات بالقسم: {mealsCount}</div>
      </div>
      <table className="print-table w-full">
        <thead>
          <tr>
            <th style={{ width: "26px" }}>#</th>
            <th style={{ width: "60px" }}>الكود</th>
            <th>اسم الصنف</th>
            <th style={{ width: "50px" }}>الوحدة</th>
            <th style={{ width: "30px" }}>تم</th>
            <th style={{ width: "110px" }}>الكمية الفعلية</th>
          </tr>
        </thead>
        <tbody>
          {items.map((r, i) => (
            <tr key={r.item.id}>
              <td>{i + 1}</td>
              <td style={{ fontFamily: "monospace" }}>{r.item.code}</td>
              <td>{r.item.name}</td>
              <td>{r.item.unit}</td>
              <td style={{ textAlign: "center" }}>◯</td>
              <td>[&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;]</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="flex justify-between mt-4 text-xs">
        <div>اسم القائم بالجرد: ____________</div>
        <div>التوقيع: ____________</div>
      </div>
    </div>
  );
}

export function MealsByDept(meals: Meal[], dept: SubDept) {
  return meals.filter((m) => m.department === dept);
}
