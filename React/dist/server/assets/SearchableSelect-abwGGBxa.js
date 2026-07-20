import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useRef, useEffect, useMemo } from "react";
import { a as arabicMatch } from "./arabic-CnN6FHbg.js";
import { Search, ChevronDown } from "lucide-react";
function SearchableSelect({ options, value, onChange, placeholder = "ابحث أو اختر...", className = "", disabled }) {
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
  const selected = options.find((o) => o.value === value);
  const filtered = useMemo(() => {
    const list = q ? options.filter((o) => arabicMatch(o.label + " " + (o.hint || "") + " " + (o.group || ""), q)) : options;
    return list.slice(0, 80);
  }, [options, q]);
  const groups = useMemo(() => {
    const map = /* @__PURE__ */ new Map();
    for (const o of filtered) {
      const g = o.group || "";
      const arr = map.get(g) || [];
      arr.push(o);
      map.set(g, arr);
    }
    return Array.from(map.entries());
  }, [filtered]);
  return /* @__PURE__ */ jsxs("div", { className: `relative ${className}`, ref, children: [
    /* @__PURE__ */ jsxs("div", { className: "relative", children: [
      /* @__PURE__ */ jsx(Search, { className: "absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" }),
      /* @__PURE__ */ jsx(
        "input",
        {
          type: "text",
          value: open ? q : selected?.label || "",
          disabled,
          placeholder,
          onFocus: () => {
            if (!disabled) {
              setOpen(true);
              setQ("");
            }
          },
          onChange: (e) => {
            setQ(e.target.value);
            setOpen(true);
          },
          className: "w-full h-10 ps-8 pe-7 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
        }
      ),
      /* @__PURE__ */ jsx(ChevronDown, { className: "absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" })
    ] }),
    open && /* @__PURE__ */ jsx("div", { className: "absolute z-50 mt-1 w-full max-h-72 overflow-auto rounded-md border border-border bg-popover shadow-lg", children: filtered.length === 0 ? /* @__PURE__ */ jsx("div", { className: "p-3 text-sm text-muted-foreground text-center", children: "لا توجد نتائج" }) : groups.map(([g, items]) => /* @__PURE__ */ jsxs("div", { children: [
      g && /* @__PURE__ */ jsx("div", { className: "px-3 py-1 text-[11px] font-bold bg-secondary/50 text-muted-foreground sticky top-0", children: g }),
      items.map((o) => /* @__PURE__ */ jsxs(
        "button",
        {
          type: "button",
          onClick: () => {
            onChange(o.value);
            setOpen(false);
            setQ("");
          },
          className: `w-full text-right px-3 py-2 hover:bg-accent text-sm flex justify-between items-center gap-2 ${o.value === value ? "bg-accent/50" : ""}`,
          children: [
            /* @__PURE__ */ jsx("span", { className: "font-medium", children: o.label }),
            o.hint && /* @__PURE__ */ jsx("span", { className: "text-xs text-muted-foreground", children: o.hint })
          ]
        },
        o.value
      ))
    ] }, g)) })
  ] });
}
export {
  SearchableSelect as S
};
