import { useEffect, useState, type ReactNode } from "react";
import { Lock } from "lucide-react";

export function AuthGate({ children }: { children: ReactNode }) {
  const [authed, setAuthed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pwd, setPwd] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setMounted(true);
    // قراءة حالة الدخول مباشرة من المتصفح بدون الحاجة لملف store القديم
    const isLogged = localStorage.getItem("is_admin_logged_in") === "true";
    setAuthed(isLogged);
  }, []);

  if (!mounted) return null;

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/20 p-4">
        <div className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-xl p-8">
          <div className="flex flex-col items-center mb-6">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3">
              <Lock className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">ERP System</h1>
            <p className="text-sm text-muted-foreground mt-1">
              أدخل كلمة المرور للدخول
            </p>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (busy) return;
              setBusy(true);

              // التحقق الثابت من الباسوورد
              if (pwd === "admin123") {
                // حفظ الدخول في المتصفح وتحديث الواجهة فوراً
                localStorage.setItem("is_admin_logged_in", "true");
                setAuthed(true);
                setErr("");
              } else {
                setErr("كلمة مرور غير صحيحة");
              }

              setBusy(false);
            }}
            className="space-y-3"
          >
            <input
              type="password"
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
              placeholder="كلمة المرور"
              autoFocus
              className="w-full h-11 px-4 rounded-lg border border-input bg-background text-center text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {err && (
              <p className="text-sm text-destructive text-center">{err}</p>
            )}
            <button
              type="submit"
              disabled={busy}
              className="w-full h-11 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition disabled:opacity-50"
            >
              دخول
            </button>
          </form>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
