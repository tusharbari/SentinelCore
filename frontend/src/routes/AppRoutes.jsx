import { BrowserRouter, Route, Routes } from "react-router-dom";
import Login from "../pages/Login";
import Register from "../pages/Register";
import Dashboard from "../pages/Dashboard";
import ThreatList from "../pages/ThreatList";
import AddThreat from "../pages/AddThreat";
import EditThreat from "../pages/EditThreat";
import IOCList from "../pages/IOCList";
import AddIOC from "../pages/AddIOC";
import EditIOC from "../pages/EditIOC";
import AlertList from "../pages/AlertList";
import AddAlert from "../pages/AddAlert";
import EditAlert from "../pages/EditAlert";
import UserList from "../pages/UserList";
import AddUser from "../pages/AddUser";
import EditUser from "../pages/EditUser";
import Reports from "../pages/Reports";
import VulnerabilityDashboard from "../pages/VulnerabilityDashboard";
import IncidentList from "../pages/IncidentList";
import PlaybookList from "../pages/PlaybookList";
import PlaybookExecutionDetail from "../pages/PlaybookExecutionDetail";
import ProtectedRoute from "./ProtectedRoute";


const writeRoles = ["ADMIN", "ANALYST"];
const adminRoles = ["ADMIN"];

const protect = (element, allowedRoles) => (
  <ProtectedRoute allowedRoles={allowedRoles}>{element}</ProtectedRoute>
);

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={protect(<Dashboard />)} />
        <Route path="/threat-list" element={protect(<ThreatList />)} />
        <Route path="/add-threat" element={protect(<AddThreat />, writeRoles)} />
        <Route path="/edit-threat/:id" element={protect(<EditThreat />, writeRoles)} />
        <Route path="/ioc-list" element={protect(<IOCList />)} />
        <Route path="/add-ioc" element={protect(<AddIOC />, writeRoles)} />
        <Route path="/edit-ioc/:id" element={protect(<EditIOC />, writeRoles)} />
        <Route path="/alert-list" element={protect(<AlertList />)} />
        <Route path="/add-alert" element={protect(<AddAlert />, writeRoles)} />
        <Route path="/edit-alert/:id" element={protect(<EditAlert />, writeRoles)} />
        <Route path="/users" element={protect(<UserList />, adminRoles)} />
        <Route path="/add-user" element={protect(<AddUser />, adminRoles)} />
        <Route path="/edit-user/:id" element={protect(<EditUser />, adminRoles)} />
        <Route path="/vulnerabilities" element={protect(<VulnerabilityDashboard />)} />
        <Route path="/reports" element={protect(<Reports />)} />
        
        {/* Playbook and Incident Routes */}
        <Route path="/incidents" element={protect(<IncidentList />)} />
        <Route path="/playbooks" element={protect(<PlaybookList />)} />
        <Route path="/playbooks/executions/:id" element={protect(<PlaybookExecutionDetail />)} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
