import { Router } from "express";
import { exec } from "child_process";
import { join } from "path";
import multer from "multer";
import { existsSync, mkdirSync, unlinkSync } from "fs";
const router = Router();

// إعداد مكان مؤقت لاستقبال ملفات الاسترجاع
const upload = multer({ dest: "uploads/" });

// 1. مسار تحميل النسخة الاحتياطية (Manual Backup)
router.get("/download", (req, res) => {
  const fileName = `backup-${Date.now()}.sql`;
  const filePath = join(__dirname, "../backups", fileName);

  // تأكد من وجود مجلد backups
  if (!existsSync(join(__dirname, "../backups"))) {
    mkdirSync(join(__dirname, "../backups"));
  }

  // أمر تصدير قاعدة البيانات (تأكد من مطابقة اسم قاعدة البيانات والمستخدم)
  const command = `pg_dump -U postgres -d mall_erp -F p -f "${filePath}"`;

  exec(command, (error) => {
    if (error) {
      console.error("Backup Error:", error);
      return res.status(500).json({ error: "فشل في إنشاء النسخة الاحتياطية" });
    }
    res.download(filePath, fileName, () => {
      // مسح الملف من السيرفر بعد التحميل لتوفير المساحة (اختياري)
      unlinkSync(filePath);
    });
  });
});

// 2. مسار استرجاع النسخة الاحتياطية (Restore Backup)
router.post("/restore", upload.single("backupFile"), (req, res) => {
  const filePath = req.file.path;

  // أمر استرجاع قاعدة البيانات
  const command = `psql -U postgres -d mall_erp -f "${filePath}"`;

  exec(command, (error) => {
    // مسح الملف المؤقت بعد الاسترجاع
    unlinkSync(filePath);

    if (error) {
      console.error("Restore Error:", error);
      return res.status(500).json({ error: "فشل في استرجاع البيانات" });
    }
    res.json({ message: "تم استرجاع البيانات بنجاح" });
  });
});

export default router;
