import { type ReactNode } from "react";

export function AuthGate({ children }: { children: ReactNode }) {
  // إلغاء صفحة اللوجن بالكامل وعرض محتوى التطبيق مباشرة
  return <>{children}</>;
}
