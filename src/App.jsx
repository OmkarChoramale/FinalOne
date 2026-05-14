import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';

// --- COMPONENTS ---
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// --- PUBLIC PAGES ---
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';

// --- THE ONE SMART DASHBOARD ---
import Dashboard from './pages/Report/Dashboard';
import { NotificationProvider } from './context/NotificationContext';

// --- TOURIST PAGES ---
import TouristDashboard from './pages/Tourist/TouristDashboard';
import TouristEvents from './pages/Program-Events/TouristEvents';
import TouristPrograms from './pages/Program-Events/TouristPrograms';
import CompleteProfile from './pages/Tourist/CompleteProfile';
import DocumentManager from './pages/Tourist/DocumentManager';

// 🔥 OFFICER DASHBOARD FOR TOURISTS 🔥
import AdminTourists from './pages/Tourist/AdminTourists'; 

// --- ADMIN PAGES ---
import AdminEvents from './pages/Program-Events/AdminEvents';
import AdminPrograms from './pages/Program-Events/AdminPrograms';
import AdminHeritageSites from './pages/Sites/AdminHeritageSites'; 
import NotificationsPage from './pages/Report/NotificationsPage';
import ReportsPage from './pages/Report/ReportPage'; 

// --- COMPLIANCE & AUDIT PAGES ---
import ComplianceDashboard from './pages/Compliance/ComplianceDashboard';
import AuditDashboard from './pages/Compliance/AuditDashboard';

// --- ADMIN MANAGEMENT PAGES ---
import AdminUsers from './pages/Admin/AdminUsers'; 
import AuditLogs from './pages/Admin/AuditLogs'; 

// =======================================================
// LAYOUT WRAPPER (Handles the Navbar for logged-in pages)
// =======================================================
const LayoutWithNavbar = ({ authState }) => {
  return (
    <>
      <Navbar unreadNotifications={authState.unreadNotifications} />
      <Outlet /> 
    </>
  );
};

// =======================================================
// PROFILE GUARD (Forces tourists to complete setup)
// =======================================================
const TouristProfileGuard = ({ children, authState }) => {
  if (authState.userRole === 'TOURIST' && !authState.hasProfile) {
    return <Navigate to="/complete-profile" replace />;
  }
  return children;
};

function App() {
  const [authState, setAuthState] = useState({
    isLoggedIn: !!localStorage.getItem('token'), 
    userRole: localStorage.getItem('role') || "TOURIST", 
    userName: localStorage.getItem('name') || "User",
    hasProfile: localStorage.getItem('hasProfile') === 'true', 
    unreadNotifications: 0
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const name = localStorage.getItem('name');
    const hasProfileStr = localStorage.getItem('hasProfile');
    
    if (token) {
      setAuthState(prev => ({ 
        ...prev, 
        isLoggedIn: true, 
        userRole: role, 
        userName: name,
        hasProfile: hasProfileStr === 'true'
      }));
    }
  }, []);

  return (
    <NotificationProvider>
      <Router>
        <div className="relative min-h-screen bg-[#FFFDF7]">
          <Routes>
            
            {/* PUBLIC ROUTES */}
            <Route path="/login" element={!authState.isLoggedIn ? <Login /> : <Navigate to="/main-dashboard" />} />
            <Route path="/register" element={!authState.isLoggedIn ? <Register /> : <Navigate to="/main-dashboard" />} />
            <Route path="/complete-profile" element={
              authState.isLoggedIn ? 
                (authState.hasProfile ? <Navigate to="/main-dashboard" /> : <CompleteProfile />) 
                : <Navigate to="/login" />
            } />

            {/* PROTECTED ROUTES (With Navbar) */}
            <Route element={<LayoutWithNavbar authState={authState} />}>
              
              <Route path="/" element={<Home />} />
              
              <Route path="/main-dashboard" element={
                authState.isLoggedIn ? 
                <TouristProfileGuard authState={authState}><Dashboard /></TouristProfileGuard> 
                : <Navigate to="/login" />
              } />
              
              <Route path="/admin" element={<Navigate to="/main-dashboard" />} />
              <Route path="/dashboard" element={<Navigate to="/main-dashboard" />} />

              {/* TOURIST ROUTES */}
              <Route path="/tourist" element={authState.isLoggedIn ? <TouristProfileGuard authState={authState}><TouristDashboard /></TouristProfileGuard> : <Navigate to="/login" />} />
              <Route path="/tourist/events" element={authState.isLoggedIn ? <TouristProfileGuard authState={authState}><TouristEvents /></TouristProfileGuard> : <Navigate to="/login" />} />
              <Route path="/tourist/programs" element={authState.isLoggedIn ? <TouristProfileGuard authState={authState}><TouristPrograms /></TouristProfileGuard> : <Navigate to="/login" />} />
              <Route path="/tourist/documents" element={authState.isLoggedIn ? <TouristProfileGuard authState={authState}><DocumentManager /></TouristProfileGuard> : <Navigate to="/login" />} />

              {/* 🔥 OFFICER DASHBOARD ROUTE FOR TOURISTS 🔥 */}
              <Route path="/admin-tourists" element={<ProtectedRoute allowedRoles={['ADMIN', 'OFFICER', 'MANAGER', 'AUDITOR']}><AdminTourists /></ProtectedRoute>} />

              {/* ADMIN ROUTES */}
              <Route path="/events" element={authState.isLoggedIn ? <AdminEvents /> : <Navigate to="/login" />} />
              <Route path="/programs" element={authState.isLoggedIn ? <AdminPrograms /> : <Navigate to="/login" />} />
              <Route path="/sites" element={authState.isLoggedIn ? <AdminHeritageSites /> : <Navigate to="/login" />} /> 
              
              <Route path="/compliance" element={<ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'COMPLIANCE', 'AUDITOR', 'OFFICER']}><ComplianceDashboard /></ProtectedRoute>} />
              <Route path="/audits" element={<ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'COMPLIANCE', 'AUDITOR', 'OFFICER']}><AuditDashboard /></ProtectedRoute>} />
              <Route path="/reports" element={<ProtectedRoute allowedRoles={['ADMIN', 'MANAGER', 'COMPLIANCE', 'AUDITOR', 'OFFICER']}><ReportsPage /></ProtectedRoute>} />
              <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
              <Route path="/admin-users" element={<ProtectedRoute allowedRoles={['ADMIN', 'OFFICER']}><AdminUsers /></ProtectedRoute>} />
              <Route path="/audit-logs" element={<ProtectedRoute allowedRoles={['ADMIN', 'OFFICER']}><AuditLogs /></ProtectedRoute>} />

              <Route path="*" element={<Navigate to="/" />} />
            </Route>

          </Routes>
        </div>
      </Router>
    </NotificationProvider>
  );
}

export default App;