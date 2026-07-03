import { useEffect, useState, type ReactNode } from "react";
import { LockKeyhole, ArrowLeft } from "lucide-react";

export function AuthGate({ children }: { children: ReactNode }) {
  const [authed, setAuthed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pwd, setPwd] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    setMounted(true);
    // قراءة حالة الدخول مباشرة
    const isLogged = localStorage.getItem("is_admin_logged_in") === "true";
    setAuthed(isLogged);
  }, []);

  if (!mounted) return null;

  if (!authed) {
    return (
      <div
        dir="rtl"
        className="min-h-screen flex items-center justify-center bg-slate-50/50 p-4"
      >
        {/* صندوق تسجيل الدخول بتأثير زجاجي وحركة دخول */}
        <div className="w-full max-w-sm bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl shadow-emerald-900/5 border border-gray-100 p-8 text-center relative overflow-hidden animate-pop-in">
          {/* تأثيرات إضاءة في الخلفية */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-100/50 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-gray-100/80 rounded-full blur-3xl" />

          <div className="relative z-10">
            {/* أيقونة القفل */}
            <div className="mx-auto w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 shadow-inner border border-emerald-100/50 rotate-3 transition-transform hover:rotate-0 duration-300">
              <LockKeyhole className="w-7 h-7" />
            </div>

            {/* العناوين */}
            <div className="mb-8 space-y-2">
              <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
                نظام إدارة المطعم
              </h1>
              <p className="text-sm font-medium text-gray-500">
                برجاء إدخال رمز الدخول للمتابعة
              </p>
            </div>

            {/* نموذج الدخول */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (pwd === "admin123") {
                  localStorage.setItem("is_admin_logged_in", "true");
                  setAuthed(true);
                  setErr("");
                } else {
                  setErr("كلمة المرور غير صحيحة");
                  setPwd(""); // تفريغ الحقل عند الخطأ
                }
              }}
              className="space-y-5"
            >
              <div className="space-y-2">
                <input
                  type="password"
                  value={pwd}
                  onChange={(e) => setPwd(e.target.value)}
                  placeholder="••••••••"
                  autoFocus
                  className={`w-full h-14 px-4 text-center text-3xl tracking-[0.4em] text-gray-800 bg-gray-50/50 border-2 rounded-2xl outline-none transition-all duration-300 focus:bg-white ${
                    err
                      ? "border-red-200 focus:border-red-500 focus:ring-4 focus:ring-red-500/10 text-red-600"
                      : "border-gray-100 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                  }`}
                />

                {/* رسالة الخطأ */}
                <div className="h-5">
                  {err && (
                    <p className="text-sm font-bold text-red-500 animate-shake">
                      {err}
                    </p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                className="w-full h-12 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-base transition-all duration-300 active:scale-[0.97] shadow-lg shadow-emerald-600/20 group"
              >
                دخول للنظام
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1.5" />
              </button>
            </form>
          </div>
        </div>

        {/* ستايل الأنيميشن مدمج عشان يشتغل فوراً */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
          @keyframes popIn {
            0% { transform: scale(0.95) translateY(10px); opacity: 0; }
            100% { transform: scale(1) translateY(0); opacity: 1; }
          }
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-4px); }
            75% { transform: translateX(4px); }
          }
          .animate-pop-in { animation: popIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
          .animate-shake { animation: shake 0.3s ease-in-out; }
        `,
          }}
        />
      </div>
    );
  }

  return <>{children}</>;
}
