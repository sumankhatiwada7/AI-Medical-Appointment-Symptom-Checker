import { Navigate, Route, Routes } from "react-router-dom";
import type { ReactElement } from "react";
import { useAuth } from "../context/AuthContext";
import Login from "../pages/auth/login";
import Register from "../pages/auth/register";
import SymptomChecker from "../pages/symptom/SymptomChecker";

const ProtectedRoute = ({ children }: { children: ReactElement }) => {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 text-sm font-medium text-slate-600">
        Loading your medical workspace...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export const AppRoute = () => {
  const { loading, isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          loading ? (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 text-sm font-medium text-slate-600">
              Loading your medical workspace...
            </div>
          ) : isAuthenticated ? (
            <Navigate to="/symptom-checker" replace />
          ) : (
            <Register />
          )
        }
      />
      <Route
        path="/symptom-checker"
        element={
          <ProtectedRoute>
            <SymptomChecker />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoute;
