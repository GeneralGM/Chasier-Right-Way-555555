// 1. استدعاء المكتبات اللي نزلناها
import express from "express";
import cors from "cors";
import pg from "pg";
const { Pool } = pg;
import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();
console.log("🔑 الباسورد المقروء من الـ .env هو:", process.env.DB_PASSWORD);

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "mall_erp",
  password: "123456", // الباسورد بتاعك هنا مباشرة
  port: 5432,
});

// تأكد إن كود اختبار الاتصال مكتوب تحتها بالشكل ده:
pool.connect((err, client, release) => {
  if (err) {
    return console.error("❌ فشل الاتصال بقاعدة البيانات:", err.stack);
  }
  console.log("🚀 تم الاتصال بقاعدة البيانات PostgreSQL بنجاح يا بطل!");
  release();
});

// 2. إنشاء السيرفر بتاعنا
const app = express();

// 3. تشغيل حارس الأمن (CORS) عشان الـ React يعرف يكلمنا
app.use(cors());

// 4. عشان السيرفر يفهم البيانات اللي جاية من الـ React بصيغة JSON
app.use(express.json());

// ==========================================
// 5. الروابط بتاعتنا (Routes)
// ==========================================

// رابط تجريبي عشان نتأكد إن السيرفر شغال
app.get("/", (req, res) => {
  res.send("مرحباً بك في سيرفر إدارة المول! 🚀");
});

// رابط تجريبي هنجيب منه بيانات وهمية دلوقتي لحد ما نربط الداتا بيس
app.get("/api/test", (req, res) => {
  res.json({
    message: "تم الاتصال بالباك إند بنجاح!",
    status: "success",
  });
});

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
// 📄 مسارات الفواتير (Invoices)
// ==========================================

// 1. حفظ فاتورة جديدة (النسخة النهائية المصححة)
// app.post("/api/invoices", async (req, res) => {
//   try {
//     const data = req.body;

//     const id = data.id || crypto.randomUUID();
//     let invoice_number =
//       data.invoiceNumber !== undefined
//         ? data.invoiceNumber
//         : data.invoice_number;
//     if (
//       invoice_number === undefined ||
//       invoice_number === null ||
//       invoice_number === ""
//     ) {
//       invoice_number = Math.floor(100000 + Math.random() * 900000);
//     } else {
//       invoice_number = Number(invoice_number);
//     }

//     const type = data.type || "dinein";
//     const table_code =
//       data.tableCode !== undefined ? data.tableCode : data.table_code || null;
//     const items =
//       typeof data.items === "string"
//         ? data.items
//         : JSON.stringify(data.items || []);
//     const subtotal = Number(data.subtotal || 0);
//     const discount_pct = Number(
//       data.discountPct !== undefined
//         ? data.discountPct
//         : data.discount_pct || 0,
//     );
//     const discount_value = Number(
//       data.discountValue !== undefined
//         ? data.discountValue
//         : data.discount_value || 0,
//     );
//     const tax_pct = Number(
//       data.taxPct !== undefined ? data.taxPct : data.tax_pct || 0,
//     );

//     // 🔥 الغلطة كانت هنا وتم تصحيحها بالملي!
//     const tax_value = Number(
//       data.taxValue !== undefined ? data.taxValue : data.tax_value || 0,
//     );

//     const total = Number(data.total || 0);
//     const cashier_id =
//       data.cashierId !== undefined ? data.cashierId : data.cashier_id || null;
//     const cashier_name =
//       data.cashierName !== undefined
//         ? data.cashierName
//         : data.cashier_name || null;
//     const customer_name =
//       data.customerName !== undefined
//         ? data.customerName
//         : data.customer_name || null;
//     const customer_address =
//       data.customerAddress !== undefined
//         ? data.customerAddress
//         : data.customer_address || null;

//     const createdAtSource = data.createdAt || data.created_at;
//     const formattedDate = createdAtSource
//       ? new Date(Number(createdAtSource))
//       : new Date();

//     const query = `
//       INSERT INTO invoices (
//         id, invoice_number, type, table_code, items, subtotal,
//         discount_pct, discount_value, tax_pct, tax_value, total,
//         cashier_id, cashier_name, customer_name, customer_address, created_at
//       )
//       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
//       RETURNING *
//     `;

//     const result = await pool.query(query, [
//       id,
//       invoice_number,
//       type,
//       table_code,
//       items,
//       subtotal,
//       discount_pct,
//       discount_value,
//       tax_pct,
//       tax_value,
//       total,
//       cashier_id,
//       cashier_name,
//       customer_name,
//       customer_address,
//       formattedDate,
//     ]);

//     res.status(201).json(result.rows[0]);
//   } catch (err) {
//     console.error("❌ خطأ حقيقي في حفظ الفاتورة:", err.message);
//     res
//       .status(500)
//       .json({ error: "حدث خطأ أثناء حفظ الفاتورة", details: err.message });
//   }
// });
app.post("/api/invoices", async (req, res) => {
  // 🔥 السطر ده هيطبعلك الفاتورة أول ما تضغط "إنهاء ودفع" في شاشة الكاشير
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
    total,
    createdAt,
  } = req.body;

  try {
    const query = `
      INSERT INTO invoices (
        id, type, invoice_number, table_code, zone, 
        customer_name, customer_address, cashier_id, cashier_name, 
        items, subtotal, discount_pct, discount_value, tax_pct, tax_value, total, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
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
      total,
      new Date(createdAt), // تحويل الطابع الزمني لتاريخ مناسب للـ PostgreSQL
    ]);

    console.log(
      "✅ تم الحفظ بنجاح في قاعدة البيانات برقم معرف:",
      result.rows[0].id,
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("❌ خطأ قاتل أثناء الحفظ في pgAdmin:", err.message);
    res.status(500).json({ error: "حدث خطأ أثناء حفظ الفاتورة" });
  }
});

// 2. جلب كل الفواتير
app.get("/api/invoices", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM invoices ORDER BY created_at DESC",
    );
    const invoices = result.rows.map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoice_number,
      type: inv.type,
      tableCode: inv.table_code,
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
      total: Number(inv.total),
      createdAt: Number(inv.created_at),
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

// 1. فتح أو إغلاق شيفت
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
// 6. تشغيل السيرفر على بورت معين
// ==========================================
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🔥 السيرفر شغال زي الفل على بورت ${PORT}`);
  console.log(`🌐 جرب تفتح: http://localhost:${PORT}`);
});
