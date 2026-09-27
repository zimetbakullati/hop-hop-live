import { Navigate, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Upload from './pages/Upload';
import Profile from './pages/Profile';
import Live from './pages/Live';
import { useAuth } from './context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { auth } = useAuth();
  return auth.token ? children : <Navigate to="/login" replace />;
};

const App = () => (
  <>
    <Navbar />
    <main className="container">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/upload"
          element={
            <ProtectedRoute>
              <Upload />
            </ProtectedRoute>
          }
        />
        <Route path="/profile/:id" element={<Profile />} />
        <Route
          path="/live"
          element={
            <ProtectedRoute>
              <Live />
            </ProtectedRoute>
          }
        />
      </Routes>
    </main>
  </>
);

export default App;
