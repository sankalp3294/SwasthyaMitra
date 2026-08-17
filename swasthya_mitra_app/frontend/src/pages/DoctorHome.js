import React from 'react';
import { Container, Card, Row, Col, Button, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { 
  FaUserInjured, FaPills, FaCalendarAlt, FaStethoscope, 
  FaHeartbeat, FaMicroscope, FaUserCheck, FaArrowRight, FaShieldAlt
} from 'react-icons/fa';

export default function DoctorHome() {
  const navigate = useNavigate();

  return (
    <Container className="py-4 fade-slide-up">
      {/* Doctor Hero Header */}
      <div className="page-intro mb-4 p-4 rounded-4 position-relative overflow-hidden"
           style={{ background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.15) 0%, rgba(13, 148, 136, 0.1) 100%)', border: '1px solid var(--border-color)' }}>
        <Row className="align-items-center">
          <Col md={8}>
            <span className="eyebrow">CLINICAL OPD & TELE-ICU COMMAND</span>
            <h1 className="display-6 fw-extrabold mb-2" style={{ color: 'var(--text-heading)' }}>
              Doctor Workstation & Consultation Queue 🩺
            </h1>
            <p className="lead text-muted mb-3" style={{ fontSize: '1.05rem' }}>
              Manage active patient consultations, order diagnostic lab tests, prescribe medications with 1-click presets, and review missed OPD follow-ups.
            </p>
            <div className="d-flex flex-wrap gap-2">
              <Button className="primary-action d-flex align-items-center gap-2" onClick={() => navigate('/doctor/patients')}>
                <FaUserInjured /> View Patient Consultation Roster <FaArrowRight />
              </Button>
              <Button variant="outline-teal" className="rounded-3 border-2 fw-bold px-3" onClick={() => navigate('/doctor/medications')}>
                <FaPills className="me-2" /> Medicine Catalog & Prescriptions
              </Button>
            </div>
          </Col>
          <Col md={4} className="text-center d-none d-md-block">
            <div className="p-3 rounded-circle bg-cyan-subtle text-cyan d-inline-block shadow-sm">
              <FaStethoscope size={70} className="animate-float" />
            </div>
          </Col>
        </Row>
      </div>

      {/* Doctor Stats Summary */}
      <Row className="g-3 mb-4">
        <Col md={3}>
          <Card className="app-card text-center p-3">
            <Card.Body>
              <h2 className="fw-extrabold text-teal mb-0">18</h2>
              <small className="text-muted fw-bold">Today's Scheduled OPD</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="app-card text-center p-3">
            <Card.Body>
              <h2 className="fw-extrabold text-danger mb-0">3</h2>
              <small className="text-muted fw-bold">Urgent / High Triage</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="app-card text-center p-3">
            <Card.Body>
              <h2 className="fw-extrabold text-cyan mb-0">12</h2>
              <small className="text-muted fw-bold">Prescriptions Issued</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="app-card text-center p-3">
            <Card.Body>
              <h2 className="fw-extrabold text-warning mb-0">2</h2>
              <small className="text-muted fw-bold">ASHA Follow-ups Dispatched</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Action Modules */}
      <Row className="g-3">
        <Col md={4}>
          <Card className="app-card text-center p-3 cursor-pointer h-100" onClick={() => navigate('/doctor/patients')}>
            <Card.Body>
              <div className="p-3 rounded-circle bg-teal-subtle text-teal d-inline-block mb-3">
                <FaUserInjured size={32} />
              </div>
              <h5 className="fw-bold">Patient Consultation Queue</h5>
              <p className="text-muted small">Review patient cases, inspect AI symptom triage reports, record clinical findings, and trigger lab orders.</p>
              <Button size="sm" variant="outline-teal" className="rounded-pill px-3">Open Queue →</Button>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="app-card text-center p-3 cursor-pointer h-100" onClick={() => navigate('/doctor/medications')}>
            <Card.Body>
              <div className="p-3 rounded-circle bg-cyan-subtle text-cyan d-inline-block mb-3">
                <FaPills size={32} />
              </div>
              <h5 className="fw-bold">Medication Catalog & Stock</h5>
              <p className="text-muted small">Manage hospital medicine inventory, check dosage guidelines, and configure fast prescription presets.</p>
              <Button size="sm" variant="outline-cyan" className="rounded-pill px-3">Manage Medicines →</Button>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="app-card text-center p-3 cursor-pointer h-100" onClick={() => navigate('/doctor/appointments')}>
            <Card.Body>
              <div className="p-3 rounded-circle bg-primary-subtle text-primary d-inline-block mb-3">
                <FaCalendarAlt size={32} />
              </div>
              <h5 className="fw-bold">Hospital Schedule</h5>
              <p className="text-muted small">View daily time slots, manage walk-in OPD queues, and handle missed appointment follow-up actions.</p>
              <Button size="sm" variant="outline-primary" className="rounded-pill px-3">View Schedule →</Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
