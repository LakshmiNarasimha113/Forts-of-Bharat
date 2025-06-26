import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import StatePage from './pages/StatePage';
import FortDetailPage from './pages/FortDetailPage'; // ✅ Correct import

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/state/:stateName" element={<StatePage />} />  {/* ✅ Fixed here */}
        <Route path="/fort/:id" element={<FortDetailPage />} />     {/* ✅ Correct route */}
      </Routes>
    </Router>
  );
}

export default App;
