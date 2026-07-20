import{c as P,u as L,r as M,a as l,j as e,B as E,k as O,f as u}from"./index-B-hfOW34.js";import{u as W}from"./pos-store-DpNO2Seo.js";import{P as G}from"./printer-adqVWNgH.js";import{C as H}from"./chef-hat-DtSNOS8s.js";import{W as q,C as Z,S as U,B as J,D as R,P as K,M as Q,R as X,a as Y}from"./wine-9ZcM4RP2.js";const ee=[["path",{d:"m16 17 5-5-5-5",key:"1bji2h"}],["path",{d:"M21 12H9",key:"dn1m92"}],["path",{d:"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4",key:"1uf3rs"}]],te=P("log-out",ee);const ae=[["path",{d:"M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z",key:"1xq2db"}]],se=P("zap",ae);function ne(){const{db:h}=L(),{db:r,closeShift:f}=W(),n=M.useMemo(()=>{if(!r.shift)return[];const o=localStorage.getItem("isSecCashierDevice")==="true"?"Sub-1":"Main";return r.invoices.filter(c=>c.createdAt>=r.shift.openedAt&&(c.terminalId===o||c.terminal_id===o))},[r.invoices,r.shift]),t=M.useMemo(()=>{let a=0,o=0,c=0,g=0,p=0,x=0,m=0,b=0,j=0,N=0,w=0,k=0,C=0,S=0,T=0;for(const s of n){m+=s.subtotal,b+=s.discountValue,j+=s.taxValue||0;const y=Number(s.deliveryPrice)||Number(s.delivery_price)||0;x+=y,s.type==="takeaway"?g+=s.total-y:s.type==="delivery"&&(p+=s.total-y);const F=s.orderCategory||s.order_category||"normal";F==="fast"?(N+=s.total,w++,k+=Number(s.commissionValue||s.commission_value||0)):F==="talabat"&&(C+=s.total,S++,T+=Number(s.commissionValue||s.commission_value||0));for(const d of s.items){const V=d.extras?.reduce((z,A)=>z+Number(A.price||0),0)||0,_=(Number(d.unitPrice||d.price||0)+V)*Number(d.qty||1);let D=d.department||"مطبخ";const v=h.meals.find(z=>z.id===d.mealId);v&&(v.department==="شيشه"||(v.category||"").trim().replace("ة","ه")==="شيشه"?D="شيشة":v.department&&(D=v.department)),D.includes("شيش")?c+=_:D.includes("بار")?o+=_:a+=_}}const $=a+o+c+j-b;return{kitchen:l(a),bar:l(o),shisha:l(c),takeaway:l(g),deliveryTotal:l(p),deliveryFees:l(x),subtotal:l(m),discount:l(b),tax:l(j),total:l($),revenues:l($),fastTotal:l(N),fastCount:w,fastComission:l(k),talabatTotal:l(C),talabatCount:S,talabatCommission:l(T)}},[n,h.meals]);async function I(){const a=prompt("برجاء إدخال مبلغ الكاش الفعلي الموجود بالدرج حالياً لتسوية العهدة:");if(a===null)return;const o=Number(a)||0,g=localStorage.getItem("isSecCashierDevice")==="true"?"Sub-1":"Main",p=await f({kitchenSales:t.kitchen,barSales:t.bar,shishaSales:t.shisha,taxValue:t.tax,discountValue:t.discount,dineinSales:t.revenues-t.takeaway-t.deliveryTotal,takeawaySales:t.takeaway,deliverySales:t.deliveryTotal,fastSales:t.fastTotal,talabatSales:t.talabatTotal,talabatCommission:t.talabatCommission,terminalId:g,actualCash:o});if(p){if(p.auditReport){const x=p.auditReport,m=x.variance;let b="متطابق 🟢";m<0?b=`عجز: ${Math.abs(m).toFixed(2)} ج.م 🔴`:m>0&&(b=`زيادة: ${m.toFixed(2)} ج.م 🔵`),t.revenues-t.takeaway-t.deliveryTotal;const j=t.kitchen,N=t.bar,w=t.shisha,k=t.takeaway,C=t.deliveryTotal,S=t.tax,T=t.discount,$=t.revenues,s=t.deliveryFees,y=new Date(r.shift.openedAt).toLocaleString("ar-EG"),F=new Date().toLocaleString("ar-EG"),d=window.open("","_blank","width=600,height=800");d&&(d.document.write(`
            <html dir="rtl">
              <head>
                <title>تقرير تقفيل وردية نهائي</title>
                <style>
                  @page { margin: 0; size: auto; }
                  body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    width: 100%; max-width: 80mm; margin: 0 auto; padding: 10px 5px;
                    color: #000; background: #fff; font-size: 13px; line-height: 1.5; box-sizing: border-box;
                  }
                  h2 { text-align: center; margin: 0 0 10px 0; font-size: 18px; font-weight: bold; text-decoration: underline; }
                  .header-box { border: 1.5px solid #000; padding: 6px; margin-bottom: 12px; font-size: 12px; font-weight: bold; }
                  .header-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
                  table { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 13px; }
                  th, td { border: 1.5px solid #000; padding: 5px; }
                  td:first-child { width: 65%; font-weight: bold; }
                  td:last-child { width: 35%; text-align: center; font-family: monospace; font-size: 14px;}
                  .table-header { text-align: center !important; background-color: #f0f0f0 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; font-weight: bold; font-size: 14px; }
                  .bold { font-weight: bold; }
                  .variance-row td { background-color: #eee; -webkit-print-color-adjust: exact; }
                </style>
              </head>
              <body onload="setTimeout(() => { window.print(); window.close(); }, 500);">
                
                <h2>Z-Report تقرير وردية</h2>
                
                <div class="header-box">
                  <div class="header-row"><span>الجهاز:</span><span dir="ltr">${g}</span></div>
                  <div class="header-row"><span>من:</span><span dir="ltr">${y}</span></div>
                  <div class="header-row"><span>إلى:</span><span dir="ltr">${F}</span></div>
                  <div class="header-row"><span>الكاشير:</span><span>${r.shift?.cashierName||"غير معروف"}</span></div> 
                </div>
                  
                <table>
                  <tr><td colspan="2" class="table-header">تفاصيل المبيعات</td></tr>
                  <tr><td>المطبخ</td><td class="bold">${j.toFixed(2)}</td></tr>
                  <tr><td>بار</td><td class="bold">${N.toFixed(2)}</td></tr>
                  <tr><td>شيشة</td><td class="bold">${w.toFixed(2)}</td></tr>
                </table>
                  
                <table>
                  <tr><td colspan="2" class="table-header">توزيع الطلبات والمنصات</td></tr>
                  <tr><td>تيك اواي</td><td class="bold">${k.toFixed(2)}</td></tr>
                  <tr><td>دليفري</td><td class="bold">${C.toFixed(2)}</td></tr>
                  <tr><td>فاست فود (مبيعات)</td><td class="bold">${t.fastTotal.toFixed(2)}</td></tr>
                  <tr><td>طلبات Talabat (مبيعات)</td><td class="bold">${t.talabatTotal.toFixed(2)}</td></tr>
                  <tr style="background-color: #fdf2f8;"><td>إجمالي نسبة طلبات المضافة (+15%)</td><td class="bold" style="color: #db2777;">${t.talabatCommission.toFixed(2)}</td></tr>
                  <tr><td>إجمالي الخدمة / التوصيل</td><td class="bold">${s.toFixed(2)}</td></tr>
                </table>
                  
                <table>
                  <tr><td colspan="2" class="table-header">المجموع النهائي</td></tr>
                  <tr><td>إجمالي الضريبة</td><td class="bold">${S.toFixed(2)}</td></tr>
                  <tr><td>إجمالي الخصم</td><td class="bold">${T.toFixed(2)}</td></tr>
                  <tr><td>إجمالي الإيرادات (شامل النسبة)</td><td class="bold">${$.toFixed(2)}</td></tr>
                </table>

                <table>
                  <tr><td colspan="2" class="table-header">طرق الدفع</td></tr>
                  <tr><td>نقدي (المدخل فعلياً)</td><td class="bold">${x.actualCashReceived.toFixed(2)}</td></tr>
                  <tr><td>فيزا / منصات</td><td class="bold">0.00</td></tr>
                </table>

                <table>
                  <tr><td colspan="2" class="table-header">تسوية العهدة (الجرد)</td></tr>
                  <tr><td>إجمالي السيستم المطلوب</td><td class="bold">${x.databaseTotalSales.toFixed(2)}</td></tr>
                  <tr><td>الكاش الفعلي بالدرج</td><td class="bold">${x.actualCashReceived.toFixed(2)}</td></tr>
                  <tr class="variance-row"><td>نتيجة الجرد</td><td class="bold" style="font-size: 12px;">${b}</td></tr>
                </table>

              </body>
            </html>
          `),d.document.close())}else window.print();setTimeout(()=>{window.location.reload()},1500)}}return e.jsxs("div",{dir:"rtl",className:"space-y-4",children:[e.jsxs("div",{className:"flex items-center justify-between flex-wrap gap-2 no-print",children:[e.jsxs("div",{children:[e.jsx("h1",{className:"text-2xl font-bold",children:"إيراد الشيفت الحالي"}),e.jsx("p",{className:"text-sm text-muted-foreground",children:r.shift?`مفتوح بواسطة: ${r.shift.cashierName}`:"لا يوجد شيفت مفتوح"})]}),e.jsx("div",{className:"flex gap-2",children:r.shift&&e.jsxs(E,{onDoubleClick:I,variant:"destructive",className:"gap-2",children:[e.jsx(G,{className:"w-4 h-4"})," طباعة وتقفيل الشيفت"," ",e.jsx(te,{className:"w-4 h-4"})]})})]}),e.jsxs("div",{className:"grid grid-cols-2 md:grid-cols-6 gap-3",children:[e.jsx(i,{icon:H,label:"المطبخ",value:t.kitchen,accent:"orange"}),e.jsx(i,{icon:q,label:"البار",value:t.bar,accent:"rose"}),e.jsx(i,{icon:Z,label:"الشيشة",value:t.shisha,accent:"purple"}),e.jsx(B,{icon:se,label:"فاست(Fast)",value:t.fastTotal,commission:t.fastComission,count:t.fastCount,accent:"amber"}),e.jsx(B,{icon:O,label:"طلبات (Talabat)",value:t.talabatTotal,commission:t.talabatCommission,count:t.talabatCount,accent:"orange"}),e.jsx(i,{icon:U,label:"التيك أواي (إحصائية)",value:t.takeaway,accent:"sky"}),e.jsx(i,{icon:J,label:"أوردر التوصيل (إحصائية)",value:t.deliveryTotal,accent:"orange"}),e.jsx(i,{icon:R,label:"رسوم التوصيل",value:t.deliveryFees,accent:"emerald"}),e.jsx(i,{icon:R,label:"الإيرادات",value:t.revenues,accent:"emerald"}),e.jsx(i,{icon:K,label:"القيمة المضافة (14%)",value:t.tax,accent:"indigo"}),e.jsx(i,{icon:Q,label:"الخصم",value:t.discount,accent:"amber"}),e.jsx(i,{icon:X,label:"المجموع الكلي",value:t.subtotal,accent:"slate"})]}),e.jsx("div",{className:"bg-gradient-to-br from-primary to-primary/70 text-primary-foreground rounded-2xl p-6 shadow-lg",children:e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx(Y,{className:"w-10 h-10 opacity-80"}),e.jsxs("div",{className:"flex-1",children:[e.jsx("p",{className:"text-sm opacity-80",children:"التوتال النهائي للشيفت (شامل إجمالي نسبة طلبات المضافة)"}),e.jsxs("p",{className:"text-4xl font-bold mt-1",children:[u(t.total)," ",e.jsx("span",{className:"text-lg font-normal opacity-80",children:"ج.م"})]})]}),e.jsxs("div",{className:"text-sm opacity-80 text-end",children:[e.jsxs("div",{children:[n.length," فاتورة"]}),e.jsxs("div",{className:"text-xs text-emerald-300 font-bold mt-1",children:["مضاف عوائد طلبات: +",u(t.talabatCommission)," ج.م"]}),r.shift&&e.jsxs("div",{className:"mt-1",children:["الكاشير: ",r.shift.cashierName]})]})]})}),e.jsxs("div",{className:"bg-card border border-border rounded-xl overflow-hidden",children:[e.jsx("div",{className:"p-3 border-b border-border bg-secondary/40 text-sm font-medium",children:"فواتير الشيفت الحالي"}),e.jsxs("table",{className:"w-full text-sm",children:[e.jsx("thead",{className:"bg-secondary/20 text-xs",children:e.jsxs("tr",{children:[e.jsx("th",{className:"text-right p-2",children:"الوقت"}),e.jsx("th",{className:"text-right p-2",children:"النوع / المنصة"}),e.jsx("th",{className:"text-right p-2",children:"طاولة/عميل"}),e.jsx("th",{className:"text-right p-2",children:"الأصناف"}),e.jsx("th",{className:"text-right p-2",children:"الإجمالي"})]})}),e.jsx("tbody",{children:n.length===0?e.jsx("tr",{children:e.jsx("td",{colSpan:5,className:"p-6 text-center text-muted-foreground",children:"لا توجد فواتير في هذا الشيفت."})}):n.slice(0,50).map(a=>{const o=a.orderCategory||a.order_category||"normal";return e.jsxs("tr",{className:"border-t border-border",children:[e.jsx("td",{className:"p-2 text-xs text-muted-foreground",children:new Date(a.createdAt).toLocaleTimeString("ar-EG")}),e.jsx("td",{className:"p-2",children:o==="fast"?e.jsx("span",{className:"text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded text-xs border border-amber-200",children:"⚡ فاست فود"}):o==="talabat"?e.jsx("span",{className:"text-pink-600 font-bold bg-pink-50 px-2 py-0.5 rounded text-xs border border-pink-200",children:"🛍️ طلبات (+15%)"}):a.type==="delivery"?e.jsx("span",{className:"text-amber-600 font-medium",children:"توصيل 🛵"}):a.type==="takeaway"?e.jsx("span",{className:"text-green-600 font-medium",children:"تيك أواي 🛍️"}):e.jsx("span",{className:"text-blue-600 font-medium",children:"صالة 🍽️"})}),e.jsx("td",{className:"p-2 font-mono",children:a.tableCode||a.customerName}),e.jsx("td",{className:"p-2",children:a.items.length}),e.jsx("td",{className:"p-2 font-bold",children:u(a.total)})]},a.id)})})]})]})]})}function i({icon:h,label:r,value:f,accent:n}){const t={emerald:"bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",orange:"bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300",rose:"bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",purple:"bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300",sky:"bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300",indigo:"bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300",slate:"bg-slate-50 text-slate-700 dark:bg-slate-950/40 dark:text-slate-300",amber:"bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"};return e.jsxs("div",{className:"bg-card border border-border rounded-xl p-4 flex flex-col justify-between",children:[e.jsx("div",{className:`w-10 h-10 rounded-lg grid place-items-center ${t[n]}`,children:e.jsx(h,{className:"w-5 h-5"})}),e.jsxs("div",{children:[e.jsx("p",{className:"text-xs text-muted-foreground mt-2",children:r}),e.jsxs("p",{className:"text-xl font-bold mt-1",children:[u(f)," ",e.jsx("span",{className:"text-xs font-normal text-muted-foreground",children:"ج.م"})]})]})]})}function B({icon:h,label:r,value:f,commission:n,count:t,accent:I}){const a={orange:"bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300"};return e.jsxs("div",{className:"bg-card border-1 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden",children:[e.jsxs("div",{className:"flex justify-between items-start",children:[e.jsx("div",{className:`w-10 h-10 rounded-lg grid place-items-center ${a[I]||a.orange}`,children:e.jsx(h,{className:"w-5 h-5"})}),e.jsx("span",{className:"text-[11px] font-extrabold bg-pink-50 text-pink-700 px-2 py-1 rounded-md border border-pink-200",children:u(n)})]}),e.jsxs("div",{className:"mt-2",children:[e.jsxs("div",{className:"flex justify-between items-baseline",children:[e.jsx("p",{className:"text-xs font-bold text-foreground",children:r}),e.jsxs("span",{className:"text-[10px] text-muted-foreground",children:["(",t," أوردر)"]})]}),e.jsxs("p",{className:"text-xl font-black mt-1 text-primary",children:[u(f)," ",e.jsx("span",{className:"text-xs font-normal text-muted-foreground",children:"ج.م"})]})]})]})}export{ne as component};
