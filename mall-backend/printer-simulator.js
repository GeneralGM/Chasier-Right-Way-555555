import { createServer } from "net";
import iconv from "iconv-lite"; // 👈 استيراد مكتبة فك التشفير

// 🌟 تعريف الـ 5 طابعات بالبورتات وأسماء الأقسام
const PRINTERS_CONFIG = [
  { name: "🍽️ طابعة المطبخ الرئيسي", port: 9100, color: "\x1b[32m" }, // أخضر
  { name: "🍹 طابعة البار والمشروبات", port: 9101, color: "\x1b[36m" }, // سماوي
  { name: "💨 طابعة الشيشة الخارجية", port: 9102, color: "\x1b[35m" }, // بنفسجي
  { name: "💻 طابعة الكاشير الفرعي / عام", port: 9103, color: "\x1b[33m" }, // أصفر
  { name: "🧪 طابعة التجربة (Test 5)", port: 9104, color: "\x1b[31m" }, // أحمر
];

const RESET_COLOR = "\x1b[0m";

console.clear();
console.log("======================================================");
console.log("🚀 تشغيل محاكي شبكة الطابعات الديناميكي (5 Printers)");
console.log("======================================================\n");

// تشغيل سيرفر مستقل لكل طابعة ديناميكياً
PRINTERS_CONFIG.forEach((printer) => {
  createServer((socket) => {
    console.log(
      `${printer.color}\n========================================${RESET_COLOR}`,
    );
    console.log(
      `${printer.color}🔥 [${printer.name}] استقبلت بون جديد على بورت (${printer.port}):${RESET_COLOR}`,
    );
    console.log(
      `${printer.color}========================================${RESET_COLOR}`,
    );

    // تجميع الـ Buffers المستلمة لأن الشبكة قد تقسم البيانات
    let chunks = [];

    socket.on("data", (chunk) => {
      chunks.push(chunk);
    });

    socket.on("end", () => {
      // دمج البيانات المستلمة بالكامل
      const buffer = Buffer.concat(chunks);

      // 1️⃣ فك التشفير من Windows-1256 إلى نص مقروء
      const rawText = iconv.decode(buffer, "win1256");

      // 2️⃣ عشان نعرضها في الترمينال معدولة (لأننا عاكسينها في السيرفر عشان الطابعة الحقيقية)
      // هنعكس الحروف في كل سطر تاني عشان تظهر للعين البشرية في الكونسول صح
      const testViewText = rawText
        .split("\n")
        .map((line) => {
          // لو السطر فيه أوامر للـ Cut أو تهيئة الطابعة (غير مقروءة)، هنظفها عشان الكونسول
          const cleanLine = line.replace(/[\x00-\x1F\x7F-\x9F]/g, "");
          return cleanLine.split("").reverse().join("");
        })
        .join("\n");

      console.log(testViewText);
      console.log(
        `${printer.color}----------------------------------------${RESET_COLOR}\n`,
      );
    });

    socket.on("error", (err) => {
      console.error(`❌ خطأ في اتصال سوكيت ${printer.name}:`, err.message);
    });
  }).listen(printer.port, "0.0.0.0", () => {
    console.log(
      `✅ ${printer.color}[${printer.name}]${RESET_COLOR} جاهزة ومستمعة على: 0.0.0.0:${printer.port}`,
    );
  });
});
