import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/HomePage';
import IndianMap from './components/IndianMap';
import FortsList from './components/FortsList';
import FortDetailPage from './pages/FortDetailPage';
import ScrollToTop from './components/ScrollToTop';
import ChatBot from './pages/ChatBot';
import AIPhotoBooth from './components/AIPhotoBooth';
import { ThemeProvider } from './context/ThemeContext';
import './App.css';





function App() {
  return (
    <ThemeProvider>
      <Router>
        <ScrollToTop />
        <Navbar />

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/explore" element={<IndianMap />} />
          <Route path="/forts/:stateName" element={<FortsList />} />
          
          <Route path="/fort/:slug" element={<FortDetailPage />} />
          <Route path="/chatbot" element={<ChatBot />} />
          <Route path="/photo-booth" element={<AIPhotoBooth />} /> {/* ✅ NEW ROUTE */}
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
