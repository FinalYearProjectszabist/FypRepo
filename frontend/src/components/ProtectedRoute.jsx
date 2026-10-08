import { Navigate, useLocation } from 'react-router-dom';
import { HOME_BY_ROLE, useAuth } from '../context/AuthContext';
import Spinner from './Spinner';

/** Blocks the route unless signed in; optionally restricts to some roles. */
export default function ProtectedRoute({ roles, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-brand-600"><Spinner className="h-8 w-8" /></div>;
  }
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (roles && !roles.includes(user.role)) {
    return <Navigate to={HOME_BY_ROLE[user.role]} replace />;
  }
  return children;
}

/** For login/signup pages: signed-in users are sent to their home page. */
export function GuestRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to={HOME_BY_ROLE[user.role]} replace />;
  return children;
}
