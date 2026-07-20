/* eslint-disable prettier/prettier */
// src/config.ts
export const getApiUrl = () => {
  // بيحاول يقرأ الـ IP اللي الفني كتبه وخزنه في البرنامج، لو ملاقاش حاجة بياخد الـ localhost كافتراضي
  const savedIp = "192.168.1.88";
  return savedIp;
};
