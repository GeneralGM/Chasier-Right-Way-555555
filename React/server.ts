/* eslint-disable prettier/prettier */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable prettier/prettier */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const PORT = 3000;

console.log("🚀 جاري تشغيل سيرفر الـ POS المركزي المطور...");

Bun.serve({
  port: PORT,
  async fetch(req: { url: string | URL; method: string; json: () => any }) {
    const url = new URL(req.url);

    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json",
    };

    if (req.method === "OPTIONS") return new Response(null, { headers });

    try {
      // 1. نظام الفواتير
      if (url.pathname === "/api/invoices") {
        if (req.method === "POST") {
          const body = await req.json();
          await prisma.invoice.create({
            data: {
              id: body.id,
              type: body.type,
              invoiceNumber: Number(body.invoiceNumber),
              tableCode: body.tableCode || null,
              zone: body.zone || null,
              customerName: body.customerName || null,
              customerAddress: body.customerAddress || null,
              cashierId: body.cashierId || null,
              cashierName: body.cashierName || null,
              subtotal: Number(body.subtotal),
              discountPct: Number(body.discountPct),
              discountValue: Number(body.discountValue),
              taxPct: Number(body.taxPct),
              taxValue: Number(body.taxValue),
              total: Number(body.total),
              createdAt: BigInt(body.createdAt),
              items: JSON.stringify(body.items),
            },
          });
          return new Response(JSON.stringify({ success: true }), { headers });
        }

        if (req.method === "GET") {
          const invoices = await prisma.invoice.findMany();
          const formatted = invoices.map(
            (inv: { createdAt: any; items: string }) => ({
              ...inv,
              createdAt: Number(inv.createdAt),
              items: JSON.parse(inv.items),
            }),
          );
          return new Response(JSON.stringify(formatted), { headers });
        }
      }

      // 2. نظام الموظفين
      if (url.pathname === "/api/employees") {
        if (req.method === "POST") {
          const body = await req.json();
          const emp = await prisma.employee.create({ data: body });
          return new Response(JSON.stringify(emp), { headers });
        }
        if (req.method === "GET") {
          const emps = await prisma.employee.findMany();
          return new Response(JSON.stringify(emps), { headers });
        }
      }

      // 3. نظام الشيفتات
      if (url.pathname === "/api/shifts") {
        if (req.method === "POST") {
          const body = await req.json();
          await prisma.shift.create({
            data: {
              cashierId: body.cashierId,
              cashierName: body.cashierName,
              openedAt: BigInt(body.openedAt),
              closedAt: body.closedAt ? BigInt(body.closedAt) : null,
            },
          });
          return new Response(JSON.stringify({ success: true }), { headers });
        }
        if (req.method === "GET") {
          const shifts = await prisma.shift.findMany();
          const formatted = shifts.map(
            (s: { openedAt: any; closedAt: any }) => ({
              ...s,
              openedAt: Number(s.openedAt),
              closedAt: s.closedAt ? Number(s.closedAt) : null,
            }),
          );
          return new Response(JSON.stringify(formatted), { headers });
        }
      }

      return new Response(JSON.stringify({ error: "المسار غير موجود" }), {
        status: 404,
        headers,
      });
    } catch (error: any) {
      console.error("خطأ في السيرفر:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers,
      });
    }
  },
});

console.log(`📡 السيرفر المركزي شغال طيارة على: http://localhost:${PORT}`);
