import { BrowserRouter, Route, Routes } from "react-router-dom";

import Login from "../pages/Login";
import Register from "../pages/Register";
import LandingPage from "../pages/LandingPage";

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

import AlertRuleList from "../pages/AlertRuleList";
import AddAlertRule from "../pages/AddAlertRule";
import EditAlertRule from "../pages/EditAlertRule";
import TestAlertEngine from "../pages/TestAlertEngine";

import UserList from "../pages/UserList";
import AddUser from "../pages/AddUser";
import EditUser from "../pages/EditUser";

import Reports from "../pages/Reports";
import ReportsModule from "../modules/reports/ReportsModule";

import VulnerabilityDashboard from "../pages/VulnerabilityDashboard";

import IncidentList from "../pages/IncidentList";
import IncidentDetail from "../pages/IncidentDetail";

import PlaybookList from "../pages/PlaybookList";
import PlaybookExecutionDetail from "../pages/PlaybookExecutionDetail";

import AuditLogs from "../pages/AuditLogs";

import AssetDashboard from "../pages/AssetDashboard";
import AssetList from "../pages/AssetList";
import AddAsset from "../pages/AddAsset";
import EditAsset from "../pages/EditAsset";
import AssetDetail from "../pages/AssetDetail";

import ProtectedRoute from "./ProtectedRoute";

const writeRoles = ["ADMIN", "ANALYST"];
const adminRoles = ["ADMIN"];

const protect = (element, allowedRoles) => (
    <ProtectedRoute allowedRoles={allowedRoles}>
        {element}
    </ProtectedRoute>
);

function AppRoutes() {

    return (

        <BrowserRouter>

            <Routes>

                {/* Authentication */}

                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Dashboard */}

                <Route
                    path="/dashboard"
                    element={protect(<Dashboard />)}
                />

                {/* Threats */}

                <Route
                    path="/threat-list"
                    element={protect(<ThreatList />)}
                />

                <Route
                    path="/add-threat"
                    element={protect(<AddThreat />, writeRoles)}
                />

                <Route
                    path="/edit-threat/:id"
                    element={protect(<EditThreat />, writeRoles)}
                />

                {/* IOC */}

                <Route
                    path="/ioc-list"
                    element={protect(<IOCList />)}
                />

                <Route
                    path="/add-ioc"
                    element={protect(<AddIOC />, writeRoles)}
                />

                <Route
                    path="/edit-ioc/:id"
                    element={protect(<EditIOC />, writeRoles)}
                />

                {/* Alerts */}

                <Route
                    path="/alert-list"
                    element={protect(<AlertList />)}
                />

                <Route
                    path="/add-alert"
                    element={protect(<AddAlert />, writeRoles)}
                />

                <Route
                    path="/edit-alert/:id"
                    element={protect(<EditAlert />, writeRoles)}
                />

                {/* Alert Rules */}

                <Route
                    path="/alert-rules"
                    element={protect(<AlertRuleList />, writeRoles)}
                />

                <Route
                    path="/add-alert-rule"
                    element={protect(<AddAlertRule />, writeRoles)}
                />

                <Route
                    path="/edit-alert-rule/:id"
                    element={protect(<EditAlertRule />, writeRoles)}
                />

                <Route
                    path="/test-alert-engine"
                    element={protect(<TestAlertEngine />, writeRoles)}
                />

                {/* Users */}

                <Route
                    path="/users"
                    element={protect(<UserList />, adminRoles)}
                />

                <Route
                    path="/add-user"
                    element={protect(<AddUser />, adminRoles)}
                />

                <Route
                    path="/edit-user/:id"
                    element={protect(<EditUser />, adminRoles)}
                />

                {/* Assets */}

                <Route
                    path="/assets/dashboard"
                    element={protect(<AssetDashboard />)}
                />

                <Route
                    path="/assets"
                    element={protect(<AssetList />)}
                />

                <Route
                    path="/assets/add"
                    element={protect(<AddAsset />, writeRoles)}
                />

                <Route
                    path="/assets/edit/:id"
                    element={protect(<EditAsset />, writeRoles)}
                />

                <Route
                    path="/assets/detail/:id"
                    element={protect(<AssetDetail />)}
                />

                {/* Vulnerability Scanner */}

                <Route
                    path="/vulnerabilities"
                    element={protect(<VulnerabilityDashboard />)}
                />

                {/* Reports */}

                <Route
                    path="/reports"
                    element={protect(<Reports />)}
                />

                <Route
                    path="/new-reports"
                    element={protect(<ReportsModule />)}
                />

                {/* Incident Management */}

                <Route
                    path="/incidents"
                    element={protect(<IncidentList />)}
                />

                <Route
                    path="/incidents/:id"
                    element={protect(<IncidentDetail />)}
                />

                {/* Playbook Automation */}

                <Route
                    path="/playbooks"
                    element={protect(<PlaybookList />)}
                />

                <Route
                    path="/playbooks/executions/:id"
                    element={protect(<PlaybookExecutionDetail />)}
                />

                {/* Audit Logs */}

                <Route
                    path="/audit-logs"
                    element={protect(
                        <AuditLogs />,
                        ["ADMIN", "ANALYST"]
                    )}
                />

            </Routes>

        </BrowserRouter>

    );

}

export default AppRoutes;