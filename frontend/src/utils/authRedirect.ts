import type { UserRole } from "../context/AuthContext";

export const getDashboardPath = (role?: UserRole | null): string => {
  return role === "DOCTOR" ? "/doctor-dashboard" : "/symptom-checker";
};