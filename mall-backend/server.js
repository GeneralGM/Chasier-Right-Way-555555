// 1. استدعاء المكتبات الأساسية
import express from "express";
import cors from "cors";
import pg from "pg";
const { Pool } = pg;
import dotenv from "dotenv";
import crypto from "crypto";
// require("dotenv").config();

dotenv.config();

// إعداد الاتصال بقاعدة البيانات PostgreSQL
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "mall_erp",
  password: "123456",
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

const app = express();
app.use(cors());
app.use(express.json());

// ==========================================
// المسارات الأساسية (Routes)
// ==========================================

app.get("/", (req, res) => {
  res.send("مرحباً بك في سيرفر إدارة المول! 🚀");
});

app.get("/api/test", (req, res) => {
  res.json({ message: "تم الاتصال بالباك إند بنجاح!", status: "success" });
});

// --- مسارات الموظفين (Employees) ---

app.post("/api/employees", async (req, res) => {
  console.log("📥 بيانات الموظف الجديد وصلت للسيرفر:", req.body);

  const { name, role } = req.body;

  // 🌟 تأمين استقبال الـ PIN بجميع الأشكال الممكنة عشان مفيش صفحة تبوظ
  const pinHash =
    req.body.pinHash ||
    req.body.pin_hash ||
    req.body.pin ||
    req.body.password ||
    "";
  const id = req.body.id || crypto.randomUUID();

  // التحقق من وجود البيانات الأساسية
  if (!name || !pinHash) {
    return res.status(400).json({ message: "الاسم والرقم السري مطلوبان" });
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

    // 🌟 توحيد الـ Response بكل المسميات الممكنة عشان الصفحات التانية متقفلش أو تضرب
    res.status(201).json({
      ...result.rows[0],
      pinHash: result.rows[0].pinHash, // للشاشات الجديدة
      pin_hash: result.rows[0].pinHash, // للاحتياط
      pin: result.rows[0].pinHash, // للشاشات القديمة
    });
  } catch (error) {
    // 🔍 الكود 23505 في بوسطجرس معناه تكرار حقل فريد (Unique Violation)
    if (error.code === "23505") {
      return res.status(400).json({
        message:
          "عذراً، هذا الرقم السري مستخدم بالفعل لموظف آخر! اختر رقماً مختلفاً.",
      });
    }

    console.error("❌ خطأ سيرفر داخلي:", error);
    res.status(500).json({ message: "حدث خطأ داخلي في السيرفر" });
  }
});

app.get("/api/employees", async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, role, pin_hash AS "pinHash" FROM employees',
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "خطأ في جلب البيانات" });
  }
});
// --- مسار التعديل (PUT) ---
app.put("/api/employees/:id", async (req, res) => {
  const { id } = req.params;
  const { name, role, pinHash } = req.body;

  try {
    let query;
    let values;

    // لو الموظف كتب باسوورد جديد، هنحدث الـ pin_hash مع الاسم والرتبة
    if (pinHash) {
      query = `
        UPDATE employees 
        SET name = $1, role = $2, pin_hash = $3 
        WHERE id = $4
        RETURNING id, name, role, pin_hash AS "pinHash"
      `;
      values = [name, role, pinHash, id];
    } else {
      // لو مش باعت باسوورد (عايز يعدل الاسم أو الرتبة بس)
      query = `
        UPDATE employees 
        SET name = $1, role = $2 
        WHERE id = $3
        RETURNING id, name, role, pin_hash AS "pinHash"
      `;
      values = [name, role, id];
    }

    const result = await pool.query(query, values);

    // نتأكد إن الموظف موجود أصلاً
    if (result.rowCount === 0) {
      return res.status(404).json({ message: "الموظف غير موجود" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("❌ خطأ أثناء التعديل في الداتابيز:", error);
    res.status(500).json({ message: "فشل التعديل في قاعدة البيانات" });
  }
});

// --- مسار الحذف (DELETE) ---
app.delete("/api/employees/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "DELETE FROM employees WHERE id = $1 RETURNING id",
      [id],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "الموظف غير موجود أصلاً" });
    }

    res.json({ success: true, message: "تم حذف الموظف بنجاح" });
  } catch (error) {
    console.error("❌ خطأ أثناء الحذف من الداتابيز:", error);
    res.status(500).json({ message: "فشل الحذف من قاعدة البيانات" });
  }
});
// --- مسارات الفواتير (Invoices) ---

// 🌟 تحديث الدالة المساعدة لضمان قراءة الضريبة والخصم بأي شكل وهي راجعة للفرونت إند
function formatInvoiceToFrontend(inv) {
  if (!inv) return null;

  return {
    id: inv.id,
    invoiceNumber: Number(inv.invoice_number || inv.invoiceNumber || 0),
    type: inv.type,
    tableCode: inv.table_code || inv.tableCode || "",
    zone: inv.zone || "",
    customerName: inv.customer_name || inv.customerName || "",
    customerAddress: inv.customer_address || inv.customerAddress || "",
    cashierId: inv.cashier_id || inv.cashierId || "",
    cashierName: inv.cashier_name || inv.cashierName || "",
    captainName: inv.captain_name || inv.captainName || "",
    items:
      typeof inv.items === "string" ? JSON.parse(inv.items) : inv.items || [],

    // 🌟 تأمين قراءة قيم الحسابات والضرائب من الداتابيز (تلقط الـ snake_case والـ camelCase)
    subtotal: Number(inv.subtotal || 0),
    discountPct: Number(inv.discount_pct || inv.discountPct || 0),
    discountValue: Number(inv.discount_value || inv.discountValue || 0),
    taxPct: Number(inv.tax_pct || inv.taxPct || 0),
    taxValue: Number(inv.tax_value || inv.taxValue || 0), // 👈 دي اللي كانت مخلية الفرونت يقراها 0
    deliveryPrice: Number(inv.delivery_price || inv.deliveryPrice || 0),
    total: Number(inv.total || 0),

    createdAt: inv.created_at
      ? new Date(inv.created_at).getTime()
      : Number(inv.createdAt) || Date.now(),
    terminalId: inv.terminal_id || inv.terminalId || "Main",
    createdBy: inv.created_by || inv.createdBy || "",
  };
}

// 1️⃣ تعديل مسار حفظ الفاتورة (POST) لضمان تسجيل الضريبة والخصم صح
app.post("/api/invoices", async (req, res) => {
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
    captainName,
    items,
    subtotal,
    discountPct,
    discountValue,
    taxPct,
    taxValue,
    deliveryPrice,
    total,
    createdAt,
    terminalId,
    createdBy,
  } = req.body;

  try {
    let finalSubtotal = Number(subtotal);
    if (!finalSubtotal && Array.isArray(items)) {
      finalSubtotal = items.reduce((sum, item) => {
        const itemPrice = Number(item.unitPrice) || 0;
        const extrasTotal = (item.extras || []).reduce(
          (exSum, ex) => exSum + (Number(ex.price) || 0),
          0,
        );
        return sum + item.qty * (itemPrice + extrasTotal);
      }, 0);
    }

    const finalTaxPct = Number(taxPct) || Number(req.body.tax_pct) || 0;
    const finalTaxValue = Number(taxValue) || Number(req.body.tax_value) || 0;
    const finalDiscountPct =
      Number(discountPct) || Number(req.body.discount_pct) || 0;
    const finalDiscountValue =
      Number(discountValue) || Number(req.body.discount_value) || 0;
    const finalDeliveryPrice =
      Number(deliveryPrice) || Number(req.body.delivery_price) || 0;
    const finalTotal = Number(total) || Number(req.body.total) || 0;

    // 🌟 السحر هنا: تأمين قراءة الـ terminalId و createdBy من أي صيغة فرونت إند لمنع التصفير
    const finalTerminalId =
      terminalId || req.body.terminal_id || req.body.terminalId || "Main";
    const finalCreatedBy =
      createdBy ||
      req.body.created_by ||
      req.body.createdBy ||
      cashierName ||
      null;

    const query = `
      INSERT INTO invoices (
        id, type, invoice_number, table_code, zone, customer_name, customer_address, 
        cashier_id, cashier_name, captain_name, items, subtotal, discount_pct, discount_value, 
        tax_pct, tax_value, delivery_price, total, created_at, terminal_id, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
      RETURNING *
    `;

    const result = await pool.query(query, [
      id,
      type,
      invoiceNumber || req.body.invoice_number,
      tableCode || req.body.table_code,
      zone || null,
      customerName || null,
      customerAddress || null,
      cashierId || null,
      cashierName || null,
      captainName || null,
      JSON.stringify(items),
      finalSubtotal,
      finalDiscountPct,
      finalDiscountValue,
      finalTaxPct,
      finalTaxValue,
      finalDeliveryPrice,
      finalTotal,
      new Date(createdAt || req.body.created_at || Date.now()),
      finalTerminalId, // 🌟 مررنا المتغير المؤمن
      finalCreatedBy, // 🌟 مررنا المتغير المؤمن
    ]);

    res.status(201).json(formatInvoiceToFrontend(result.rows[0]));
  } catch (err) {
    console.error("❌ خطأ أثناء حفظ الفاتورة:", err.message);
    res
      .status(500)
      .json({ error: "حدث خطأ أثناء حفظ الفاتورة", details: err.message });
  }
});

// 2️⃣ حماية وتعديل مسار جلب الفواتير (GET) للأرشيف والتقارير
app.get("/api/invoices", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM invoices ORDER BY created_at DESC",
    );

    // تحويل كل الفواتير المجلوبة لـ camelCase عشان الأرشيف والتقارير يشتغلوا صح
    const formattedInvoices = result.rows.map((row) =>
      formatInvoiceToFrontend(row),
    );

    res.json(formattedInvoices);
  } catch (err) {
    console.error("❌ خطأ أثناء جلب الفواتير:", err.message);
    res.status(500).json({ error: "حدث خطأ أثناء جلب الفواتير" });
  }
});

// ==========================================
// 🕒 مسارات الورديات (Shifts) بالمنطق الجديد
// ==========================================

// 🌟 1. فحص الوردية الحالية (للمزامنة) مخصصة للجهاز نفسه
app.get("/api/pos/shift", async (req, res) => {
  const terminalId = req.query.terminalId || "Main"; // 🌟 بنعرف رقم الجهاز

  try {
    const result = await pool.query(
      "SELECT * FROM shifts WHERE terminal_id = $1 AND closed_at IS NULL ORDER BY created_at DESC LIMIT 1",
      [terminalId],
    );

    if (result.rows.length > 0) {
      const shift = result.rows[0];
      res.json({
        success: true,
        activeShift: {
          cashierId: shift.cashier_id,
          cashierName: shift.cashier_name,
          openedAt: Number(shift.opened_at),
        },
      });
    } else {
      res.json({ success: true, activeShift: null });
    }
  } catch (err) {
    console.error("🚨 خطأ أثناء فحص الوردية:", err.message);
    res.status(500).json({ success: false, error: "Database error" });
  }
});

// 🌟 2. فتح وردية جديدة (بداية الشيفت)
app.post("/api/pos/shift/open", async (req, res) => {
  const { cashierId, cashierName, openedAt, terminalId } = req.body; // 🌟 استلمنا terminalId

  try {
    const id = crypto.randomUUID();
    const finalOpenedAt = openedAt ? Number(openedAt) : Date.now();
    const termId = terminalId || "Main";

    // 💡 حماية: نتأكد إن مفيش وردية مفتوحة لنفس الجهاز
    const checkQuery = await pool.query(
      "SELECT id FROM shifts WHERE terminal_id = $1 AND closed_at IS NULL LIMIT 1",
      [termId],
    );
    if (checkQuery.rows.length > 0) {
      return res
        .status(400)
        .json({ success: false, error: "الوردية مفتوحة بالفعل لهذا الجهاز" });
    }

    const query = `
      INSERT INTO shifts (id, cashier_id, cashier_name, opened_at, created_at, terminal_id) 
      VALUES ($1, $2, $3, $4, NOW(), $5) 
      RETURNING *
    `;

    const result = await pool.query(query, [
      id,
      cashierId,
      cashierName,
      finalOpenedAt,
      termId,
    ]);

    res.status(201).json({ success: true, shift: result.rows[0] });
  } catch (err) {
    console.error("🚨 خطأ أثناء فتح الوردية:", err.message);
    res
      .status(500)
      .json({ success: false, error: "حدث خطأ أثناء فتح الوردية" });
  }
});

// 🌟 3. إغلاق الوردية الحالية (نهاية الشيفت للجهاز فقط)
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
    terminalId, // 🌟 استلام رقم الجهاز
  } = req.body;

  try {
    const finalClosedAt = closedAt ? Number(closedAt) : Date.now();
    const finalOpenedAt = Number(openedAt);
    const termId = terminalId || "Main"; // 🌟

    const totalRevenue =
      (Number(kitchenSales) || 0) +
      (Number(barSales) || 0) +
      (Number(shishaSales) || 0) +
      (Number(taxValue) || 0) -
      (Number(discountValue) || 0);

    // 💡 بنقفل الوردية الخاصة بالجهاز ده بس (WHERE terminal_id = $12)
    const query = `
      UPDATE shifts 
      SET 
        closed_at = $1, kitchen_sales = $2, bar_sales = $3, shisha_sales = $4, 
        tax_value = $5, discount_value = $6, total_revenue = $7, dinein_sales = $8, 
        takeaway_sales = $9, delivery_sales = $10 
      WHERE opened_at = $11 AND terminal_id = $12 AND closed_at IS NULL 
      RETURNING *
    `;

    const result = await pool.query(query, [
      finalClosedAt,
      Number(kitchenSales) || 0,
      Number(barSales) || 0,
      Number(shishaSales) || 0,
      Number(taxValue) || 0,
      Number(discountValue) || 0,
      Number(totalRevenue) || 0,
      Number(dineinSales) || 0,
      Number(takeawaySales) || 0,
      Number(deliverySales) || 0,
      finalOpenedAt,
      termId, // 🌟 تمرير رقم الجهاز
    ]);

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ error: "لا توجد وردية مفتوحة مطابقة لإغلاقها لهذا الجهاز!" });
    }

    const row = result.rows[0];
    res.status(200).json({
      ...row,
      openedAt: Number(row.opened_at),
      closedAt: Number(row.closed_at),
    });
  } catch (err) {
    console.error("❌ خطأ أثناء تحديث وإغلاق الوردية:", err.message);
    res.status(500).json({ error: "حدث خطأ أثناء إغلاق الوردية" });
  }
});
// 🌟 4. جلب أرشيف كل الورديات (لشاشة التقارير)
app.get("/api/shifts", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM shifts ORDER BY opened_at DESC",
    );

    const formattedShifts = result.rows.map((row) => ({
      id: row.id,
      cashierName: row.cashier_name,
      cashierId: row.cashier_id,
      openedAt: row.opened_at ? Number(row.opened_at) : Date.now(),
      closedAt: row.closed_at ? Number(row.closed_at) : null,
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
    console.error("🚨 خطأ أثناء جلب الورديات:", err.message);
    res.status(500).json({ error: "حدث خطأ أثناء جلب الورديات" });
  }
});

// --- مسارات المخزن الرئيسي (Main Inventory) ---

app.get("/api/inventory", async (req, res) => {
  try {
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
    res.status(500).json({ error: "حدث خطأ في جلب أصناف المخزن" });
  }
});

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
    const query = `
      INSERT INTO inventory_items (
        id, department, code, name, unit, qty, avg_price, critical, 
        conversion_factor, sub_unit_qty, sub_unit_type, kind, yield_def, last_yield_deltas, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      ON CONFLICT (id) DO UPDATE SET
        department = EXCLUDED.department, code = EXCLUDED.code, name = EXCLUDED.name, unit = EXCLUDED.unit,
        qty = EXCLUDED.qty, avg_price = EXCLUDED.avg_price, critical = EXCLUDED.critical, conversion_factor = EXCLUDED.conversion_factor,
        sub_unit_qty = EXCLUDED.sub_unit_qty, sub_unit_type = EXCLUDED.sub_unit_type, kind = EXCLUDED.kind,
        yield_def = EXCLUDED.yield_def, last_yield_deltas = EXCLUDED.last_yield_deltas, notes = EXCLUDED.notes
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
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({
      error: "حدث خطأ أثناء إضافة الصنف للداتابيز",
      details: err.message,
    });
  }
});

app.delete("/api/inventory/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM inventory_items WHERE id = $1", [
      req.params.id,
    ]);
    res.json({ success: true, message: "تم حذف الصنف بنجاح" });
  } catch (err) {
    res.status(500).json({ error: "حدث خطأ أثناء الحذف" });
  }
});

// --- مسارات أذونات المخزن (Vouchers) ---

app.post("/api/vouchers", async (req, res) => {
  const { id, type, date, supplier, department, lines, createdAt } = req.body;
  try {
    const query = `
      INSERT INTO inventory_vouchers (id, type, date, supplier, department, lines, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *
    `;
    const result = await pool.query(query, [
      id,
      type,
      date,
      supplier || null,
      department || null,
      JSON.stringify(lines),
      createdAt || Date.now(),
    ]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: "حدث خطأ أثناء حفظ الإذن" });
  }
});

app.get("/api/vouchers", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM inventory_vouchers ORDER BY created_at DESC",
    );
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
    res.status(500).json({ error: "حدث خطأ أثناء جلب الأذونات" });
  }
});

// --- مسارات المخازن الفرعية (Department Stock) ---

app.get("/api/dept-stock", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT item_id, department, qty, item_name FROM department_stock",
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "حدث خطأ في جلب أرصدة الأقسام" });
  }
});

app.post("/api/dept-stock", async (req, res) => {
  const { itemId, itemName, department, qty } = req.body;
  try {
    const query = `
      INSERT INTO department_stock (item_id, item_name, department, qty) VALUES ($1, $2, $3, $4)
      ON CONFLICT (item_id, department) DO UPDATE SET qty = EXCLUDED.qty, item_name = EXCLUDED.item_name
      RETURNING *
    `;
    const result = await pool.query(query, [
      itemId,
      itemName || "غير محدد",
      department,
      Number(qty) || 0,
    ]);
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: "حدث خطأ أثناء تحديث المخزن الفرعي" });
  }
});

// --- مسارات الوجبات والوصفات (Meals / Recipes) ---

app.get("/api/meals", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM meals ORDER BY category, name ASC",
    );
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
    res.status(500).json({ error: "حدث خطأ في جلب بيانات الأصناف" });
  }
});

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
      INSERT INTO meals (id, name, department, category, kind, selling_price, waste_margin, waste_mode, ingredients, has_modifiers, modifier_groups)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, department = EXCLUDED.department, category = EXCLUDED.category, kind = EXCLUDED.kind,
        selling_price = EXCLUDED.selling_price, waste_margin = EXCLUDED.waste_margin, waste_mode = EXCLUDED.waste_mode,
        ingredients = EXCLUDED.ingredients, has_modifiers = EXCLUDED.has_modifiers, modifier_groups = EXCLUDED.modifier_groups
      RETURNING *
    `;
    await pool.query(query, [
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
    ]);
    res.status(201).json({ success: true, message: "تم حفظ الصنف بنجاح" });
  } catch (err) {
    res.status(500).json({ error: "حدث خطأ أثناء حفظ الصنف" });
  }
});

app.delete("/api/meals/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM meals WHERE id = $1", [req.params.id]);
    res.json({ success: true, message: "تم حذف الصنف بنجاح" });
  } catch (err) {
    res.status(500).json({ error: "حدث خطأ أثناء الحذف" });
  }
});

// --- مسارات المبيعات (Sales) ---

app.get("/api/sales", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, date::text, department, lines, total_sales, total_cost, created_at FROM sales ORDER BY created_at DESC",
    );

    const formattedSales = result.rows.map((row) => ({
      id: row.id,
      // 🌟 السحر هنا: date::text خلت التاريخ ييجي '2026-06-28' نص صريح ومستحيل يتغير بسبب التوقيت
      date: row.date,
      department: row.department,
      lines: typeof row.lines === "string" ? JSON.parse(row.lines) : row.lines,
      totalSales: Number(row.total_sales),
      totalCost: Number(row.total_cost),
      createdAt: new Date(row.created_at).getTime(),
    }));
    res.json(formattedSales);
  } catch (err) {
    console.error("🚨 خطأ في جلب المبيعات:", err.message);
    res.status(500).json({ error: "حدث خطأ في جلب المبيعات" });
  }
});

app.post("/api/sales", async (req, res) => {
  // 🔥 السطر ده هيخلينا نشوف الداتا وصلت السيرفر أصلاً ولا لأ
  console.log("📥 طلب إضافة مبيعات وصل للسيرفر:", req.body);

  const { id, date, department, lines, totalSales, totalCost, createdAt } =
    req.body;
  try {
    const query = `INSERT INTO sales (id, date, department, lines, total_sales, total_cost, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)`;
    await pool.query(query, [
      id,
      date,
      department,
      JSON.stringify(lines),
      Number(totalSales) || 0,
      Number(totalCost) || 0,
      new Date(createdAt),
    ]);
    res.status(201).json({ success: true, message: "تم حفظ المبيعات بنجاح" });
  } catch (err) {
    // 🔥 السطر ده هيفضح المشكلة لو الداتابيز رفضت الداتا
    console.error("🚨 خطأ في قاعدة البيانات أثناء حفظ المبيعات:", err.message);
    res
      .status(500)
      .json({ error: "حدث خطأ أثناء حفظ المبيعات", details: err.message });
  }
});

// --- مسار الجرد (Audits) ---
app.post("/api/audits", async (req, res) => {
  const { id, date, department, rows, shortageValue, penaltyValue, createdAt } =
    req.body;

  // هنستخدم Transaction عشان نضمن إن حفظ الجرد وتحديث المخزن بيتموا مع بعض
  const client = await pool.connect();

  try {
    await client.query("BEGIN"); // بداية العملية

    // 1. تسجيل الجرد في جدول audits (نفس كودك الأصلي)
    const auditQuery = `
      INSERT INTO audits (id, date, department, rows, shortage_value, penalty_value, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (date, department) 
      DO UPDATE SET 
        rows = EXCLUDED.rows,
        shortage_value = EXCLUDED.shortage_value,
        penalty_value = EXCLUDED.penalty_value,
        created_at = EXCLUDED.created_at;
    `;
    await client.query(auditQuery, [
      id,
      date,
      department,
      JSON.stringify(rows),
      shortageValue,
      penaltyValue,
      new Date(createdAt),
    ]);

    // 2. السحر هنا: تحديث المخازن الفرعية بالكميات الفعلية
    for (const item of rows) {
      // item.actual هي الكمية اللي اليوزر دخلها بإيده في الجرد
      const updateStockQuery = `
        UPDATE department_stock 
        SET qty = $1 
        WHERE item_id = $2 AND department = $3;
      `;
      await client.query(updateStockQuery, [
        item.actual,
        item.itemId,
        department,
      ]);
    }

    await client.query("COMMIT"); // تأكيد حفظ كل التعديلات
    res
      .status(201)
      .json({ success: true, message: "تم تسجيل الجرد وتحديث المخازن بنجاح" });
  } catch (err) {
    await client.query("ROLLBACK"); // لو حصل أي مشكلة، ارجع في كل حاجة
    console.error("🚨 خطأ في تسجيل الجرد وتحديث المخزن:", err.message);
    res.status(500).json({ error: "خطأ في السيرفر أثناء معالجة الجرد" });
  } finally {
    client.release(); // لازم نقفل الاتصال
  }
});
app.get("/api/audits", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM audits ORDER BY created_at DESC",
    );
    const formattedAudits = result.rows.map((row) => ({
      id: row.id,
      date: row.date,
      department: row.department,
      rows: typeof row.rows === "string" ? JSON.parse(row.rows) : row.rows,
      shortageValue: Number(row.shortage_value) || 0,
      penaltyValue: Number(row.penalty_value) || 0,
      createdAt: new Date(row.created_at).getTime(),
    }));
    res.json(formattedAudits);
  } catch (err) {
    console.error("🚨 خطأ في جلب الجرد:", err.message);
    res.status(500).json({ error: "حدث خطأ أثناء جلب الجرد" });
  }
});
///////////////////////////////////////////////// IP /////////////////////////////////////////////////
// 🖥️ قائمة بالـ IPs الثابتة لأجهزة الميكروس في المول
const MICROS_IPS = [];
// 🖥️ قائمة بالـ IPs الثابتة لأجهزة الكاشير الفرعي 🌟 (الجديدة)
const Sec_chasierIPs = [
  "192.168.100.205", // تابلت 2
  "192.168.1.32", // تابلت 1
  "192.168.1.40", // جهاز كاشير فرعي 1
  "192.168.1.41", // جهاز كاشير فرعي 2
];
// 🔍 تعديل الـ API عشان تدعم تنظيف الـ IP والتحققين سوا
app.get("/api/device-check", (req, res) => {
  let clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

  // 🌟 تنظيف الـ IP لو جاى مسبوق بـ ::ffff: بسبب خصائص الشبكة المحلية
  if (clientIp && clientIp.includes("::ffff:")) {
    clientIp = clientIp.split("::ffff:")[1];
  }

  // 1. نتحقق هل هو في قائمة الميكروس؟
  const isMicros = MICROS_IPS.includes(clientIp);

  // 2. نتحقق هل هو في قائمة الكاشير الفرعي؟
  const isSecCashier = Sec_chasierIPs.includes(clientIp);

  let deviceType = "main";
  if (isMicros) deviceType = "micros";
  else if (isSecCashier) deviceType = "sec_cashier";

  res.json({
    ip: clientIp,
    deviceType: deviceType,
  });
});
// ============================================================================
// 📡 مسارات مزامنة الطاولات النشطة لحظياً (POS Active Orders)
// ============================================================================

// 🌟 1. حفظ أو تحديث طاولة (Upsert) جوه الداتا بيس
app.post("/api/pos/orders/upsert", async (req, res) => {
  const { tableCode, orderData } = req.body;
  if (!tableCode || !orderData) {
    return res.status(400).json({ success: false, error: "البيانات ناقصة" });
  }

  const state = orderData.state || "active";
  const updatedAt = Date.now();

  try {
    const query = `
      INSERT INTO active_orders (table_code, state, order_data, updated_at)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (table_code)
      DO UPDATE SET state = $2, order_data = $3, updated_at = $4;
    `;
    await pool.query(query, [
      tableCode,
      state,
      JSON.stringify(orderData),
      updatedAt,
    ]);
    res.json({ success: true, message: `تم تحديث الطاولة ${tableCode} بنجاح` });
  } catch (err) {
    console.error("🚨 خطأ في داتا بيس الطلبات النشطة:", err);
    res.status(500).json({ success: false, error: "فشل حفظ الطلب" });
  }
});

// 🌟 2. جلب كل الطلبات النشطة (دي اللي كانت ناقصة وبتعمل 404!)
app.get("/api/pos/orders", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT table_code, order_data FROM active_orders WHERE state IN ('active', 'printed')",
    );
    const ordersMap = {};
    result.rows.forEach((row) => {
      ordersMap[row.table_code] = row.order_data;
    });
    res.json(ordersMap);
  } catch (err) {
    console.error("🚨 خطأ أثناء جلب الطلبات النشطة:", err);
    res.status(500).json({ error: "فشل جلب البيانات من السيرفر" });
  }
});
// 🌟 4. مسح الطاولة (لما الفاتورة تتقفل وتتحول لـ finish)
app.post("/api/pos/orders/clear", async (req, res) => {
  const { tableCode } = req.body;
  if (!tableCode) {
    return res.status(400).json({ success: false, error: "كود الطاولة مطلوب" });
  }

  try {
    await pool.query("DELETE FROM active_orders WHERE table_code = $1", [
      tableCode,
    ]);
    res.json({ success: true, message: `تم تفريغ الطاولة ${tableCode} بنجاح` });
  } catch (err) {
    console.error("🚨 خطأ أثناء مسح الطاولة:", err);
    res
      .status(500)
      .json({ success: false, error: "فشل مسح الطاولة من السيرفر" });
  }
});
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////// Vertify Captian /////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
app.post("/api/pos/verify-captain", async (req, res) => {
  const { password, expectedCaptainName } = req.body; // 🌟 استقبلنا الاسم المتوقع لو الطاولة مفتوحة

  if (!password) {
    return res.status(400).json({ success: false, error: "الرمز السري مطلوب" });
  }

  try {
    // 1. نبحث عن الموظف بالباسوورد وتكون رتبته كابتن صالة
    const result = await pool.query(
      "SELECT name, role FROM employees WHERE pin_hash = $1 AND role = 'كابتن صالة' LIMIT 1",
      [String(password)],
    );

    if (result.rows.length > 0) {
      const foundCaptainName = result.rows[0].name;

      // 🌟 القفل هنا: لو الطاولة مفتوحة بكابتن معين، لازم الباسوورد يرجع نفس الاسم ده بالظبط!
      if (expectedCaptainName && expectedCaptainName !== foundCaptainName) {
        return res.status(403).json({
          success: false,
          error: `عفواً، هذه الطاولة محصورة لبصمة كابتن: ${expectedCaptainName}`,
        });
      }

      // لو كله تمام أو طاولة جديدة
      return res.json({ success: true, captainName: foundCaptainName });
    } else {
      return res
        .status(401)
        .json({ success: false, error: "رمز كابتن غير صحيح أو غير مصرح له" });
    }
  } catch (err) {
    console.error("🚨 خطأ أثناء التحقق من الكابتن:", err.message);
    res.status(500).json({ success: false, error: "حدث خطأ في السيرفر" });
  }
});
const PORT = 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server is running on all network interfaces on port ${PORT}`);
});
