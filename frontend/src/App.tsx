import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useGuestStore } from './store/guestStore';
import LoginPage from './pages/auth/LoginPage';
import DashboardLayout from './components/layout/DashboardLayout';
import DashboardPage from './pages/dashboard/DashboardPage';
import HuespedesPage from './pages/recepcion/HuespedesPage';
import ReservacionesPage from './pages/recepcion/ReservacionesPage';
import RestaurantePage from './pages/restaurante/RestaurantePage';
import BarPage from './pages/bar/BarPage';
import MiniMarketPage from './pages/minimarket/MiniMarketPage';
import InventarioPage from './pages/inventario/InventarioPage';
import ReportesPage from './pages/reportes/ReportesPage';
import AdminPage from './pages/admin/AdminPage';
import GuestLayout from './components/layout/GuestLayout';
import GuestLoginPage from './pages/guest/GuestLoginPage';
import GuestDashboard from './pages/guest/GuestDashboard';
import GuestOrderPage from './pages/guest/GuestOrderPage';
import GuestReviewPage from './pages/guest/GuestReviewPage';
import GuestConsumosPage from './pages/guest/GuestConsumosPage';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

function GuestPrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useGuestStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/guest" />;
}

function App() {
  const { isDarkMode } = useAuthStore();

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/guest" element={<GuestLoginPage />} />
      <Route path="/guest/dashboard" element={
        <GuestPrivateRoute>
          <GuestLayout />
        </GuestPrivateRoute>
      }>
        <Route index element={<GuestDashboard />} />
        <Route path="pedir" element={<GuestOrderPage />} />
        <Route path="resena" element={<GuestReviewPage />} />
        <Route path="cuenta" element={<GuestConsumosPage />} />
      </Route>
      <Route
        path="/"
        element={
          <PrivateRoute>
            <DashboardLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="huespedes" element={<HuespedesPage />} />
        <Route path="reservaciones" element={<ReservacionesPage />} />
        <Route path="restaurante" element={<RestaurantePage />} />
        <Route path="bar" element={<BarPage />} />
        <Route path="minimarket" element={<MiniMarketPage />} />
        <Route path="inventario" element={<InventarioPage />} />
        <Route path="reportes" element={<ReportesPage />} />
        <Route path="admin" element={<AdminPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
