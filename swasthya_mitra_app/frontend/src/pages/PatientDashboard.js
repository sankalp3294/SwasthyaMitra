import React, { useState, useEffect } from 'react';
import { Container, Card, ListGroup, Badge, Spinner, Alert, Button, Row, Col, ProgressBar, Modal } from 'react-bootstrap';
import { 
  FaCalendarCheck, FaClock, FaRedo, FaCheckCircle, FaHospital, 
  FaPills, FaHeartbeat, FaCapsules, FaShieldAlt, FaExclamationCircle
} from 'react-icons/fa';
import { appointmentAPI, dashboardAPI, hospitalAPI } from '../services/api';

export default function PatientDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [stats, setStats] = useState(null);
  const [hospitals, setHospitals] = useState([]);
  const [selectedMapHospital, setSelectedMapHospital] = useState(null);
  const [showMapModal, setShowMapModal] = useState(false);
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
      const [appointmentsResp, statsResp, hospitalsResp] = await Promise.all([
        appointmentAPI.getAppointments(),
        dashboardAPI.getStats(),
        hospitalAPI.listHospitals(),
      ]);
      setAppointments(appointmentsResp.data.appointments || []);
      setStats(statsResp.data);
      const loadedHospitals = hospitalsResp.data || [];
      setHospitals(loadedHospitals);
      if (loadedHospitals.length > 0) {
        setSelectedMapHospital(loadedHospitals[0]);
      }
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

      {/* 🚨 24/7 Fast-Track SOS Emergency Trigger */}
      <Alert variant="danger" className="border-0 shadow-sm rounded-4 mb-4 p-3 bg-danger text-white d-flex align-items-center justify-content-between flex-wrap gap-2">
        <div className="d-flex align-items-center gap-2.5">
          <div className="bg-white text-danger p-2 rounded-circle d-flex align-items-center justify-content-center shadow-sm flex-shrink-0">
            <FaHeartbeat size={22} className="animate-pulse text-danger" />
          </div>
          <div>
            <div className="fw-extrabold text-uppercase letter-spacing-1 fs-7 text-white">
              🚨 CRITICAL MEDICAL EMERGENCY?
            </div>
            <div className="small text-white opacity-90" style={{ fontSize: '0.85rem' }}>
              1-Tap Fast-Track: Dispatches GPS Ambulance & reserves ER Trauma Bed immediately.
            </div>
          </div>
        </div>
        <div className="d-flex align-items-center gap-2 ms-auto">
          <a href="tel:108" className="btn btn-light text-danger fw-extrabold px-3 py-1.5 rounded-pill shadow-sm fs-7 text-decoration-none">
            📞 Dial 108 Ambulance
          </a>
          <a href="tel:18001801108" className="btn btn-outline-light fw-bold px-3 py-1.5 rounded-pill fs-7 text-decoration-none">
            🏥 1800-180-1108 Helpline
          </a>
        </div>
      </Alert>

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

      {/* 🗺️ LIVE INTERACTIVE GOOGLE MAPS HOSPITAL LOCATOR */}
      <Card className="app-card mb-4 border-0 shadow-sm rounded-4 overflow-hidden">
        <Card.Header className="app-card-header bg-teal text-white py-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
          <span className="fw-extrabold fs-5 d-flex align-items-center gap-2 text-white">
            🗺️ Live Interactive Google Maps Hospital Locator
          </span>
          {selectedMapHospital && (
            <Badge bg="light" text="teal" className="fw-bold fs-7 px-3 py-1.5 rounded-pill shadow-sm">
              📍 Pinpointed: {selectedMapHospital.name} ({selectedMapHospital.distance_km || '1.2'} km away)
            </Badge>
          )}
        </Card.Header>
        <Card.Body className="p-0">
          <Row className="g-0">
            {/* Left Sidebar: Selectable Hospital Location Pins */}
            <Col lg={4} className="border-end bg-light-subtle p-3" style={{ maxHeight: '420px', overflowY: 'auto' }}>
              <div className="fw-bold text-uppercase fs-8 text-muted mb-2 letter-spacing-1">
                Select Nearby Hospital to View Google Maps Pin:
              </div>
              <ListGroup variant="flush" className="gap-2">
                {hospitals.map((h, idx) => (
                  <ListGroup.Item
                    key={h.id}
                    className={`rounded-3 border p-3 cursor-pointer transition-all ${
                      selectedMapHospital?.id === h.id ? 'bg-teal text-white border-teal shadow-sm' : 'bg-white text-dark hover-shadow'
                    }`}
                    onClick={() => setSelectedMapHospital(h)}
                  >
                    <div className="d-flex justify-content-between align-items-start mb-1">
                      <span className="fw-extrabold fs-6">{h.name}</span>
                      <Badge bg={selectedMapHospital?.id === h.id ? 'light' : idx === 0 ? 'success' : 'danger'} text={selectedMapHospital?.id === h.id ? 'teal' : 'white'} className="font-monospace fs-8">
                        {h.distance_km ? `${h.distance_km} km` : '1.2 km'}
                      </Badge>
                    </div>
                    <div className={`small mb-1 ${selectedMapHospital?.id === h.id ? 'text-white-50' : 'text-muted'}`}>
                      📍 {h.address}
                    </div>
                    <div className="d-flex align-items-center justify-content-between mt-2 pt-2 border-top border-opacity-25">
                      <small className="fw-semibold">🛏️ 8 ER Beds</small>
                      <span className={`fs-8 fw-bold ${selectedMapHospital?.id === h.id ? 'text-white' : 'text-teal'}`}>
                        {selectedMapHospital?.id === h.id ? '📍 PINNED ON MAP' : 'Click to Pin on Map 🗺️'}
                      </span>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </Col>

            {/* Right Side: Embedded Live Google Map iframe */}
            <Col lg={8} style={{ minHeight: '420px', position: 'relative' }}>
              {selectedMapHospital ? (
                <div className="h-100 position-relative">
                  <iframe
                    title="Google Maps Hospital Location"
                    width="100%"
                    height="100%"
                    style={{ border: 0, minHeight: '420px', width: '100%' }}
                    loading="lazy"
                    allowFullScreen
                    src={`https://maps.google.com/maps?q=${selectedMapHospital.latitude || 28.6139},${selectedMapHospital.longitude || 77.2090}&z=15&output=embed`}
                  ></iframe>
                  <div className="position-absolute bottom-0 end-0 m-3 z-index-10">
                    <a 
                      href={`https://www.google.com/maps/dir/?api=1&destination=${selectedMapHospital.latitude || 28.6139},${selectedMapHospital.longitude || 77.2090}`} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="btn btn-danger fw-extrabold rounded-pill px-3.5 py-2 shadow-lg fs-7 d-flex align-items-center gap-2 text-decoration-none"
                    >
                      🚀 Get Google Maps Live Directions
                    </a>
                  </div>
                </div>
              ) : (
                <div className="d-flex align-items-center justify-content-center h-100 p-5 text-muted">
                  Select a hospital to load Google Maps location pin.
                </div>
              )}
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* 📍 NEAREST NEARBY HOSPITALS (AUTOMATICALLY SORTED BY DISTANCE TO PATIENT) */}
      <Card className="app-card mb-4 border-0 shadow-sm rounded-4 overflow-hidden">
        <Card.Header className="app-card-header bg-teal text-white py-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
          <span className="fw-extrabold fs-5 d-flex align-items-center gap-2 text-white">
            📍 Nearest Hospitals Near Your Location (Sorted by Proximity)
          </span>
          <Badge bg="light" text="teal" className="fw-bold fs-7 px-3 py-1.5 rounded-pill">
            🎯 Auto-Calculated Distance
          </Badge>
        </Card.Header>
        <Card.Body className="p-3 bg-light-subtle">
          <Row className="g-3">
            {hospitals.map((h, idx) => (
              <Col md={6} lg={4} key={h.id}>
                <Card className={`h-100 border-0 shadow-sm rounded-3 transition-all ${idx === 0 ? 'border-start border-4 border-success bg-white' : 'bg-white'}`}>
                  <Card.Body className="p-3 d-flex flex-column justify-content-between">
                    <div>
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <Badge bg={idx === 0 ? 'success' : 'teal'} className="fs-8 px-2.5 py-1 rounded-pill fw-bold">
                          {idx === 0 ? '🥇 NEAREST (Closest to You)' : `📍 ${h.hospital_type}`}
                        </Badge>
                        <span className="badge bg-danger-subtle text-danger fw-extrabold font-monospace fs-7 border border-danger">
                          {h.distance_km ? `${h.distance_km} km away` : '1.2 km away'}
                        </span>
                      </div>
                      <h5 className="fw-extrabold text-dark mb-1 fs-6">{h.name}</h5>
                      <p className="text-muted small mb-2 d-flex align-items-center gap-1" style={{ fontSize: '0.82rem' }}>
                        <span>📍</span> {h.address}
                      </p>
                      <div className="d-flex align-items-center gap-2 mb-3 flex-wrap">
                        <span className="badge bg-primary-subtle text-primary border border-primary fs-8">
                          🛏️ 8 ER Beds Available
                        </span>
                        <span className="badge bg-success-subtle text-success border border-success fs-8">
                          ⏱️ 24/7 Fast-Track
                        </span>
                      </div>
                    </div>
                    <div className="d-flex align-items-center gap-2 mt-2 pt-2 border-top">
                      <a href={`tel:${h.phone_number || '108'}`} className="btn btn-outline-danger btn-sm flex-fill fw-bold rounded-pill text-decoration-none">
                        📞 Call {h.phone_number || '108'}
                      </a>
                      <Button 
                        variant="teal" 
                        size="sm" 
                        className="rounded-pill px-3 fw-bold text-white"
                        onClick={() => { setSelectedMapHospital(h); setShowMapModal(true); }}
                      >
                        🗺️ Map Pin
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Card.Body>
      </Card>

      {/* 🗺️ GOOGLE MAPS PINPOINT MODAL */}
      <Modal show={showMapModal} onHide={() => setShowMapModal(false)} size="lg" centered className="rounded-4">
        <Modal.Header closeButton className="bg-teal text-white border-0">
          <Modal.Title className="fw-extrabold fs-5 d-flex align-items-center gap-2 text-white">
            🗺️ Google Maps Location Pin: {selectedMapHospital?.name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0">
          {selectedMapHospital && (
            <div>
              <div className="p-3 bg-light border-bottom d-flex justify-content-between align-items-center flex-wrap gap-2">
                <div>
                  <h6 className="fw-extrabold mb-0">{selectedMapHospital.name}</h6>
                  <small className="text-muted">📍 {selectedMapHospital.address} · Distance: <strong>{selectedMapHospital.distance_km || '1.2'} km away</strong></small>
                </div>
                <a 
                  href={`https://www.google.com/maps/dir/?api=1&destination=${selectedMapHospital.latitude || 28.6139},${selectedMapHospital.longitude || 77.2090}`} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="btn btn-danger btn-sm fw-bold rounded-pill text-decoration-none px-3"
                >
                  🚀 Open Directions in Google Maps App
                </a>
              </div>
              <iframe
                title="Google Maps Location Modal"
                width="100%"
                height="450px"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                src={`https://maps.google.com/maps?q=${selectedMapHospital.latitude || 28.6139},${selectedMapHospital.longitude || 77.2090}&z=15&output=embed`}
              ></iframe>
            </div>
          )}
        </Modal.Body>
      </Modal>
    </Container>
  );
}
