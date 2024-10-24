import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Register from './components/Register'; // Ensure this points to your existing Register component
import Login from './components/Login'; // Ensure this points to your existing Login component
import Home from './components/Home';

const App = () => {
  return (
    <Router>
      <Header />
      <main className="container mx-auto p-4">
        <Routes>
          <Route path="/" element={
            <div className="flex justify-center items-center h-screen bg-gray-100">
            <h1 className="text-4xl font-bold text-slate-800 shadow-md p-4 bg-white rounded-lg">
              Welcome to Ticket Booking System
            </h1>
          </div>
          
          } />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/home" element={<Home />} />
        </Routes>
      </main>
      <Footer />
    </Router>
  );
};

export default App;
