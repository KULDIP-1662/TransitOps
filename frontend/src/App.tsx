import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Placeholder from './pages/Placeholder';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/vehicles" element={<Placeholder title="Vehicles" />} />
          <Route path="/drivers" element={<Placeholder title="Drivers" />} />
          <Route path="/trips" element={<Placeholder title="Trips" />} />
          <Route
            path="/maintenance"
            element={
              <ProtectedRoute roles={['FLEET_MANAGER']}>
                <Placeholder title="Maintenance" />
              </ProtectedRoute>
            }
          />
          <Route path="/fuel" element={<Placeholder title="Fuel & Expenses" />} />
          <Route
            path="/reports"
            element={
              <ProtectedRoute roles={['FLEET_MANAGER', 'FINANCIAL_ANALYST']}>
                <Placeholder title="Reports" />
              </ProtectedRoute>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
