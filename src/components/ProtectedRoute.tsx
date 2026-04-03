import { Navigate, Outlet } from 'react-router-dom';
import { useApp } from '@/context/AppContext';
import { UserRole } from '@/types';

export default function ProtectedRoute({ allowedRole }: { allowedRole: UserRole }) {
  const { user } = useApp();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== allowedRole) return <Navigate to={`/${user.role === 'admin' ? 'admin' : 'manager'}/dashboard`} replace />;
  return <Outlet />;
}
