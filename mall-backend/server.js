// 1. استدعاء المكتبات الأساسية
import express from "express";
import cors from "cors";
import pg from "pg";
const { Pool } = pg;
import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();

// إعداد الاتصال بقاعدة البيانات PostgreSQL
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "mall_erp",
  password: "123456", // الباسورد الخاص بك
  port: 5432,
});

// اختبار الاتصال بقاعدة البيانات للتأكد من نجاحه
pool.connect((err, client, release) => {
  if (err) {
    return console.error("❌ فشل الاتصال بقاعدة البيانات:", err.stack);
  }
  console.log("🚀 تم الاتصال بقاعدة البيانات PostgreSQL بنجاح يا بطل!");
  release();
});

// 2. إنشاء وتجهيز السيرفر
const app = express();

// 3. تشغيل حارس الأمن (CORS) للسماح للـ React بالتواصل مع السيرفر
app.use(cors());

// 4. تفعيل قراءة البيانات القادمة بصيغة JSON
app.use(express.json());

// ==========================================
// 5. الروابط والمسارات (Routes)
// ==========================================

// رابط تجريبي للمعاينة الأساسية
app.get("/", (req, res) => {
  res.send("مرحباً بك في سيرفر إدارة المول! 🚀");
});

app.get("/api/test", (req, res) => {
  res.json({
    message: "تم الاتصال بالباك إند بنجاح!",
    status: "success",
  });
});

// --- مسارات الموظفين (Employees) ---

// إضافة موظف جديد وضمان السماع في الداتابيز مهما كانت مسميات الفرونت إند
app.post("/api/employees", async (req, res) => {
  console.log("📥 بيانات الموظف الجديد وصلت للسيرفر:", req.body);

  const { name, role } = req.body;
  // 🌟 لقط الباسورد مهما كان اسمه القادم من الفرونت إند (pinHash أو pin أو password)
  const pinHash = req.body.pinHash || req.body.pin || req.body.password || "";
  const id = req.body.id || crypto.randomUUID();

  // لو الاسم أو الباسورد فاضي متسجلش واقفل عشان الداتابيز متزعلش
  if (!name || !pinHash) {
    console.error("❌ فشل الإضافة: الاسم أو الباسورد ناقصين!");
    return res.status(400).json({ error: "الاسم والرقم السري مطلوبان" });
  }

  try {
    const query = `
      INSERT INTO employees (id, name, role, pin_hash) 
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, role, pin_hash AS "pinHash"
    `;

    const result = await pool.query(query, [
      id,
      name,
      role || "cashier",
      pinHash,
    ]);
    console.log("✅ تم حفظ الموظف بنجاح في pgAdmin:", result.rows[0]);

    // إرسال الاستجابة مطابقة للفرونت إند بكل الطرق الممكنة لمنع الـ Errors
    const savedEmp = result.rows[0];
    res.status(201).json({
      id: savedEmp.id,
      name: savedEmp.name,
      role: savedEmp.role,
      pinHash: savedEmp.pinHash,
      pin: savedEmp.pinHash, // احتياطي لو الفرونت إند بيدور على pin
    });
  } catch (err) {
    console.error("❌ خطأ قاتل أثناء إضافة موظف في pgAdmin:", err.message);
    res
      .status(500)
      .json({ error: "حدث خطأ في قاعدة البيانات", details: err.message });
  }
});
// جلب كل الموظفين بالباسورد الظاهر بتاعهم
app.get("/api/employees", async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, role, pin_hash AS "pinHash" FROM employees',
    );
    res.json(result.rows);
  } catch (err) {
    console.error("❌ خطأ في جلب البيانات:", err);
    res.status(500).json({ error: "خطأ في جلب البيانات" });
  }
});

// ==========================================
// 📄 مسارات الفواتير (Invoices) - متضمنة عمود التوصيل الحقيقي
// ==========================================

// 1. حفظ فاتورة جديدة داخل قاعدة البيانات (نسخة معدلة ومطابقة للفرونت إند)
app.post("/api/invoices", async (req, res) => {
  console.log("📥 فاتورة جديدة وصلت للسيرفر وجاري حفظها في pgAdmin:", req.body);

  const {
    id,
    type,
    invoiceNumber,
    tableCode,
    zone,
    customerName,
    customerAddress,
    cashierId,
    cashierName,
    items,
    subtotal,
    discountPct,
    discountValue,
    taxPct,
    taxValue,
    deliveryPrice,
    total,
    createdAt,
  } = req.body;

  try {
    const query = `
      INSERT INTO invoices (
        id, type, invoice_number, table_code, zone, 
        customer_name, customer_address, cashier_id, cashier_name, 
        items, subtotal, discount_pct, discount_value, tax_pct, tax_value, 
        delivery_price, total, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *
    `;

    const result = await pool.query(query, [
      id,
      type,
      invoiceNumber,
      tableCode,
      zone || null,
      customerName || null,
      customerAddress || null,
      cashierId || null,
      cashierName || null,
      JSON.stringify(items),
      subtotal,
      discountPct,
      discountValue,
      taxPct,
      taxValue,
      Number(deliveryPrice) || 0,
      total,
      new Date(createdAt),
    ]);

    console.log(
      "✅ تم الحفظ بنجاح في قاعدة البيانات برقم معرف:",
      result.rows[0].id,
    );

    // 🌟 التعديل السحري: تحويل وتجهيز البيانات العائدة لتطابق الـ camelCase والـ Timestamp للفرونت إند فوراً
    const inv = result.rows[0];
    const mappedResponse = {
      id: inv.id,
      invoiceNumber: Number(inv.invoice_number),
      type: inv.type,
      tableCode: inv.table_code,
      zone: inv.zone,
      customerName: inv.customer_name,
      customerAddress: inv.customer_address,
      cashierId: inv.cashier_id,
      cashierName: inv.cashier_name,
      items: typeof inv.items === "string" ? JSON.parse(inv.items) : inv.items,
      subtotal: Number(inv.subtotal),
      discountPct: Number(inv.discount_pct),
      discountValue: Number(inv.discount_value),
      taxPct: Number(inv.tax_pct),
      taxValue: Number(inv.tax_value),
      deliveryPrice: Number(inv.delivery_price || 0),
      total: Number(inv.total),
      createdAt: inv.created_at
        ? new Date(inv.created_at).getTime()
        : Date.now(),
    };

    res.status(201).json(mappedResponse);
  } catch (err) {
    console.error("❌ خطأ قاتل أثناء الحفظ في pgAdmin:", err.message);
    res
      .status(500)
      .json({ error: "حدث خطأ أثناء حفظ الفاتورة", details: err.message });
  }
});

// 2. جلب الفواتير وقراءة عمود التوصيل وإرساله للتقارير والفرونت إند
app.get("/api/invoices", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM invoices ORDER BY created_at DESC",
    );

    const invoices = result.rows.map((inv) => ({
      id: inv.id,
      invoiceNumber: Number(inv.invoice_number),
      type: inv.type,
      tableCode: inv.table_code,
      zone: inv.zone,
      customerName: inv.customer_name,
      customerAddress: inv.customer_address,
      cashierId: inv.cashier_id,
      cashierName: inv.cashier_name,
      items: typeof inv.items === "string" ? JSON.parse(inv.items) : inv.items,
      subtotal: Number(inv.subtotal),
      discountPct: Number(inv.discount_pct),
      discountValue: Number(inv.discount_value),
      taxPct: Number(inv.tax_pct),
      taxValue: Number(inv.tax_value),
      deliveryPrice: Number(inv.delivery_price || 0), // 🌟 قراءة العمود المخصص من الداتابيز وتحويله لرقم آمن
      total: Number(inv.total),
      createdAt: inv.created_at
        ? new Date(inv.created_at).getTime()
        : Date.now(), // تحويل الوقت الزمني لـ Timestamp رقمي عشان حسابات التقارير تفهمه
    }));

    res.json(invoices);
  } catch (err) {
    console.error("❌ خطأ في جلب الفواتير:", err);
    res.status(500).json({ error: "حدث خطأ أثناء جلب الفواتير" });
  }
});

// ==========================================
// 🕒 مسارات الورديات (Shifts)
// ==========================================
app.post("/api/shifts", async (req, res) => {
  const {
    cashierId,
    cashierName,
    openedAt,
    closedAt,
    kitchenSales,
    barSales,
    shishaSales,
    taxValue,
    discountValue,
    dineinSales,
    takeawaySales,
    deliverySales,
  } = req.body;

  try {
    // 🧮 تطبيق معادلتك المحاسبية: (مطبخ + بار + شيشة + قيمة مضافة) - الخصم
    const totalRevenue =
      (Number(kitchenSales) || 0) +
      (Number(barSales) || 0) +
      (Number(shishaSales) || 0) +
      (Number(taxValue) || 0) -
      (Number(discountValue) || 0);

    const query = `
      INSERT INTO shifts (
        id, cashier_id, cashier_name, opened_at, closed_at,
        kitchen_sales, bar_sales, shisha_sales, tax_value, discount_value, total_revenue,
        dinein_sales, takeaway_sales, delivery_sales
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `;

    const result = await pool.query(query, [
      crypto.randomUUID(),
      cashierId,
      cashierName,
      openedAt,
      closedAt || Date.now(),
      kitchenSales || 0,
      barSales || 0,
      shishaSales || 0,
      taxValue || 0,
      discountValue || 0,
      totalRevenue,
      dineinSales || 0,
      takeawaySales || 0,
      deliverySales || 0,
    ]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("❌ خطأ في حفظ الشفت بالداتابيز:", err);
    res.status(500).json({ error: "حدث خطأ أثناء حفظ الوردية" });
  }
});

// 1. جلب كل الورديات (Shifts) من قاعدة البيانات
app.get("/api/shifts", async (req, res) => {
  try {
    // تأكد من أن اسم الجدول عندك هو shifts أو عدله للاسم الصحيح في pgAdmin
    const result = await pool.query(
      "SELECT * FROM shifts ORDER BY opened_at DESC",
    );

    // تحويل الأسماء من snake_case (قاعدة البيانات) إلى camelCase (الفرونت إند) لو لزم الأمر
    const formattedShifts = result.rows.map((row) => ({
      id: row.id,
      cashierName: row.cashier_name || row.cashierName,
      openedAt: Number(row.opened_at || row.openedAt),
      closedAt:
        row.closed_at || row.closedAt
          ? Number(row.closed_at || row.closedAt)
          : null,
      status: row.status,
    }));

    res.json(formattedShifts);
  } catch (err) {
    console.error("Error fetching shifts:", err);
    res.status(500).json({ error: "حدث خطأ أثناء جلب الورديات" });
  }
});

// 2. جلب كل الفواتير (Invoices) من قاعدة البيانات
app.get("/api/invoices", async (req, res) => {
  try {
    // تأكد من أن اسم جدول الفواتير هو invoices
    const result = await pool.query(
      "SELECT * FROM invoices ORDER BY created_at DESC",
    );

    const formattedInvoices = result.rows.map((row) => ({
      id: row.id,
      invoiceNumber: row.invoice_number || row.invoiceNumber,
      createdAt: Number(row.created_at || row.createdAt),
      type: row.type, // takeaway, dinein, delivery
      tableCode: row.table_code || row.tableCode,
      customerName: row.customer_name || row.customerName,
      customerAddress: row.customer_address || row.customerAddress,
      cashierName: row.cashier_name || row.cashierName,
      subtotal: Number(row.subtotal || 0),
      discountValue: Number(row.discount_value || row.discountValue || 0),
      discountPct: Number(row.discount_pct || row.discountPct || 0),
      taxValue: Number(row.tax_value || row.taxValue || 0),
      deliveryPrice: Number(row.delivery_price || row.deliveryPrice || 0),
      total: Number(row.total || 0),
      // إذا كانت الأصناف مخزنة كـ JSON في قاعدة البيانات
      items:
        typeof row.items === "string" ? JSON.parse(row.items) : row.items || [],
    }));

    res.json(formattedInvoices);
  } catch (err) {
    console.error("Error fetching invoices:", err);
    res.status(500).json({ error: "حدث خطأ أثناء جلب الفواتير" });
  }
});

// ==========================================
// 📦 مسارات المخزون الرئيسي (Inventory Items)
// ==========================================

// 1. إضافة صنف جديد للمخزن
app.post("/api/inventory", async (req, res) => {
  const {
    id,
    code,
    name,
    department,
    unit,
    qty,
    avgPrice,
    critical,
    conversionFactor,
    subUnitQty,
    subUnitType,
    kind,
    yieldDef,
    notes,
  } = req.body;

  try {
    const query = `
      INSERT INTO inventory_items (
        id, code, name, department, unit, qty, avg_price, critical, 
        conversion_factor, sub_unit_qty, sub_unit_type, kind, yield_def, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `;
    const result = await pool.query(query, [
      id,
      code,
      name,
      department || "",
      unit,
      qty,
      avgPrice,
      critical,
      conversionFactor,
      subUnitQty || null,
      subUnitType || null,
      kind,
      yieldDef ? JSON.stringify(yieldDef) : null,
      notes || null,
    ]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("❌ خطأ في إضافة صنف للمخزن:", err);
    res.status(500).json({ error: "حدث خطأ أثناء حفظ الصنف" });
  }
});

// 2. جلب كل أصناف المخزن الرئيسي
app.get("/api/inventory", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM inventory_items ORDER BY created_at DESC",
    );

    // تحويل الأسماء للـ Frontend
    const items = result.rows.map((row) => ({
      id: row.id,
      code: row.code,
      name: row.name,
      department: row.department,
      unit: row.unit,
      qty: Number(row.qty),
      avgPrice: Number(row.avg_price),
      critical: Number(row.critical),
      conversionFactor: Number(row.conversion_factor),
      subUnitQty: row.sub_unit_qty ? Number(row.sub_unit_qty) : undefined,
      subUnitType: row.sub_unit_type,
      kind: row.kind,
      yieldDef:
        typeof row.yield_def === "string"
          ? JSON.parse(row.yield_def)
          : row.yield_def,
      notes: row.notes,
    }));

    res.json(items);
  } catch (err) {
    console.error("❌ خطأ في جلب المخزن:", err);
    res.status(500).json({ error: "حدث خطأ أثناء جلب الأصناف" });
  }
});

// 3. تعديل صنف موجود (Update)
app.put("/api/inventory/:id", async (req, res) => {
  const { id } = req.params;
  const {
    name,
    qty,
    avgPrice,
    critical,
    conversionFactor,
    subUnitQty,
    subUnitType,
    yieldDef,
    notes,
  } = req.body;

  try {
    const query = `
      UPDATE inventory_items SET 
        name = COALESCE($1, name),
        qty = COALESCE($2, qty),
        avg_price = COALESCE($3, avg_price),
        critical = COALESCE($4, critical),
        conversion_factor = COALESCE($5, conversion_factor),
        sub_unit_qty = $6,
        sub_unit_type = $7,
        yield_def = $8,
        notes = $9
      WHERE id = $10 RETURNING *
    `;
    const result = await pool.query(query, [
      name,
      qty,
      avgPrice,
      critical,
      conversionFactor,
      subUnitQty || null,
      subUnitType || null,
      yieldDef ? JSON.stringify(yieldDef) : null,
      notes || null,
      id,
    ]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ خطأ في تعديل الصنف:", err);
    res.status(500).json({ error: "حدث خطأ أثناء التعديل" });
  }
});

// 4. مسح صنف
app.delete("/api/inventory/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM inventory_items WHERE id = $1", [
      req.params.id,
    ]);
    res.json({ message: "تم الحذف بنجاح" });
  } catch (err) {
    res.status(500).json({ error: "حدث خطأ أثناء الحذف" });
  }
});

// ==========================================
// 🏭 مسارات مخازن الأقسام الفرعية (Department Stock)
// ==========================================

// جلب مخزون الأقسام (مطبخ، بار، شيشة)
app.get("/api/inventory/dept-stock", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM department_stock");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "حدث خطأ في جلب مخازن الأقسام" });
  }
});

// تحديث كمية صنف في قسم معين (عند الصرف أو المبيعات)
app.post("/api/inventory/dept-stock", async (req, res) => {
  const { departmentName, itemId, qty } = req.body;
  try {
    const query = `
      INSERT INTO department_stock (department_name, item_id, qty) 
      VALUES ($1, $2, $3)
      ON CONFLICT (department_name, item_id) 
      DO UPDATE SET qty = $3 
      RETURNING *
    `;
    const result = await pool.query(query, [departmentName, itemId, qty]);
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error("❌ خطأ في تحديث مخزن القسم:", err);
    res.status(500).json({ error: "حدث خطأ في تحديث القسم" });
  }
});

// ==========================================
// 6. تشغيل السيرفر والاستماع للطلبات
// ==========================================
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🔥 السيرفر شغال زي الفل على بورت ${PORT}`);
  console.log(`🌐 جرب تفتح: http://localhost:${PORT}`);
});
