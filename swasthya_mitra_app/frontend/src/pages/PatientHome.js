import React, { useState } from 'react';
import { Container, Card, Row, Col, Button, Badge, Form, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { 
  FaUserMd, FaHeartbeat, FaCalendarAlt, FaComments, FaLungs, 
  FaThermometerHalf, FaStethoscope, FaArrowRight
} from 'react-icons/fa';
import { FiActivity } from 'react-icons/fi';

export default function PatientHome() {
  const navigate = useNavigate();

  // Interactive Vital Signs State
  const [vitals, setVitals] = useState({
    heartRate: 72,
    bloodPressure: 120,
    spo2: 98,
    temp: 98.6
  });

  // Body Diagram Selected Region
  const [selectedRegion, setSelectedRegion] = useState(null);

  const bodyRegions = [
    { id: 'head', name: 'Head & Brain', icon: '🧠', symptoms: ['Migraine', 'Dizziness', 'Fever', 'Visual Disturbance'] },
    { id: 'throat', name: 'Throat & Respiratory', icon: '🗣️', symptoms: ['Sore Throat', 'Dry Cough', 'Difficulty Swallowing'] },
    { id: 'chest', name: 'Chest & Heart', icon: '🫀', symptoms: ['Chest Tightness', 'Palpitations', 'Shortness of Breath'] },
    { id: 'abdomen', name: 'Stomach & Abdomen', icon: '🩺', symptoms: ['Abdominal Pain', 'Nausea', 'Indigestion', 'Acidity'] },
    { id: 'joints', name: 'Joints & Muscles', icon: '🦴', symptoms: ['Joint Stiffness', 'Muscle Aches', 'Lower Back Strain'] },
    { id: 'skin', name: 'Skin & Allergy', icon: '✨', symptoms: ['Rashes', 'Itching', 'Hives', 'Swelling'] }
  ];

  const getHeartRateStatus = (hr) => {
    if (hr < 60) return { label: 'Bradycardia (Low)', color: 'warning' };
    if (hr > 100) return { label: 'Tachycardia (High)', color: 'danger' };
    return { label: 'Optimal Normal', color: 'success' };
  };

  const getSpo2Status = (s) => {
    if (s < 95) return { label: 'Low Oxygen Alert!', color: 'danger' };
    return { label: 'Normal Oxygen Saturation', color: 'success' };
  };

  const handleStartChatWithRegion = (symptom) => {
    navigate('/chat', { state: { prefill: symptom } });
  };

  return (
    <Container className="py-4 fade-slide-up">
      {/* Hero Welcome Section */}
      <div className="page-intro mb-4 p-4 rounded-4 position-relative overflow-hidden" 
           style={{ background: 'linear-gradient(135deg, rgba(13, 148, 136, 0.15) 0%, rgba(2, 132, 199, 0.1) 100%)', border: '1px solid var(--border-color)' }}>
        <Row className="align-items-center">
          <Col md={8}>
            <span className="eyebrow">PATIENT DIGITAL HEALTH SUITE</span>
            <h1 className="display-6 fw-extrabold mb-2" style={{ color: 'var(--text-heading)' }}>
              Welcome back, Health Champion! 👋
            </h1>
            <p className="lead text-muted mb-3" style={{ fontSize: '1.05rem' }}>
              Your personal AI triage hub. Check your vitals, pinpoint symptoms using our interactive body map, or start an AI consultation.
            </p>
            <div className="d-flex flex-wrap gap-2">
              <Button className="primary-action d-flex align-items-center gap-2" onClick={() => navigate('/chat')}>
                <FaComments /> Start AI Triage Assistant <FaArrowRight />
              </Button>
              <Button variant="outline-teal" className="rounded-3 border-2 fw-bold px-3" onClick={() => navigate('/dashboard')}>
                <FaCalendarAlt className="me-2" /> My Appointments & Records
              </Button>
            </div>
          </Col>
          <Col md={4} className="text-center d-none d-md-block">
            <div className="position-relative d-inline-block">
              <FaHeartbeat size={110} style={{ color: 'var(--accent-teal)', opacity: 0.8 }} className="animate-pulse" />
              <div className="position-absolute top-50 start-50 translate-middle bg-white rounded-circle shadow p-2" style={{ width: '45px', height: '45px' }}>
                <FaStethoscope size={24} className="text-teal" />
              </div>
            </div>
          </Col>
        </Row>
      </div>

      {/* 🚨 24/7 Fast-Track Emergency SOS Banner */}
      <Alert variant="danger" className="border-0 shadow-sm rounded-4 mb-4 p-3 bg-danger text-white d-flex align-items-center justify-content-between flex-wrap gap-2">
        <div className="d-flex align-items-center gap-2.5">
          <div className="bg-white text-danger p-2 rounded-circle d-flex align-items-center justify-content-center shadow-sm flex-shrink-0">
            <FaHeartbeat size={22} className="animate-pulse text-danger" />
          </div>
          <div>
            <div className="fw-extrabold text-uppercase letter-spacing-1 fs-7 text-white">
              📍 NEAREST HOSPITAL & 24/7 EMERGENCY SOS
            </div>
            <div className="small text-white opacity-90" style={{ fontSize: '0.85rem' }}>
              Swasthya Nagar PHC is <strong>1.2 km away</strong> (Nearest to your location). Dispatches GPS Ambulance & reserves ER Bed.
            </div>
          </div>
        </div>
        <div className="d-flex align-items-center gap-2 ms-auto">
          <Button variant="light" className="text-danger fw-extrabold px-3 py-1.5 rounded-pill shadow-sm fs-7" onClick={() => navigate('/dashboard')}>
            📍 Nearest Hospitals & SOS
          </Button>
          <a href="tel:108" className="btn btn-outline-light fw-bold px-3 py-1.5 rounded-pill fs-7 text-decoration-none">
            📞 Dial 108
          </a>
        </div>
      </Alert>

      <Row className="g-4 mb-4">
        {/* Interactive Vital Signs Gauge Monitor */}
        <Col lg={6}>
          <Card className="app-card h-100">
            <Card.Header className="app-card-header d-flex justify-content-between align-items-center">
              <span className="d-flex align-items-center gap-2">
                <FiActivity /> Live Interactive Vitals Monitor
              </span>
              <Badge bg="light" text="dark" className="fs-7">Real-time Simulation</Badge>
            </Card.Header>
            <Card.Body className="p-4">
              <p className="text-muted small mb-4">Drag sliders to test real-time AI risk assessment:</p>

              {/* Heart Rate Slider */}
              <div className="vital-card mb-3">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span className="fw-bold d-flex align-items-center gap-2">
                    <FaHeartbeat className="text-danger" /> Heart Rate (BPM): <span className="fs-5 text-teal">{vitals.heartRate}</span>
                  </span>
                  <Badge bg={getHeartRateStatus(vitals.heartRate).color}>
                    {getHeartRateStatus(vitals.heartRate).label}
                  </Badge>
                </div>
                <Form.Range 
                  value={vitals.heartRate} 
                  min={40} 
                  max={140} 
                  onChange={(e) => setVitals({ ...vitals, heartRate: Number(e.target.value) })}
                  className="vital-slider" 
                />
              </div>

              {/* SpO2 Slider */}
              <div className="vital-card mb-3">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span className="fw-bold d-flex align-items-center gap-2">
                    <FaLungs className="text-cyan" /> Oxygen Level SpO2 (%): <span className="fs-5 text-teal">{vitals.spo2}%</span>
                  </span>
                  <Badge bg={getSpo2Status(vitals.spo2).color}>
                    {getSpo2Status(vitals.spo2).label}
                  </Badge>
                </div>
                <Form.Range 
                  value={vitals.spo2} 
                  min={85} 
                  max={100} 
                  onChange={(e) => setVitals({ ...vitals, spo2: Number(e.target.value) })}
                  className="vital-slider" 
                />
              </div>

              {/* Temperature Slider */}
              <div className="vital-card">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span className="fw-bold d-flex align-items-center gap-2">
                    <FaThermometerHalf className="text-warning" /> Temperature (°F): <span className="fs-5 text-teal">{vitals.temp}</span>
                  </span>
                  <Badge bg={vitals.temp > 100 ? 'danger' : 'success'}>
                    {vitals.temp > 100 ? 'Fever Detected' : 'Normal Temperature'}
                  </Badge>
                </div>
                <Form.Range 
                  value={vitals.temp} 
                  min={96} 
                  max={104} 
                  step={0.2}
                  onChange={(e) => setVitals({ ...vitals, temp: Number(e.target.value) })}
                  className="vital-slider" 
                />
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Interactive Visual Body Map Selector */}
        <Col lg={6}>
          <Card className="app-card h-100">
            <Card.Header className="app-card-header d-flex justify-content-between align-items-center">
              <span className="d-flex align-items-center gap-2">
                🩺 Interactive Body Symptom Picker
              </span>
              <Badge bg="light" text="dark" className="fs-7">Click Body Part</Badge>
            </Card.Header>
            <Card.Body className="p-4">
              <p className="text-muted small mb-3">Select the area where you feel discomfort to pre-fill symptoms:</p>
              
              <Row className="g-2 mb-3">
                {bodyRegions.map((region) => (
                  <Col key={region.id} xs={6} sm={4}>
                    <button
                      className={`body-region-btn w-100 ${selectedRegion?.id === region.id ? 'active' : ''}`}
                      onClick={() => setSelectedRegion(region)}
                    >
                      <span className="fs-5">{region.icon}</span>
                      <span>{region.name}</span>
                    </button>
                  </Col>
                ))}
              </Row>

              {selectedRegion ? (
                <div className="p-3 rounded-3 bg-teal-subtle border border-teal fade-slide-up">
                  <h6 className="fw-bold text-teal d-flex align-items-center gap-2 mb-2">
                    {selectedRegion.icon} Common {selectedRegion.name} Symptoms:
                  </h6>
                  <div className="d-flex flex-wrap gap-2">
                    {selectedRegion.symptoms.map((symptom, i) => (
                      <span 
                        key={i} 
                        className="symptom-chip"
                        onClick={() => handleStartChatWithRegion(symptom)}
                      >
                        + {symptom}
                      </span>
                    ))}
                  </div>
                  <small className="d-block text-muted mt-2">Click any symptom chip to launch instant AI diagnosis.</small>
                </div>
              ) : (
                <div className="text-center py-4 text-muted border rounded-3 bg-body-tertiary">
                  👈 Tap any body area above to explore common symptoms.
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Quick Action Navigation Grid */}
      <Row className="g-3">
        <Col md={4}>
          <Card className="app-card text-center p-3 cursor-pointer" onClick={() => navigate('/chat')}>
            <Card.Body>
              <div className="p-3 rounded-circle bg-teal-subtle text-teal d-inline-block mb-3">
                <FaComments size={32} />
              </div>
              <h5 className="fw-bold">AI Symptom Chat</h5>
              <p className="text-muted small">Describe symptoms in plain text or voice for instant triage priority guidance.</p>
              <Button size="sm" variant="outline-teal" className="rounded-pill px-3">Launch Chat →</Button>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="app-card text-center p-3 cursor-pointer" onClick={() => navigate('/dashboard')}>
            <Card.Body>
              <div className="p-3 rounded-circle bg-cyan-subtle text-cyan d-inline-block mb-3">
                <FaCalendarAlt size={32} />
              </div>
              <h5 className="fw-bold">My Appointments</h5>
              <p className="text-muted small">View upcoming hospital visits, doctor notes, or rebook missed slots.</p>
              <Button size="sm" variant="outline-cyan" className="rounded-pill px-3">View Schedule →</Button>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card className="app-card text-center p-3 cursor-pointer" onClick={() => navigate('/chat')}>
            <Card.Body>
              <div className="p-3 rounded-circle bg-danger-subtle text-danger d-inline-block mb-3">
                <FaUserMd size={32} />
              </div>
              <h5 className="fw-bold">Tele-Consultation</h5>
              <p className="text-muted small">Request direct tele-OPD consultation with available district specialists.</p>
              <Button size="sm" variant="outline-danger" className="rounded-pill px-3">Consult Doctor →</Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
