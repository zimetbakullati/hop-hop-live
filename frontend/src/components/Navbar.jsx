import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { auth, logout } = useAuth();

  return (
    <nav className="navbar">
      <Link to="/" className="brand">
        Hop Hop Live
      </Link>
      <div className="nav-links">
        {auth.token ? (
          <>
            <Link to="/upload">Upload</Link>
            <Link to="/live">Live</Link>
            <Link to={`/profile/${auth.user?.id}`}>Profile</Link>
            <button onClick={logout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
