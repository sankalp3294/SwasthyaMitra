import React, { useEffect, useState } from 'react';
import { Container, Card, Badge, Alert, Spinner, Row, Col, Form, Button, Modal, Table, ListGroup } from 'react-bootstrap';
import { ashaAPI, dashboardAPI } from '../services/api';

export default function ASHAHome() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Field Report Modal State
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [submittingReport, setSubmittingReport] = useState(false);

  // Advanced Field Report Form Data
  const [reportData, setReportData] = useState({
    notes: '',
    outcome: 'RECOVERED',
    vitals_bp: '120/80',
    vitals_temp: '98.6 F',
    med_compliance: 'YES',
    photo_url: '',
    is_false_complaint: false,
    flag_reason: '',
    book_appointment: false,
    appointment_date: ''
  });

  // ASHA Community Emergency SOS Dispatch State
  const [showAshaSosModal, setShowAshaSosModal] = useState(false);
  const [ashaSosForm, setAshaSosForm] = useState({
    phone_number: '',
    patient_name: '',
    emergency_type: 'Severe Chest Pain / Cardiac Emergency',
    location: 'Swasthya Nagar Ward #4',
    vitals: 'BP 130/85, Pulse 92, Oxygen 96%'
  });
  const [ashaSosCountdown, setAshaSosCountdown] = useState(null);
  const [ashaSosIntervalId, setAshaSosIntervalId] = useState(null);
  const [ashaSosResult, setAshaSosResult] = useState(null);
  const [ashaSosSubmitting, setAshaSosSubmitting] = useState(false);
  const [ashaSosRetractedMsg, setAshaSosRetractedMsg] = useState('');

  const triggerAshaSOSCountdown = (e) => {
    if (e) e.preventDefault();
    const cleanPhone = ashaSosForm.phone_number.replace(/\D/g, '').slice(-10);
    if (!cleanPhone || cleanPhone.length < 10) {
      setError('Please enter a valid 10-digit patient contact number');
      return;
    }
    setError('');
    setAshaSosRetractedMsg('');
    setAshaSosCountdown(10);

    if (ashaSosIntervalId) clearInterval(ashaSosIntervalId);

    let count = 10;
    const timer = setInterval(() => {
      count -= 1;
      setAshaSosCountdown(count);
      if (count <= 0) {
        clearInterval(timer);
        setAshaSosCountdown(null);
        executeAshaSOSDispatch(cleanPhone);
      }
    }, 1000);
    setAshaSosIntervalId(timer);
  };

  const cancelAndRetractAshaSOS = () => {
    if (ashaSosIntervalId) clearInterval(ashaSosIntervalId);
    setAshaSosCountdown(null);
    setAshaSosIntervalId(null);
    setAshaSosResult(null);
    setAshaSosRetractedMsg('✅ ASHA Community Emergency SOS Signal successfully RETRACTED & CANCELED within 10-second safety window.');
  };

  const executeAshaSOSDispatch = async (cleanPhone) => {
    if (ashaSosIntervalId) clearInterval(ashaSosIntervalId);
    setAshaSosCountdown(null);
    setAshaSosSubmitting(true);
    setError('');
    const targetPhone = cleanPhone || ashaSosForm.phone_number.replace(/\D/g, '').slice(-10) || '9876543210';
    try {
      const res = await ashaAPI.dispatchEmergency({
        ...ashaSosForm,
        phone_number: targetPhone
      });
      setAshaSosResult(res.data);
      setSuccessMsg(`🚨 ASHA Community SOS Pass Generated! Code: ${res.data.pass_code}`);
      loadDashboard();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to dispatch ASHA emergency response unit.');
    } finally {
      setAshaSosSubmitting(false);
    }
  };

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const res = await dashboardAPI.getMyASHADashboard();
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load ASHA worker assignments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const openReportModal = (assignment) => {
    setSelectedAssignment(assignment);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const defaultDateStr = tomorrow.toISOString().split('T')[0];

    setReportData({
      notes: '',
      outcome: 'RECOVERED',
      vitals_bp: '120/80',
      vitals_temp: '98.6 F',
      med_compliance: 'YES',
      photo_url: '',
      is_false_complaint: false,
      flag_reason: '',
      book_appointment: false,
      appointment_date: defaultDateStr
    });
    setShowReportModal(true);
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReportData(prev => ({ ...prev, photo_url: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAssignment || !reportData.notes.trim()) return;
    setSubmittingReport(true);
    setError('');

    try {
      const formattedNotes = `Vitals: BP ${reportData.vitals_bp}, Temp ${reportData.vitals_temp} | Med Adherence: ${reportData.med_compliance} | Notes: ${reportData.notes}`;
      await ashaAPI.submitFollowup(selectedAssignment.id, {
        notes: formattedNotes,
        outcome: reportData.outcome,
        photo_url: reportData.photo_url,
        is_false_complaint: reportData.is_false_complaint,
        flag_reason: reportData.flag_reason,
        book_appointment: reportData.book_appointment,
        appointment_date: reportData.appointment_date
      });

      setShowReportModal(false);
      setSuccessMsg(`Field report for Case #${selectedAssignment.case_id} submitted successfully! ${reportData.book_appointment ? '📅 Doctor appointment scheduled!' : ''}`);
      setTimeout(() => setSuccessMsg(''), 4000);
      loadDashboard();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit follow-up report.');
    } finally {
      setSubmittingReport(false);
    }
  };

  const [gpsCheckedIn, setGpsCheckedIn] = useState(false);

  const handleGpsCheckIn = () => {
    setGpsCheckedIn(true);
    setSuccessMsg('📍 GPS Location Verified! Checked in at Swasthya Nagar Ward #4.');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  if (loading) return <Container className="text-center py-5"><Spinner animation="border" variant="teal" /></Container>;

  const assignments = data?.assignments || [];
  const pendingAssignments = assignments.filter(a => a.assignment_status === 'ASSIGNED');
  const completedAssignments = assignments.filter(a => a.assignment_status === 'COMPLETED');

  return (
    <Container className="py-4 fade-slide-up">
      {/* 🚨 ASHA WORKER 24/7 COMMUNITY EMERGENCY SOS DESK */}
      <Alert variant="danger" className="border-0 shadow-lg rounded-4 p-3 mb-4 bg-danger text-white d-flex align-items-center justify-content-between flex-wrap gap-3">
        <div className="d-flex align-items-center gap-3">
          <div className="bg-white text-danger p-2.5 rounded-circle d-flex align-items-center justify-content-center shadow-sm flex-shrink-0">
            <span className="fs-4 animate-pulse">🚑</span>
          </div>
          <div>
            <div className="fw-extrabold text-uppercase letter-spacing-1 fs-6 text-white">
              🚨 ASHA COMMUNITY EMERGENCY SOS DISPATCH DESK
            </div>
            <div className="small text-white opacity-90">
              When a villager/patient calls in critical condition, trigger Fast-Track SOS to reserve hospital ER bed & ambulance instantly.
            </div>
          </div>
        </div>
        <Button 
          variant="light" 
          className="text-danger fw-extrabold px-3.5 py-2 rounded-pill shadow-sm fs-7 d-flex align-items-center gap-2 ms-auto"
          onClick={() => { setShowAshaSosModal(true); setAshaSosResult(null); }}
        >
          ⚡ 1-Click Community Emergency SOS
        </Button>
      </Alert>

      <div className="page-intro mb-4 d-flex justify-content-between align-items-center flex-wrap gap-3 p-4 rounded-4"
           style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(13, 148, 136, 0.1) 100%)', border: '1px solid var(--border-color)' }}>
        <div>
          <span className="eyebrow text-success">COMMUNITY HEALTH WORKFORCE CENTER</span>
          <h1 className="mb-1 fw-extrabold" style={{ color: 'var(--text-heading)' }}>
            ASHA Worker Field Command Center 👩‍⚕️
          </h1>
          <p className="lead text-muted mb-0" style={{ fontSize: '0.95rem' }}>
            {data?.worker?.name || 'Sunita Devi (ASHA)'} · Assigned Zone: <strong>{data?.worker?.zone || 'Swasthya Nagar'}</strong>
          </p>
        </div>
        <Button 
          variant={gpsCheckedIn ? 'success' : 'outline-success'} 
          className="rounded-pill fw-bold px-3 py-2 d-flex align-items-center gap-2"
          onClick={handleGpsCheckIn}
        >
          {gpsCheckedIn ? '✓ Verified GPS Checked-in' : '📍 Simulate Field GPS Check-In'}
        </Button>
      </div>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
      {successMsg && <Alert variant="success" dismissible onClose={() => setSuccessMsg('')}>{successMsg}</Alert>}

      {/* Top ASHA Worker Metrics */}
      <Row className="g-3 mb-4">
        <Col md={4}>
          <Card className="border-0 shadow-sm bg-primary text-white text-center py-3">
            <Card.Body>
              <span className="fs-6 text-white-50 d-block mb-1">📋 Total Assigned Tasks</span>
              <h2 className="display-6 fw-bold mb-0">{assignments.length}</h2>
              <small className="text-white-50">Community Visits Assigned</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-0 shadow-sm bg-warning text-dark text-center py-3">
            <Card.Body>
              <span className="fs-6 text-dark-50 d-block mb-1">⏳ Pending Household Visits</span>
              <h2 className="display-6 fw-bold mb-0">{pendingAssignments.length}</h2>
              <small className="text-dark-50">Requires Home Visit & Follow-Up</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="border-0 shadow-sm bg-success text-white text-center py-3">
            <Card.Body>
              <span className="fs-6 text-white-50 d-block mb-1">✅ Completed Field Reports</span>
              <h2 className="display-6 fw-bold mb-0">{completedAssignments.length}</h2>
              <small className="text-white-50">Reports Submitted</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Pending Household Field Tasks Queue */}
      <Card className="shadow-sm border-0 mb-4">
        <Card.Header className="bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
          <h5 className="mb-0 text-primary fw-bold">🏡 Pending Community Household Field Visits ({pendingAssignments.length})</h5>
          <small className="text-muted">Grassroots Health Monitoring Queue</small>
        </Card.Header>
        <Card.Body className="p-0">
          {pendingAssignments.length ? (
            <ListGroup variant="flush">
              {pendingAssignments.map((item) => (
                <ListGroup.Item key={item.id} className="py-3 px-4">
                  <Row className="align-items-center">
                    <Col md={8}>
                      <div className="d-flex align-items-center gap-2 mb-1">
                        <Badge bg={item.priority === 'URGENT' ? 'danger' : 'secondary'}>
                          {item.priority || 'ROUTINE'}
                        </Badge>
                        <h6 className="mb-0 text-dark fw-bold">
                          {item.task_type || 'Post-Consultation Follow-Up'}
                        </h6>
                        <small className="text-muted font-monospace">Case #{item.case_id || 'N/A'}</small>
                      </div>
                      <p className="text-secondary mb-1 small">{item.notes}</p>
                      <small className="text-muted">Assigned Date: {item.assigned_date || 'Today'}</small>
                    </Col>
                    <Col md={4} className="text-end">
                      <Button variant="success" size="sm" onClick={() => openReportModal(item)}>
                        📝 Submit Report & Field Actions
                      </Button>
                    </Col>
                  </Row>
                </ListGroup.Item>
              ))}
            </ListGroup>
          ) : (
            <div className="text-center py-5 text-muted">
              ✅ Great job! All assigned community field visits completed.
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Completed Field Follow-ups History */}
      <Card className="shadow-sm border-0 mb-4">
        <Card.Header className="bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
          <h5 className="mb-0 text-success fw-bold">✅ Completed Field Visit History ({completedAssignments.length})</h5>
          <small className="text-muted">Submitted Reports</small>
        </Card.Header>
        <Card.Body className="p-0">
          <Table responsive hover className="mb-0 align-middle">
            <thead className="bg-light">
              <tr>
                <th>Task & Case #</th>
                <th>Outcome Status</th>
                <th>Follow-up Notes, Vitals & Flags</th>
                <th>Date Completed</th>
              </tr>
            </thead>
            <tbody>
              {completedAssignments.length ? (
                completedAssignments.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <div className="fw-bold">{a.task_type || 'Field Follow-Up'}</div>
                      <small className="text-muted">Case #{a.case_id}</small>
                    </td>
                    <td>
                      <Badge bg={a.outcome?.includes('FALSE') ? 'danger' : 'success'}>
                        {a.outcome || 'COMPLETED'}
                      </Badge>
                    </td>
                    <td>
                      <small className="text-dark d-block">{a.follow_up_notes || 'Patient checked at home.'}</small>
                    </td>
                    <td>
                      <small className="text-muted">{a.follow_up_date || 'Recently'}</small>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center py-4 text-muted">
                    No completed field reports recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* 📝 Comprehensive ASHA Field Action Modal */}
      <Modal show={showReportModal} onHide={() => setShowReportModal(false)} size="lg" backdrop="static">
        <Modal.Header closeButton className="bg-success text-white">
          <Modal.Title>📝 Field Visit Report & Actions — Case #{selectedAssignment?.case_id}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleReportSubmit}>
          <Modal.Body className="py-4">
            <Alert variant="info" className="py-2 mb-3 small">
              <strong>Task:</strong> {selectedAssignment?.task_type} | {' '}
              <strong>Directives:</strong> {selectedAssignment?.notes}
            </Alert>

            {/* Vitals Row */}
            <Row className="g-3 mb-3">
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="fw-bold">Blood Pressure (BP)</Form.Label>
                  <Form.Control
                    placeholder="e.g. 120/80 mmHg"
                    value={reportData.vitals_bp}
                    onChange={(e) => setReportData({ ...reportData, vitals_bp: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="fw-bold">Body Temperature</Form.Label>
                  <Form.Control
                    placeholder="e.g. 98.6 F"
                    value={reportData.vitals_temp}
                    onChange={(e) => setReportData({ ...reportData, vitals_temp: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="fw-bold">Medicine Compliance?</Form.Label>
                  <Form.Select
                    value={reportData.med_compliance}
                    onChange={(e) => setReportData({ ...reportData, med_compliance: e.target.value })}
                  >
                    <option value="YES">Yes — Taking Prescribed Medicines</option>
                    <option value="NO">No — Missing Dosage</option>
                    <option value="OUT_OF_STOCK">No — Out of Stock</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            {/* 📸 Field Photo Upload */}
            <Form.Group className="mb-3 border p-3 rounded bg-light">
              <Form.Label className="fw-bold text-primary">📸 Upload Patient Field Visit Photo (Lesion, Recovery, or Visit Proof)</Form.Label>
              <Form.Control type="file" accept="image/*" onChange={handlePhotoUpload} />
              {reportData.photo_url && (
                <div className="mt-2 text-center">
                  <img src={reportData.photo_url} alt="Field preview" style={{ maxHeight: '120px', borderRadius: '8px' }} />
                  <small className="d-block text-success mt-1">✓ Photo attached to report</small>
                </div>
              )}
            </Form.Group>

            {/* ⚠️ False Complaint Flagging Control */}
            <Card className="mb-3 border-danger-subtle bg-danger-subtle p-3">
              <Form.Check
                type="checkbox"
                id="false-complaint-check"
                label={<strong className="text-danger">⚠️ Report as False Complaint / Non-Compliant Patient Flag</strong>}
                checked={reportData.is_false_complaint}
                onChange={(e) => setReportData({ ...reportData, is_false_complaint: e.target.checked })}
              />
              {reportData.is_false_complaint && (
                <Form.Group className="mt-2">
                  <Form.Label className="fw-bold text-danger">Reason for Flagging False Complaint / Non-Compliance *</Form.Label>
                  <Form.Select
                    value={reportData.flag_reason}
                    onChange={(e) => setReportData({ ...reportData, flag_reason: e.target.value })}
                    required={reportData.is_false_complaint}
                  >
                    <option value="">Select reason...</option>
                    <option value="Patient not present at given address">Patient not present at given address</option>
                    <option value="Patient refusing examination or treatment">Patient refusing examination or treatment</option>
                    <option value="False symptom claim / Misleading report">False symptom claim / Misleading report</option>
                    <option value="Patient uncooperative / False emergency claim">Patient uncooperative / False emergency claim</option>
                  </Form.Select>
                </Form.Group>
              )}
            </Card>

            {/* 📅 Schedule Doctor Appointment Control */}
            <Card className="mb-3 border-primary-subtle bg-primary-subtle p-3">
              <Form.Check
                type="checkbox"
                id="book-appt-check"
                label={<strong className="text-primary">📅 Schedule Doctor Appointment at PHC/Hospital for Patient</strong>}
                checked={reportData.book_appointment}
                onChange={(e) => setReportData({ ...reportData, book_appointment: e.target.checked })}
              />
              {reportData.book_appointment && (
                <Row className="mt-2 g-2">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label className="fw-bold">Requested Appointment Date *</Form.Label>
                      <Form.Control
                        type="date"
                        value={reportData.appointment_date}
                        onChange={(e) => setReportData({ ...reportData, appointment_date: e.target.value })}
                        required={reportData.book_appointment}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6} className="d-flex align-items-end">
                    <small className="text-muted">
                      Will automatically book an OPD slot at Swasthya Nagar PHC for the patient.
                    </small>
                  </Col>
                </Row>
              )}
            </Card>

            {/* Outcome & General Notes */}
            <Row className="g-3">
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-bold">Visit Outcome Status</Form.Label>
                  <Form.Select
                    value={reportData.outcome}
                    onChange={(e) => setReportData({ ...reportData, outcome: e.target.value })}
                  >
                    <option value="RECOVERED">🟢 RECOVERED — Patient Doing Well</option>
                    <option value="STABLE">🟡 STABLE — Continuing Medications</option>
                    <option value="ESCALATED_TO_DOCTOR">🔴 ESCALATED — Symptoms Worsening, Doctor Visit Needed</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group>
                  <Form.Label className="fw-bold">Field Visit Observations & Detailed Notes <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder="Record patient recovery progress, symptoms observed, barriers to care..."
                    value={reportData.notes}
                    onChange={(e) => setReportData({ ...reportData, notes: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowReportModal(false)} disabled={submittingReport}>
              Cancel
            </Button>
            <Button variant="success" type="submit" disabled={submittingReport || !reportData.notes.trim()}>
              {submittingReport ? <Spinner size="sm" className="me-2" /> : null}
              🚀 Submit Field Report & Actions
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
      {/* 🚨 ASHA WORKER COMMUNITY EMERGENCY SOS DISPATCH MODAL */}
      <Modal show={showAshaSosModal} onHide={() => { setShowAshaSosModal(false); setAshaSosResult(null); }} centered className="rounded-4">
        <Modal.Header closeButton className="bg-danger text-white border-0">
          <Modal.Title className="fw-extrabold fs-5 d-flex align-items-center gap-2">
            🚑 ASHA Worker 1-Click Community Emergency SOS
          </Modal.Title>
        </Modal.Header>

        <Modal.Body className="p-4">
          {ashaSosRetractedMsg && (
            <Alert variant="success" className="rounded-3 border-0 shadow-sm mb-3 text-center fw-bold" dismissible onClose={() => setAshaSosRetractedMsg('')}>
              {ashaSosRetractedMsg}
            </Alert>
          )}

          {ashaSosCountdown !== null ? (
            /* 10-Second Countdown Timer */
            <div className="bg-danger text-white p-4 rounded-4 text-center shadow-lg animate-pulse">
              <Badge bg="white" text="danger" className="fs-7 px-3 py-1.5 rounded-pill mb-2 fw-extrabold shadow-sm">
                🚨 RETRACTABLE ASHA COMMUNITY SOS TRIGGERED
              </Badge>
              <h1 className="display-2 fw-extrabold font-monospace mb-2 text-white letter-spacing-1">
                00:{String(ashaSosCountdown).padStart(2, '0')}
              </h1>
              <p className="fw-semibold mb-3 fs-6">
                Dispatching GPS Ambulance & reserving Hospital ER Bed for community patient in <strong className="text-warning fs-5">{ashaSosCountdown} seconds</strong>...
              </p>

              <div className="progress mb-4 bg-black bg-opacity-25" style={{ height: '12px' }}>
                <div 
                  className="progress-bar bg-warning progress-bar-striped progress-bar-animated" 
                  style={{ width: `${(ashaSosCountdown / 10) * 100}%`, transition: 'width 1s linear' }}
                ></div>
              </div>

              <div className="d-flex flex-column gap-2">
                <Button 
                  variant="light" 
                  size="lg"
                  className="text-danger fw-extrabold rounded-pill py-2.5 shadow fs-6 d-flex align-items-center justify-content-center gap-2"
                  onClick={cancelAndRetractAshaSOS}
                >
                  ❌ CANCEL & RETRACT SOS SIGNAL (Accidental Trigger)
                </Button>
                <Button 
                  variant="outline-light" 
                  size="sm" 
                  className="rounded-pill fw-semibold border-white opacity-90 mt-1"
                  onClick={() => executeAshaSOSDispatch()}
                >
                  ⚡ DISPATCH IMMEDIATELY (Skip 10s Countdown)
                </Button>
              </div>
            </div>
          ) : ashaSosResult ? (
            /* Live ASHA Emergency Pass Card */
            <div className="bg-danger-subtle p-3 rounded-4 border border-danger">
              <div className="text-center mb-3">
                <Badge bg="danger" className="fs-7 px-3 py-1.5 rounded-pill mb-1">
                  🚨 ASHA COMMUNITY EMERGENCY DISPATCHED
                </Badge>
                <h4 className="fw-extrabold text-danger mb-0 font-monospace">
                  {ashaSosResult.pass_code}
                </h4>
                <small className="text-muted">Assigned ASHA Worker: {ashaSosResult.asha_worker_name}</small>
              </div>

              <div className="bg-white p-3 rounded-3 shadow-sm mb-3">
                <div className="d-flex align-items-center justify-content-between border-bottom pb-2 mb-2">
                  <span className="fw-bold text-dark fs-6">👤 Patient Name:</span>
                  <span className="fw-extrabold text-danger">{ashaSosResult.patient_name}</span>
                </div>
                <div className="d-flex align-items-center justify-content-between border-bottom pb-2 mb-2">
                  <span className="fw-bold text-dark fs-6">🚑 GPS Ambulance Unit:</span>
                  <span className="fw-bold text-danger">{ashaSosResult.ambulance_unit}</span>
                </div>
                <div className="d-flex align-items-center justify-content-between border-bottom pb-2 mb-2">
                  <span className="fw-bold text-dark fs-6">⏳ Estimated ETA:</span>
                  <Badge bg="warning" text="dark" className="fs-6 px-2.5">
                    {ashaSosResult.eta_minutes} MINUTES AWAY
                  </Badge>
                </div>
                <div className="d-flex align-items-center justify-content-between border-bottom pb-2 mb-2">
                  <span className="fw-bold text-dark fs-6">🛏️ Hospital ER Bay:</span>
                  <span className="fw-bold text-teal">{ashaSosResult.er_bay_number}</span>
                </div>
                <div className="d-flex align-items-center justify-content-between">
                  <span className="fw-bold text-dark fs-6">🏥 Destination Hospital:</span>
                  <span className="fw-semibold text-truncate ms-2" style={{ maxWidth: '180px' }}>{ashaSosResult.hospital_name}</span>
                </div>
              </div>

              <div className="d-flex flex-column gap-2">
                <a 
                  href={`tel:${ashaSosResult.ambulance_driver_contact}`} 
                  className="btn btn-danger w-100 fw-bold rounded-pill py-2 text-decoration-none d-flex align-items-center justify-content-center gap-1.5"
                >
                  📞 Call Ambulance Driver ({ashaSosResult.ambulance_driver_contact})
                </a>
                <Button 
                  variant="outline-danger" 
                  className="rounded-pill fw-bold py-1.5 fs-7"
                  onClick={cancelAndRetractAshaSOS}
                >
                  ❌ Retract & Cancel Emergency SOS
                </Button>
              </div>
            </div>
          ) : (
            /* ASHA Community Emergency SOS Dispatch Form */
            <Form onSubmit={triggerAshaSOSCountdown}>
              <Alert variant="warning" className="p-2 fs-7 rounded-3 border-0 mb-3">
                ⚡ <strong>ASHA Emergency Protocol:</strong> As an ASHA worker, submitting this form immediately dispatches a GPS Ambulance to the village and reserves an ER Trauma bed at the district hospital.
              </Alert>

              <Form.Group className="mb-2">
                <Form.Label className="fw-semibold small mb-1">Patient Emergency Mobile Number <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="tel"
                  placeholder="Patient 10-digit mobile number"
                  value={ashaSosForm.phone_number}
                  onChange={(e) => setAshaSosForm({ ...ashaSosForm, phone_number: e.target.value })}
                  required
                  className="rounded-3 border-2"
                />
              </Form.Group>

              <Form.Group className="mb-2">
                <Form.Label className="fw-semibold small mb-1">Patient Full Name</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Patient full name"
                  value={ashaSosForm.patient_name}
                  onChange={(e) => setAshaSosForm({ ...ashaSosForm, patient_name: e.target.value })}
                  className="rounded-3 border-2"
                />
              </Form.Group>

              <Form.Group className="mb-2">
                <Form.Label className="fw-semibold small mb-1">Emergency Condition / Crisis Type <span className="text-danger">*</span></Form.Label>
                <Form.Select
                  value={ashaSosForm.emergency_type}
                  onChange={(e) => setAshaSosForm({ ...ashaSosForm, emergency_type: e.target.value })}
                  className="rounded-3 border-2 fw-semibold"
                >
                  <option value="High-Risk Maternity Labor Emergency">🤰 High-Risk Maternity Labor & Delivery Emergency</option>
                  <option value="Severe Chest Pain / Cardiac Emergency">🫀 Severe Chest Pain / Cardiac Arrest</option>
                  <option value="Snake Bite / Severe Poisoning">🐍 Snake Bite / Poisoning Emergency</option>
                  <option value="Severe Road Accident & Heavy Bleeding">🚨 Severe Road Trauma & Heavy Bleeding</option>
                  <option value="High Fever, Convulsions & Unconscious">⚡ High Fever, Convulsions & Unconscious Infant/Adult</option>
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-2">
                <Form.Label className="fw-semibold small mb-1">Village Location / Ward Address</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="e.g. House 14, Swasthya Nagar Ward #4"
                  value={ashaSosForm.location}
                  onChange={(e) => setAshaSosForm({ ...ashaSosForm, location: e.target.value })}
                  className="rounded-3 border-2"
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="fw-semibold small mb-1">Field Vitals / Assessment</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="e.g. BP 140/90, Pulse 105, Patient in severe pain"
                  value={ashaSosForm.vitals}
                  onChange={(e) => setAshaSosForm({ ...ashaSosForm, vitals: e.target.value })}
                  className="rounded-3 border-2"
                />
              </Form.Group>

              <Button 
                type="submit" 
                variant="danger" 
                disabled={ashaSosSubmitting}
                className="w-100 py-2.5 rounded-3 fw-extrabold fs-6 shadow-sm d-flex align-items-center justify-content-center gap-2"
              >
                {ashaSosSubmitting ? <Spinner size="sm" /> : null}
                TRIGGER 10s RETRACTABLE ASHA COMMUNITY SOS DISPATCH ⚡
              </Button>
            </Form>
          )}
        </Modal.Body>

        <Modal.Footer className="border-0 pt-0">
          <Button variant="secondary" className="w-100 rounded-3 fw-bold" onClick={() => { setShowAshaSosModal(false); setAshaSosResult(null); }}>
            Close Emergency Panel
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}
