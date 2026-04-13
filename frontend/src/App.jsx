import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import NeedsMap from './pages/NeedsMap';
import Volunteers from './pages/Volunteers';
import VolunteerRegister from './pages/VolunteerRegister';
import TaskDetail from './pages/TaskDetail';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1a1d2e',
            color: '#e2e8f0',
            border: '1px solid rgba(99, 102, 241, 0.2)',
            borderRadius: '10px',
            fontSize: '0.88rem',
          },
          success: { iconTheme: { primary: '#06d6a0', secondary: '#0f1117' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#0f1117' } },
        }}
      />
      <Navbar />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/map" element={<NeedsMap />} />
        <Route path="/volunteers" element={<Volunteers />} />
        <Route path="/register" element={<VolunteerRegister />} />
        <Route path="/needs/:id" element={<TaskDetail />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
