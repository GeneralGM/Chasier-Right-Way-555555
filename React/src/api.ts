/* eslint-disable prettier/prettier */
// src/config.ts
export const getApiUrl = () => {
  const savedIp = import.meta.env.VITE_SERVER_IP || "192.168.1.88";
  return savedIp;
};
