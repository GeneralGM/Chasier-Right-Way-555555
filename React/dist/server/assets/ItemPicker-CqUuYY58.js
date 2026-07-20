import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useRef, useEffect, useMemo } from "react";
import { a as arabicMatch } from "./arabic-CnN6FHbg.js";
import { Search } from "lucide-react";
function ItemPicker({ items, value, onChange, placeholder = "ابحث عن صنف..." }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    function close(e) {
      if (!ref.current?.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  const selected = items.find((i) => i.id === value);
  const filtered = useMemo(() => items.filter((i) => arabicMatch(i.name, q)).slice(0, 50), [items, q]);
  useEffect(() => {
    if (selected && !open) setQ(selected.name);
  }, [selected, open]);
  return /* @__PURE__ */ jsxs("div", { className: "relative", ref, children: [
    /* @__PURE__ */ jsxs("div", { className: "relative", children: [
      /* @__PURE__ */ jsx(Search, { className: "absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" }),
      /* @__PURE__ */ jsx(
        "input",
        {
          type: "text",
          value: q,
          onFocus: () => {
            setOpen(true);
            setQ("");
          },
          onChange: (e) => {
            setQ(e.target.value);
            setOpen(true);
          },
          placeholder,
          className: "w-full h-10 ps-8 pe-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        }
      )
    ] }),
    open && /* @__PURE__ */ jsx("div", { className: "absolute z-50 mt-1 w-full max-h-64 overflow-auto rounded-md border border-border bg-popover shadow-lg", children: filtered.length === 0 ? /* @__PURE__ */ jsx("div", { className: "p-3 text-sm text-muted-foreground text-center", children: "لا توجد نتائج" }) : filtered.map((i) => /* @__PURE__ */ jsxs(
      "button",
      {
        type: "button",
        onClick: () => {
          onChange(i.id);
          setQ(i.name);
          setOpen(false);
        },
        className: "w-full text-right px-3 py-2 hover:bg-accent text-sm flex justify-between items-center gap-2",
        children: [
          /* @__PURE__ */ jsx("span", { className: "font-medium", children: i.name }),
          /* @__PURE__ */ jsxs("span", { className: "text-xs text-muted-foreground", children: [
            i.qty,
            " ",
            i.unit
          ] })
        ]
      },
      i.id
    )) })
  ] });
}
export {
  ItemPicker as I
};
