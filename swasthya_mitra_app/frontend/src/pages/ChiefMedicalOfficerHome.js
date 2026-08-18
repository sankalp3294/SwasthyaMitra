import React from 'react';
import { Container, Card, Row, Col, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { 
  FaBrain, FaUserNurse, 
  FaMapMarkedAlt, FaUsers, FaArrowRight
} from 'react-icons/fa';

export default function ChiefMedicalOfficerHome() {
  const navigate = useNavigate();

  return (
    <Container className="py-4 fade-slide-up">
      {/* CMO Hero Banner */}
      <div className="page-intro mb-4 p-4 rounded-4 position-relative overflow-hidden"
           style={{ background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(13, 148, 136, 0.4) 100%)', color: 'white', border: '1px solid var(--border-color)' }}>
        <Row className="align-items-center">
          <Col md={8}>
            <span className="eyebrow text-cyan">DISTRICT CHIEF MEDICAL OFFICER HUB</span>
            <h1 className="display-6 fw-extrabold mb-2 text-white">
              Public Health Command & Epidemic Response 🧠
            </h1>
            <p className="lead mb-3 text-white-50" style={{ fontSize: '1.05rem' }}>
              Real-time district surveillance, GIS disease hotspot maps, ASHA field workforce tracking, and hospital bed capacity telemetry.
            </p>
            <div className="d-flex flex-wrap gap-2">
              <Button className="primary-action d-flex align-items-center gap-2" onClick={() => navigate('/cmo/overview')}>
                <FaMapMarkedAlt /> Open District GIS & Outbreak Map <FaArrowRight />
              </Button>
              <Button variant="outline-light" className="rounded-3 border-2 fw-bold px-3" onClick={() => navigate('/cmo/patients')}>
                <FaUsers className="me-2" /> District Patient Registry
              </Button>
            </div>
          </Col>
          <Col md={4} className="text-center d-none d-md-block">
            <div className="p-3 rounded-circle bg-white-10 text-cyan d-inline-block shadow-lg">
              <FaBrain size={80} className="animate-pulse" />
            </div>
          </Col>
        </Row>
      </div>

      {/* CMO Key Performance Indicators */}
      <Row className="g-3 mb-4">
        <Col md={3}>
          <Card className="app-card text-center p-3">
            <Card.Body>
              <h2 className="fw-extrabold text-teal mb-0">1,248</h2>
              <small className="text-muted fw-bold">Active District Patients</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="app-card text-center p-3">
            <Card.Body>
              <h2 className="fw-extrabold text-cyan mb-0">42</h2>
              <small className="text-muted fw-bold">OPD Specialist Doctors</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="app-card text-center p-3">
            <Card.Body>
              <h2 className="fw-extrabold text-warning mb-0">94.2%</h2>
              <small className="text-muted fw-bold">District Health Score</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="app-card text-center p-3">
            <Card.Body>
              <h2 className="fw-extrabold text-danger mb-0">1</h2>
              <small className="text-muted fw-bold">Active Public Health Interventions</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* CMO Command Modules */}
      <Row className="g-3">
        <Col md={4}>
          <Card className="app-card text-center p-3 cursor-pointer h-100" onClick={() => navigate('/cmo/overview')}>
            <Card.Body>
              <div className="p-3 rounded-circle bg-cyan-subtle text-cyan d-inline-block mb-3">
                <FaMapMarkedAlt size={32} />
              </div>
              <h5 className="fw-bold">GIS Maps & Epidemic Command</h5>
              <p className="text-muted small">Monitor real-time disease clusters, authorize emergency Mobile Medical Units, and inspect hospital bed loads.</p>
              <Button size="sm" variant="outline-cyan" className="rounded-pill px-3">Launch GIS Command →</Button>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="app-card text-center p-3 cursor-pointer h-100" onClick={() => navigate('/cmo/patients')}>
            <Card.Body>
              <div className="p-3 rounded-circle bg-teal-subtle text-teal d-inline-block mb-3">
                <FaUsers size={32} />
              </div>
              <h5 className="fw-bold">District Patient Analytics</h5>
              <p className="text-muted small">Comprehensive patient case breakdown across all district PHCs, triage history, and missed visit reports.</p>
              <Button size="sm" variant="outline-teal" className="rounded-pill px-3">View Patient Registry →</Button>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="app-card text-center p-3 cursor-pointer h-100" onClick={() => navigate('/cmo/doctors')}>
            <Card.Body>
              <div className="p-3 rounded-circle bg-primary-subtle text-primary d-inline-block mb-3">
                <FaUserNurse size={32} />
              </div>
              <h5 className="fw-bold">Doctors & Clinical Roster</h5>
              <p className="text-muted small">Manage specialist assignments across PHCs, monitor OPD consultation volume, and assess doctor performance.</p>
              <Button size="sm" variant="outline-primary" className="rounded-pill px-3">View Doctors Network →</Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
