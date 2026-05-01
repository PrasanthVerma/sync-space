import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Workspace from './pages/Workspace';
import Login from './pages/Login';
import Register from './pages/Register';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Home />} />
        <Route 
          path="/api/rooms/:roomId" 
          element={
            <ProtectedRoute>
              <Workspace />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;
