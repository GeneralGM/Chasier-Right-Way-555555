import { useEffect, useState, type ReactNode } from "react";
import { isAuthenticated, login, hasPassword, setPassword } from "@/lib/store";
import { Lock } from "lucide-react";

export function AuthGate({ children }: { children: ReactNode }) {
  const [authed, setAuthed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [pwd, setPwd] = useState("");
  const [pwd2, setPwd2] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setMounted(true);
    setAuthed(isAuthenticated());
    setNeedsSetup(!hasPassword());
    const refresh = () => {
      setAuthed(isAuthenticated());
      setNeedsSetup(!hasPassword());
    };
    window.addEventListener("auth-change", refresh);
    return () => window.removeEventListener("auth-change", refresh);
  }, []);

  if (!mounted) return null;

  if (!authed) {
    const isSetup = needsSetup;
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/20 p-4">
        <div className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-xl p-8">
          <div className="flex flex-col items-center mb-6">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <Lock className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">نظام إدارة المخزون</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isSetup ? "قم بإعداد كلمة المرور للمرة الأولى" : "أدخل كلمة المرور للدخول"}
            </p>
          </div>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (busy) return;
              setBusy(true);
              try {
                if (isSetup) {
                  if (pwd !== pwd2) {
                    setErr("كلمتا المرور غير متطابقتين");
                    return;
                  }
                  try {
                    await setPassword(pwd);
                    setErr("");
                    setPwd("");
                    setPwd2("");
                  } catch (e: any) {
                    setErr(e?.message || "خطأ");
                  }
                } else {
                  const ok = await login(pwd);
                  if (ok) {
                    setErr("");
                    setPwd("");
                  } else {
                    setErr("كلمة مرور غير صحيحة");
                  }
                }
              } finally {
                setBusy(false);
              }
            }}
            className="space-y-3"
          >
            <input
              type="password"
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
              placeholder={isSetup ? "كلمة المرور الجديدة" : "كلمة المرور"}
              autoFocus
              minLength={4}
              className="w-full h-11 px-4 rounded-lg border border-input bg-background text-center text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {isSetup && (
              <input
                type="password"
                value={pwd2}
                onChange={(e) => setPwd2(e.target.value)}
                placeholder="تأكيد كلمة المرور"
                minLength={4}
                className="w-full h-11 px-4 rounded-lg border border-input bg-background text-center text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-ring"
              />
            )}
            {err && <p className="text-sm text-destructive text-center">{err}</p>}
            <button
              type="submit"
              disabled={busy}
              className="w-full h-11 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition disabled:opacity-50"
            >
              {isSetup ? "حفظ والدخول" : "دخول"}
            </button>
            {isSetup && (
              <p className="text-xs text-muted-foreground text-center pt-2">
                لا توجد كلمة مرور افتراضية. اختر كلمة سرية لا يعرفها غيرك.
              </p>
            )}
          </form>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
