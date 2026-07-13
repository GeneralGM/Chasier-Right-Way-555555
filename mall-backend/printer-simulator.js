import { createServer } from "net";

// تعريف بورتات الـ 3 طابعات الوهمية
const KITCHEN_PORT = 9100;
const BAR_PORT = 9101;
const SHISHA_PORT = 9102;

// 1. تشغيل محاكي طابعة المطبخ
createServer((socket) => {
  console.log("\n========================================");
  console.log("🔥 [طابعة المطبخ] استقبلت بون جديد حالاً:");
  console.log("========================================");
  socket.on("data", (data) => console.log(data.toString("utf8")));
}).listen(KITCHEN_PORT, "127.0.0.1", () => {
  console.log(
    `🚀 طابعة المطبخ جاهزة ومستمعة على البورت: 127.0.0.1:${KITCHEN_PORT}`,
  );
});

// 2. تشغيل محاكي طابعة البار
createServer((socket) => {
  console.log("\n========================================");
  console.log("🍹 [طابعة البار] استقبلت بون جديد حالاً:");
  console.log("========================================");
  socket.on("data", (data) => console.log(data.toString("utf8")));
}).listen(BAR_PORT, "127.0.0.1", () => {
  console.log(`🚀 طابعة البار جاهزة ومستمعة على البورت: 127.0.0.1:${BAR_PORT}`);
});

// 3. تشغيل محاكي طابعة الشيشة
createServer((socket) => {
  console.log("\n========================================");
  console.log("💨 [طابعة الشيشة] استقبلت بون جديد حالاً:");
  console.log("========================================");
  socket.on("data", (data) => console.log(data.toString("utf8")));
}).listen(SHISHA_PORT, "127.0.0.1", () => {
  console.log(
    `🚀 طابعة الشيشة جاهزة ومستمعة على البورت: 127.0.0.1:${SHISHA_PORT}`,
  );
});
