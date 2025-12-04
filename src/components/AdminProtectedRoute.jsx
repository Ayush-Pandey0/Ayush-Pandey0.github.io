import { Navigate } from 'react-router-dom';
import { isAdminAuthenticated } from '../utils/adminAuth';

export default function AdminProtectedRoute({ children }) {
  const isAdmin = isAdminAuthenticated();
  console.log('AdminProtectedRoute check:', isAdmin, 'sessionStorage:', sessionStorage.getItem('adminAuthenticated'));
  return isAdmin ? children : <Navigate to="/admin-login" replace />;
}
