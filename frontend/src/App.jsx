import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import PublicLayout from './components/PublicLayout';
import AdminLayout from './components/AdminLayout';

// Eagerly loaded (always needed on first render)
import Home from './pages/Home';

// Lazy-loaded pages (code-split for smaller initial bundle)
const Catalog = React.lazy(() => import('./pages/Catalog'));
const ToolDetails = React.lazy(() => import('./pages/ToolDetails'));
const AdminLogin = React.lazy(() => import('./pages/AdminLogin'));
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'));
const AdminTools = React.lazy(() => import('./pages/AdminTools'));
const AdminCategories = React.lazy(() => import('./pages/AdminCategories'));
const AdminCountries = React.lazy(() => import('./pages/AdminCountries'));
const AdminToolPopularity = React.lazy(() => import('./pages/AdminToolPopularity'));
const AdminToolGrowth = React.lazy(() => import('./pages/AdminToolGrowth'));

// Minimal loading fallback
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
  </div>
);

const AdminRoute = () => {
  const token = localStorage.getItem('adminToken');
  return token ? <Outlet /> : <Navigate to="/admin/login" />;
};

const App = () => {
  return (
    <Router>
      <Suspense fallback={<PageLoader />}>
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
      </Suspense>
    </Router>
  );
};

export default App;
