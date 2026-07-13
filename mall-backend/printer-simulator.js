import { createServer } from "net";

// بورت طابعة المطبخ الوهمية
const KITCHEN_PORT = 9100;

const server = createServer((socket) => {
  console.log("--- 🖨️ طابعة المطبخ استقبلت بون جديد ---");

  socket.on("data", (data) => {
    // تحويل الداتا المبعوثة من الـ POS لنص مقروء
    console.log(data.toString("utf8"));
  });

  socket.on("end", () => {
    console.log("----------------------------------------\n");
  });
});

server.listen(KITCHEN_PORT, "127.0.0.1", () => {
  console.log(
    `🚀 محاكي الطابعة شغال وجاهز يستقبل بونات على الـ IP: 127.0.0.1:${KITCHEN_PORT}`,
  );
});
