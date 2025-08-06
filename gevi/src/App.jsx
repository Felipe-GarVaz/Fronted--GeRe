import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/protectedRoute/protectedRoute';
import Login from "./pages/login/login";
import Home from "./pages/home/home";
import VehicleMenu from './pages/vehicle/vehicleMenu/vehicleMenu';
import TpsReadersMenu from './pages/tpsAndReaders/tps-ReadersMenu/tps-ReadersMenu';
import VehicleRegistration from "./pages/vehicle/vehicleRegistration/vehicleRegistration";
import VehicleReport from './pages/vehicle/vehicleReport/vehicleReport';
import VehicleHistory from './pages/vehicle/vehicleHistory/vehicleHistory';
import Layout from './components/layout/layout';
import DeviceRegistered from './pages/tpsAndReaders/deviceRegistered/deviceRegistered';
import DeviceReport from './pages/tpsAndReaders/deviceReport/deviceReport';
import VehicleWorkshop from './pages/vehicle/vehicleWorkshop/vehicleWorkshop';
import VehicleYard from './pages/vehicle/vehicleYard/vehicleYard'
import DeviceDamaged from './pages/tpsAndReaders/deviceDamaged/deviceDamaged';

function App() {
  return (
    <Router>
      <Routes>
        
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />

        <Route path="/home"
          element={<ProtectedRoute><Layout><Home /> </Layout></ProtectedRoute>} />

        <Route path="/tps-lectores-menu"
          element={<ProtectedRoute><Layout><TpsReadersMenu /> </Layout></ProtectedRoute>} />

        <Route path="/vehiculos-menu"
          element={<ProtectedRoute><Layout><VehicleMenu /> </Layout></ProtectedRoute>} />

        <Route path="/vehiculos-registrados"
          element={<ProtectedRoute><Layout><VehicleRegistration /> </Layout></ProtectedRoute>} />

        <Route path="/reportar"
          element={<ProtectedRoute><Layout><VehicleReport /> </Layout></ProtectedRoute>} />

        <Route path="/historial"
          element={<ProtectedRoute><Layout><VehicleHistory /> </Layout></ProtectedRoute>} />

        <Route path="/taller"
          element={<ProtectedRoute><Layout><VehicleWorkshop /> </Layout></ProtectedRoute>} />

        <Route path="/patio"
          element={<ProtectedRoute><Layout><VehicleYard /> </Layout></ProtectedRoute>} />

        <Route path="/tps-lectores-registrados"
          element={<ProtectedRoute><Layout><DeviceRegistered /> </Layout></ProtectedRoute>} />

        <Route path="/reportar-tp-lector"
          element={<ProtectedRoute><Layout><DeviceReport /> </Layout></ProtectedRoute>} />

        <Route path="/tps-lectores-defectuosos"
          element={<ProtectedRoute><Layout><DeviceDamaged /> </Layout></ProtectedRoute>} />

      </Routes>
    </Router>
  )
}
export default App;
