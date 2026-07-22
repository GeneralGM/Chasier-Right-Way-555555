import{c as xe,j as e,r as p,S as he,I as fe,f,B as J,u as ge,a as h,D as ye,b as Ne,d as je,e as we,g as ve,t as ke,h as Se}from"./index-BA0iVfkR.js";import{u as me}from"./pos-store-C4wZgZjD.js";import{u as le,w as $e}from"./xlsx-BojT3SgY.js";import{R as oe,W as Ce,C as De,S as ne,B as Ae,D as ce,M as Fe,P as Te,a as _e}from"./wine-DOano8FQ.js";import{D as Ie}from"./download-DHZyugg8.js";import{P as pe}from"./printer-DMHfj01S.js";import{C as Pe}from"./chef-hat-DcETGZOD.js";const Le=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M12 6v6l4 2",key:"mmk7yg"}]],ue=xe("clock",Le);const Ee=[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M12 16v-4",key:"1dtifu"}],["path",{d:"M12 8h.01",key:"e9boi3"}]],Ve=xe("info",Ee),Me=({size:t=24,color:c="#FF6B35"})=>e.jsxs("svg",{width:t,height:t,viewBox:"0 0 24 24",fill:"none",xmlns:"http://www.w3.org/2000/svg",children:[e.jsx("path",{d:"M13 2L3 14H9L11 22L21 10H15L13 2Z",fill:c,stroke:c,strokeWidth:"1",strokeLinejoin:"round"}),e.jsx("circle",{cx:"12",cy:"12",r:"10",fill:"none",stroke:c,strokeWidth:"0.5",opacity:"0.3"})]}),We=({size:t=24,color:c="#00A859"})=>e.jsxs("svg",{width:t,height:t,viewBox:"0 0 24 24",fill:"none",xmlns:"http://www.w3.org/2000/svg",children:[e.jsx("path",{d:"M7 3H17C18.1046 3 19 3.89543 19 5V19C19 20.1046 18.1046 21 17 21H7C5.89543 21 5 20.1046 5 19V5C5 3.89543 5.89543 3 7 3Z",stroke:c,strokeWidth:"1.5",strokeLinejoin:"round"}),e.jsx("path",{d:"M8 3C8 1.5 9 1 12 1C15 1 16 1.5 16 3",stroke:c,strokeWidth:"1.5",strokeLinecap:"round"}),e.jsx("line",{x1:"8",y1:"8",x2:"16",y2:"8",stroke:c,strokeWidth:"1",opacity:"0.5"}),e.jsx("line",{x1:"8",y1:"14",x2:"16",y2:"14",stroke:c,strokeWidth:"1",opacity:"0.5"})]}),de=Se(),Oe=t=>{const c=window.open("","_blank","width=650,height=850");if(!c)return;const d=Number(t.deliveryPrice)||Number(t.delivery_price)||0,g=Number(t.taxValue)||Number(t.tax_value)||0,y=Number(t.discountValue)||Number(t.discount_value)||0,S=y||Number(t.subtotal||0)*Number(t.discountPct||t.discount_pct||0)/100||0,w=g||(Number(t.subtotal||0)-y)*Number(t.taxPct||t.tax_pct||0)/100||0,$=Number(t.total)||Number(t.subtotal||0)-y+w+d,E=typeof t.items=="string"?JSON.parse(t.items):t.items||[],N=Number(t.commissionValue)||Number(t.commission_value)||0,F=t.type==="delivery"?"توصيل (Delivery)":t.type==="takeaway"?"تيك أواي (Takeaway)":"صالة (Dine-In)",V=t.createdAt?new Date(t.createdAt).toLocaleDateString("ar-EG",{year:"numeric",month:"2-digit",day:"2-digit"}):new Date().toLocaleDateString("ar-EG"),z=t.createdAt?new Date(t.createdAt).toLocaleTimeString("ar-EG",{hour:"2-digit",minute:"2-digit",hour12:!0}):new Date().toLocaleTimeString("ar-EG",{hour:"2-digit",minute:"2-digit"}),M=t.cashierName||t.cashier_name||"...........",T=t.captainName||t.captain_name||t.captain||"—",v=t.table_name||t.tableCode||"...........",r=`
    <!doctype html>
    <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>فاتورة - مول زايد</title>
        <script src="https://cdn.tailwindcss.com"><\/script>
        <style>
          @media print {
            body {
              background: white;
              margin: 0;
              padding: 0;
            }
            .receipt-container {
              box-shadow: none;
              max-width: 100%;
              padding: 10px;
            }
              /* لمنع تكررا راس الجدول  */ 
            thead {
              display: table-row-group !important;
            }
          }
          body {
            background-color: #f5f5f5;
            direction: rtl;
            font-family: Arial, sans-serif;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .separator-line {
            border-top: 1px dashed #333;
            margin: 12px 0;
          }
          .separator-solid {
            border-top: 2px solid #000;
            margin: 16px 0;
          }
        </style>
      </head>
      <body class="p-4">
        <div class="receipt-container bg-white rounded-lg shadow-lg px-8 py-10 max-w-2xl mx-auto">
          
          <div class="mb-6 text-right">
            <div class="flex items-center justify-between mb-4">
              <div class="text-right">
                <div class="text-5xl font-bold text-black mb-1">مول زايد</div>
                <div class="text-sm text-gray-800">عنوان المطعم - مدينة طنطا</div>
              </div>
              <img
                class="h-16 w-16 ml-4"
                src="../.././public/favicon.ico"
                alt="Logo"
              />
            </div>
          </div>

          <div class="separator-solid"></div>

          <div class="text-center mb-6">
            <h2 class="text-2xl font-bold bg-gray-100 py-2 rounded-xl ">
              ${F}
            </h2>
          </div>

          <div class="grid grid-cols-2 gap-4 mb-6 text-center text-sm">

            <div>
              <div class="text-gray-500 mb-0.5">التاريخ</div>
              <div class="font-bold text-black text-xs">${V} </div>
            </div>
            <div>
              <div class="text-gray-500 mb-0.5">التاريخ</div>
              <div class="font-bold text-black text-xs">${z}</div>
            </div>
            <div>
            <div>
              <div class="text-gray-500 mb-0.5">اسم الطاولة / الطلب</div>
              <div class="font-bold text-black border-b border-gray-300 pb-1">
                ${v.length>3?v.substring(0,3)+"...":v}
              </div>
            </div>
            </div>
            <div>
              <div class="text-gray-500 mb-0.5">اسم الكاشير</div>
              <div class="font-bold text-black border-b border-gray-300 pb-1">
                ${M}
              </div>
            </div>
          </div>
          <!-- ✨ الجزء الجديد الخاص بالكابتن -->
          ${t.type==="dinein"?`
              <div>
                <div class="text-gray-500 mb-0.5">اسم الكابتن</div>
                <div class="font-bold text-black border-b border-gray-300 pb-1">
                  ${T}
                </div>
              </div>
              `:""}


          ${(t.type==="takeaway"||t.type==="delivery")&&t.orderCategory&&t.orderCategory!=="normal"?`
              <div class="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-2.5 text-center text-xs font-bold mb-4">
                منصة التوصيل: 
                <span>
                  ${t.orderCategory==="talabat"?"طلبات (Talabat)":t.orderCategory==="fast"?"فاست (Fast)":t.orderCategory}
                </span>
              </div>
              `:""}

          <div class="separator-line"></div>

          <div class="mb-6">
          <table class="w-full table-fixed text-center text-sm mb-4">
            <thead>
              <tr class="border-b border-gray-300">
                <th class="w-[22%] text-gray-800 font-bold py-3 text-xs text-center whitespace-nowrap">الإجمالي</th>
                <th class="w-[20%] text-gray-800 font-bold py-3 text-xs text-center whitespace-nowrap">السعر</th>
                <th class="w-[13%] text-gray-800 font-bold py-3 text-xs text-center whitespace-nowrap">الكمية</th>
                <th class="w-[45%] text-gray-800 font-bold py-3 text-xs text-center whitespace-nowrap">الصنف</th>
              </tr>
            </thead>
            <tbody>
              ${E.map(m=>{const s=m.extras&&m.extras.length?` <span class="text-xs text-gray-500 block mt-0.5 font-normal break-words whitespace-normal leading-relaxed">(+ ${m.extras.map(n=>n.name||n.label).join(", ")})</span>`:"",x=m.mealName||m.name||"صنف غير معروف",l=Number(m.unitPrice||m.price||0)+(m.extras?m.extras.reduce((n,u)=>n+Number(u.price||0),0):0);return`
                  <tr class="border-b border-gray-200">
                    <td class="py-3 text-gray-700 text-center font-medium whitespace-nowrap">${(l*Number(m.qty||1)).toFixed(0)}</td>
                    <td class="py-3 text-gray-700 text-center whitespace-nowrap">${l.toFixed(0)}</td>
                    <td class="py-3 text-gray-700 text-center font-bold whitespace-nowrap">${m.qty}</td>
                    
                    <td class="py-3 text-gray-800 font-bold text-center break-words whitespace-normal pr-1 leading-tight">
                      ${x}
                      ${s}
                    </td>
                  </tr>
                  `}).join("")}
            </tbody>
          </table>
          </div>

          <div class="separator-solid"></div>

          <div class="mb-6 space-y-2.5 text-sm">
            <div class="flex justify-between items-center">
              <span class="text-gray-800 font-bold">المجموع الأصلي:</span>
              <span class="text-gray-700 font-semibold">${Number(t.subtotal||0).toFixed(2)}</span>
            </div>
            
            ${S>0?`
                <div class="flex justify-between items-center text-red-600 font-bold">
                  <span>الخصم (${t.discountPct||0}%):</span>
                  <span>-${S.toFixed(2)}</span>
                </div>
                `:""}
            
            ${w>0?`
                <div class="flex justify-between items-center text-gray-700">
                  <span>الضريبة (${t.taxPct||0}%):</span>
                  <span>${w.toFixed(2)}</span>
                </div>
                `:""}

            ${N>0?`
                <div class="flex justify-between items-center text-amber-700 font-bold">
                  <span>منصة (${t.orderCategory==="talabat"?"طلبات":"فاست"}):</span>
                  <span>+${N.toFixed(2)}</span>
                </div>
                `:""}

            ${d>0?`
                <div class="flex justify-between items-center text-gray-700 font-semibold">
                  <span>خدمة التوصيل:</span>
                  <span>+${d.toFixed(2)}</span>
                </div>
                `:""}

            <div class="flex justify-between items-center text-xl font-black border-t border-b border-gray-300 py-3.5 mt-2">
              <span class="text-black">الإجمالي الكلي:</span>
              <span class="text-black text-2xl">${$.toFixed(2)}</span>
            </div>
          </div>


          <div class="grid grid-cols-1 gap-6 mb-6 text-right text-xs">
            <div>
              <div class="font-bold text-gray-800 mb-2 uppercase">أرقام التواصل</div>
              <div class="space-y-1 text-gray-600">
                <div>☎ +20 123 456 7890</div>
              </div>
            </div>
            
          </div>
          
          <div class="text-center mt-4">
            <div class="text-sm font-black text-gray-800 mb-2">
              شكراً لاختيارك.. نرجو أن نكون قد نلنا اعجابكم 🙏
            </div>
          </div>

          </div>

        <script>
          window.onload = function() {
            setTimeout(() => {
              window.print();
              // نغلق النافذة المنبثقة تلقائياً بعد انتهاء أمر الطباعة أو إلغائه
              window.close();
            }, 300);
          }
        <\/script>
      </body>
    </html>
  `;c.document.open(),c.document.write(r),c.document.close()};function Ke(){const[t,c]=p.useState("invoices");return e.jsxs("div",{dir:"rtl",className:"space-y-4",children:[e.jsxs("div",{children:[e.jsxs("h1",{className:"text-2xl font-bold flex items-center gap-2",children:[e.jsx(he,{className:"w-6 h-6"})," الإعدادات"]}),e.jsx("p",{className:"text-sm text-muted-foreground",children:"أرشيف الفواتير وإعدادات النظام."})]}),e.jsxs("div",{className:"flex gap-1 bg-secondary p-1 rounded-lg w-fit",children:[e.jsxs("button",{onClick:()=>c("invoices"),className:`px-4 h-9 rounded-md text-sm font-medium flex items-center gap-2 ${t==="invoices"?"bg-card shadow-sm":"text-muted-foreground"}`,children:[e.jsx(oe,{className:"w-4 h-4"})," الفواتير"]}),e.jsxs("button",{onClick:()=>c("shifts"),className:`px-4 h-9 rounded-md text-sm font-medium flex items-center gap-2 ${t==="shifts"?"bg-card shadow-sm":"text-muted-foreground"}`,children:[e.jsx(ue,{className:"w-4 h-4"})," الشيفتات"]})]}),t==="invoices"&&e.jsx(Be,{}),t==="shifts"&&e.jsx(Ge,{})]})}function Be(){const{db:t}=me(),[c,d]=p.useState(""),[g,y]=p.useState(new Date().toISOString().slice(0,10)),[S,w]=p.useState(new Date().toISOString().slice(0,10)),[$,E]=p.useState("all"),[N,F]=p.useState("all"),[V,z]=p.useState([]),[M,T]=p.useState(!1);p.useEffect(()=>{async function s(){try{T(!0);const x=new Date(g);x.setHours(0,0,0,0);const l=new Date(S);l.setHours(23,59,59,999);const a=await fetch(`http://${de}:5000/api/invoices?startDate=${x.toISOString()}&endDate=${l.toISOString()}`);if(a.ok){const n=await a.json();z(n)}}catch(x){console.error("❌ خطأ أثناء جلب الفواتير من الأرشيف:",x)}finally{T(!1)}}s()},[g,S]);const v=p.useMemo(()=>{const s=new Map;return t.invoices.forEach(l=>s.set(l.id,l)),V.forEach(l=>s.set(l.id,l)),Array.from(s.values()).sort((l,a)=>a.createdAt-l.createdAt).filter(l=>{if($!=="all"){const a=(l.tableCode||"").trim().toUpperCase(),n=l.type||"";if($==="takeaway"){if(n!=="takeaway"&&n!=="delivery"&&!a.startsWith("TAK")&&!a.startsWith("DEL")&&!a.startsWith("T")&&!a.startsWith("D"))return!1}else if($==="X"){if(!a.startsWith("X")&&n!=="staff"&&n!=="hospitality"&&l.zone!=="others")return!1}else if(!a.startsWith($.toUpperCase()))return!1}if(N!=="all"){const a=Number(l.total)||0;if(N==="lt200"&&a>=200||N==="200-500"&&(a<200||a>500)||N==="500-700"&&(a<500||a>700)||N==="700-1000"&&(a<700||a>1e3)||N==="gt1000"&&a<=1e3)return!1}return!(c&&!`${l.invoiceNumber||""} ${l.tableCode||""} ${l.customerName||""} ${l.customerAddress||""}`.toLowerCase().includes(c.toLowerCase()))})},[t.invoices,V,$,N,c]),r=p.useMemo(()=>{const s=v.length,x=v.reduce((l,a)=>l+(Number(a.total)||0),0);return{count:s,sum:x}},[v]);function m(){const s=v.map(n=>{const u=t.shifts.find(b=>n.createdAt>=b.openedAt&&(!b.closedAt||n.createdAt<=b.closedAt));return{"الأصناف المباعة":n.items?.map(b=>`${b.name}×${b.qty}`).join(" , ")||"",الشيفت:u?`${u.cashierName} (${new Date(u.openedAt).toLocaleDateString("ar-EG")})`:"—",التاريخ:new Date(n.createdAt).toLocaleString("ar-EG"),"المجموع النهائي":f(n.total),"نوع الطلب":n.type==="staff"?"موظفين":n.type==="hospitality"?"ضيافة":n.type,"رقم الطاولة":n.tableCode||"تيك أواي"}}),x=le.json_to_sheet(s);x["!cols"]=[{wch:60},{wch:30},{wch:25},{wch:15},{wch:15},{wch:15}],x["!dir"]="rtl";const l=le.book_new();le.book_append_sheet(l,x,"الفواتير");const a=`فواتير_أرشيف_${new Date().toISOString().slice(0,10)}.xlsx`;$e(l,a)}return e.jsxs("div",{className:"space-y-3",children:[e.jsxs("div",{className:"bg-card p-2.5 rounded-xl border border-border shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5",children:[e.jsx("div",{className:"relative flex-1 min-w-[220px]",children:e.jsx(fe,{dir:"rtl",placeholder:"ابحث برقم الفاتورة، الطاولة، العميل...",value:c,onChange:s=>d(s.target.value),className:"pe-9 h-9 text-xs bg-secondary/30 focus:bg-background transition-colors"})}),e.jsxs("div",{className:"flex flex-wrap items-center gap-2",children:[e.jsxs("select",{value:$,onChange:s=>E(s.target.value),className:"h-9 px-2.5 rounded-lg border border-input bg-secondary/50 text-xs font-bold text-foreground focus:ring-2 focus:ring-primary outline-none cursor-pointer",children:[e.jsx("option",{value:"all",children:"🌐 كل المناطق"}),e.jsx("option",{value:"C",children:"🔒 صالة (C)"}),e.jsx("option",{value:"O",children:"☀️ صالة (O)"}),e.jsx("option",{value:"X",children:"👥 داخلي / موظفين (X)"}),e.jsx("option",{value:"K",children:"🧸 أطفال (K)"}),e.jsx("option",{value:"ص",children:"🏠 قاعة صغيرة (ص)"}),e.jsx("option",{value:"ك",children:"🏛️ قاعة كبيرة (ك)"}),e.jsx("option",{value:"takeaway",children:"🛍️ تيك أواي / دليفري"})]}),e.jsxs("select",{value:N,onChange:s=>F(s.target.value),className:"h-9 px-2.5 rounded-lg border border-input bg-secondary/50 text-xs font-bold text-foreground focus:ring-2 focus:ring-primary outline-none cursor-pointer",children:[e.jsx("option",{value:"all",children:"💰 كل المبالغ"}),e.jsx("option",{value:"lt200",children:"🔻 أقل من 200 ج.م"}),e.jsx("option",{value:"200-500",children:"💵 200 : 500 ج.م"}),e.jsx("option",{value:"500-700",children:"💵 500 : 700 ج.م"}),e.jsx("option",{value:"700-1000",children:"💵 700 : 1000 ج.م"}),e.jsx("option",{value:"gt1000",children:"💎 أكبر من 1000 ج.م"})]}),e.jsxs("div",{className:"flex items-center gap-1 bg-secondary/50 rounded-lg p-1 px-2 border border-input",children:[e.jsx("span",{className:"text-[11px] font-bold text-muted-foreground",children:"من:"}),e.jsx("input",{type:"date",value:g,onChange:s=>y(s.target.value),className:"h-7 text-xs rounded bg-background border-none px-1 text-primary font-bold cursor-pointer outline-none"}),e.jsx("span",{className:"text-[11px] font-bold text-muted-foreground",children:"إلى:"}),e.jsx("input",{type:"date",value:S,onChange:s=>w(s.target.value),className:"h-7 text-xs rounded bg-background border-none px-1 text-primary font-bold cursor-pointer outline-none"})]})]})]}),e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-3 bg-secondary/20 p-2 rounded-xl border border-border/60",children:[e.jsxs("div",{className:"flex items-center gap-4 px-2",children:[e.jsxs("div",{className:"flex items-center gap-1.5 text-xs",children:[e.jsx("span",{className:"text-muted-foreground font-semibold",children:"عدد الفواتير:"}),e.jsx("span",{className:"font-extrabold bg-primary/10 text-primary px-2 py-0.5 rounded-md font-mono",children:r.count})]}),e.jsx("div",{className:"h-4 w-[1px] bg-border"}),e.jsxs("div",{className:"flex items-center gap-1.5 text-xs",children:[e.jsx("span",{className:"text-muted-foreground font-semibold",children:"الإجمالي النهائي:"}),e.jsxs("span",{className:"font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-md font-mono",children:[f(r.sum)," ج.م"]})]})]}),e.jsxs(J,{variant:"outline",size:"sm",onClick:m,className:"gap-1.5 h-8 text-xs font-bold bg-card hover:bg-secondary shadow-sm",children:[e.jsx(Ie,{className:"w-3.5 h-3.5 text-emerald-600"})," تصدير Excel"]})]}),e.jsx("div",{className:"bg-card border border-border rounded-xl overflow-hidden shadow-sm",children:e.jsxs("table",{className:"w-full text-sm",children:[e.jsx("thead",{className:"bg-secondary/60 text-xs",children:e.jsxs("tr",{children:[e.jsx("th",{className:"text-center p-3",children:"رقم الفاتورة"}),e.jsx("th",{className:"text-center p-3",children:"التاريخ والوقت"}),e.jsx("th",{className:"text-center p-3",children:"نوع الطلب"}),e.jsx("th",{className:"text-center p-3",children:"الطاولة"}),e.jsx("th",{className:"text-center p-3",children:"الكاشير"}),e.jsx("th",{className:"text-center p-3",children:"الأصناف"}),e.jsx("th",{className:"text-center p-3",children:"المجموع"}),e.jsx("th",{className:"text-center p-3",children:"الخصم"}),e.jsx("th",{className:"text-center p-3 text-purple-600 font-bold",children:"الضريبة / المنصة"}),e.jsx("th",{className:"text-center p-3 text-blue-600 font-bold",children:"الكابتن / التوصيل"}),e.jsx("th",{className:"text-center p-3 text-emerald-600 font-bold",children:"الإجمالي النهائي"}),e.jsx("th",{className:"text-center p-3",children:"طباعة"})]})}),e.jsx("tbody",{children:M?e.jsx("tr",{children:e.jsx("td",{colSpan:12,className:"p-8 text-center text-amber-600 font-medium animate-pulse",children:"جاري جلب الفواتير من الأرشيف (pgAdmin)..."})}):v.length===0?e.jsx("tr",{children:e.jsx("td",{colSpan:12,className:"p-8 text-center text-muted-foreground",children:"لا توجد فواتير مطابقة للفلاتر المحددة حالياً."})}):v.map(s=>e.jsxs("tr",{className:"border-t border-border hover:bg-secondary/30 transition-colors",children:[e.jsx("td",{className:"p-3 font-mono text-center text-xs font-bold",children:s.invoiceNumber||"-"}),e.jsx("td",{className:"p-3 font-mono text-center text-xs",dir:"ltr",children:new Date(s.createdAt).toLocaleString("en-GB",{hour:"2-digit",minute:"2-digit",hour12:!0,day:"2-digit",month:"2-digit"}).replace(","," ||")}),e.jsx("td",{className:"p-3 text-right text-xs",children:s.orderCategory==="talabat"?e.jsxs("span",{className:"inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-amber-100 text-amber-900 font-semibold text-sm border border-amber-300",children:[e.jsx(We,{size:16,color:"#FF5E00"})," طلبات"]}):s.orderCategory==="fast"?e.jsxs("span",{className:"inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-amber-100 text-amber-900 font-semibold text-sm border border-amber-300",children:[e.jsx(Me,{size:16,color:"#FF5E00"})," فاست"]}):s.type==="delivery"?e.jsx("span",{className:"px-2 py-1 rounded bg-amber-100 text-amber-800 font-medium",children:"توصيل 🛵"}):s.type==="takeaway"?e.jsx("span",{className:"px-2 py-1 rounded bg-green-100 text-green-800 font-medium",children:"تيك أواي 🛍️"}):s.type==="staff"?e.jsx("span",{className:"px-2 py-1 rounded bg-purple-100 text-purple-800 font-bold",children:"موظفين 👤"}):s.type==="hospitality"?e.jsx("span",{className:"px-2 py-1 rounded bg-pink-100 text-pink-800 font-bold",children:"ضيافة ☕"}):e.jsx("span",{className:"px-2 py-1 rounded bg-blue-100 text-blue-800 font-medium",children:"صالة 🍽️"})}),e.jsx("td",{className:"p-3 text-center",children:s.type==="takeaway"||s.type==="delivery"?e.jsxs("div",{children:[e.jsx("div",{className:"font-medium",children:s.customerName||"عميل نقدي"}),s.customerAddress&&e.jsx("div",{className:"text-xs text-muted-foreground truncate max-w-[150px]",children:s.customerAddress})]}):e.jsx("span",{className:"font-mono font-bold text-primary text-base",children:s.tableCode||"—"})}),e.jsx("td",{className:"p-3 text-center text-muted-foreground text-xs font-medium",children:s.cashierName||"—"}),e.jsx("td",{className:"p-3 text-center font-bold text-center",children:(typeof s.items=="string"?JSON.parse(s.items):s.items||[]).reduce((x,l)=>x+(Number(l.qty)||1),0)}),e.jsx("td",{className:"p-3 text-center font-medium",children:f(s.subtotal)}),e.jsxs("td",{className:"p-3 text-center text-xs",children:[Math.floor(+f(s.discountPct||s.discount_pct||0)),"% ≈ ",e.jsx("span",{className:"text-red-600 font-bold",children:f(s.discountValue||s.discount_value||0)})]}),e.jsx("td",{className:"p-3 text-center",children:s.commissionValue?e.jsx("span",{className:"text-purple-600 font-bold text-sm",children:f(s.commissionValue)}):e.jsx("span",{className:"text-blue-600 font-medium text-sm",children:f(s.taxValue||s.tax_value||0)})}),e.jsx("td",{className:"p-3 text-center font-bold text-xs",children:s.type==="delivery"||s.type==="takeaway"?e.jsx("span",{className:"text-amber-600",children:s.deliveryPrice&&s.deliveryPrice>0?`+${f(s.deliveryPrice)} ج.م`:"—"}):e.jsx("span",{className:"text-blue-600",children:s.captainName||s.captain_name||s.captain||"—"})}),e.jsx("td",{className:"p-3 text-center font-black text-emerald-600 text-base",children:f(s.total)}),e.jsx("td",{className:"p-3 text-center",children:e.jsxs(J,{variant:"outline",size:"sm",onClick:()=>Oe(s),className:"gap-1.5 h-8 font-bold",children:[e.jsx(pe,{className:"w-3.5 h-3.5"})," طباعة"]})})]},s.id))})]})})]})}function Ge(){const{db:t}=me(),{db:c}=ge(),[d,g]=p.useState(null),[y,S]=p.useState(()=>{const r=new Date;return r.setDate(r.getDate()-1),r.toISOString().slice(0,10)}),[w,$]=p.useState(new Date().toISOString().slice(0,10)),[E,N]=p.useState([]),[F,V]=p.useState([]),[z,M]=p.useState(!1);p.useEffect(()=>{async function r(){try{M(!0);const m=new Date(y);m.setHours(0,0,0,0);const s=new Date(w);s.setHours(23,59,59,999);const x=m.toISOString(),l=s.toISOString(),[a,n]=await Promise.all([fetch(`http://${de}:5000/api/shifts?startDate=${x}&endDate=${l}`),fetch(`http://${de}:5000/api/invoices?startDate=${x}&endDate=${l}`)]);if(a.ok&&n.ok){const u=await a.json(),j=await n.json();Array.isArray(u)&&N(u),Array.isArray(j)&&V(j)}}catch(m){console.error("❌ خطأ أثناء جلب الشيفتات من قاعدة البيانات:",m)}finally{M(!1)}}r()},[y,w]);const T=p.useMemo(()=>{const r=new Map;E.forEach(a=>r.set(a.id,a)),t.shifts.forEach(a=>r.set(a.id,a));const m=Array.from(r.values()),s=new Map;F.forEach(a=>s.set(a.id,a)),t.invoices.forEach(a=>s.set(a.id,a));const x=Array.from(s.values());return[...m].sort((a,n)=>(n.closedAt||0)-(a.closedAt||0)).map(a=>{const n=x.filter(i=>!(i.createdAt<a.openedAt||a.closedAt&&i.createdAt>a.closedAt));let u=Number(a.kitchenSales)||0,j=Number(a.barSales)||0,b=Number(a.shishaSales)||0,W=Number(a.takeawaySales)||0,_=Number(a.deliverySales)||0,I=Number(a.taxValue||a.tax_value)||0,A=Number(a.discountValue||a.discount_value)||0,P=u+j+b,O=0,H=0,q=0,B=0,K=0,Z=0;if(n.length>0&&c.meals&&c.meals.length>0){u=0,j=0,b=0,W=0,_=0,P=0,A=0,I=0;for(const i of n){P+=i.subtotal,A+=Number(i.discountValue||i.discount_value)||0;const re=Number(i.discountValue||i.discount_value)||0,R=Number(i.taxPct||i.tax_pct)||0;I+=Number(i.taxValue||i.tax_value)||(Number(i.subtotal)-re)*R/100||0;const Y=Number(i.deliveryPrice)||0;i.type==="takeaway"?W+=i.total-Y:i.type==="delivery"&&(_+=i.total-Y);const o=i.orderCategory||i.order_category||"normal";o==="fast"?(O+=i.total,H++,q+=Number(i.commissionValue||i.commission_value||0)):o==="talabat"&&(B+=i.total,K++,Z+=Number(i.commissionValue||i.commission_value||0));for(const D of i.items){const L=c.meals.find(G=>G.id===D.mealId),ee=D.extras?.reduce((G,U)=>G+Number(U.price||0),0)||0,te=(Number(D.unitPrice||D.price||0)+ee)*Number(D.qty||1);let k=D.department||"مطبخ";L&&(L.department==="شيشه"||(L.category||"").trim().replace("ة","ه")==="شيشه"?k="شيشة":L.department&&(k=L.department)),k.includes("شيش")?b+=te:k.includes("بار")?j+=te:u+=te}}}const Q=u+j+b+I-A;return{shift:a,invoiceCount:n.length||Number(a.invoice_count)||0,kitchen:h(u),bar:h(j),shisha:h(b),takeaway:h(W),delivery:h(_),deliveryFees:h(Number(a.deliverySales)||0),subtotal:h(P),discount:h(A),tax:h(I),total:h(Q),revenues:h(Q),fastTotal:h(O),fastCount:H,fastCommission:h(q),talabatTotal:h(B),talabatCount:K,talabatCommission:h(Z)}})},[t.shifts,E,t.invoices,F,c.meals]),v=(r,m)=>{let s=0,x=0,l=0,a=0,n=0,u=0,j=0,b=0,W=0,_=0,I=0,A=0,P=0,O=0,H=0,q=0,B=0;m.forEach(o=>{o.type==="dinein"||o.type==="dine-in"?s+=Number(o.total)||0:o.type==="takeaway"?x+=Number(o.total)||0:o.type==="delivery"?l+=Number(o.total)||0:o.type==="staff"||o.type==="موظفين"?a+=Number(o.total)||0:(o.type==="hospitality"||o.type==="ضيافة")&&(n+=Number(o.total)||0),u+=Number(o.subtotal)||0;const D=Number(o.discountValue||o.discount_value)||0;j+=D;const L=Number(o.taxPct||o.tax_pct)||0;b+=Number(o.taxValue||o.tax_value)||(Number(o.subtotal)-D)*L/100||0,W+=Number(o.deliveryPrice||o.delivery_price)||0;const ee=o.orderCategory||o.order_category||"normal";ee==="fast"?H+=Number(o.total)||0:ee==="talabat"&&(q+=Number(o.total)||0,B+=Number(o.commissionValue||o.commission_value||0)),o.paymentMethod==="visa"||o.paymentMethod==="فيزا"?I+=Number(o.total)||0:_+=Number(o.total)||0,(typeof o.items=="string"?JSON.parse(o.items):o.items||[]).forEach(k=>{const G=k.extras?.reduce((ae,be)=>ae+Number(be.price||0),0)||0,U=(Number(k.unitPrice||k.price||0)+G)*Number(k.qty||1),X=c.meals?.find(ae=>ae.id===k.mealId);let se=k.department||"مطبخ";X&&(X.department==="شيشه"||(X.category||"").trim().replace("ة","ه")==="شيشه"?se="شيشة":X.department&&(se=X.department)),se.includes("شيش")?O+=U:se.includes("بار")?P+=U:A+=U})});const K=A+P+O+B+b-j,Z=r.openedAt?new Date(r.openedAt).toLocaleString("ar-EG"):"غير محدد",Q=r.closedAt?new Date(r.closedAt).toLocaleString("ar-EG"):"ما زال مفتوحاً",re=(Number(r.startingCash)||Number(r.initialCash)||0)+_,R=window.open("","_blank","width=600,height=800");if(!R){ke.error("يرجى السماح بالنوافذ المنبثقة (Pop-ups) للطباعة");return}const Y=`
      <html dir="rtl">
        <head>
          <title>تقرير الوردية</title>
          <style>
            @page { margin: 0; size: auto; }
            body { font-family: 'Segoe UI', Tahoma, sans-serif; width: 100%; max-width: 80mm; margin: 0 auto; padding: 10px 5px; color: #000; font-size: 13px; line-height: 1.5; }
            h2 { text-align: center; margin: 0 0 10px 0; font-size: 18px; font-weight: bold; text-decoration: underline; }
            .header-box { border: 1.5px solid #000; padding: 6px; margin-bottom: 12px; font-size: 12px; font-weight: bold; }
            .header-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 13px; }
            th, td { border: 1.5px solid #000; padding: 5px; }
            td:first-child { width: 65%; font-weight: bold; }
            td:last-child { width: 35%; text-align: center; font-family: monospace; font-size: 14px;}
            .table-header { text-align: center !important; background-color: #f0f0f0 !important; font-weight: bold; font-size: 14px; }
            .bold { font-weight: bold; }
          </style>
        </head>
        <body onload="setTimeout(() => { window.print(); window.close(); }, 500);">
          
          <h2>تقرير وردية</h2>
          
          <div class="header-box">
            <div class="header-row"><span>من:</span><span dir="ltr">${Z}</span></div>
            <div class="header-row"><span>إلى:</span><span dir="ltr">${Q}</span></div>
            <div class="header-row"><span>الكاشير:</span><span>${r.cashierName||r.cashier_name||"غير معروف"}</span></div> 
          </div>
            
          <table>
            <tr><td colspan="2" class="table-header">إيرادات الأقسام</td></tr>
            <tr><td>إجمالي المطبخ</td><td class="bold">${A.toFixed(2)}</td></tr>
            <tr><td>إجمالي البار</td><td class="bold">${P.toFixed(2)}</td></tr>
            <tr><td>إجمالي الشيشة</td><td class="bold">${O.toFixed(2)}</td></tr>
          </table>
            
          <table>
            <tr><td colspan="2" class="table-header">توزيع الطلبات والمنصات</td></tr>
            <tr><td>التيك أواي</td><td class="bold">${x.toFixed(2)}</td></tr>
            <tr><td>الدليفري</td><td class="bold">${l.toFixed(2)}</td></tr>
            <tr><td>فاست فود (مبيعات)</td><td class="bold">${H.toFixed(2)}</td></tr>
            <tr><td>طلبات Talabat (مبيعات)</td><td class="bold">${q.toFixed(2)}</td></tr>
            ${n>0?`<tr><td>ضيافة</td><td class="bold">${n.toFixed(2)}</td></tr>`:""}
            ${a>0?`<tr><td>وجبات موظفين</td><td class="bold">${a.toFixed(2)}</td></tr>`:""}
            <tr><td>رسوم التوصيل</td><td class="bold">${W.toFixed(2)}</td></tr>
          </table>
            
          <table>
            <tr><td colspan="2" class="table-header">المجموع النهائي</td></tr>
            <tr><td>إجمالي الضريبة</td><td class="bold">${b.toFixed(2)}</td></tr>
            <tr><td>إجمالي الخصم</td><td class="bold">${j.toFixed(2)}</td></tr>
            <tr><td>نسبة طالبات</td><td class="bold">${B.toFixed(2)}</td></tr>
            <tr style="background:#eee;"><td>الإيرادات الصافية (شاملة النسبة)</td><td class="bold">${K.toFixed(2)}</td></tr>
          </table>

          <table>
            <tr><td colspan="2" class="table-header">طرق الدفع</td></tr>
            <tr><td>كاش (نقدي)</td><td class="bold">${_.toFixed(2)}</td></tr>
            <tr><td>فيزا / بطاقة</td><td class="bold">${I.toFixed(2)}</td></tr>
          </table>

          <table>
            <tr style="background:#000; color:#fff;"><td>الرصيد المتوقع بالدرج</td><td class="bold">${re.toFixed(2)}</td></tr>
          </table>

        </body>
      </html>
    `;R.document.write(Y),R.document.close()};return e.jsxs("div",{className:"space-y-3",children:[e.jsxs("div",{className:"flex flex-wrap items-center gap-3 bg-secondary/30 p-2 rounded-xl border border-border w-fit",children:[e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("span",{className:"text-sm font-bold text-primary",children:"من تاريخ:"}),e.jsx("input",{type:"date",value:y,onChange:r=>S(r.target.value),className:"h-9 text-sm font-bold rounded-md bg-background border border-input px-2 cursor-pointer text-emerald-700"})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("span",{className:"text-sm font-bold text-primary",children:"إلى تاريخ:"}),e.jsx("input",{type:"date",value:w,onChange:r=>$(r.target.value),className:"h-9 text-sm font-bold rounded-md bg-background border border-input px-2 cursor-pointer text-emerald-700"})]})]}),e.jsx("div",{className:"bg-card border border-border rounded-xl overflow-hidden",children:e.jsxs("table",{className:"w-full text-sm",children:[e.jsx("thead",{className:"bg-secondary/50 text-xs",children:e.jsxs("tr",{children:[e.jsx("th",{className:"text-right p-3",children:"تاريخ ووقت الشيفت"}),e.jsx("th",{className:"text-right p-3",children:"الكاشير"}),e.jsx("th",{className:"text-right p-3",children:"عدد الفواتير"}),e.jsx("th",{className:"text-right p-3",children:"التوتال النهائي (Net Cash)"}),e.jsx("th",{className:"text-right p-3",children:"الإجراءات"})]})}),e.jsx("tbody",{children:z?e.jsx("tr",{children:e.jsx("td",{colSpan:5,className:"p-8 text-center text-amber-600 font-medium animate-pulse",children:"جاري استرجاع الورديات والتقارير من السيرفر (pgAdmin)..."})}):T.length===0?e.jsx("tr",{children:e.jsx("td",{colSpan:5,className:"p-8 text-center text-muted-foreground",children:"لا توجد شيفتات مسجلة."})}):T.map((r,m)=>e.jsxs("tr",{className:"border-t border-border",children:[e.jsxs("td",{className:"p-3 text-xs",children:[e.jsx("div",{children:new Date(Number(r.shift.openedAt)).toLocaleString("ar-EG")}),e.jsxs("div",{className:"text-muted-foreground",children:["إلى:"," ",r.shift.closedAt?new Date(Number(r.shift.closedAt)).toLocaleTimeString("ar-EG"):"الآن"]})]}),e.jsx("td",{className:"p-3 font-medium",children:r.shift.cashierName||r.shift.cashier_name||"Unkonwn يا يوسف"}),e.jsx("td",{className:"p-3",children:r.invoiceCount}),e.jsxs("td",{className:"p-3 font-bold text-emerald-600",children:[f(r.total)," ج.م"]}),e.jsx("td",{className:"p-3",children:e.jsxs("div",{className:"flex gap-1",children:[e.jsxs(J,{size:"sm",variant:"outline",onClick:()=>g(r),children:[e.jsx(Ve,{className:"w-3 h-3"}),e.jsx("span",{className:"mr-1",children:"التفاصيل"})]}),e.jsxs(J,{size:"sm",variant:"outline",onClick:()=>{const x=(t.invoices.length>0?t.invoices:F).filter(l=>!(l.createdAt<r.shift.openedAt||r.shift.closedAt&&l.createdAt>r.shift.closedAt));v(r.shift,x)},children:[e.jsx(pe,{className:"w-3 h-3"}),e.jsx("span",{className:"mr-1",children:"طباعة"})]})]})})]},m))})]})}),d&&e.jsx(ye,{open:!0,onOpenChange:()=>g(null),children:e.jsxs(Ne,{dir:"rtl",className:"max-w-5xl p-6 overflow-y-auto max-h-[90vh]",children:[e.jsx(je,{children:e.jsxs(we,{className:"text-xl font-bold flex items-center gap-2 border-b pb-3 text-primary",children:[e.jsx(ue,{className:"w-5 h-5 text-emerald-600"}),e.jsxs("span",{children:["تقرير تفاصيل وردية الكاشير: (",d.shift.cashierName,")"]})]})}),e.jsxs("div",{className:"bg-secondary/40 rounded-xl p-3 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs mb-4 border border-border",children:[e.jsxs("div",{children:[e.jsxs("span",{className:"font-semibold text-muted-foreground",children:["تاريخ ووقت الفتح:"," "]}),e.jsx("span",{className:"font-mono text-foreground",children:new Date(Number(d.shift.openedAt)).toLocaleString("ar-EG")})]}),e.jsxs("div",{children:[e.jsxs("span",{className:"font-semibold text-muted-foreground",children:["تاريخ ووقت الإغلاق:"," "]}),e.jsx("span",{className:"font-mono text-foreground",children:d.shift.closedAt?new Date(Number(d.shift.closedAt)).toLocaleString("ar-EG"):"لا يزال مفتوحاً الأن"})]})]}),e.jsxs("div",{className:"grid grid-cols-2 md:grid-cols-4 gap-3",children:[e.jsx(C,{icon:Pe,label:"المطبخ",value:d.kitchen,accent:"orange"}),e.jsx(C,{icon:Ce,label:"البار",value:d.bar,accent:"rose"}),e.jsx(C,{icon:De,label:"الشيشة",value:d.shisha,accent:"purple"}),e.jsx(ie,{icon:oe,label:"فاست (Fast)",value:d.fastTotal,commission:d.fastCommission,count:d.fastCount,accent:"amber"}),e.jsx(ie,{icon:ne,label:"طلبات (Talabat)",value:d.talabatTotal,commission:d.talabatCommission,count:d.talabatCount,accent:"orange"}),e.jsx(C,{icon:ne,label:"التيك أواي (إحصائية)",value:d.takeaway,accent:"sky"}),e.jsx(C,{icon:Ae,label:"أوردر التوصيل (إحصائية)",value:d.delivery,accent:"amber"}),e.jsx(C,{icon:ce,label:"رسوم التوصيل",value:d.deliveryFees,accent:"emerald"}),e.jsx(C,{icon:ce,label:"الإيرادات الأساسية",value:d.subtotal,accent:"slate"}),e.jsx(C,{icon:Fe,label:"الخصم",value:d.discount,accent:"rose"}),e.jsx(C,{icon:Te,label:"القيمة المضافة (14%)",value:d.tax,accent:"indigo"}),e.jsx(C,{icon:oe,label:"المجموع الكلي",value:d.subtotal+d.tax+d.deliveryFees,accent:"slate"})]}),e.jsxs("div",{className:"mt-5 bg-emerald-600 text-white rounded-xl p-4 flex items-center justify-between shadow-md",children:[e.jsxs("div",{className:"flex items-center gap-3",children:[e.jsx("div",{className:"w-12 h-12 rounded-lg bg-white/20 grid place-items-center",children:e.jsx(_e,{className:"w-6 h-6 text-white"})}),e.jsxs("div",{children:[e.jsx("p",{className:"text-sm font-medium text-emerald-100",children:"التوتال النهائي (Net Cash in Drawer)"}),e.jsxs("p",{className:"text-xs text-emerald-200 mt-0.5",children:["عدد الفواتير المسجلة: ",d.invoiceCount," فاتورة"]})]})]}),e.jsx("div",{className:"text-left",children:e.jsxs("p",{className:"text-2xl font-black",children:[f(d.total)," ",e.jsx("span",{className:"text-xs font-normal text-emerald-100",children:"ج.م"})]})})]}),e.jsx(ve,{className:"mt-4 border-t pt-3 flex gap-2 justify-end",children:e.jsx(J,{variant:"outline",onClick:()=>g(null),children:"إغلاق النافذة"})})]})})]})}function C({icon:t,label:c,value:d,accent:g}){const y={emerald:"bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",orange:"bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300",rose:"bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",purple:"bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300",sky:"bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300",indigo:"bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300",slate:"bg-slate-50 text-slate-700 dark:bg-slate-950/40 dark:text-slate-300",amber:"bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"};return e.jsxs("div",{className:"bg-card border border-border rounded-xl p-4",children:[e.jsx("div",{className:`w-10 h-10 rounded-lg grid place-items-center ${y[g]}`,children:e.jsx(t,{className:"w-5 h-5"})}),e.jsx("p",{className:"text-xs text-muted-foreground mt-2",children:c}),e.jsxs("p",{className:"text-xl font-bold mt-1",children:[f(d)," ",e.jsx("span",{className:"text-xs font-normal text-muted-foreground",children:"ج.م"})]})]})}function ie({icon:t,label:c,value:d,commission:g,count:y,accent:S}){const w={orange:"bg-orange-50 text-orange-700",amber:"bg-amber-50 text-amber-700"};return e.jsxs("div",{className:"bg-card border rounded-xl p-4 flex flex-col justify-between relative overflow-hidden",children:[e.jsxs("div",{className:"flex justify-between items-start",children:[e.jsx("div",{className:`w-10 h-10 rounded-lg grid place-items-center ${w[S]||w.orange}`,children:e.jsx(t,{className:"w-5 h-5"})}),e.jsx("span",{className:"text-[11px] font-extrabold bg-pink-50 text-pink-700 px-2 py-1 rounded-md border border-pink-200",children:f(g)})]}),e.jsxs("div",{className:"mt-2",children:[e.jsxs("div",{className:"flex justify-between items-baseline",children:[e.jsx("p",{className:"text-xs font-bold text-foreground",children:c}),e.jsxs("span",{className:"text-[10px] text-muted-foreground",children:["(",y," أوردر)"]})]}),e.jsxs("p",{className:"text-xl font-black mt-1 text-primary",children:[f(d)," ",e.jsx("span",{className:"text-xs font-normal text-muted-foreground",children:"ج.م"})]})]})]})}export{Ke as component};
