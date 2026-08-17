import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { Navbar, Container, Nav, Spinner, Badge, Button } from 'react-bootstrap';
import { 
  FaSun, FaMoon, FaBell, FaUserMd, FaShieldAlt, FaUser,
  FaHeartbeat, FaSignOutAlt, FaStethoscope, FaUserNurse, FaBrain, FaHospitalUser
} from 'react-icons/fa';
import { useAuthStore } from './store/store';
import { patientsAPI } from './services/api';
import PatientProfileModal from './components/PatientProfileModal';
import OTPLogin from './pages/OTPLogin';
import PatientChat from './pages/PatientChat';
import PatientDashboard from './pages/PatientDashboard';
import PatientHome from './pages/PatientHome';
import DoctorHome from './pages/DoctorHome';
import DoctorDashboard from './pages/DoctorDashboard';
import DoctorMedications from './pages/DoctorMedications';
import DoctorAppointments from './pages/DoctorAppointments';
import ASHAHome from './pages/ASHAHome';
import ChiefMedicalOfficerHome from './pages/ChiefMedicalOfficerHome';
import CMOOverview from './pages/CMOOverview';
import CMODoctors from './pages/CMODoctors';
import CMOPatients from './pages/CMOPatients';
import AdminHome from './pages/AdminHome';
import PharmacyPortal from './pages/PharmacyPortal';
import LabPortal from './pages/LabPortal';
import './App.css';

function App() {
  const { isAuthenticated, clearSession } = useAuthStore();
  const [ready, setReady] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('app_theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('app_theme', theme);
    setReady(true);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  if (!ready) return <div className="d-flex justify-content-center align-items-center min-vh-100"><Spinner animation="border" variant="teal" /></div>;

  return (
    <BrowserRouter>
      <AppContent 
        isAuthenticated={isAuthenticated} 
        onLogout={clearSession} 
        theme={theme}
        toggleTheme={toggleTheme}
      />
    </BrowserRouter>
  );
}

function AppContent({ isAuthenticated, onLogout, theme, toggleTheme }) {
  const { role } = useAuthStore();
  const [patientProfile, setPatientProfile] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isFirstTimeOnboarding, setIsFirstTimeOnboarding] = useState(false);

  const isPatientRole = role === 'patient' || (!role || (role !== 'doctor' && role !== 'chief_doctor' && role !== 'asha' && role !== 'admin'));

  useEffect(() => {
    if (isAuthenticated && isPatientRole) {
      patientsAPI.getCurrentProfile()
        .then((res) => {
          const profile = res.data;
          setPatientProfile(profile);
          const isPlaceholderName = !profile.name || profile.name.startsWith('Patient ');
          if (!profile.is_profile_complete || isPlaceholderName) {
            setIsFirstTimeOnboarding(true);
            setShowProfileModal(true);
          }
        })
        .catch((err) => {
          console.warn('Failed to load patient profile:', err);
        });
    }
  }, [isAuthenticated, isPatientRole]);

  const redirectPath = () => {
    if (!isAuthenticated) return '/login';
    if (role === 'doctor') return '/doctor';
    if (role === 'chief_doctor') return '/cmo';
    if (role === 'admin') return '/admin';
    if (role === 'asha') return '/asha';
    if (role === 'pharmacist') return '/pharmacy';
    if (role === 'lab_technician') return '/lab';
    return '/patient';
  };

  const handleProfileSaveSuccess = (updatedProfile) => {
    setPatientProfile(updatedProfile);
    setIsFirstTimeOnboarding(false);
    setShowProfileModal(false);
  };

  const openProfileManually = () => {
    setIsFirstTimeOnboarding(false);
    setShowProfileModal(true);
  };

  return (
    <>
      {isAuthenticated && (
        <AppNavbar 
          onLogout={onLogout} 
          theme={theme} 
          toggleTheme={toggleTheme}
          onOpenProfile={openProfileManually}
          patientName={patientProfile?.name}
        />
      )}
      <main className="fade-slide-up">
        <Routes>
          <Route path="/login" element={<OTPLogin />} />

          {/* Strict Patient Routes */}
          <Route
            path="/patient"
            element={isAuthenticated ? (isPatientRole ? <PatientHome /> : <Navigate to={redirectPath()} />) : <Navigate to="/login" />}
          />
          <Route
            path="/dashboard"
            element={isAuthenticated ? (isPatientRole ? <PatientDashboard /> : <Navigate to={redirectPath()} />) : <Navigate to="/login" />}
          />
          <Route
            path="/chat"
            element={isAuthenticated ? (isPatientRole ? <PatientChat /> : <Navigate to={redirectPath()} />) : <Navigate to="/login" />}
          />

          {/* Strict Doctor Routes */}
          <Route
            path="/doctor"
            element={isAuthenticated && role === 'doctor' ? <DoctorHome /> : <Navigate to={redirectPath()} />}
          />
          <Route
            path="/doctor/patients"
            element={isAuthenticated && role === 'doctor' ? <DoctorDashboard /> : <Navigate to={redirectPath()} />}
          />
          <Route
            path="/doctor/medications"
            element={isAuthenticated && role === 'doctor' ? <DoctorMedications /> : <Navigate to={redirectPath()} />}
          />
          <Route
            path="/doctor/appointments"
            element={isAuthenticated && role === 'doctor' ? <DoctorAppointments /> : <Navigate to={redirectPath()} />}
          />

          {/* Strict CMO / Chief Doctor Routes */}
          <Route
            path="/cmo"
            element={isAuthenticated && role === 'chief_doctor' ? <ChiefMedicalOfficerHome /> : <Navigate to={redirectPath()} />}
          />
          <Route
            path="/cmo/overview"
            element={isAuthenticated && role === 'chief_doctor' ? <CMOOverview /> : <Navigate to={redirectPath()} />}
          />
          <Route
            path="/cmo/patients"
            element={isAuthenticated && role === 'chief_doctor' ? <CMOPatients /> : <Navigate to={redirectPath()} />}
          />
          <Route
            path="/cmo/doctors"
            element={isAuthenticated && role === 'chief_doctor' ? <CMODoctors /> : <Navigate to={redirectPath()} />}
          />

          {/* Strict ASHA & Admin Routes */}
          <Route
            path="/admin"
            element={isAuthenticated && role === 'admin' ? <AdminHome /> : <Navigate to={redirectPath()} />}
          />
          <Route 
            path="/asha" 
            element={isAuthenticated && role === 'asha' ? <ASHAHome /> : <Navigate to={redirectPath()} />} 
          />

          {/* Pharmacy & Path Lab Routes */}
          <Route 
            path="/pharmacy" 
            element={isAuthenticated && (role === 'pharmacist' || role === 'doctor' || role === 'chief_doctor' || role === 'admin') ? <PharmacyPortal /> : <Navigate to={redirectPath()} />} 
          />
          <Route 
            path="/lab" 
            element={isAuthenticated && (role === 'lab_technician' || role === 'doctor' || role === 'chief_doctor' || role === 'admin') ? <LabPortal /> : <Navigate to={redirectPath()} />} 
          />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to={redirectPath()} />} />
        </Routes>
      </main>

      {/* Patient Profile Completion & Editing Modal */}
      {isPatientRole && (
        <PatientProfileModal
          show={showProfileModal}
          onHide={() => setShowProfileModal(false)}
          profileData={patientProfile}
          onSaveSuccess={handleProfileSaveSuccess}
          isFirstTimeOnboarding={isFirstTimeOnboarding}
        />
      )}
    </>
  );
}

function AppNavbar({ onLogout, theme, toggleTheme, onOpenProfile, patientName }) {
  const { role } = useAuthStore();
  const location = useLocation();
  const [showNotifDrawer, setShowNotifDrawer] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: 1, text: 'System Security: Authenticated Session Active', time: '1m ago', unread: true },
    { id: 2, text: 'Clinical Notifications Synced', time: '10m ago', unread: false }
  ]);

  const isPatientRole = role === 'patient' || (!role || (role !== 'doctor' && role !== 'chief_doctor' && role !== 'asha' && role !== 'admin'));
  const unreadCount = notifications.filter(n => n.unread).length;

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, unread: false })));
  };

  const navLinks = {
    patient: [
      { label: 'Health Hub', href: '/patient' },
      { label: 'My Dashboard', href: '/dashboard' },
      { label: 'AI Symptom Bot', href: '/chat' },
    ],
    doctor: [
      { label: 'Doctor Hub', href: '/doctor' },
      { label: 'Clinical Queue & Roster', href: '/doctor/patients' },
      { label: 'Pharmacy Workstation 💊', href: '/pharmacy' },
      { label: 'Path Lab Portal 🧪', href: '/lab' },
      { label: 'Hospital Schedule', href: '/doctor/appointments' },
    ],
    pharmacist: [
      { label: 'Pharmacy Inventory & Dispensing 💊', href: '/pharmacy' },
    ],
    lab_technician: [
      { label: 'Pathology Lab Queue & Results 🧪', href: '/lab' },
    ],
    asha: [
      { label: 'ASHA Field Center', href: '/asha' },
    ],
    chief_doctor: [
      { label: 'CMO Command Center', href: '/cmo' },
      { label: 'GIS Epidemic Maps', href: '/cmo/overview' },
      { label: 'Pharmacy Inventory 💊', href: '/pharmacy' },
      { label: 'Path Lab Portal 🧪', href: '/lab' },
    ],
    admin: [
      { label: 'System Telemetry', href: '/admin' },
      { label: 'Pharmacy Workstation 💊', href: '/pharmacy' },
      { label: 'Path Lab Portal 🧪', href: '/lab' },
    ],
  };

  const getRoleLabel = () => {
    if (role === 'doctor') return { label: 'Doctor Portal', bg: 'primary', icon: FaStethoscope };
    if (role === 'chief_doctor') return { label: 'Chief Medical Officer', bg: 'dark', icon: FaBrain };
    if (role === 'pharmacist') return { label: 'Pharmacist Workstation', bg: 'warning', icon: FaStethoscope };
    if (role === 'lab_technician') return { label: 'Path Lab Specialist', bg: 'info', icon: FaStethoscope };
    if (role === 'asha') return { label: 'ASHA Worker', bg: 'success', icon: FaUserNurse };
    if (role === 'admin') return { label: 'Administrator', bg: 'danger', icon: FaShieldAlt };
    return { label: patientName || 'Patient Portal', bg: 'teal', icon: FaHospitalUser };
  };

  const roleInfo = getRoleLabel();
  const RoleIcon = roleInfo.icon;

  return (
    <Navbar expand="lg" sticky="top" className="custom-navbar py-2 px-3 mb-3">
      <Container fluid className="px-lg-4">
        <Navbar.Brand as={Link} to={navLinks[role]?.[0]?.href || '/patient'} className="brand-logo me-4">
          <span style={{ color: 'var(--accent-teal)' }}><FaHeartbeat className="me-2 text-danger animate-pulse" />Swasthya</span>
          <span style={{ color: 'var(--accent-cyan)' }}>Mitra</span>
          <span className="brand-badge ms-2">AI 2.0</span>
        </Navbar.Brand>

        {/* Display Active Authenticated Role Badge */}
        <div className="d-none d-md-flex align-items-center me-3">
          <span className="badge-role px-3 py-2 rounded-pill fs-7 d-flex align-items-center gap-2 shadow-sm">
            <RoleIcon size={14} />
            {roleInfo.label}
          </span>
        </div>

        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            {(navLinks[role] || navLinks.patient).map((link) => {
              const active = location.pathname === link.href;
              return (
                <Nav.Link 
                  key={link.href} 
                  as={Link} 
                  to={link.href} 
                  className={`fw-bold px-3 py-2 rounded-3 transition-all me-1 ${active ? 'text-teal bg-teal-subtle active-nav-link' : 'text-body'}`}
                  style={{ color: active ? 'var(--accent-teal)' : 'var(--text-main)' }}
                >
                  {link.label}
                </Nav.Link>
              );
            })}
          </Nav>

          <div className="d-flex align-items-center gap-2 mt-3 mt-lg-0 position-relative">
            {/* Patient Profile Edit Button */}
            {isPatientRole && (
              <Button
                size="sm"
                className="btn-profile rounded-pill px-3 py-1.5 fw-bold text-white shadow-sm d-flex align-items-center gap-2"
                onClick={onOpenProfile}
                title="Edit My Patient Profile"
              >
                <FaUser size={12} /> My Profile
              </Button>
            )}

            {/* Theme Toggle Button */}
            <Button
              variant="outline-secondary"
              className="rounded-circle p-2 d-flex align-items-center justify-content-center border-0"
              style={{ width: '38px', height: '38px', background: 'rgba(13, 148, 136, 0.1)', color: 'var(--accent-teal)' }}
              onClick={toggleTheme}
              title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
            >
              {theme === 'light' ? <FaMoon size={16} /> : <FaSun size={16} className="text-warning" />}
            </Button>

            {/* Notifications Bell Drawer Toggle */}
            <div className="position-relative">
              <Button
                variant="outline-secondary"
                className="rounded-circle p-2 d-flex align-items-center justify-content-center border-0 position-relative"
                style={{ width: '38px', height: '38px', background: 'rgba(2, 132, 199, 0.1)', color: 'var(--accent-cyan)' }}
                onClick={() => setShowNotifDrawer(!showNotifDrawer)}
                title="Notifications"
              >
                <FaBell size={16} />
                {unreadCount > 0 && (
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '0.6rem' }}>
                    {unreadCount}
                  </span>
                )}
              </Button>

              {/* Notification Slide-out Menu */}
              {showNotifDrawer && (
                <div className="notif-drawer fade-slide-up">
                  <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
                    <h6 className="mb-0 fw-bold d-flex align-items-center gap-2">
                      <FaBell className="text-cyan" /> Notifications
                    </h6>
                    {unreadCount > 0 && (
                      <Button size="sm" variant="link" className="p-0 text-teal text-decoration-none fs-7" onClick={markAllRead}>
                        Mark all read
                      </Button>
                    )}
                  </div>
                  {notifications.map((n) => (
                    <div key={n.id} className={`notif-item ${n.unread ? 'bg-teal-subtle font-weight-bold' : ''}`}>
                      <div className="d-flex justify-content-between text-muted fs-7">
                        <small>{n.time}</small>
                        {n.unread && <Badge bg="teal" className="p-1 rounded-circle"></Badge>}
                      </div>
                      <div className="fs-7 text-main mt-1">{n.text}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Logout Button */}
            <Button
              variant="outline-danger"
              size="sm"
              className="rounded-pill px-3 py-1 fw-bold ms-2 d-flex align-items-center gap-2"
              onClick={() => {
                onLogout();
                window.location.href = '/login';
              }}
            >
              <FaSignOutAlt /> Exit
            </Button>
          </div>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default App;
