import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Card, Form, Button, Alert, Spinner, Badge } from 'react-bootstrap';
import { FaHeartbeat, FaMobileAlt, FaUserMd, FaUserShield, FaCheckCircle, FaUserCheck } from 'react-icons/fa';
import { authAPI } from '../services/api';
import { useAuthStore } from '../store/store';
import './Auth.css';

export default function OTPLogin() {
  const navigate = useNavigate();
  const setSession = useAuthStore((state) => state.setSession);
  const [loginMode, setLoginMode] = useState('patient');
  const [step, setStep] = useState('phone'); // phone or otp
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const getRoleRoute = (userRole) => {
    if (userRole === 'doctor') return '/doctor';
    if (userRole === 'chief_doctor') return '/cmo';
    if (userRole === 'admin') return '/admin';
    if (userRole === 'asha') return '/asha';
    return '/patient';
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

  const switchMode = (mode) => {
    setLoginMode(mode);
    setStep('phone');
    setError('');
    setSuccess('');
  };

  return (
    <div className="auth-container fade-slide-up">
      <Container className="d-flex align-items-center justify-content-center min-vh-100 py-5">
        <Card className="app-card shadow-lg border-0" style={{ maxWidth: '440px', width: '100%' }}>
          <Card.Body className="p-4 p-md-5">
            <div className="text-center mb-4">
              <div className="p-3 rounded-circle bg-teal-subtle text-teal d-inline-block mb-3">
                <FaHeartbeat size={48} className="animate-pulse text-teal" />
              </div>
              <h2 className="fw-extrabold mb-1" style={{ color: 'var(--text-heading)' }}>
                Swasthya<span className="text-cyan">Mitra</span>
              </h2>
              <p className="text-muted small">NextGen AI Health Platform & OPD Triage</p>
            </div>

            <div className="bg-body-tertiary p-1 rounded-pill d-flex mb-4 border">
              <Button
                variant={loginMode === 'patient' ? 'teal' : 'text'}
                className={`w-50 rounded-pill py-2 fw-bold text-center border-0 ${loginMode === 'patient' ? 'bg-success text-white shadow-sm' : 'text-muted'}`}
                onClick={() => switchMode('patient')}
                disabled={loading}
              >
                Patient Access
              </Button>
              <Button
                variant={loginMode === 'staff' ? 'teal' : 'text'}
                className={`w-50 rounded-pill py-2 fw-bold text-center border-0 ${loginMode === 'staff' ? 'bg-success text-white shadow-sm' : 'text-muted'}`}
                onClick={() => switchMode('staff')}
                disabled={loading}
              >
                Staff Portal
              </Button>
            </div>

            {error && <Alert variant="danger" className="rounded-3">{error}</Alert>}
            {success && <Alert variant="success" className="rounded-3">{success}</Alert>}

            {loginMode === 'staff' ? (
              <Form onSubmit={handleStaffLogin}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-semibold">Work Email</Form.Label>
                  <Form.Control 
                    type="email" 
                    placeholder="doctor@swasthyamitra.org" 
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
            ) : step === 'phone' ? (
              <Form onSubmit={handleRequestOTP}>
                <Form.Group className="mb-4">
                  <Form.Label className="fw-semibold">Mobile Number</Form.Label>
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
                  className="primary-action w-100 py-2.5 rounded-3 fw-bold d-flex align-items-center justify-content-center gap-2"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? <Spinner size="sm" /> : <FaMobileAlt />} Request Secure OTP Code
                </Button>
              </Form>
            ) : (
              <Form onSubmit={handleVerifyOTP}>
                <Form.Group className="mb-4">
                  <Form.Label className="fw-semibold">Enter 6-Digit OTP</Form.Label>
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
                  {loading ? <Spinner size="sm" className="me-2" /> : null} Verify & Enter Portal
                </Button>

                <Button
                  variant="link"
                  className="w-100 text-teal text-decoration-none small"
                  onClick={() => { setStep('phone'); setOtp(''); }}
                  disabled={loading}
                >
                  ← Change Phone Number
                </Button>
              </Form>
            )}

            {/* Quick Demo Access Bar */}
            <div className="mt-4 pt-3 border-top text-center">
              <small className="text-muted fw-bold d-block mb-2">⚡ 1-Click Instant Demo Login:</small>
              <div className="d-flex justify-content-center flex-wrap gap-1">
                <Button size="sm" variant="outline-teal" className="rounded-pill px-2 py-1 fs-7" onClick={() => handleQuickDemoLogin('patient')}>
                  Patient
                </Button>
                <Button size="sm" variant="outline-cyan" className="rounded-pill px-2 py-1 fs-7" onClick={() => handleQuickDemoLogin('doctor')}>
                  Doctor
                </Button>
                <Button size="sm" variant="outline-primary" className="rounded-pill px-2 py-1 fs-7" onClick={() => handleQuickDemoLogin('chief_doctor')}>
                  CMO
                </Button>
                <Button size="sm" variant="outline-success" className="rounded-pill px-2 py-1 fs-7" onClick={() => handleQuickDemoLogin('asha')}>
                  ASHA
                </Button>
              </div>
            </div>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
}
