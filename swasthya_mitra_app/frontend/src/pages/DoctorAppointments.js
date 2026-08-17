import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Badge, Button, Alert, Spinner, Row, Col, Form, InputGroup, Modal } from 'react-bootstrap';
import { appointmentAPI, dashboardAPI, ashaAPI } from '../services/api';

export default function DoctorAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [ashaWorkers, setAshaWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Filter State
  const [filterMode, setFilterMode] = useState('ALL'); // ALL, REBOOKED, ATTENDED
  const [searchTerm, setSearchTerm] = useState('');

  // No-Show & ASHA Deployment Modal State
  const [showNoShowModal, setShowNoShowModal] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [dispatchAsha, setDispatchAsha] = useState(true);
  const [selectedAshaId, setSelectedAshaId] = useState('');
  const [ashaInstructions, setAshaInstructions] = useState('');
  const [submittingNoShow, setSubmittingNoShow] = useState(false);

  const loadAppointments = async () => {
    setLoading(true);
    setError('');
    try {
      const [dashRes, workersRes] = await Promise.all([
        dashboardAPI.getMyDoctorDashboard().catch(() => dashboardAPI.getHospitalDashboard(1)),
        ashaAPI.getWorkers().catch(() => ({ data: { workers: [] } }))
      ]);
      
      const apptList = dashRes.data?.appointments || dashRes.data?.today_appointments || [];
      setAppointments(apptList);

      const workers = workersRes.data?.workers || [];
      setAshaWorkers(workers);
      if (workers.length) {
        setSelectedAshaId(workers[0].id);
      }
    } catch (err) {
      console.error('Failed to load appointments schedule:', err);
      setError('Unable to load appointment schedule. Please refresh or check connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const handleConfirm = async (id) => {
    try {
      await appointmentAPI.confirmAppointment(id);
      setActionSuccess('2nd Appointment confirmed by Doctor!');
      setTimeout(() => setActionSuccess(''), 3000);
      loadAppointments();
    } catch (err) {
      setError('Failed to confirm appointment.');
    }
  };

  const handleCheckIn = async (id) => {
    try {
      await appointmentAPI.checkIn(id);
      setActionSuccess('Patient marked as Checked-In / Attended!');
      setTimeout(() => setActionSuccess(''), 3000);
      loadAppointments();
    } catch (err) {
      setError('Failed to check in patient.');
    }
  };

  const openNoShowModal = (appt) => {
    setSelectedAppt(appt);
    setDispatchAsha(true);
    setAshaInstructions(`Visit patient home to check health, verify reason for missed appointment, and check recovery.`);
    if (ashaWorkers.length) {
      setSelectedAshaId(ashaWorkers[0].id);
    }
    setShowNoShowModal(true);
  };

  const handleNoShowSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAppt) return;
    setSubmittingNoShow(true);
    setError('');

    try {
      const res = await appointmentAPI.markNoShow(selectedAppt.id, {
        dispatch_asha: dispatchAsha,
        asha_worker_id: selectedAshaId ? parseInt(selectedAshaId, 10) : null,
        asha_instructions: ashaInstructions.trim()
      });

      setShowNoShowModal(false);
      const workerObj = ashaWorkers.find(w => w.id === parseInt(selectedAshaId, 10));
      const workerName = workerObj?.name || 'ASHA Worker';

      if (res.data.dispatch_asha) {
        setActionSuccess(`🚨 ASHA Field Worker ${workerName} successfully assigned & deployed!`);
      } else {
        setActionSuccess('Appointment marked No-Show (Closed without ASHA deployment).');
      }
      setTimeout(() => setActionSuccess(''), 5000);
      loadAppointments();
    } catch (err) {
      setError('Failed to process no-show decision.');
    } finally {
      setSubmittingNoShow(false);
    }
  };

  if (loading) return <Container className="text-center py-5"><Spinner animation="border" variant="primary" /></Container>;

  // Filtered Appointments List
  const filteredAppointments = appointments.filter(appt => {
    const isRebooked = appt.appointment_status === 'REBOOKED' || (appt.no_show_count && appt.no_show_count > 0);
    const isAttended = appt.check_in_status === 'CHECKED_IN' || appt.appointment_status === 'ATTENDED';

    let matchesFilter = true;
    if (filterMode === 'REBOOKED') matchesFilter = isRebooked;
    if (filterMode === 'ATTENDED') matchesFilter = isAttended;

    const matchesSearch = appt.patient_id?.toString().includes(searchTerm) ||
                          (appt.notes && appt.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesFilter && matchesSearch;
  });

  const rebookedCount = appointments.filter(a => a.appointment_status === 'REBOOKED' || (a.no_show_count && a.no_show_count > 0)).length;
  const checkedInCount = appointments.filter(a => a.check_in_status === 'CHECKED_IN' || a.appointment_status === 'ATTENDED').length;

  return (
    <Container className="py-4">
      <div className="page-intro mb-4">
        <span className="eyebrow">DOCTOR OPD COMMAND & ASHA WORKER DEPLOYMENT</span>
        <h1>Doctor Appointments & 2nd Visit Queue</h1>
        <p className="lead text-muted">
          Manage OPD visits, confirm 2nd rebooked appointments, and deploy ASHA field workers for home visits with custom orders.
        </p>
      </div>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
      {actionSuccess && <Alert variant="success" dismissible onClose={() => setActionSuccess('')}>{actionSuccess}</Alert>}

      {/* Top Filter & Metric Cards */}
      <Row className="g-3 mb-4">
        <Col md={4}>
          <Card className={`border-0 shadow-sm text-center py-3 ${filterMode === 'ALL' ? 'bg-primary text-white' : 'bg-light'}`}
                style={{ cursor: 'pointer' }} onClick={() => setFilterMode('ALL')}>
            <Card.Body>
              <h3 className="fw-bold mb-0">{appointments.length}</h3>
              <small>📅 All Scheduled Visits</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className={`border-0 shadow-sm text-center py-3 ${filterMode === 'REBOOKED' ? 'bg-warning text-dark border border-warning border-2' : 'bg-light'}`}
                style={{ cursor: 'pointer' }} onClick={() => setFilterMode('REBOOKED')}>
            <Card.Body>
              <h3 className="fw-bold mb-0">{rebookedCount}</h3>
              <small>🔄 Rebooked 2nd Appointments Queue</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className={`border-0 shadow-sm text-center py-3 ${filterMode === 'ATTENDED' ? 'bg-success text-white' : 'bg-light'}`}
                style={{ cursor: 'pointer' }} onClick={() => setFilterMode('ATTENDED')}>
            <Card.Body>
              <h3 className="fw-bold mb-0">{checkedInCount}</h3>
              <small>🟢 Checked-In / Attended Queue</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Appointments List Table */}
      <Card className="shadow-sm border-0 mb-4">
        <Card.Header className="bg-white py-3 border-bottom d-flex justify-content-between align-items-center flex-wrap gap-2">
          <h5 className="mb-0 text-primary fw-bold">
            {filterMode === 'REBOOKED' ? '🔄 2nd / Rebooked Appointments Queue' :
             filterMode === 'ATTENDED' ? '🟢 Checked-In Patients Queue' :
             '📅 Today\'s OPD Appointment Schedule'} ({filteredAppointments.length})
          </h5>
          <InputGroup size="sm" style={{ maxWidth: '300px' }}>
            <InputGroup.Text>🔍</InputGroup.Text>
            <Form.Control
              placeholder="Search by Patient Ref ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
        </Card.Header>
        <Card.Body className="p-0">
          <Table responsive hover className="mb-0 align-middle">
            <thead className="bg-light">
              <tr>
                <th>Patient Ref & ID</th>
                <th>Attempt & Visit Type</th>
                <th>Scheduled Date & Time</th>
                <th>Check-in Status</th>
                <th>Doctor Actions & ASHA Control</th>
              </tr>
            </thead>
            <tbody>
              {filteredAppointments.length ? (
                filteredAppointments.map((appt) => {
                  const isRebooked = appt.appointment_status === 'REBOOKED' || (appt.no_show_count && appt.no_show_count > 0);
                  const isCheckedIn = appt.check_in_status === 'CHECKED_IN' || appt.appointment_status === 'ATTENDED';
                  const isConfirmed = appt.appointment_status === 'CONFIRMED';
                  const isAshaEscalated = appt.appointment_status === 'ASHA_ESCALATION';

                  return (
                    <tr key={appt.id} className={isRebooked ? 'table-warning-subtle' : ''}>
                      <td>
                        <div className="fw-bold fs-6 text-dark">Patient #{appt.patient_id}</div>
                        <small className="text-muted">Appointment Ref: #{appt.id}</small>
                      </td>
                      <td>
                        {isRebooked ? (
                          <div>
                            <Badge bg="warning" text="dark" className="fs-6 d-inline-block mb-1">
                              🔄 2nd Appointment (Rebooked)
                            </Badge>
                            <small className="text-danger d-block fw-semibold">
                              ⚠️ Missed 1st visit ({appt.no_show_count || 1} No-Show)
                            </small>
                          </div>
                        ) : (
                          <Badge bg="secondary">Standard Visit</Badge>
                        )}
                      </td>
                      <td>
                        <div className="fw-bold">{appt.appointment_date}</div>
                        <small className="text-muted">⏰ {appt.appointment_time || '09:00 AM'}</small>
                      </td>
                      <td>
                        {isCheckedIn ? (
                          <Badge bg="success">🟢 Checked In / Attended</Badge>
                        ) : isAshaEscalated ? (
                          <Badge bg="dark">🚨 Escalated to ASHA Worker</Badge>
                        ) : isConfirmed ? (
                          <Badge bg="info">🔵 Confirmed Slot</Badge>
                        ) : (
                          <Badge bg="warning" text="dark">🟡 Pending Check-in</Badge>
                        )}
                      </td>
                      <td>
                        <div className="d-flex gap-2 flex-wrap">
                          {/* Confirm Button for 2nd Appointments */}
                          {!isConfirmed && !isCheckedIn && (
                            <Button size="sm" variant="outline-primary" onClick={() => handleConfirm(appt.id)}>
                              🔵 Confirm 2nd Visit
                            </Button>
                          )}

                          {/* Check-In Button */}
                          {!isCheckedIn && (
                            <Button size="sm" variant="success" onClick={() => handleCheckIn(appt.id)}>
                              🟢 Mark Attended
                            </Button>
                          )}

                          {/* Direct ASHA Worker Deployment Button */}
                          <Button size="sm" variant="warning" text="dark" onClick={() => openNoShowModal(appt)}>
                            🚨 Deploy ASHA Worker
                          </Button>

                          {/* Doctor Decision No-Show Button */}
                          {!isCheckedIn && (
                            <Button size="sm" variant="outline-danger" onClick={() => openNoShowModal(appt)}>
                              ❌ Mark No-Show
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-5 text-muted">
                    No appointments found in current view.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* 🚨 Doctor ASHA Worker Deployment & No-Show Decision Modal */}
      <Modal show={showNoShowModal} onHide={() => setShowNoShowModal(false)} backdrop="static" size="lg">
        <Modal.Header closeButton className="bg-warning text-dark">
          <Modal.Title className="fw-bold">🚨 Deploy ASHA Field Worker & Mark No-Show Decision</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleNoShowSubmit}>
          <Modal.Body className="py-3">
            <Alert variant="info" className="py-2 mb-3 small">
              <strong>Patient Ref:</strong> #{selectedAppt?.patient_id} | {' '}
              <strong>Attempt Status:</strong> {selectedAppt?.appointment_status === 'REBOOKED' ? '2nd Rebooked Attempt' : 'Initial OPD Visit'}
            </Alert>

            <Form.Group className="mb-3 border p-3 rounded bg-light">
              <Form.Check
                type="checkbox"
                id="dispatch-asha-check"
                label={
                  <strong className="text-dark">
                    🚨 Deploy ASHA Field Worker for Home Visit & Health Screening
                  </strong>
                }
                checked={dispatchAsha}
                onChange={(e) => setDispatchAsha(e.target.checked)}
              />
              <small className="text-muted d-block mt-1 ms-4">
                Check this option to deploy a dedicated ASHA field worker to conduct a home visit, check patient vitals, and verify recovery. Uncheck if no ASHA visit is required.
              </small>
            </Form.Group>

            {dispatchAsha && (
              <>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Select Assigned ASHA Field Worker</Form.Label>
                  <Form.Select
                    value={selectedAshaId}
                    onChange={(e) => setSelectedAshaId(e.target.value)}
                  >
                    {ashaWorkers.length ? (
                      ashaWorkers.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name} — Zone: {w.zone || 'Swasthya Nagar'} (Phone: {w.phone_number})
                        </option>
                      ))
                    ) : (
                      <option value="">Sunita Devi (ASHA) — Swasthya Nagar Zone</option>
                    )}
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Doctor Directives & Direct Orders for ASHA Worker <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder="Specify what the ASHA worker should inspect at patient home (e.g. check BP, measure temperature, verify why appointment was missed)..."
                    value={ashaInstructions}
                    onChange={(e) => setAshaInstructions(e.target.value)}
                    required={dispatchAsha}
                  />
                </Form.Group>
              </>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowNoShowModal(false)} disabled={submittingNoShow}>
              Cancel
            </Button>
            <Button variant="warning" type="submit" disabled={submittingNoShow} className="fw-bold">
              {submittingNoShow ? <Spinner size="sm" className="me-2" /> : null}
              🚀 Deploy ASHA Worker & Execute Decision
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
}
