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
    </Container>
  );
}
