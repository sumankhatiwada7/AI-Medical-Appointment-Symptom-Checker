import { Navigate, Route, Routes } from "react-router-dom";
import type { ReactElement } from "react";
import { useAuth, type UserRole } from "../context/AuthContext";
import { getDashboardPath } from "../utils/authRedirect";
import Landing from "../pages/home/landing";
import Login from "../pages/auth/login";
import Register from "../pages/auth/register";
import SymptomChecker from "../pages/symptom/SymptomChecker";
import DoctorDashboard from "../pages/doctor/dashboard";

const Loader = () => (
  <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 text-sm font-medium text-slate-600">
    Loading your medical workspace...
  </div>
);

const ProtectedRoute = ({
  children,
  allowedRoles,
}: {
  children: ReactElement;
  allowedRoles?: UserRole[];
}) => {
  const { loading, isAuthenticated, user } = useAuth();

  if (loading) {
    return <Loader />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={getDashboardPath(user.role)} replace />;
  }

  return children;
};

export const AppRoute = () => {
  const { loading, isAuthenticated, user } = useAuth();

  return (
    <Routes>
      <Route
        path="/"
        element={
          loading ? <Loader /> : isAuthenticated && user ? <Navigate to={getDashboardPath(user.role)} replace /> : <Landing />
        }
      />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/symptom-checker"
        element={
          <ProtectedRoute allowedRoles={["PATIENT"]}>
            <SymptomChecker />
          </ProtectedRoute>
        }
      />
      <Route
        path="/doctor-dashboard"
        element={
          <ProtectedRoute allowedRoles={["DOCTOR"]}>
            <DoctorDashboard />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoute;
