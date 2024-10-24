import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <header className="bg-gray-800 text-white p-4">
      <nav className="flex justify-between">
        <div>
          <Link to="/" className="text-lg font-bold">Ticket Booking System</Link>
        </div>
        <div>
          <Link to="/login" className="mr-4">Login</Link>
          <Link to="/register">Register</Link>
        </div>
      </nav>
    </header>
  );
};

export default Header;
