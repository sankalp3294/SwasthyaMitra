import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Card, Form, Button, Alert, Spinner, Badge, Row, Col, Modal } from 'react-bootstrap';
import { 
  FaHeartbeat, FaMobileAlt, FaUserMd, FaUserPlus, 
  FaPhoneAlt, FaAmbulance, FaPhoneVolume
} from 'react-icons/fa';
import { authAPI, hospitalAPI } from '../services/api';
import { useAuthStore } from '../store/store';
import './Auth.css';

export default function OTPLogin() {
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);
  const [loginMode, setLoginMode] = useState('patient'); // Default: 'patient' (OTP Login). Signup form hidden until clicked.
  const [step, setStep] = useState('phone'); // 'phone' or 'otp'
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);

  // Fast-Track Emergency Dispatch Form & Pass State
  const [emgDispatchForm, setEmgDispatchForm] = useState({
    phone_number: '',
    patient_name: '',
    emergency_type: 'Severe Chest Pain / Cardiac Emergency',
    location: 'Swasthya Nagar',
    notes: '',
  });
  const [emgDispatchResult, setEmgDispatchResult] = useState(null);
  const [emgLoading, setEmgLoading] = useState(false);
  const [emgTab, setEmgTab] = useState('dispatch'); // 'dispatch' or 'hotlines'

  // 10-Second SOS Cancellation & Retraction Countdown State
  const [sosCountdown, setSosCountdown] = useState(null);
  const [sosIntervalId, setSosIntervalId] = useState(null);
  const [sosRetractedMessage, setSosRetractedMessage] = useState('');

  // Patient Sign Up Form State
  const [signupForm, setSignupForm] = useState({
    phone_number: '',
    name: '',
    age: '',
    gender: 'Male',
    address: '',
    location: 'Swasthya Nagar',
    blood_group: 'O+',
    language_preference: 'en',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const getRoleRoute = (userRole) => {
    if (userRole === 'doctor') return '/doctor';
    if (userRole === 'chief_doctor') return '/cmo';
    if (userRole === 'admin') return '/admin';
    if (userRole === 'asha') return '/asha';
    if (userRole === 'pharmacist') return '/pharmacy';
    if (userRole === 'lab_technician') return '/lab';
    return '/patient';
  };

  const handleSignupChange = (e) => {
    const { name, value } = e.target;
    setSignupForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePatientSignUp = async (e) => {
    e.preventDefault();
    const cleanPhone = signupForm.phone_number.replace(/\D/g, '').slice(-10);
    if (!cleanPhone || cleanPhone.length < 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    if (!signupForm.name || signupForm.name.trim() === '') {
      setError('Please enter your full name');
      return;
    }
    if (!signupForm.age || Number(signupForm.age) <= 0) {
      setError('Please enter your age');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // 1. Register Patient Profile
      const registerPayload = {
        phone_number: cleanPhone,
        name: signupForm.name.trim(),
        age: Number(signupForm.age),
        gender: signupForm.gender,
        address: signupForm.address.trim(),
        location: signupForm.location,
        blood_group: signupForm.blood_group,
        language_preference: signupForm.language_preference,
      };

      await authAPI.registerPatient(registerPayload);

      // 2. Request OTP for the registered phone number
      setPhoneNumber(cleanPhone);
      const response = await authAPI.requestOTP(cleanPhone);

      if (response.data.otp) {
        setSuccess(`Registration successful! Verification code sent to ${cleanPhone}. Demo Code: ${response.data.otp}`);
      } else {
        setSuccess(`Registration successful! 📱 Real SMS sent to ${cleanPhone}.`);
      }

      setStep('otp');
    } catch (err) {
      if (err.response?.data?.detail === 'Patient already registered') {
        setError('Mobile number is already registered! Requesting OTP to log in...');
        setPhoneNumber(cleanPhone);
        try {
          const res = await authAPI.requestOTP(cleanPhone);
          setSuccess(`Existing user detected. Demo OTP: ${res.data.otp || 'Code Sent'}`);
          setStep('otp');
        } catch (e2) {
          setError(e2.response?.data?.detail || 'Failed to request OTP');
        }
      } else {
        setError(err.response?.data?.detail || 'Failed to register patient account');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    if (!phoneNumber || phoneNumber.length < 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.requestOTP(phoneNumber);
      if (response.data.otp) {
        setSuccess(`OTP sent to ${phoneNumber}. Demo Code: ${response.data.otp}`);
      } else {
        setSuccess(`📱 Real SMS sent to ${phoneNumber}! Check your phone.`);
      }
      setStep('otp');
      setError('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to request OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      setError('Please enter the 6-digit OTP code');
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.verifyOTP(phoneNumber, otp);
      const userRole = response.data.role || 'patient';
      setSession(response.data.session_token, response.data.patient_id, userRole);
      navigate(getRoleRoute(userRole));
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid OTP verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleStaffLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Enter your staff email address and password');
      return;
    }
    setLoading(true);
    try {
      const response = await authAPI.staffLogin(email, password);
      const userRole = response.data.role;
      setSession(response.data.session_token, response.data.patient_id, userRole);
      navigate(getRoleRoute(userRole));
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to sign in with credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = (role) => {
    setSession(`demo_session_${role}`, '101', role);
    navigate(getRoleRoute(role));
  };

  const triggerSOSCountdown = (e) => {
    if (e) e.preventDefault();
    const cleanPhone = emgDispatchForm.phone_number.replace(/\D/g, '').slice(-10);
    if (!cleanPhone || cleanPhone.length < 10) {
      setError('Please enter a valid 10-digit emergency contact phone number');
      return;
    }
    setError('');
    setSosRetractedMessage('');
    setSosCountdown(10);

    if (sosIntervalId) clearInterval(sosIntervalId);

    let count = 10;
    const timer = setInterval(() => {
      count -= 1;
      setSosCountdown(count);
      if (count <= 0) {
        clearInterval(timer);
        setSosCountdown(null);
        executeEmergencyDispatch(cleanPhone);
      }
    }, 1000);
    setSosIntervalId(timer);
  };

  const cancelAndRetractSOS = async () => {
    if (sosIntervalId) clearInterval(sosIntervalId);
    setSosCountdown(null);
    setSosIntervalId(null);
    setSosRetractedMessage('✅ SOS Emergency Signal successfully RETRACTED & CANCELED within 10-second safety window.');

    if (emgDispatchResult?.emergency_pass_code) {
      try {
        await hospitalAPI.cancelEmergency({ emergency_pass_code: emgDispatchResult.emergency_pass_code });
      } catch (e) {}
      setEmgDispatchResult(null);
    }
  };

  const executeEmergencyDispatch = async (phone) => {
    if (sosIntervalId) clearInterval(sosIntervalId);
    setSosCountdown(null);
    setEmgLoading(true);
    setError('');
    const targetPhone = phone || emgDispatchForm.phone_number.replace(/\D/g, '').slice(-10) || '9876543210';
    try {
      const response = await hospitalAPI.dispatchEmergency({
        ...emgDispatchForm,
        phone_number: targetPhone
      });
      setEmgDispatchResult(response.data);
      setSuccess(`🚨 Emergency Fast-Track Pass Generated! Code: ${response.data.emergency_pass_code}`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to dispatch emergency response unit');
    } finally {
      setEmgLoading(false);
    }
  };

  const switchMode = (mode) => {
    setLoginMode(mode);
    setStep('phone');
    setError('');
    setSuccess('');
  };

  return (
    <div className="auth-container fade-slide-up">
      <Container className="d-flex flex-column align-items-center justify-content-center min-vh-100 py-4">
        
        {/* 🚨 24/7 CRITICAL MEDICAL EMERGENCY HELPLINE BANNER */}
        <div className="w-100 mb-3" style={{ maxWidth: loginMode === 'signup' ? '580px' : '460px' }}>
          <Alert variant="danger" className="border-0 shadow-lg rounded-4 p-3 m-0 bg-danger text-white">
            <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
              <div className="d-flex align-items-center gap-2.5">
                <div className="bg-white text-danger p-2 rounded-circle d-flex align-items-center justify-content-center shadow-sm flex-shrink-0">
                  <FaAmbulance size={22} className="animate-pulse text-danger" />
                </div>
                <div>
                  <div className="fw-extrabold text-uppercase letter-spacing-1 fs-7 text-white">
                    🚨 CRITICAL MEDICAL EMERGENCY?
                  </div>
                  <div className="small text-white opacity-90" style={{ fontSize: '0.82rem' }}>
                    For trauma, chest pain or breathlessness:
                  </div>
                </div>
              </div>
              <div className="d-flex align-items-center gap-2 ms-auto">
                <a 
                  href="tel:108" 
                  className="btn btn-light text-danger fw-extrabold px-3 py-1.5 rounded-pill shadow-sm fs-7 text-decoration-none d-flex align-items-center gap-1.5"
                >
                  <FaPhoneAlt size={12} /> Call 108
                </a>
                <Button 
                  variant="outline-light" 
                  size="sm" 
                  className="rounded-pill px-2.5 py-1.5 fs-8 text-white border-white fw-semibold"
                  onClick={() => setShowEmergencyModal(true)}
                >
                  Hotlines 📋
                </Button>
              </div>
            </div>
          </Alert>
        </div>

        <Card className="app-card shadow-lg border-0" style={{ maxWidth: loginMode === 'signup' ? '580px' : '460px', width: '100%' }}>
          <Card.Body className="p-4 p-md-5">
            <div className="text-center mb-4">
              <div className="p-3 rounded-circle bg-teal-subtle text-teal d-inline-block mb-3">
                <FaHeartbeat size={44} className="animate-pulse text-teal" />
              </div>
              <h2 className="fw-extrabold mb-1" style={{ color: 'var(--text-heading)' }}>
                Swasthya<span className="text-cyan">Mitra</span>
              </h2>
              <p className="text-muted small">NextGen AI Health Platform & OPD Triage</p>
            </div>

            {/* 3-Way Mode Switcher: Sign Up | OTP Login | Staff */}
            <div className="bg-body-tertiary p-1.5 rounded-pill d-flex gap-1 mb-4 border shadow-sm">
              <Button
                variant={loginMode === 'signup' ? 'teal' : 'light'}
                className={`flex-fill rounded-pill py-2 fw-bold text-center border-0 fs-7 ${loginMode === 'signup' ? 'bg-teal text-white shadow' : 'text-muted bg-transparent'}`}
                onClick={() => switchMode('signup')}
                disabled={loading}
              >
                📝 Patient Sign Up
              </Button>
              <Button
                variant={loginMode === 'patient' ? 'teal' : 'light'}
                className={`flex-fill rounded-pill py-2 fw-bold text-center border-0 fs-7 ${loginMode === 'patient' ? 'bg-teal text-white shadow' : 'text-muted bg-transparent'}`}
                onClick={() => switchMode('patient')}
                disabled={loading}
              >
                🔑 OTP Login
              </Button>
              <Button
                variant={loginMode === 'staff' ? 'teal' : 'light'}
                className={`flex-fill rounded-pill py-2 fw-bold text-center border-0 fs-7 ${loginMode === 'staff' ? 'bg-teal text-white shadow' : 'text-muted bg-transparent'}`}
                onClick={() => switchMode('staff')}
                disabled={loading}
              >
                🩺 Staff Portal
              </Button>
            </div>

            {error && <Alert variant="danger" className="rounded-3">{error}</Alert>}
            {success && <Alert variant="success" className="rounded-3">{success}</Alert>}

            {/* Step: OTP Code Verification (Shown after Sign Up or OTP Login) */}
            {step === 'otp' ? (
              <Form onSubmit={handleVerifyOTP}>
                <Form.Group className="mb-4">
                  <Form.Label className="fw-semibold">Enter 6-Digit Verification OTP</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="6-digit verification code"
                    maxLength="6"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    disabled={loading}
                    className="rounded-3 p-2 border-2 text-center fs-4 font-monospace letter-spacing-2"
                  />
                  <small className="text-muted d-block text-center mt-1">Code sent to {phoneNumber}</small>
                </Form.Group>

                <Button
                  className="primary-action w-100 py-2.5 mb-2 rounded-3 fw-bold"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? <Spinner size="sm" className="me-2" /> : null} Verify OTP & Enter Portal
                </Button>

                <Button
                  variant="link"
                  className="w-100 text-teal text-decoration-none small"
                  onClick={() => { setStep('phone'); setOtp(''); }}
                  disabled={loading}
                >
                  ← Back to Start
                </Button>
              </Form>
            ) : loginMode === 'signup' ? (
              /* Patient Sign Up Form */
              <Form onSubmit={handlePatientSignUp}>
                <Row className="g-3 mb-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-semibold">Mobile Number <span className="text-danger">*</span></Form.Label>
                      <Form.Control
                        type="tel"
                        name="phone_number"
                        placeholder="10-digit mobile number"
                        value={signupForm.phone_number}
                        onChange={handleSignupChange}
                        disabled={loading}
                        required
                        className="rounded-3 p-2 border-2"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-semibold">Full Name <span className="text-danger">*</span></Form.Label>
                      <Form.Control
                        type="text"
                        name="name"
                        placeholder="e.g. Ramesh Kumar"
                        value={signupForm.name}
                        onChange={handleSignupChange}
                        disabled={loading}
                        required
                        className="rounded-3 p-2 border-2"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row className="g-3 mb-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-semibold">Age (Years) <span className="text-danger">*</span></Form.Label>
                      <Form.Control
                        type="number"
                        name="age"
                        placeholder="e.g. 35"
                        min="1"
                        max="120"
                        value={signupForm.age}
                        onChange={handleSignupChange}
                        disabled={loading}
                        required
                        className="rounded-3 p-2 border-2"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-semibold">Gender <span className="text-danger">*</span></Form.Label>
                      <Form.Select
                        name="gender"
                        value={signupForm.gender}
                        onChange={handleSignupChange}
                        disabled={loading}
                        className="rounded-3 p-2 border-2 fw-semibold"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Residential Address / Village</Form.Label>
                  <Form.Control
                    type="text"
                    name="address"
                    placeholder="House / Street / Village Details"
                    value={signupForm.address}
                    onChange={handleSignupChange}
                    disabled={loading}
                    className="rounded-3 p-2 border-2"
                  />
                </Form.Group>

                <Row className="g-3 mb-4">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-semibold">Health Zone / Ward</Form.Label>
                      <Form.Select
                        name="location"
                        value={signupForm.location}
                        onChange={handleSignupChange}
                        disabled={loading}
                        className="rounded-3 p-2 border-2 fw-semibold"
                      >
                        <option value="Swasthya Nagar">Swasthya Nagar</option>
                        <option value="Wellness Ward">Wellness Ward</option>
                        <option value="Central Zone">Central Zone</option>
                        <option value="North District">North District</option>
                        <option value="South Ward">South Ward</option>
                        <option value="East Region">East Region</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-semibold">Blood Group</Form.Label>
                      <Form.Select
                        name="blood_group"
                        value={signupForm.blood_group}
                        onChange={handleSignupChange}
                        disabled={loading}
                        className="rounded-3 p-2 border-2 fw-semibold"
                      >
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Button
                  className="primary-action w-100 py-2.5 rounded-3 fw-bold d-flex align-items-center justify-content-center gap-2 mb-3"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? <Spinner size="sm" /> : <FaUserPlus />} Register & Create Profile
                </Button>

                <div className="text-center">
                  <small className="text-muted">
                    Already registered?{' '}
                    <span 
                      className="text-teal fw-bold cursor-pointer text-decoration-underline"
                      onClick={() => switchMode('patient')}
                    >
                      Log in with OTP →
                    </span>
                  </small>
                </div>
              </Form>
            ) : loginMode === 'staff' ? (
              /* Staff Login Form */
              <Form onSubmit={handleStaffLogin}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Work Email</Form.Label>
                  <Form.Control 
                    type="email" 
                    placeholder="doctor@swasthyamitra.demo" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    disabled={loading}
                    className="rounded-3 p-2 border-2"
                  />
                </Form.Group>
                <Form.Group className="mb-4">
                  <Form.Label className="fw-semibold">Password</Form.Label>
                  <Form.Control 
                    type="password" 
                    placeholder="Enter your staff password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    disabled={loading}
                    className="rounded-3 p-2 border-2"
                  />
                </Form.Group>
                <Button className="primary-action w-100 py-2.5 rounded-3 fw-bold" type="submit" disabled={loading}>
                  {loading ? <Spinner size="sm" className="me-2" /> : <FaUserMd className="me-2" />}
                  Sign In to Clinical Staff Portal
                </Button>
              </Form>
            ) : (
              /* Existing Patient OTP Login Form */
              <Form onSubmit={handleRequestOTP}>
                <Form.Group className="mb-4">
                  <Form.Label className="fw-semibold">Registered Mobile Number</Form.Label>
                  <Form.Control
                    type="tel"
                    placeholder="Enter 10-digit mobile number"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(-10))}
                    disabled={loading}
                    className="rounded-3 p-2 border-2"
                  />
                </Form.Group>

                <Button
                  className="primary-action w-100 py-2.5 rounded-3 fw-bold d-flex align-items-center justify-content-center gap-2 mb-3"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? <Spinner size="sm" /> : <FaMobileAlt />} Request Secure OTP Code
                </Button>

                <div className="text-center">
                  <small className="text-muted">
                    New Patient?{' '}
                    <span 
                      className="text-teal fw-bold cursor-pointer text-decoration-underline"
                      onClick={() => switchMode('signup')}
                    >
                      Create account & sign up here →
                    </span>
                  </small>
                </div>
              </Form>
            )}

            {/* Quick Demo Access Bar */}
            <div className="mt-4 pt-3 border-top text-center">
              <small className="text-muted fw-bold d-block mb-2">⚡ 1-Click Instant Demo Login:</small>
              <div className="d-flex justify-content-center flex-wrap gap-1 mb-3">
                <Button size="sm" variant="outline-teal" className="rounded-pill px-2 py-1 fs-7" onClick={() => handleQuickDemoLogin('patient')}>
                  Patient
                </Button>
                <Button size="sm" variant="outline-cyan" className="rounded-pill px-2 py-1 fs-7" onClick={() => handleQuickDemoLogin('doctor')}>
                  Doctor
                </Button>
                <Button size="sm" variant="outline-warning" className="rounded-pill px-2 py-1 fs-7 fw-bold" onClick={() => handleQuickDemoLogin('pharmacist')}>
                  💊 Pharmacist
                </Button>
                <Button size="sm" variant="outline-info" className="rounded-pill px-2 py-1 fs-7 fw-bold" onClick={() => handleQuickDemoLogin('lab_technician')}>
                  🧪 Path Lab
                </Button>
                <Button size="sm" variant="outline-primary" className="rounded-pill px-2 py-1 fs-7" onClick={() => handleQuickDemoLogin('chief_doctor')}>
                  CMO
                </Button>
                <Button size="sm" variant="outline-success" className="rounded-pill px-2 py-1 fs-7" onClick={() => handleQuickDemoLogin('asha')}>
                  ASHA
                </Button>
              </div>

              {/* Emergency Hotline Shortcut Link */}
              <div className="bg-danger-subtle p-2 rounded-3 text-center border border-danger-subtle">
                <small className="text-danger fw-bold d-flex align-items-center justify-content-center gap-1">
                  <FaPhoneVolume className="animate-pulse" /> 24/7 Emergency Medical Response:
                  <a href="tel:108" className="text-danger text-decoration-underline fw-extrabold ms-1">108</a>
                  <span className="text-muted fw-normal ms-1">or</span>
                  <a href="tel:18001801108" className="text-danger text-decoration-underline fw-extrabold ms-1">1800-180-1108</a>
                </small>
              </div>
            </div>
          </Card.Body>
        </Card>

        {/* 24/7 Fast-Track Emergency SOS & Hotlines Modal */}
        <Modal show={showEmergencyModal} onHide={() => { setShowEmergencyModal(false); setEmgDispatchResult(null); }} centered className="rounded-4">
          <Modal.Header closeButton className="bg-danger text-white border-0">
            <Modal.Title className="fw-extrabold fs-5 d-flex align-items-center gap-2">
              <FaAmbulance className="animate-pulse" /> 1-Click Fast-Track Emergency Dispatch & Hotlines
            </Modal.Title>
          </Modal.Header>

          <Modal.Body className="p-4">
            {/* Sub-tabs: SOS Fast-Track Booking vs Hotlines */}
            <div className="d-flex gap-2 mb-3 border-bottom pb-2">
              <Button 
                variant={emgTab === 'dispatch' ? 'danger' : 'light'} 
                size="sm" 
                className="rounded-pill fw-bold px-3 flex-fill"
                onClick={() => setEmgTab('dispatch')}
              >
                🚨 Fast-Track SOS Dispatch
              </Button>
              <Button 
                variant={emgTab === 'hotlines' ? 'danger' : 'light'} 
                size="sm" 
                className="rounded-pill fw-bold px-3 flex-fill"
                onClick={() => setEmgTab('hotlines')}
              >
                📞 Emergency Contacts
              </Button>
            </div>

            {sosRetractedMessage && (
              <Alert variant="success" className="rounded-3 border-0 shadow-sm mb-3 text-center fw-bold" dismissible onClose={() => setSosRetractedMessage('')}>
                {sosRetractedMessage}
              </Alert>
            )}

            {sosCountdown !== null ? (
              /* 10-Second Retractable SOS Countdown Timer View */
              <div className="bg-danger text-white p-4 rounded-4 text-center shadow-lg animate-pulse">
                <Badge bg="white" text="danger" className="fs-7 px-3 py-1.5 rounded-pill mb-2 fw-extrabold shadow-sm">
                  🚨 RETRACTABLE SOS EMERGENCY TRIGGERED
                </Badge>
                <h1 className="display-2 fw-extrabold font-monospace mb-2 text-white letter-spacing-1">
                  00:{String(sosCountdown).padStart(2, '0')}
                </h1>
                <p className="fw-semibold mb-3 fs-6">
                  Dispatching GPS Ambulance & reserving ER Hospital Bed in <strong className="text-warning fs-5">{sosCountdown} seconds</strong>...
                </p>

                <div className="progress mb-4 bg-black bg-opacity-25" style={{ height: '12px' }}>
                  <div 
                    className="progress-bar bg-warning progress-bar-striped progress-bar-animated" 
                    style={{ width: `${(sosCountdown / 10) * 100}%`, transition: 'width 1s linear' }}
                  ></div>
                </div>

                <div className="d-flex flex-column gap-2">
                  <Button 
                    variant="light" 
                    size="lg"
                    className="text-danger fw-extrabold rounded-pill py-2.5 shadow fs-6 d-flex align-items-center justify-content-center gap-2"
                    onClick={cancelAndRetractSOS}
                  >
                    ❌ CANCEL & RETRACT SOS SIGNAL (Accidental Press)
                  </Button>
                  <Button 
                    variant="outline-light" 
                    size="sm" 
                    className="rounded-pill fw-semibold border-white opacity-90 mt-1"
                    onClick={() => executeEmergencyDispatch()}
                  >
                    ⚡ DISPATCH IMMEDIATELY (Skip 10s Countdown)
                  </Button>
                </div>
              </div>
            ) : emgDispatchResult ? (
              /* Live Fast-Track Emergency Pass Card */
              <div className="bg-danger-subtle p-3 rounded-4 border border-danger">
                <div className="text-center mb-3">
                  <Badge bg="danger" className="fs-7 px-3 py-1.5 rounded-pill mb-1">
                    🚨 FAST-TRACK EMERGENCY DISPATCHED
                  </Badge>
                  <h4 className="fw-extrabold text-danger mb-0 font-monospace">
                    {emgDispatchResult.emergency_pass_code}
                  </h4>
                  <small className="text-muted">Show this code upon ambulance / hospital ER arrival</small>
                </div>

                <div className="bg-white p-3 rounded-3 shadow-sm mb-3">
                  <div className="d-flex align-items-center justify-content-between border-bottom pb-2 mb-2">
                    <span className="fw-bold text-dark fs-6">🚑 GPS Ambulance Unit:</span>
                    <span className="fw-extrabold text-danger">{emgDispatchResult.ambulance_unit}</span>
                  </div>
                  <div className="d-flex align-items-center justify-content-between border-bottom pb-2 mb-2">
                    <span className="fw-bold text-dark fs-6">⏳ Estimated ETA:</span>
                    <Badge bg="warning" text="dark" className="fs-6 px-2.5">
                      {emgDispatchResult.eta_minutes} MINUTES AWAY
                    </Badge>
                  </div>
                  <div className="d-flex align-items-center justify-content-between border-bottom pb-2 mb-2">
                    <span className="fw-bold text-dark fs-6">🛏️ Reserved Hospital ER Bay:</span>
                    <span className="fw-bold text-teal">{emgDispatchResult.er_bay_number}</span>
                  </div>
                  <div className="d-flex align-items-center justify-content-between border-bottom pb-2 mb-2">
                    <span className="fw-bold text-dark fs-6">🏥 Assigned Hospital:</span>
                    <span className="fw-semibold text-truncate ms-2" style={{ maxWidth: '200px' }}>{emgDispatchResult.hospital_name}</span>
                  </div>
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="fw-bold text-dark fs-6">👨‍⚕️ On-Call ER Specialist:</span>
                    <span className="fw-bold text-primary">{emgDispatchResult.assigned_doctor_name}</span>
                  </div>

                  {/* 🗺️ Live Google Maps Hospital Location Pin Embed */}
                  <div className="mt-3 rounded-3 overflow-hidden border border-teal position-relative">
                    <div className="bg-teal text-white p-1.5 px-3 small fw-bold d-flex justify-content-between align-items-center">
                      <span>🗺️ ER Hospital Location Pin on Google Maps</span>
                      <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(emgDispatchResult.hospital_name + ' ' + (emgDispatchResult.hospital_address || ''))}`} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-white text-decoration-underline fs-8"
                      >
                        Open Maps App ↗
                      </a>
                    </div>
                    <iframe
                      title="Assigned Emergency Hospital Google Map Pin"
                      width="100%"
                      height="180px"
                      style={{ border: 0 }}
                      loading="lazy"
                      src={`https://maps.google.com/maps?q=28.6139,77.2090&z=15&output=embed`}
                    ></iframe>
                  </div>
                </div>

                <div className="d-flex flex-column gap-2">
                  <a 
                    href={`tel:${emgDispatchResult.ambulance_driver_contact}`} 
                    className="btn btn-danger w-100 fw-bold rounded-pill py-2 text-decoration-none d-flex align-items-center justify-content-center gap-1.5"
                  >
                    <FaPhoneAlt /> Call Ambulance Driver ({emgDispatchResult.ambulance_driver_contact})
                  </a>
                  <Button 
                    variant="outline-danger" 
                    className="rounded-pill fw-bold py-1.5 fs-7"
                    onClick={cancelAndRetractSOS}
                  >
                    ❌ Retract & Cancel Active Emergency Dispatch
                  </Button>
                </div>
              </div>
            ) : emgTab === 'dispatch' ? (
              /* Fast-Track Emergency Dispatch Form */
              <Form onSubmit={triggerSOSCountdown}>
                <Alert variant="warning" className="p-2 fs-7 rounded-3 border-0 mb-3">
                  ⚡ <strong>Fast-Track Protocol:</strong> Submitting this form immediately reserves an ICU/ER Bed, dispatches a GPS Ambulance, and alerts the emergency trauma doctor.
                </Alert>

                <Form.Group className="mb-2">
                  <Form.Label className="fw-semibold small mb-1">Emergency Contact Mobile Number <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    type="tel"
                    placeholder="10-digit emergency contact phone"
                    value={emgDispatchForm.phone_number}
                    onChange={(e) => setEmgDispatchForm({ ...emgDispatchForm, phone_number: e.target.value })}
                    required
                    className="rounded-3 border-2"
                  />
                </Form.Group>

                <Form.Group className="mb-2">
                  <Form.Label className="fw-semibold small mb-1">Patient Name</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Patient full name"
                    value={emgDispatchForm.patient_name}
                    onChange={(e) => setEmgDispatchForm({ ...emgDispatchForm, patient_name: e.target.value })}
                    className="rounded-3 border-2"
                  />
                </Form.Group>

                <Form.Group className="mb-2">
                  <Form.Label className="fw-semibold small mb-1">Emergency Medical Condition <span className="text-danger">*</span></Form.Label>
                  <Form.Select
                    value={emgDispatchForm.emergency_type}
                    onChange={(e) => setEmgDispatchForm({ ...emgDispatchForm, emergency_type: e.target.value })}
                    className="rounded-3 border-2 fw-semibold"
                  >
                    <option value="Severe Chest Pain / Cardiac Emergency">🫀 Severe Chest Pain / Cardiac Emergency</option>
                    <option value="Severe Road Accident & Heavy Bleeding">🚨 Severe Road Accident & Heavy Bleeding</option>
                    <option value="Acute Breathlessness & Low Oxygen">🫁 Acute Breathlessness & Low Oxygen</option>
                    <option value="Stroke / Unconscious Patient">🧠 Stroke / Unconscious Patient</option>
                    <option value="High-Risk Maternity Labor Emergency">🤰 High-Risk Maternity Labor Emergency</option>
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold small mb-1">Current Pickup Location / Zone</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="e.g. House 42, Swasthya Nagar, Ward 5"
                    value={emgDispatchForm.location}
                    onChange={(e) => setEmgDispatchForm({ ...emgDispatchForm, location: e.target.value })}
                    className="rounded-3 border-2"
                  />
                </Form.Group>

                <Button 
                  type="submit" 
                  variant="danger" 
                  disabled={emgLoading}
                  className="w-100 py-2.5 rounded-3 fw-extrabold fs-6 shadow-sm d-flex align-items-center justify-content-center gap-2"
                >
                  {emgLoading ? <Spinner size="sm" /> : <FaAmbulance className="animate-pulse" />}
                  DISPATCH FAST-TRACK AMBULANCE & RESERVE ER BED NOW ⚡
                </Button>
              </Form>
            ) : (
              /* Emergency Hotlines */
              <div className="d-flex flex-column gap-2.5">
                <a href="tel:108" className="p-3 rounded-3 bg-danger-subtle text-danger border border-danger-subtle text-decoration-none d-flex align-items-center justify-content-between">
                  <div>
                    <div className="fw-bold fs-6">🚨 National Emergency Ambulance (108)</div>
                    <small className="text-muted">Immediate trauma response, cardiac care & emergency dispatch</small>
                  </div>
                  <span className="btn btn-danger btn-sm fw-bold rounded-pill px-3 ms-2">Call 108</span>
                </a>

                <a href="tel:18001801108" className="p-3 rounded-3 bg-teal-subtle text-teal border border-teal-subtle text-decoration-none d-flex align-items-center justify-content-between">
                  <div>
                    <div className="fw-bold fs-6">🏥 SwasthyaMitra 24/7 Tele-Triage Desk</div>
                    <small className="text-muted">Toll-free hospital bed booking & doctor tele-consultation</small>
                  </div>
                  <span className="btn btn-teal btn-sm fw-bold rounded-pill px-3 ms-2">1800-180-1108</span>
                </a>

                <a href="tel:102" className="p-3 rounded-3 bg-warning-subtle text-dark border border-warning-subtle text-decoration-none d-flex align-items-center justify-content-between">
                  <div>
                    <div className="fw-bold fs-6">🚑 Free Govt Maternity & Child Transport (102)</div>
                    <small className="text-muted">24/7 Free ambulance for pregnant mothers & infants</small>
                  </div>
                  <span className="btn btn-warning btn-sm fw-bold rounded-pill px-3 ms-2">Call 102</span>
                </a>

                <a href="tel:104" className="p-3 rounded-3 bg-info-subtle text-dark border border-info-subtle text-decoration-none d-flex align-items-center justify-content-between">
                  <div>
                    <div className="fw-bold fs-6">🩺 Health Helpline & ASHA Emergency (104)</div>
                    <small className="text-muted">Medical information, blood bank & village health officer</small>
                  </div>
                  <span className="btn btn-info btn-sm fw-bold rounded-pill px-3 ms-2">Call 104</span>
                </a>
              </div>
            )}
          </Modal.Body>

          <Modal.Footer className="border-0 pt-0">
            <Button variant="secondary" className="w-100 rounded-3 fw-bold" onClick={() => { setShowEmergencyModal(false); setEmgDispatchResult(null); }}>
              Close Emergency Hotlines
            </Button>
          </Modal.Footer>
        </Modal>

      </Container>
    </div>
  );
}

