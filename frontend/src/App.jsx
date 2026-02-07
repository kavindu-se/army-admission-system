import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import ApplicationForm from "./pages/ApplicationForm.jsx";
import ReviewQueue from "./pages/ReviewQueue.jsx";
import ReviewDetail from "./pages/ReviewDetail.jsx";
import AdminUsers from "./pages/AdminUsers.jsx";
import AdminFilter from "./pages/AdminFilter.jsx";
import AdminSchools from "./pages/AdminSchools.jsx";
import AdminNoticePdf from "./pages/AdminNoticePdf.jsx";
import AdjutantQueue from "./pages/AdjutantQueue.jsx";
import AppHeader from "./components/AppHeader.jsx";
import { AuthProvider, useAuth } from "./state/auth.jsx";

function PrivateRoute({ children }) {
  const { user, loading, token } = useAuth();
  if (loading && token) {
    return <div className="page">Loading...</div>;
  }
  if (!user) return <Navigate to="/" replace />;
  return children;
}

function AppShell() {
  const location = useLocation();
  const hideHeader = location.pathname === "/";
  return (
    <div className="app-shell">
      {!hideHeader && <AppHeader />}
      <Routes>
        <Route path="/" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/apply"
          element={
            <PrivateRoute>
              <ApplicationForm />
            </PrivateRoute>
          }
        />
        <Route
          path="/apply/:id"
          element={
            <PrivateRoute>
              <ApplicationForm />
            </PrivateRoute>
          }
        />
        <Route
          path="/review"
          element={
            <PrivateRoute>
              <ReviewQueue />
            </PrivateRoute>
          }
        />
        <Route
          path="/adjutant"
          element={
            <PrivateRoute>
              <AdjutantQueue />
            </PrivateRoute>
          }
        />
        <Route
          path="/review/:id"
          element={
            <PrivateRoute>
              <ReviewDetail />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <PrivateRoute>
              <AdminUsers />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/filter"
          element={
            <PrivateRoute>
              <AdminFilter />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/schools"
          element={
            <PrivateRoute>
              <AdminSchools />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin/notice"
          element={
            <PrivateRoute>
              <AdminNoticePdf />
            </PrivateRoute>
          }
        />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
