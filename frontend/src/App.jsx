import { Navigate, Outlet } from 'react-router-dom';
import Navbar from './components/Navbar';
import { useAuth } from './context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { auth } = useAuth();
  return auth.token ? children : <Navigate to="/login" replace />;
};

const AppLayout = () => (
  <>
    <Navbar />
    <main className="container">
      <Outlet />
    </main>
  </>
);

export { AppLayout, ProtectedRoute };
