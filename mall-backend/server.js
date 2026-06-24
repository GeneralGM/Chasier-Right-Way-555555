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

// إضافة موظف جديد
app.post("/api/employees", async (req, res) => {
  const { name, role, pinHash } = req.body;
  const id = req.body.id || crypto.randomUUID();

  try {
    const query = `
      INSERT INTO employees (id, name, role, pin_hash) 
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, role, pin_hash AS "pinHash"
    `;
    const result = await pool.query(query, [id, name, role, pinHash]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("❌ خطأ أثناء إضافة موظف:", err);
    res.status(500).json({ error: "حدث خطأ في قاعدة البيانات" });
  }
});

// جلب كل الموظفين
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
  const { cashierId, cashierName, openedAt, closedAt } = req.body;
  try {
    const query = `
      INSERT INTO shifts (id, cashier_id, cashier_name, opened_at, closed_at)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const result = await pool.query(query, [
      crypto.randomUUID(),
      cashierId,
      cashierName,
      openedAt,
      closedAt || null,
    ]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("❌ خطأ في تحديث الشيفت:", err);
    res.status(500).json({ error: "حدث خطأ في الـ Shift" });
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
