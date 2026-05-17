import { Routes, Route } from "react-router-dom";
import Login from "../pages/auth/login";
import Register from "../pages/auth/register";

export const AppRoute = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Register />} />
    </Routes>
  );
};

export default AppRoute;
