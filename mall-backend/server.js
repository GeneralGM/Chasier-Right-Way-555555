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

    // 🌟 التعديل السحري: تحويل التايم-ستامب الرقمي إلى كائن تاريخ يفهمه الـ PostgreSQL تماماً
    const result = await pool.query(query, [
      crypto.randomUUID(),
      cashierId,
      cashierName,
      openedAt ? new Date(Number(openedAt)) : new Date(),
      closedAt ? new Date(Number(closedAt)) : new Date(),
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
    console.error("❌ خطأ في حفظ الشفت بالداتابيز:", err.message);
    res
      .status(500)
      .json({ error: "حدث خطأ أثناء حفظ الوردية", details: err.message });
  }
});

// 1. جلب كل الورديات (Shifts) من قاعدة البيانات (النسخة المعدلة)
app.get("/api/shifts", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM shifts ORDER BY opened_at DESC",
    );

    const formattedShifts = result.rows.map((row) => ({
      id: row.id,
      cashierName: row.cashier_name || row.cashierName,
      openedAt: row.opened_at ? new Date(row.opened_at).getTime() : Date.now(),
      closedAt: row.closed_at ? new Date(row.closed_at).getTime() : null,
      status: row.status,
      // 🌟 السطر السحري: إضافة كل حقول الأموال والمبيعات وتمريرها للفرونت إند
      kitchenSales: Number(row.kitchen_sales) || 0,
      barSales: Number(row.bar_sales) || 0,
      shishaSales: Number(row.shisha_sales) || 0,
      taxValue: Number(row.tax_value) || 0,
      discountValue: Number(row.discount_value) || 0,
      totalRevenue: Number(row.total_revenue) || 0,
      dineinSales: Number(row.dinein_sales) || 0,
      takeawaySales: Number(row.takeaway_sales) || 0,
      deliverySales: Number(row.delivery_sales) || 0,
    }));

    res.json(formattedShifts);
  } catch (err) {
    console.error("Error fetching shifts:", err);
    res.status(500).json({ error: "حدث خطأ أثناء جلب الورديات" });
  }
});
// 📌 ملاحظة: تم حذف دالة جلب الفواتير المكررة الثانية التي كانت هنا لعدم تضارب الكود وموتها.
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
// 📦 مسارات المخزن الرئيسي (Main Inventory)
// ==========================================

// 1. جلب جميع الأصناف
app.get("/api/inventory", async (req, res) => {
  try {
    // 🌟 التعديل هنا: inventory_items
    const result = await pool.query(
      "SELECT * FROM inventory_items ORDER BY name ASC",
    );

    const formattedRows = result.rows.map((row) => ({
      id: row.id,
      department: row.department || "",
      code: row.code || "",
      name: row.name,
      unit: row.unit,
      qty: Number(row.qty) || 0,
      avgPrice: Number(row.avg_price) || 0,
      critical: Number(row.critical) || 0,
      conversionFactor: Number(row.conversion_factor) || 1,
      subUnitQty: Number(row.sub_unit_qty) || 0,
      subUnitType: row.sub_unit_type || "",
      kind: row.kind || "standard",
      yieldDef: row.yield_def || null,
      lastYieldDeltas: row.last_yield_deltas || [],
      notes: row.notes || "",
    }));

    res.json(formattedRows);
  } catch (err) {
    console.error("🚨 خطأ في جلب الأصناف:", err);
    res.status(500).json({ error: "حدث خطأ في جلب أصناف المخزن" });
  }
});

// 2. إضافة أو تحديث صنف جديد
app.post("/api/inventory", async (req, res) => {
  const {
    id,
    department,
    code,
    name,
    unit,
    qty,
    avgPrice,
    critical,
    conversionFactor,
    subUnitQty,
    subUnitType,
    kind,
    yieldDef,
    lastYieldDeltas,
    notes,
  } = req.body;

  try {
    // 🌟 التعديل هنا: inventory_items بدلاً من inventory
    const query = `
      INSERT INTO inventory_items (
        id, department, code, name, unit, qty, avg_price, critical, 
        conversion_factor, sub_unit_qty, sub_unit_type, kind, yield_def, last_yield_deltas, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      ON CONFLICT (id) DO UPDATE SET
        department = EXCLUDED.department,
        code = EXCLUDED.code,
        name = EXCLUDED.name,
        unit = EXCLUDED.unit,
        qty = EXCLUDED.qty,
        avg_price = EXCLUDED.avg_price,
        critical = EXCLUDED.critical,
        conversion_factor = EXCLUDED.conversion_factor,
        sub_unit_qty = EXCLUDED.sub_unit_qty,
        sub_unit_type = EXCLUDED.sub_unit_type,
        kind = EXCLUDED.kind,
        yield_def = EXCLUDED.yield_def,
        last_yield_deltas = EXCLUDED.last_yield_deltas,
        notes = EXCLUDED.notes
      RETURNING *
    `;

    const values = [
      id,
      department || "",
      code || "",
      name,
      unit,
      Number(qty) || 0,
      Number(avgPrice) || 0,
      Number(critical) || 0,
      Number(conversionFactor) || 1,
      Number(subUnitQty) || 0,
      subUnitType || null,
      kind || "standard",
      yieldDef
        ? typeof yieldDef === "string"
          ? yieldDef
          : JSON.stringify(yieldDef)
        : null,
      lastYieldDeltas
        ? typeof lastYieldDeltas === "string"
          ? lastYieldDeltas
          : JSON.stringify(lastYieldDeltas)
        : null,
      notes || "",
    ];

    const result = await pool.query(query, values);
    const row = result.rows[0];

    res.status(201).json({
      id: row.id,
      department: row.department,
      code: row.code,
      name: row.name,
      unit: row.unit,
      qty: Number(row.qty),
      avgPrice: Number(row.avg_price),
      critical: Number(row.critical),
      conversionFactor: Number(row.conversion_factor),
      subUnitQty: Number(row.sub_unit_qty),
      subUnitType: row.sub_unit_type,
      kind: row.kind,
      yieldDef: row.yield_def,
      lastYieldDeltas: row.last_yield_deltas,
      notes: row.notes,
    });
  } catch (err) {
    console.error("🚨 خطأ حقيقي جوة السيرفر:", err.message);
    res.status(500).json({
      error: "حدث خطأ أثناء إضافة الصنف للداتابيز",
      details: err.message,
    });
  }
});

// 3. حذف صنف
app.delete("/api/inventory/:id", async (req, res) => {
  const { id } = req.params;
  try {
    // 🌟 التعديل هنا: inventory_items
    await pool.query("DELETE FROM inventory_items WHERE id = $1", [id]);
    res.json({ success: true, message: "تم حذف الصنف بنجاح" });
  } catch (err) {
    console.error("🚨 خطأ في حذف الصنف:", err);
    res.status(500).json({ error: "حدث خطأ أثناء الحذف" });
  }
});

// ==========================================
// 🧾 مسارات أذونات المخزن (التوريد والصرف)
// ==========================================

// 1. حفظ إذن جديد (توريد أو صرف) في قاعدة البيانات
app.post("/api/vouchers", async (req, res) => {
  const { id, type, date, supplier, department, lines, createdAt } = req.body;

  try {
    const query = `
      INSERT INTO inventory_vouchers (id, type, date, supplier, department, lines, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const values = [
      id,
      type,
      date,
      supplier || null,
      department || null,
      JSON.stringify(lines), // تحويل الأصناف والأسعار لـ JSON
      createdAt || Date.now(),
    ];

    const result = await pool.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("❌ خطأ في حفظ الإذن بالداتابيز:", err.message);
    res.status(500).json({ error: "حدث خطأ أثناء حفظ الإذن" });
  }
});

// 2. جلب كل الأذونات لعرضها في صفحة السجل (History)
app.get("/api/vouchers", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM inventory_vouchers ORDER BY created_at DESC",
    );

    // تجهيز البيانات لتطابق ما ينتظره الفرونت إند بالضبط
    const formattedVouchers = result.rows.map((row) => ({
      id: row.id,
      type: row.type,
      date: row.date,
      supplier: row.supplier,
      department: row.department,
      lines: typeof row.lines === "string" ? JSON.parse(row.lines) : row.lines,
      createdAt: Number(row.created_at),
    }));

    res.json(formattedVouchers);
  } catch (err) {
    console.error("❌ خطأ في جلب الأذونات:", err);
    res.status(500).json({ error: "حدث خطأ أثناء جلب الأذونات" });
  }
});
// ==========================================
// 🏪 مسارات المخازن الفرعية (مطبخ، بار، شيشة)
// ==========================================

// 1. جلب أرصدة كل الأقسام
app.get("/api/dept-stock", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT item_id, department, qty, item_name FROM department_stock",
    );
    res.json(result.rows);
  } catch (err) {
    console.error("🚨 خطأ في جلب المخازن الفرعية:", err);
    res.status(500).json({ error: "حدث خطأ في جلب أرصدة الأقسام" });
  }
});

// تحديث أو إدخال رصيد صنف في قسم معين
app.post("/api/dept-stock", async (req, res) => {
  const { itemId, itemName, department, qty } = req.body;
  try {
    const query = `
      INSERT INTO department_stock (item_id, item_name, department, qty)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (item_id, department) DO UPDATE SET 
        qty = EXCLUDED.qty,
        item_name = EXCLUDED.item_name
      RETURNING *
    `;
    const result = await pool.query(query, [
      itemId,
      itemName || "غير محدد",
      department,
      Number(qty) || 0,
    ]);
    res.json({
      success: true,
      message: "تم تحديث رصيد القسم بنجاح",
      data: result.rows[0],
    });
  } catch (err) {
    console.error("🚨 خطأ في تحديث رصيد القسم:", err);
    res.status(500).json({ error: "حدث خطأ أثناء تحديث المخزن الفرعي" });
  }
});

// ==========================================
// 🍔 مسارات الأصناف والريسبي (Meals / Recipes)
// ==========================================

// 1. جلب كل الأصناف والريسبي
app.get("/api/meals", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM meals ORDER BY category, name ASC",
    );

    // تحويل البيانات لشكل يفهمه الفرونت إند
    const formattedMeals = result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      department: row.department,
      category: row.category,
      kind: row.kind,
      sellingPrice: Number(row.selling_price) || 0,
      wasteMargin: Number(row.waste_margin) || 0,
      wasteMode: row.waste_mode,
      hasModifiers: row.has_modifiers,
      // فك الـ JSON عشان الفرونت إند يقراه كمصفوفة
      ingredients:
        typeof row.ingredients === "string"
          ? JSON.parse(row.ingredients)
          : row.ingredients || [],
      modifierGroups:
        typeof row.modifier_groups === "string"
          ? JSON.parse(row.modifier_groups)
          : row.modifier_groups || [],
    }));

    res.json(formattedMeals);
  } catch (err) {
    console.error("🚨 خطأ في جلب الريسبي:", err);
    res.status(500).json({ error: "حدث خطأ في جلب بيانات الأصناف" });
  }
});

// 2. إضافة أو تحديث ريسبي (Meal)
app.post("/api/meals", async (req, res) => {
  const {
    id,
    name,
    department,
    category,
    kind,
    sellingPrice,
    wasteMargin,
    wasteMode,
    ingredients,
    hasModifiers,
    modifierGroups,
  } = req.body;

  try {
    const query = `
      INSERT INTO meals (
        id, name, department, category, kind, selling_price, 
        waste_margin, waste_mode, ingredients, has_modifiers, modifier_groups
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        department = EXCLUDED.department,
        category = EXCLUDED.category,
        kind = EXCLUDED.kind,
        selling_price = EXCLUDED.selling_price,
        waste_margin = EXCLUDED.waste_margin,
        waste_mode = EXCLUDED.waste_mode,
        ingredients = EXCLUDED.ingredients,
        has_modifiers = EXCLUDED.has_modifiers,
        modifier_groups = EXCLUDED.modifier_groups
      RETURNING *
    `;

    const values = [
      id,
      name,
      department,
      category || "",
      kind || "menu",
      Number(sellingPrice) || 0,
      Number(wasteMargin) || 0,
      wasteMode || "fixed",
      JSON.stringify(ingredients || []),
      hasModifiers || false,
      JSON.stringify(modifierGroups || []),
    ];

    await pool.query(query, values);
    res.status(201).json({ success: true, message: "تم حفظ الصنف بنجاح" });
  } catch (err) {
    console.error("🚨 خطأ في حفظ الريسبي:", err.message);
    res.status(500).json({ error: "حدث خطأ أثناء حفظ الصنف" });
  }
});

// 3. حذف ريسبي
app.delete("/api/meals/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM meals WHERE id = $1", [req.params.id]);
    res.json({ success: true, message: "تم حذف الصنف بنجاح" });
  } catch (err) {
    console.error("🚨 خطأ في حذف الريسبي:", err);
    res.status(500).json({ error: "حدث خطأ أثناء الحذف" });
  }
});

// ==========================================
// 🛒 مسارات المبيعات (Sales)
// ==========================================

// 1. جلب كل المبيعات لعرضها في الجرد والتقارير
app.get("/api/sales", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM sales ORDER BY created_at DESC",
    );

    const formattedSales = result.rows.map((row) => ({
      id: row.id,
      date: new Date(row.date).toISOString().slice(0, 10), // تحويل لـ YYYY-MM-DD
      department: row.department,
      // فك سطور المبيعات
      lines: typeof row.lines === "string" ? JSON.parse(row.lines) : row.lines,
      totalSales: Number(row.total_sales),
      totalCost: Number(row.total_cost),
      createdAt: new Date(row.created_at).getTime(),
    }));

    res.json(formattedSales);
  } catch (err) {
    console.error("🚨 خطأ في جلب المبيعات:", err);
    res.status(500).json({ error: "حدث خطأ في جلب المبيعات" });
  }
});

// 2. إضافة مبيعات جديدة (وحفظها في الأرشيف)
app.post("/api/sales", async (req, res) => {
  const { id, date, department, lines, totalSales, totalCost, createdAt } =
    req.body;
  try {
    const query = `
      INSERT INTO sales (id, date, department, lines, total_sales, total_cost, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const values = [
      id,
      date,
      department,
      JSON.stringify(lines),
      Number(totalSales) || 0,
      Number(totalCost) || 0,
      new Date(createdAt),
    ];

    await pool.query(query, values);
    res.status(201).json({ success: true, message: "تم حفظ المبيعات بنجاح" });
  } catch (err) {
    console.error("🚨 خطأ في حفظ المبيعات:", err.message);
    res.status(500).json({ error: "حدث خطأ أثناء حفظ المبيعات" });
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
