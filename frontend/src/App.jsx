import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Background3D from './components/Background3D';
import AppLayout from './components/AppLayout';
import ProtectedRoute, { GuestRoute } from './components/ProtectedRoute';
import { HOME_BY_ROLE, useAuth } from './context/AuthContext';
import AdminUsersPage from './pages/app/AdminUsersPage';
import DashboardPage from './pages/app/DashboardPage';
import ProfilePage from './pages/app/ProfilePage';
import SecurityPage from './pages/app/SecurityPage';
import StationsPage from './pages/app/StationsPage';
import VehiclesPage from './pages/app/VehiclesPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import LoginPage from './pages/auth/LoginPage';
import MfaLoginPage from './pages/auth/MfaLoginPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import SignupPage from './pages/auth/SignupPage';
import VerifyEmailPage from './pages/auth/VerifyEmailPage';

function Home() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return <Navigate to={user ? HOME_BY_ROLE[user.role] : '/login'} replace />;
}

const APP_PATHS = ['/dashboard', '/stations', '/vehicles', '/admin', '/profile', '/security'];

export default function App() {
  const { pathname } = useLocation();
  // Dim the 3D scene on content-heavy pages so forms and tables stay readable.
  const dim = APP_PATHS.some((p) => pathname.startsWith(p));
  return (
    <>
      <Background3D dim={dim} />
      <Routes>
        <Route path="/" element={<Home />} />

        {/* Authentication */}
        <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/login/verify" element={<GuestRoute><MfaLoginPage /></GuestRoute>} />
        <Route path="/signup" element={<GuestRoute><SignupPage /></GuestRoute>} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/forgot-password" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />
        <Route path="/reset-password" element={<GuestRoute><ResetPasswordPage /></GuestRoute>} />

        {/* Signed-in area */}
        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<ProtectedRoute roles={['DRIVER', 'STATION_OWNER']}><DashboardPage /></ProtectedRoute>} />
          <Route path="/stations" element={<StationsPage />} />
          <Route path="/vehicles" element={<ProtectedRoute roles={['DRIVER']}><VehiclesPage /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute roles={['ADMIN']}><AdminUsersPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/security" element={<SecurityPage />} />
        </Route>

        <Route path="*" element={<Home />} />
      </Routes>
    </>
  );
}
