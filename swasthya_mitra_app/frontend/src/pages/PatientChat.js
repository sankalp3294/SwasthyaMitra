import React, { useEffect, useState } from 'react';
import { Container, Card, Form, Button, Alert, Spinner, Row, Col, Badge } from 'react-bootstrap';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  FaMicrophone, FaPaperPlane, FaRobot, FaUser, FaHospital, 
  FaCalendarCheck, FaExclamationTriangle, FaVolumeUp, FaSparkles
} from 'react-icons/fa';
import { appointmentAPI, caseAPI, hospitalAPI } from '../services/api';
import { useAuthStore } from '../store/store';

export default function PatientChat() {
  const patientId = useAuthStore((state) => state.patientId);
  const location = useLocation();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState(location.state?.prefill || '');
  const [loading, setLoading] = useState(false);
  const [caseCreated, setCaseCreated] = useState(null);
  const [currentStep, setCurrentStep] = useState('chat');

  // Voice Assistant Simulation State
  const [isListening, setIsListening] = useState(false);

  const presetSymptoms = [
    "🔥 Sudden high fever and body chills since last night",
    "🫁 Chest tightness and shortness of breath when climbing stairs",
    "🤕 Severe throbbing migraine with light sensitivity",
    "🤢 Acute stomach ache and nausea after eating dinner",
    "🩺 General weakness and routine annual preventive checkup request"
  ];

  const handleSendMessage = async (customText) => {
    const symptomText = (typeof customText === 'string' ? customText : input).trim();
    if (!symptomText) return;

    setMessages((prev) => [...prev, { role: 'user', content: symptomText }]);
    setInput('');
    setLoading(true);

    try {
      const caseResponse = await caseAPI.createCase({
        patient_id: patientId,
        presenting_complaint: symptomText,
        symptoms: symptomText
      });
      setCaseCreated(caseResponse.data);

      const triageResponse = await caseAPI.triageCase(caseResponse.data.id, symptomText);
      
      setMessages((prev) => [
        ...prev, 
        { 
          role: 'assistant', 
          content: `${triageResponse.data.reasoning}. ${triageResponse.data.recommendations?.[0] || ''}`, 
          triage: triageResponse.data.triage_level 
        }
      ]);
      setCurrentStep('triage');
    } catch {
      setMessages((prev) => [
        ...prev, 
        { role: 'assistant', content: 'We could not complete the clinical triage right now. Please try again or contact your nearest health center.' }
      ]);
    } finally { 
      setLoading(false); 
    }
  };

  const toggleVoiceListening = () => {
    if (!isListening) {
      setIsListening(true);
      const sampleVoices = [
        "I have had a high fever, dry cough, and mild shivering since yesterday afternoon.",
        "I feel sharp chest pressure whenever I take a deep breath.",
        "I have a stomach ache with nausea and weakness."
      ];
      const randomSample = sampleVoices[Math.floor(Math.random() * sampleVoices.length)];
      setTimeout(() => {
        setInput(randomSample);
        setIsListening(false);
      }, 2200);
    } else {
      setIsListening(false);
    }
  };

  return (
    <Container className="py-4 fade-slide-up">
      <Row>
        <Col lg={9} className="mx-auto">
          {/* Header Intro */}
          <div className="page-intro mb-3 text-center">
            <span className="eyebrow">AI CLINICAL ASSISTANT & TRIAGE</span>
            <h1 className="fw-extrabold mb-1" style={{ color: 'var(--text-heading)' }}>
              How can SwasthyaMitra help you today? 🩺
            </h1>
            <p className="text-muted" style={{ fontSize: '0.95rem' }}>
              Describe your health concerns in plain voice or text. Our AI triages severity and arranges hospital consultations.
            </p>
          </div>

          <Alert variant="danger" className="border-0 shadow-sm rounded-4 mb-4 d-flex align-items-center gap-3">
            <FaExclamationTriangle size={24} className="flex-shrink-0" />
            <div>
              <strong>Medical Emergency Notice:</strong> If you are experiencing severe chest pain, extreme breathlessness, sudden numbness, or heavy bleeding, call 108 or go to the emergency room immediately.
            </div>
          </Alert>

          <Card className="app-card">
            <Card.Header className="app-card-header d-flex justify-content-between align-items-center">
              <span className="d-flex align-items-center gap-2">
                <FaRobot className="text-warning" /> AI Symptom Checker & Triage Engine
              </span>
              <Badge bg="light" text="teal" className="fw-bold px-3 py-2 rounded-pill">
                Active Session #{(patientId || 101).toString().slice(-4)}
              </Badge>
            </Card.Header>

            <Card.Body className="p-4">
              {/* Preset Quick Symptoms Chips */}
              <div className="mb-3">
                <small className="text-muted fw-bold d-block mb-2">💡 Quick Preset Symptom Prompts:</small>
                <div className="d-flex flex-wrap gap-2">
                  {presetSymptoms.map((chip, idx) => (
                    <button 
                      key={idx} 
                      className="symptom-chip"
                      disabled={loading}
                      onClick={() => handleSendMessage(chip.replace(/^[^\s]+\s/, ''))}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat Message Window */}
              <div className="chat-messages mb-4" aria-live="polite">
                {messages.length === 0 ? (
                  <div className="text-center py-5 text-muted">
                    <FaRobot size={48} className="text-teal mb-3 opacity-50" />
                    <p className="fw-semibold mb-1">Your AI Health Assistant is ready.</p>
                    <small>Type or tap the mic button below to state your symptoms.</small>
                  </div>
                ) : (
                  messages.map((message, index) => (
                    <div key={index} className={`message-row ${message.role}`}>
                      <div className="message-bubble">
                        <div className="d-flex align-items-center gap-2 mb-1 fw-bold fs-7">
                          {message.role === 'user' ? <><FaUser /> You</> : <><FaRobot className="text-teal" /> AI Health Assistant</>}
                        </div>
                        {message.content}
                        {message.triage && (
                          <div className="mt-2 pt-2 border-top border-secondary-subtle d-flex align-items-center justify-content-between">
                            <span className="small text-muted fw-bold">Triage Assessment:</span>
                            <Badge 
                              bg={message.triage === 'URGENT' ? 'danger' : message.triage === 'MODERATE' ? 'warning' : 'success'}
                              className="px-3 py-2 rounded-pill fs-7"
                            >
                              Priority Level: {message.triage}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
                {loading && (
                  <div className="text-center py-3">
                    <Spinner animation="grow" size="sm" variant="teal" className="me-2" />
                    <small className="text-teal fw-bold">Analyzing clinical symptoms...</small>
                  </div>
                )}
              </div>

              {/* Voice Listening Soundwave Visualizer Bar */}
              {isListening && (
                <div className="mb-3 p-3 rounded-4 bg-teal-subtle d-flex align-items-center justify-content-between fade-slide-up">
                  <div className="d-flex align-items-center gap-3">
                    <FaMicrophone className="text-danger animate-pulse" size={20} />
                    <span className="fw-bold text-teal small">Listening to your voice dictation...</span>
                  </div>
                  <div className="voice-visualizer">
                    <div className="sound-bar"></div>
                    <div className="sound-bar"></div>
                    <div className="sound-bar"></div>
                    <div className="sound-bar"></div>
                    <div className="sound-bar"></div>
                  </div>
                </div>
              )}

              {/* Input Control Form */}
              {currentStep === 'chat' && (
                <Form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}>
                  <Form.Group className="mb-3 position-relative">
                    <Form.Control
                      as="textarea"
                      rows={3}
                      placeholder="Describe symptoms in detail (e.g. onset, severity, location, associated fever or nausea)..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      disabled={loading || isListening}
                      className="rounded-4 p-3 border-2"
                      style={{ fontSize: '0.95rem' }}
                    />
                  </Form.Group>

                  <div className="d-flex justify-content-between align-items-center">
                    <Button 
                      type="button" 
                      variant={isListening ? 'danger' : 'outline-teal'}
                      className="rounded-pill px-3 py-2 fw-semibold d-flex align-items-center gap-2"
                      onClick={toggleVoiceListening}
                      disabled={loading}
                    >
                      <FaMicrophone /> {isListening ? 'Stop Listening' : 'Voice Input'}
                    </Button>

                    <Button 
                      type="submit" 
                      className="primary-action d-flex align-items-center gap-2"
                      disabled={loading || !input.trim()}
                    >
                      {loading ? <Spinner size="sm" /> : <FaPaperPlane />} Assess Symptoms
                    </Button>
                  </div>
                </Form>
              )}

              {/* Triage Recommendation Action Step */}
              {currentStep === 'triage' && (
                <div className="next-step text-center p-4 rounded-4 bg-teal-subtle border border-teal fade-slide-up">
                  <h5 className="fw-bold text-teal mb-2">Care Recommendation Ready! 🏥</h5>
                  <p className="text-muted mb-3">Our AI recommends scheduling a specialist consultation to verify symptoms.</p>
                  <div className="d-flex justify-content-center gap-2">
                    <Button className="primary-action" onClick={() => setCurrentStep('hospitals')}>
                      Find Nearby Hospital & Book Appointment
                    </Button>
                    <Button variant="outline-secondary" className="rounded-3" onClick={() => setCurrentStep('chat')}>
                      Ask Follow-up Symptom
                    </Button>
                  </div>
                </div>
              )}

              {/* Hospital Slot Booking Selector Component */}
              {currentStep === 'hospitals' && (
                <HospitalSelector caseId={caseCreated?.id} patientId={patientId} />
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

function HospitalSelector({ caseId, patientId }) {
  const [hospitals, setHospitals] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    hospitalAPI.listHospitals()
      .then((res) => setHospitals(res.data))
      .catch(() => setMessage('Hospitals list could not be loaded.'))
      .finally(() => setLoading(false));
  }, []);

  const chooseHospital = async (hospital) => {
    setSelectedHospital(hospital);
    setMessage('');
    setSlots([]);
    setLoading(true);
    try {
      const res = await hospitalAPI.getSlots(hospital.id);
      setSlots(res.data.slots || []);
    } catch {
      setMessage('Available appointment slots could not be loaded.');
    } finally {
      setLoading(false);
    }
  };

  const bookSlot = async (slot) => {
    setBooking(true);
    setMessage('');
    try {
      await appointmentAPI.createAppointment({
        case_id: caseId,
        patient_id: Number(patientId),
        hospital_id: selectedHospital.id,
        slot_id: slot.id
      });
      setMessage(`🎉 Appointment successfully requested for ${slot.date} at ${slot.start_time}! Check "My Dashboard" for live status updates.`);
      setSlots((prev) => prev.filter((item) => item.id !== slot.id));
    } catch (err) {
      setMessage(err.response?.data?.detail || 'Booking failed. Please pick another slot.');
    } finally {
      setBooking(false);
    }
  };

  if (loading && !selectedHospital) return <div className="text-center py-4"><Spinner variant="teal" /></div>;

  return (
    <div className="booking-panel mt-3 fade-slide-up">
      <h5 className="fw-bold mb-3 d-flex align-items-center gap-2">
        <FaHospital className="text-teal" /> Choose District Hospital & Slot
      </h5>

      {message && (
        <Alert variant={message.includes('successfully') ? 'success' : 'danger'} className="rounded-3 shadow-sm">
          {message}
        </Alert>
      )}

      <Row className="g-3">
        {hospitals.map((hosp) => (
          <Col md={6} key={hosp.id}>
            <Card className={`hospital-card p-3 ${selectedHospital?.id === hosp.id ? 'selected' : ''}`}>
              <Card.Body className="p-2">
                <h6 className="fw-bold mb-1">{hosp.name}</h6>
                <p className="text-muted small mb-3">{hosp.address}</p>
                <Button 
                  variant={selectedHospital?.id === hosp.id ? 'teal' : 'outline-teal'} 
                  size="sm" 
                  className="w-100 rounded-pill fw-bold"
                  onClick={() => chooseHospital(hosp)}
                >
                  {selectedHospital?.id === hosp.id ? 'Selected Hospital ✓' : 'View Available Slots'}
                </Button>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>

      {selectedHospital && (
        <div className="mt-4 p-4 rounded-4 bg-body-tertiary border fade-slide-up">
          <h6 className="fw-bold mb-3 text-teal">
            Available OPD Slots at {selectedHospital.name}:
          </h6>
          {loading ? (
            <Spinner size="sm" variant="teal" />
          ) : slots.length ? (
            <div className="slot-list d-flex flex-wrap gap-2">
              {slots.map((slot) => (
                <Button
                  key={slot.id}
                  variant="light"
                  className="slot-button p-3 rounded-3 border text-start"
                  disabled={booking}
                  onClick={() => bookSlot(slot)}
                >
                  <small className="text-muted d-block">{slot.date}</small>
                  <strong className="fs-6 text-teal">{slot.start_time}</strong>
                  <small className="d-block text-success fw-semibold">{slot.available_count} spaces open</small>
                </Button>
              ))}
            </div>
          ) : (
            <p className="text-muted small">No appointment slots currently open for this hospital.</p>
          )}
        </div>
      )}
    </div>
  );
}
