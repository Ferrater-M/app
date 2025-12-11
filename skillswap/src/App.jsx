import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Login';
import Register from './Register';
import Dashboard from './Dashboard';
import OfferDetails from './OfferDetails';
import AddOffer from './AddOffer';
import Profile from './Profile';
import MySwaps from './MySwaps';
import Messages from './Messages';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/sign_in" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/offer/:id" element={<OfferDetails />} />
        <Route path="/add-skill" element={<AddOffer />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/myswaps" element={<MySwaps />} />
        <Route path="/messages" element={<Messages />} />
      </Routes>
    </Router>
  );
}

export default App;