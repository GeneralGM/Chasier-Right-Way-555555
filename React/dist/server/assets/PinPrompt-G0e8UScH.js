import { jsx, jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { D as Dialog, a as DialogContent, b as DialogHeader, d as DialogTitle, p as DialogDescription, I as Input, e as DialogFooter, B as Button, v as verifyPin } from "./router-CvLZBAlt.js";
import { Lock } from "lucide-react";
function PinPrompt({
  open,
  title = "تأكيد الصلاحية",
  description = "أدخل كلمة مرور المسؤول للمتابعة.",
  onClose,
  onSuccess,
  onCancel
}) {
  const [pin, setPin] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    setErr("");
    setBusy(true);
    const ok = await verifyPin(pin);
    setBusy(false);
    if (!ok) {
      setErr("كلمة المرور غير صحيحة");
      return;
    }
    setPin("");
    onSuccess();
  }
  function close() {
    setPin("");
    setErr("");
    onClose();
  }
  return /* @__PURE__ */ jsx(Dialog, { open, onOpenChange: (o) => !o && close(), children: /* @__PURE__ */ jsxs(DialogContent, { dir: "rtl", className: "max-w-sm", children: [
    /* @__PURE__ */ jsxs(DialogHeader, { children: [
      /* @__PURE__ */ jsxs(DialogTitle, { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Lock, { className: "w-4 h-4" }),
        " ",
        title
      ] }),
      /* @__PURE__ */ jsx(DialogDescription, { children: description })
    ] }),
    /* @__PURE__ */ jsxs("form", { onSubmit: submit, className: "space-y-3", children: [
      /* @__PURE__ */ jsx(
        Input,
        {
          type: "password",
          autoFocus: true,
          inputMode: "numeric",
          placeholder: "••••",
          value: pin,
          onChange: (e) => setPin(e.target.value),
          className: "text-center text-lg tracking-widest"
        }
      ),
      err && /* @__PURE__ */ jsx("p", { className: "text-xs text-destructive", children: err }),
      /* @__PURE__ */ jsxs(DialogFooter, { className: "gap-2", children: [
        /* @__PURE__ */ jsx(Button, { type: "button", variant: "outline", onClick: close, children: "إلغاء" }),
        /* @__PURE__ */ jsx(Button, { type: "submit", disabled: busy || !pin, children: "تأكيد" })
      ] })
    ] })
  ] }) });
}
export {
  PinPrompt as P
};
