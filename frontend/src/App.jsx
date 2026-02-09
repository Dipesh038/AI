import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import PublicLayout from './components/PublicLayout';
import AdminLayout from './components/AdminLayout';
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import ToolDetails from './pages/ToolDetails';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminTools from './pages/AdminTools';
import AdminCategories from './pages/AdminCategories';
import AdminCountries from './pages/AdminCountries';
import AdminToolPopularity from './pages/AdminToolPopularity';
import AdminToolGrowth from './pages/AdminToolGrowth';

const AdminRoute = () => {
  const token = localStorage.getItem('adminToken');
  // TODO: Add role-based access control (RBAC) check here for future Admin/Editor roles
  return token ? <Outlet /> : <Navigate to="/admin/login" />;
};

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Home />} />
          <Route path="/ai-tools" element={<Catalog />} />
          <Route path="/tools/:id" element={<ToolDetails />} />
        </Route>

        {/* Admin Login */}
        <Route path="/admin/login" element={<AdminLogin />} />

        {/* Protected Admin Routes */}
        <Route path="/admin" element={<AdminRoute />}>
          <Route element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="tools" element={<AdminTools />} />
            <Route path="categories" element={<AdminCategories />} />
            <Route path="countries" element={<AdminCountries />} />
            <Route path="tool-popularity" element={<AdminToolPopularity />} />
            <Route path="tools-growth" element={<AdminToolGrowth />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
