import { useEffect, useState, type ReactNode } from "react";

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
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f3f4f6",
          fontFamily: "sans-serif",
          padding: "20px",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "360px",
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            boxShadow:
              "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)",
            padding: "30px",
            textAlign: "center",
          }}
        >
          <div style={{ marginBottom: "20px" }}>
            <h1
              style={{
                fontSize: "24px",
                fontWeight: "bold",
                color: "#1f2937",
                margin: "0 0 8px 0",
              }}
            >
              ERP System {":)"}
            </h1>
            <p style={{ fontSize: "14px", color: "#4b5563", margin: 0 }}>
              أدخل كلمة المرور للدخول
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (pwd === "admin123") {
                localStorage.setItem("is_admin_logged_in", "true");
                setAuthed(true);
                setErr("");
              } else {
                setErr("كلمة مرور غير صحيحة");
              }
            }}
          >
            <input
              type="password"
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
              placeholder="كلمة المرور"
              autoFocus
              style={{
                width: "100%",
                height: "44px",
                padding: "0 12px",
                borderRadius: "6px",
                border: "1px solid #d1d5db",
                textAlign: "center",
                fontSize: "18px",
                letterSpacing: "4px",
                outline: "none",
                boxSizing: "border-box",
                marginBottom: "12px",
              }}
            />

            {err && (
              <p
                style={{
                  color: "#dc2626",
                  fontSize: "14px",
                  margin: "0 0 12px 0",
                }}
              >
                {err}
              </p>
            )}

            <button
              type="submit"
              style={{
                width: "100%",
                height: "44px",
                borderRadius: "6px",
                backgroundColor: "#2563eb",
                color: "#ffffff",
                fontWeight: "500",
                border: "none",
                cursor: "pointer",
                fontSize: "16px",
              }}
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
