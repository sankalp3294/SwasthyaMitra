import React, { useState, useEffect } from 'react';
import { Container, Card, ListGroup, Badge, Spinner, Alert, Button, Row, Col, ProgressBar } from 'react-bootstrap';
import { 
  FaCalendarCheck, FaClock, FaRedo, FaCheckCircle, FaHospital, 
  FaPills, FaHeartbeat, FaCapsules, FaShieldAlt, FaExclamationCircle
} from 'react-icons/fa';
import { appointmentAPI, dashboardAPI } from '../services/api';

export default function PatientDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rebookSuccess, setRebookSuccess] = useState('');
  const [rebookingId, setRebookingId] = useState(null);

  // Interactive Daily Medication Check-off Tracker
  const [meds, setMeds] = useState([
    { id: 1, name: 'Paracetamol 500mg', time: '08:00 AM (After Breakfast)', taken: true },
    { id: 2, name: 'Pantoprazole 40mg', time: '07:30 AM (Before Food)', taken: true },
    { id: 3, name: 'Multivitamin Complex', time: '02:00 PM (After Lunch)', taken: false },
    { id: 4, name: 'Amoxicillin 500mg', time: '09:00 PM (After Dinner)', taken: false }
  ]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [appointmentsResp, statsResp] = await Promise.all([
        appointmentAPI.getAppointments(),
        dashboardAPI.getStats(),
      ]);
      setAppointments(appointmentsResp.data.appointments || []);
      setStats(statsResp.data);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      setError('Your health dashboard could not be loaded. Please refresh to try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleMedTaken = (id) => {
    setMeds(meds.map(m => m.id === id ? { ...m, taken: !m.taken } : m));
  };

  const handleRebook = async (appointmentId) => {
    setRebookingId(appointmentId);
    setError('');
    setRebookSuccess('');
    try {
      const res = await appointmentAPI.rebook(appointmentId, {});
      setRebookSuccess(res.data.message || 'Appointment rebooked successfully for next available slot!');
      setTimeout(() => setRebookSuccess(''), 5000);
      loadData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to rebook appointment. Please try again or contact hospital.');
    } finally {
      setRebookingId(null);
    }
  };

  const getStatusBadge = (apt) => {
    const status = apt.appointment_status;
    const checkIn = apt.check_in_status;

    if (checkIn === 'NO_SHOW' || status?.includes('NO_SHOW')) {
      return <Badge bg="danger" className="px-3 py-2 rounded-pill">🔴 MISSED / NO SHOW</Badge>;
    }
    if (status === 'COMPLETED' || status === 'ATTENDED') {
      return <Badge bg="success" className="px-3 py-2 rounded-pill">🟢 COMPLETED / TREATED</Badge>;
    }
    if (status === 'CONFIRMED' || status === 'REBOOKED') {
      return <Badge bg="info" className="px-3 py-2 rounded-pill text-white">🔵 CONFIRMED ({status})</Badge>;
    }
    if (status === 'REQUESTED') {
      return <Badge bg="warning" text="dark" className="px-3 py-2 rounded-pill">🟡 SCHEDULED</Badge>;
    }
    return <Badge bg="secondary" className="px-3 py-2 rounded-pill">{status}</Badge>;
  };

  const completedMedsCount = meds.filter(m => m.taken).length;
  const medProgressPercent = Math.round((completedMedsCount / meds.length) * 100);

  if (loading) return <Container className="text-center py-5"><Spinner animation="border" variant="teal" /></Container>;

  return (
    <Container className="py-4 fade-slide-up">
      {/* Header Banner */}
      <div className="page-intro mb-4">
        <span className="eyebrow">PERSONAL HEALTH COMMAND CENTER</span>
        <h1 className="fw-extrabold" style={{ color: 'var(--text-heading)' }}>
          My Health Dashboard & Medical History 🏥
        </h1>
        <p className="text-muted">
          Track upcoming hospital appointments, check off daily prescribed medications, and view past consultation notes.
        </p>
      </div>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
      {rebookSuccess && <Alert variant="success" dismissible onClose={() => setRebookSuccess('')}>{rebookSuccess}</Alert>}

      {/* Stats Counters */}
      {stats && (
        <Row className="g-3 mb-4">
          <Col md={3}>
            <Card className="app-card text-center p-3">
              <Card.Body>
                <div className="p-2 rounded-circle bg-teal-subtle text-teal d-inline-block mb-2">
                  <FaHeartbeat size={24} />
                </div>
                <h2 className="fw-extrabold text-teal mb-0">{stats.total_cases || 0}</h2>
                <small className="text-muted fw-bold">Total Health Cases</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="app-card text-center p-3">
              <Card.Body>
                <div className="p-2 rounded-circle bg-cyan-subtle text-cyan d-inline-block mb-2">
                  <FaCalendarCheck size={24} />
                </div>
                <h2 className="fw-extrabold text-cyan mb-0">{stats.pending_appointments || 0}</h2>
                <small className="text-muted fw-bold">Pending Consultations</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="app-card text-center p-3">
              <Card.Body>
                <div className="p-2 rounded-circle bg-success-subtle text-success d-inline-block mb-2">
                  <FaCheckCircle size={24} />
                </div>
                <h2 className="fw-extrabold text-success mb-0">{stats.attended_appointments || 0}</h2>
                <small className="text-muted fw-bold">Attended Visits</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="app-card text-center p-3">
              <Card.Body>
                <div className="p-2 rounded-circle bg-warning-subtle text-warning d-inline-block mb-2">
                  <FaExclamationCircle size={24} />
                </div>
                <h2 className="fw-extrabold text-warning mb-0">{stats.critical_cases || 0}</h2>
                <small className="text-muted fw-bold">Urgent Follow-ups</small>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      <Row className="g-4 mb-4">
        {/* Interactive Medication Reminders Tracker */}
        <Col lg={5}>
          <Card className="app-card h-100">
            <Card.Header className="app-card-header d-flex justify-content-between align-items-center">
              <span className="d-flex align-items-center gap-2">
                <FaCapsules /> Daily Prescribed Medications Tracker
              </span>
              <Badge bg="light" text="teal" className="fw-bold">{medProgressPercent}% Done</Badge>
            </Card.Header>
            <Card.Body className="p-4">
              <div className="mb-3">
                <div className="d-flex justify-content-between small text-muted mb-1 fw-bold">
                  <span>Adherence Score</span>
                  <span>{completedMedsCount} of {meds.length} taken today</span>
                </div>
                <ProgressBar now={medProgressPercent} variant="teal" style={{ height: '8px', borderRadius: '4px' }} />
              </div>

              <ListGroup variant="flush">
                {meds.map((med) => (
                  <ListGroup.Item 
                    key={med.id} 
                    className={`py-3 px-3 border rounded-3 mb-2 transition-all cursor-pointer d-flex align-items-center justify-content-between ${med.taken ? 'bg-success-subtle border-success' : 'bg-body'}`}
                    onClick={() => toggleMedTaken(med.id)}
                  >
                    <div>
                      <div className={`fw-bold ${med.taken ? 'text-decoration-line-through text-success' : 'text-main'}`}>
                        {med.name}
                      </div>
                      <small className="text-muted d-flex align-items-center gap-1">
                        <FaClock size={12} /> {med.time}
                      </small>
                    </div>
                    <Button 
                      size="sm" 
                      variant={med.taken ? 'success' : 'outline-secondary'}
                      className="rounded-circle p-2 d-flex align-items-center justify-content-center"
                      style={{ width: '32px', height: '32px' }}
                    >
                      ✓
                    </Button>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>

        {/* Appointments List */}
        <Col lg={7}>
          <Card className="app-card h-100">
            <Card.Header className="app-card-header d-flex justify-content-between align-items-center">
              <span className="d-flex align-items-center gap-2">
                <FaHospital /> My Hospital Appointments ({appointments.length})
              </span>
              <small className="text-white-50">OPD & Tele-ICU Visits</small>
            </Card.Header>
            <ListGroup variant="flush" className="p-2">
              {appointments.length === 0 ? (
                <ListGroup.Item className="text-muted text-center py-5 border-0">
                  No hospital appointments recorded yet. Use the AI Chat to schedule a visit!
                </ListGroup.Item>
              ) : (
                appointments.map((apt) => {
                  const isMissed = apt.check_in_status === 'NO_SHOW' || apt.appointment_status?.includes('NO_SHOW');

                  return (
                    <ListGroup.Item key={apt.id} className={`py-3 px-3 rounded-3 mb-2 border ${isMissed ? 'bg-danger-subtle border-danger' : 'border-secondary-subtle'}`}>
                      <Row className="align-items-center">
                        <Col md={6}>
                          <div className="fw-bold text-main mb-1">
                            🏥 Hospital Visit (Ref #{apt.id})
                          </div>
                          <div className="text-muted small d-flex align-items-center gap-2">
                            <span>📅 <strong>{apt.appointment_date}</strong></span>
                            <span>⏰ <strong>{apt.appointment_time || '09:00 AM'}</strong></span>
                          </div>
                        </Col>
                        <Col md={3} className="my-2 my-md-0">
                          {getStatusBadge(apt)}
                        </Col>
                        <Col md={3} className="text-end">
                          {isMissed ? (
                            <Button
                              variant="danger"
                              size="sm"
                              className="rounded-pill fw-bold"
                              disabled={rebookingId === apt.id}
                              onClick={() => handleRebook(apt.id)}
                            >
                              {rebookingId === apt.id ? <Spinner size="sm" className="me-2" /> : <FaRedo className="me-1" />}
                              Rebook Visit
                            </Button>
                          ) : apt.appointment_status === 'CONFIRMED' || apt.appointment_status === 'REQUESTED' ? (
                            <span className="text-success small fw-semibold">✓ Confirmed</span>
                          ) : (
                            <span className="text-muted small">Completed</span>
                          )}
                        </Col>
                      </Row>
                    </ListGroup.Item>
                  );
                })
              )}
            </ListGroup>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
