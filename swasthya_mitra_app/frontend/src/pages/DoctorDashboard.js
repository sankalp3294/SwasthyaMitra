import React, { useEffect, useState } from 'react';
import { Container, Card, Table, Button, Badge, Alert, Spinner, Modal, Form, Row, Col, Tab, Nav, ListGroup } from 'react-bootstrap';
import { appointmentAPI, dashboardAPI, patientAPI, ashaAPI } from '../services/api';

const COMMON_MEDICINES = [
  { name: 'Paracetamol 500mg', dosage: '1 tablet', frequency: 'Thrice daily after meals', duration: '5 days' },
  { name: 'Paracetamol 650mg (Dolo)', dosage: '1 tablet', frequency: 'Thrice daily', duration: '3 days' },
  { name: 'Pantoprazole 40mg', dosage: '1 capsule', frequency: 'Once daily before breakfast', duration: '7 days' },
  { name: 'Amoxicillin 500mg', dosage: '1 capsule', frequency: 'Thrice daily', duration: '5 days' },
  { name: 'Azithromycin 500mg', dosage: '1 tablet', frequency: 'Once daily', duration: '3 days' },
  { name: 'Cetirizine 10mg', dosage: '1 tablet', frequency: 'Once daily at bedtime', duration: '5 days' },
  { name: 'Aceclofenac 100mg + Paracetamol 325mg', dosage: '1 tablet', frequency: 'Twice daily after meals', duration: '5 days' },
  { name: 'Amlodipine 5mg', dosage: '1 tablet', frequency: 'Once daily in morning', duration: '30 days' },
  { name: 'Metformin 500mg', dosage: '1 tablet', frequency: 'Twice daily with meals', duration: '30 days' },
  { name: 'Atorvastatin 10mg', dosage: '1 tablet', frequency: 'Once daily at night', duration: '30 days' },
  { name: 'Cough Syrup (Dextromethorphan)', dosage: '10ml', frequency: 'Thrice daily', duration: '5 days' },
  { name: 'Ciprofloxacin 500mg', dosage: '1 tablet', frequency: 'Twice daily', duration: '5 days' },
  { name: 'Metronidazole 400mg', dosage: '1 tablet', frequency: 'Thrice daily', duration: '5 days' },
  { name: 'Montelukast 10mg + Levocetirizine 5mg', dosage: '1 tablet', frequency: 'Once daily at night', duration: '7 days' },
  { name: 'Multivitamin & Minerals', dosage: '1 capsule', frequency: 'Once daily', duration: '15 days' },
  { name: 'ORS (Oral Rehydration Salts)', dosage: '1 sachet in 1L water', frequency: 'Sip as needed', duration: '3 days' },
  { name: 'Ranitidine 150mg', dosage: '1 tablet', frequency: 'Twice daily before meals', duration: '7 days' },
  { name: 'Rabeprazole 20mg', dosage: '1 tablet', frequency: 'Once daily before food', duration: '14 days' },
  { name: 'Ibuprofen 400mg', dosage: '1 tablet', frequency: 'Twice daily after food', duration: '3 days' },
  { name: 'Vitamin C 500mg', dosage: '1 tablet', frequency: 'Once daily', duration: '10 days' },
  { name: 'Zinc Sulfate 20mg', dosage: '1 tablet', frequency: 'Once daily', duration: '14 days' },
  { name: 'Telmisartan 40mg', dosage: '1 tablet', frequency: 'Once daily', duration: '30 days' },
  { name: 'Doxycycline 100mg', dosage: '1 capsule', frequency: 'Twice daily', duration: '7 days' }
];

export default function DoctorDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // No-Show Doctor Decision Modal State
  const [showNoShowModal, setShowNoShowModal] = useState(false);
  const [selectedNoShowAppt, setSelectedNoShowAppt] = useState(null);
  const [dispatchAsha, setDispatchAsha] = useState(true);
  const [selectedAshaId, setSelectedAshaId] = useState('');
  const [ashaInstructions, setAshaInstructions] = useState('');
  const [submittingNoShow, setSubmittingNoShow] = useState(false);
  const [ashaWorkers, setAshaWorkers] = useState([]);

  // Consultation Modal State
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showConsultationModal, setShowConsultationModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Patient Complete Medical File Modal State
  const [showMedicalFileModal, setShowMedicalFileModal] = useState(false);
  const [medicalFileData, setMedicalFileData] = useState(null);
  const [loadingMedicalFile, setLoadingMedicalFile] = useState(false);

  // Lab Test Ordering State (Standalone)
  const [showLabTestModal, setShowLabTestModal] = useState(false);
  const [labTestName, setLabTestName] = useState('');
  const [labTestCategory, setLabTestCategory] = useState('Blood Test');
  const [submittingLabTest, setSubmittingLabTest] = useState(false);

  // Lab Test Results Recording State
  const [selectedLabTest, setSelectedLabTest] = useState(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [testResultSummary, setTestResultSummary] = useState('');
  const [testResultNotes, setTestResultNotes] = useState('');
  const [queueFilter, setQueueFilter] = useState('ALL');
  const [opdSpecialtyFilter, setOpdSpecialtyFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Form State for Consultation
  const [diagnosis, setDiagnosis] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [referral, setReferral] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [medications, setMedications] = useState([
    { name: '', dosage: '', frequency: '', duration: '' }
  ]);
  const [prescribedTests, setPrescribedTests] = useState(['']);

  const loadData = async () => {
    setLoading(true);
    try {
      const [dashRes, workersRes] = await Promise.all([
        dashboardAPI.getMyDoctorDashboard(),
        ashaAPI.getWorkers().catch(() => ({ data: { workers: [] } }))
      ]);
      setData(dashRes.data);
      const workers = workersRes.data?.workers || [];
      setAshaWorkers(workers);
      if (workers.length) setSelectedAshaId(workers[0].id);
    } catch (err) {
      setError(err.response?.data?.detail || 'Unable to load clinical queue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openNoShowModal = (appointment) => {
    setSelectedNoShowAppt(appointment);
    setDispatchAsha(appointment.appointment_status === 'REBOOKED' || (appointment.no_show_count && appointment.no_show_count >= 1));
    setAshaInstructions('Visit patient home to check health, verify reason for missed appointment, and check recovery.');
    if (ashaWorkers.length) setSelectedAshaId(ashaWorkers[0].id);
    setShowNoShowModal(true);
  };

  const [actionSuccess, setActionSuccess] = useState('');

  const handleNoShowSubmit = async (e) => {
    e.preventDefault();
    if (!selectedNoShowAppt) return;
    setSubmittingNoShow(true);
    setError('');
    setActionSuccess('');
    try {
      const res = await appointmentAPI.markNoShow(selectedNoShowAppt.id, {
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
      loadData();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to process no-show decision.');
    } finally {
      setSubmittingNoShow(false);
    }
  };

  const handleUpdate = async (appointment, action) => {
    try {
      if (action === 'confirm') await appointmentAPI.confirmAppointment(appointment.id);
      if (action === 'check-in') await appointmentAPI.checkIn(appointment.id);
      if (action === 'no-show') await appointmentAPI.markNoShow(appointment.id);
      loadData();
    } catch (err) {
      setError(err.response?.data?.detail || 'The appointment could not be updated.');
    }
  };

  // Open Paperless Digital Medical Record File
  const openMedicalFile = async (patientId) => {
    setLoadingMedicalFile(true);
    setShowMedicalFileModal(true);
    try {
      const res = await patientAPI.getMedicalFile(patientId);
      setMedicalFileData(res.data);
    } catch (err) {
      setError('Unable to load patient digital health file.');
    } finally {
      setLoadingMedicalFile(false);
    }
  };

  const openConsultation = (appointment) => {
    setSelectedAppointment(appointment);
    setDiagnosis('');
    setClinicalNotes('');
    setReferral('');
    setFollowUpDate('');
    setMedications([{ name: '', dosage: '', frequency: '', duration: '' }]);
    setPrescribedTests(['']);
    setShowConsultationModal(true);
  };

  const handleAddMedication = (medObj = { name: '', dosage: '', frequency: '', duration: '' }) => {
    setMedications([...medications, medObj]);
  };

  const handleMedicationChange = (index, field, value) => {
    const updated = [...medications];
    updated[index][field] = value;

    // Auto-fill recommended dosage, frequency & duration if name matches an autosuggestion
    if (field === 'name') {
      const match = COMMON_MEDICINES.find(m => m.name.toLowerCase() === value.toLowerCase());
      if (match) {
        updated[index].dosage = match.dosage;
        updated[index].frequency = match.frequency;
        updated[index].duration = match.duration;
      }
    }

    setMedications(updated);
  };

  const handleRemoveMedication = (index) => {
    setMedications(medications.filter((_, i) => i !== index));
  };

  // Prescribed Lab Tests Handlers
  const handleAddPrescribedTest = (testName = '') => {
    setPrescribedTests([...prescribedTests, testName]);
  };

  const handlePrescribedTestChange = (index, value) => {
    const updated = [...prescribedTests];
    updated[index] = value;
    setPrescribedTests(updated);
  };

  const handleRemovePrescribedTest = (index) => {
    setPrescribedTests(prescribedTests.filter((_, i) => i !== index));
  };

  const handleSaveConsultation = async (e) => {
    e.preventDefault();
    if (!diagnosis.trim()) {
      setError('Please enter a clinical diagnosis.');
      return;
    }
    setSubmitting(true);
    setError('');

    const validMedications = medications.filter(m => m.name.trim() !== '');
    const validTests = prescribedTests.filter(t => t.trim() !== '');

    try {
      await appointmentAPI.recordConsultation(selectedAppointment.id, {
        diagnosis: diagnosis.trim(),
        clinical_notes: clinicalNotes.trim(),
        medications: validMedications,
        prescribed_tests: validTests,
        referral: referral.trim(),
        follow_up_date: followUpDate || null
      });

      setShowConsultationModal(false);
      loadData();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to record consultation.');
    } finally {
      setSubmitting(false);
    }
  };

  // Order Standalone Lab Test
  const handleOrderLabTest = async (e) => {
    e.preventDefault();
    if (!labTestName.trim() || !medicalFileData?.patient?.id) return;
    setSubmittingLabTest(true);
    try {
      await patientAPI.createLabTest(medicalFileData.patient.id, {
        patient_id: medicalFileData.patient.id,
        test_name: labTestName.trim(),
        test_category: labTestCategory,
        ordered_by: data?.doctor?.name || 'Dr. Demo Doctor'
      });
      setLabTestName('');
      setShowLabTestModal(false);
      openMedicalFile(medicalFileData.patient.id); // Reload file
    } catch (err) {
      setError('Failed to order lab test.');
    } finally {
      setSubmittingLabTest(false);
    }
  };

  // Record Lab Test Results
  const handleRecordTestResults = async (e) => {
    e.preventDefault();
    if (!selectedLabTest) return;
    try {
      await patientAPI.updateLabTestResult(selectedLabTest.id, {
        result_summary: testResultSummary.trim(),
        result_notes: testResultNotes.trim()
      });
      setShowResultModal(false);
      openMedicalFile(medicalFileData.patient.id); // Reload file
    } catch (err) {
      setError('Failed to update lab test results.');
    }
  };

  if (loading) return <Container className="py-5 text-center"><Spinner animation="border" variant="primary" /></Container>;

  return (
    <Container className="py-4">
      {/* HTML5 Autocomplete Datalist for Medicine Names */}
      <datalist id="medicine-suggestions">
        {COMMON_MEDICINES.map((m, idx) => (
          <option key={idx} value={m.name}>
            {m.dosage} · {m.frequency} ({m.duration})
          </option>
        ))}
      </datalist>

      <div className="page-intro mb-4">
        <span className="eyebrow">CLINICAL OPERATIONS & PAPERLESS EHR</span>
        <h1>Doctor Dashboard & Patient History File</h1>
        <p className="lead text-muted">
          {data?.doctor?.name || 'Dr. Demo Doctor'} ({data?.doctor?.specialization || 'General Medicine'}) · {' '}
          <strong>{data?.pending_count || 0}</strong> active patient visits.
        </p>
      </div>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
      {actionSuccess && <Alert variant="success" dismissible onClose={() => setActionSuccess('')}>{actionSuccess}</Alert>}

      <Card className="app-card shadow-sm border-0 mb-4">
        <Card.Header className="app-card-header py-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
          <h5 className="mb-0 text-white fw-bold d-flex align-items-center gap-2">
            🏥 OPD Patient Queue & Paperless EHR
          </h5>
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <Form.Control
              type="text"
              placeholder="🔍 Search patient ID or diagnosis..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="sm"
              className="rounded-pill px-3 bg-white text-dark border-0"
              style={{ width: '220px' }}
            />
            <div className="btn-group bg-white rounded-pill p-1">
              <Button 
                size="sm" 
                variant={queueFilter === 'ALL' ? 'teal' : 'light'} 
                className={`rounded-pill px-2 py-0 fs-7 ${queueFilter === 'ALL' ? 'bg-success text-white' : 'text-dark'}`}
                onClick={() => setQueueFilter('ALL')}
              >
                All Visits
              </Button>
              <Button 
                size="sm" 
                variant={queueFilter === 'CONFIRMED' ? 'teal' : 'light'} 
                className={`rounded-pill px-2 py-0 fs-7 ${queueFilter === 'CONFIRMED' ? 'bg-success text-white' : 'text-dark'}`}
                onClick={() => setQueueFilter('CONFIRMED')}
              >
                Confirmed
              </Button>
              <Button 
                size="sm" 
                variant={queueFilter === 'MISSED' ? 'teal' : 'light'} 
                className={`rounded-pill px-2 py-0 fs-7 ${queueFilter === 'MISSED' ? 'bg-danger text-white' : 'text-dark'}`}
                onClick={() => setQueueFilter('MISSED')}
              >
                No-Shows
              </Button>
            </div>
          </div>

          {/* 👁️ SPECIALIST OPD DEPARTMENT QUEUE SELECTOR BAR */}
          <div className="bg-light p-2.5 px-3 border-top border-bottom d-flex align-items-center justify-content-between flex-wrap gap-2">
            <span className="fw-bold text-dark fs-7 d-flex align-items-center gap-1.5">
              🏥 Specialist OPD Department Queue:
            </span>
            <div className="d-flex align-items-center gap-1.5 flex-wrap">
              {[
                { id: 'ALL', label: 'All OPD Queues' },
                { id: 'EYE', label: '👁️ Ophthalmology (Eye Care)' },
                { id: 'HEART', label: '🫀 Cardiology (Heart Care)' },
                { id: 'BONE', label: '🦴 Orthopedics (Bone & Joint)' },
                { id: 'SKIN', label: '✨ Dermatology (Skin Care)' },
                { id: 'GENERAL', label: '🩺 General Medicine' },
              ].map((opd) => (
                <Button
                  key={opd.id}
                  size="sm"
                  variant={opdSpecialtyFilter === opd.id ? 'teal' : 'outline-secondary'}
                  className={`rounded-pill px-2.5 py-0.5 fs-8 fw-semibold ${opdSpecialtyFilter === opd.id ? 'bg-teal text-white shadow-sm' : ''}`}
                  onClick={() => setOpdSpecialtyFilter(opd.id)}
                >
                  {opd.label}
                </Button>
              ))}
            </div>
          </div>
        </Card.Header>
        <Card.Body className="p-0">
          <Table responsive hover className="mb-0 align-middle">
            <thead className="bg-body-tertiary">
              <tr>
                <th>Patient Details & Health ID</th>
                <th>Presenting Symptoms & Specialist OPD</th>
                <th>Scheduled Time</th>
                <th>Status</th>
                <th>Actions & EHR</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                const filteredAppts = (data?.appointments || []).filter((a) => {
                  const searchLower = searchTerm.toLowerCase();
                  const matchSearch = 
                    (a.patient_name && a.patient_name.toLowerCase().includes(searchLower)) ||
                    (a.symptoms && a.symptoms.toLowerCase().includes(searchLower)) ||
                    (a.health_id && a.health_id.toLowerCase().includes(searchLower)) ||
                    String(a.patient_id).includes(searchTerm) || 
                    String(a.id).includes(searchTerm);
                  
                  if (!matchSearch) return false;
                  if (queueFilter === 'CONFIRMED' && !(a.appointment_status === 'CONFIRMED' || a.appointment_status === 'ATTENDED')) return false;
                  if (queueFilter === 'MISSED' && !(a.appointment_status?.includes('NO_SHOW') || a.check_in_status === 'NO_SHOW')) return false;

                  // Filter by Specialist OPD Department
                  if (opdSpecialtyFilter === 'EYE' && !a.symptoms?.toLowerCase().includes('eye') && !a.specialty_opd?.includes('Ophthalmology')) return false;
                  if (opdSpecialtyFilter === 'HEART' && !a.symptoms?.toLowerCase().includes('chest') && !a.specialty_opd?.includes('Cardiology')) return false;
                  if (opdSpecialtyFilter === 'BONE' && !a.symptoms?.toLowerCase().includes('joint') && !a.symptoms?.toLowerCase().includes('knee') && !a.specialty_opd?.includes('Orthopedics')) return false;
                  if (opdSpecialtyFilter === 'SKIN' && !a.symptoms?.toLowerCase().includes('skin') && !a.symptoms?.toLowerCase().includes('rash') && !a.specialty_opd?.includes('Dermatology')) return false;

                  return true;
                });

                if (!filteredAppts.length) {
                  return (
                    <tr>
                      <td colSpan="5" className="text-center py-4 text-muted">
                        No patient appointments found matching selected OPD department filter.
                      </td>
                    </tr>
                  );
                }

                return filteredAppts.map((a) => {
                  let consultationInfo = null;
                  try {
                    if (a.notes && a.notes.startsWith('{')) {
                      consultationInfo = JSON.parse(a.notes);
                    }
                  } catch (e) {}

                  const isFastTrack = (a.symptoms && a.symptoms.includes('FAST-TRACK')) || (a.notes && a.notes.includes('FAST-TRACK')) || a.triage_level === 'URGENT';

                  return (
                    <tr key={a.id} className={isFastTrack ? 'table-danger' : ''}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <span className="fw-extrabold text-teal fs-6">{a.patient_name || `Patient #${a.patient_id}`}</span>
                          <Badge bg={isFastTrack ? 'danger' : 'secondary'} className="font-monospace">
                            {a.health_id || `SM-PAT-${String(a.patient_id).padStart(6, '0')}`}
                          </Badge>
                        </div>
                        <div className="text-muted small mt-0.5">
                          {a.patient_age ? `${a.patient_age} yrs` : ''} {a.patient_gender ? `· ${a.patient_gender}` : ''} · Appt #{a.id}
                        </div>
                      </td>
                      <td>
                        <div className="fw-semibold text-main mb-1" style={{ maxWidth: '340px' }}>
                          🩺 {a.symptoms || "High fever and persistent cough for 3 days."}
                        </div>
                        <div className="d-flex align-items-center gap-1 mt-1 flex-wrap">
                          <Badge bg="teal" className="fs-8 px-2 py-1 rounded-pill fw-bold">
                            {a.specialty_opd || '🩺 General Medicine OPD'}
                          </Badge>
                          <Badge bg={isFastTrack ? 'danger' : a.triage_level === 'MODERATE' ? 'warning' : 'info'} className="fs-8">
                            {isFastTrack ? '🚨 FAST-TRACK CRITICAL' : `${a.triage_level || 'MODERATE'} TRIAGE`}
                          </Badge>
                          {consultationInfo?.diagnosis && (
                            <span className="badge bg-success-subtle text-success border border-success fw-normal fs-8">
                              Dx: {consultationInfo.diagnosis}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="fw-semibold">{a.appointment_date}</div>
                        <small className="text-muted">{a.appointment_time}</small>
                      </td>
                      <td>
                        <Badge bg={
                          a.appointment_status === 'COMPLETED' ? 'success' :
                          a.appointment_status === 'ATTENDED' ? 'info' :
                          a.appointment_status.includes('NO_SHOW') ? 'danger' : 'warning'
                        }>
                          {a.appointment_status}
                        </Badge>
                      </td>
                      <td>
                        <div className="d-flex gap-2 flex-wrap mb-1">
                          <Button size="sm" variant="outline-primary" onClick={() => openMedicalFile(a.patient_id)}>
                            📋 View Medical File
                          </Button>
                          <Button size="sm" variant="warning" onClick={() => openNoShowModal(a)}>
                            🚨 Deploy ASHA Worker
                          </Button>
                          {a.appointment_status === 'REQUESTED' && (
                            <Button size="sm" variant="primary" onClick={() => handleUpdate(a, 'confirm')}>
                              Confirm
                            </Button>
                          )}
                          {(a.appointment_status === 'CONFIRMED' || a.appointment_status === 'REQUESTED') && (
                            <>
                              <Button size="sm" variant="outline-success" onClick={() => handleUpdate(a, 'check-in')}>
                                Check-In
                              </Button>
                              <Button size="sm" variant="outline-danger" onClick={() => openNoShowModal(a)}>
                                ❌ Mark No-Show & Decide ASHA Visit
                              </Button>
                            </>
                          )}
                          {(a.appointment_status === 'CONFIRMED' || a.appointment_status === 'ATTENDED' || a.appointment_status === 'COMPLETED') && (
                            <Button size="sm" variant="success" onClick={() => openConsultation(a)}>
                              {a.appointment_status === 'COMPLETED' ? '✏️ Edit Consultation' : '🩺 Perform Consultation'}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* 📋 Complete Digital Medical File Modal (Paperless Record) */}
      <Modal show={showMedicalFileModal} onHide={() => setShowMedicalFileModal(false)} size="xl" backdrop="static">
        <Modal.Header closeButton className="bg-dark text-white">
          <Modal.Title>
            📁 Paperless Health File — Digital Health ID: {' '}
            <span className="text-warning font-monospace">
              {medicalFileData?.patient?.health_id || `SM-PAT-${String(medicalFileData?.patient?.id || 0).padStart(6, '0')}`}
            </span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="py-3">
          {loadingMedicalFile ? (
            <div className="text-center py-5"><Spinner animation="border" /></div>
          ) : medicalFileData ? (
            <div>
              {/* Patient Basic Info Card */}
              <Card className="bg-light border-0 mb-4 shadow-sm">
                <Card.Body>
                  <Row className="g-3">
                    <Col md={3}>
                      <small className="text-muted d-block">Patient Name</small>
                      <strong className="fs-6">{medicalFileData.patient.name}</strong>
                    </Col>
                    <Col md={3}>
                      <small className="text-muted d-block">Digital Health ID</small>
                      <span className="badge bg-primary fs-6 font-monospace">{medicalFileData.patient.health_id}</span>
                    </Col>
                    <Col md={2}>
                      <small className="text-muted d-block">Age / Gender</small>
                      <strong>{medicalFileData.patient.age || 'N/A'} yrs / {medicalFileData.patient.gender || 'N/A'}</strong>
                    </Col>
                    <Col md={2}>
                      <small className="text-muted d-block">Mobile Number</small>
                      <strong>{medicalFileData.patient.phone_number}</strong>
                    </Col>
                    <Col md={2}>
                      <small className="text-muted d-block">Total Visits</small>
                      <Badge bg="success" className="fs-6">{medicalFileData.total_visits} Visits</Badge>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>

              {/* Simulated Tele-ICU Live ECG Waveform Canvas */}
              <div className="ecg-canvas-container mb-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="fw-bold text-emerald d-flex align-items-center gap-2 fs-7">
                    <span className="spinner-grow spinner-grow-sm text-success" role="status"></span>
                    LIVE TELE-ICU ECG VITAL MONITOR — PATIENT ID #{medicalFileData.patient.id}
                  </span>
                  <div className="d-flex gap-3 text-emerald font-monospace fs-7">
                    <span>HR: <strong className="text-white">74 BPM</strong></span>
                    <span>SpO2: <strong className="text-white">98%</strong></span>
                    <span>BP: <strong className="text-white">122/80</strong></span>
                    <span>TEMP: <strong className="text-white">98.4°F</strong></span>
                  </div>
                </div>
                <svg width="100%" height="55" viewBox="0 0 1000 60" preserveAspectRatio="none">
                  <path 
                    className="ecg-line" 
                    d="M 0,30 Q 50,30 100,30 T 150,30 L 160,10 L 170,50 L 180,0 L 190,45 L 200,30 Q 250,30 300,30 T 350,30 L 360,10 L 370,50 L 380,0 L 390,45 L 400,30 Q 450,30 500,30 T 550,30 L 560,10 L 570,50 L 580,0 L 590,45 L 600,30 Q 650,30 700,30 T 750,30 L 760,10 L 770,50 L 780,0 L 790,45 L 800,30 Q 850,30 900,30 T 950,30 L 960,10 L 970,50 L 980,0 L 990,45 L 1000,30" 
                  />
                </svg>
              </div>

              {/* Tabs for Timeline: Consultations, Prescriptions, Lab Tests */}
              <Tab.Container defaultActiveKey="consultations">
                <Nav variant="pills" className="mb-3 gap-2">
                  <Nav.Item>
                    <Nav.Link eventKey="consultations">🩺 Consultation & Prescriptions ({medicalFileData.consultations?.length || 0})</Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="labtests">🧪 Prescribed Diagnostic Tests & Results ({medicalFileData.lab_tests?.length || 0})</Nav.Link>
                  </Nav.Item>
                </Nav>

                <Tab.Content>
                  {/* Tab 1: Consultations History */}
                  <Tab.Pane eventKey="consultations">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 className="fw-bold mb-0">Past Doctor Visits, Diagnoses & Prescriptions Timeline</h6>
                      <small className="text-muted">No physical file needed — complete history saved electronically</small>
                    </div>

                    {medicalFileData.consultations?.length ? (
                      medicalFileData.consultations.map((c, index) => (
                        <Card key={index} className="mb-3 border border-secondary-subtle shadow-sm">
                          <Card.Header className="bg-light d-flex justify-content-between align-items-center py-2">
                            <div>
                              <strong>📅 Visit Date: {c.date} ({c.time})</strong> · <small>{c.hospital_name}</small>
                            </div>
                            <Badge bg={c.status === 'COMPLETED' ? 'success' : 'secondary'}>{c.status}</Badge>
                          </Card.Header>
                          <Card.Body className="py-3">
                            {c.consultation_details ? (
                              <Row className="g-3">
                                <Col md={6}>
                                  <div className="text-danger fw-bold mb-1">Diagnosis: {c.consultation_details.diagnosis}</div>
                                  {c.consultation_details.clinical_notes && (
                                    <div className="text-muted small"><strong>Notes:</strong> {c.consultation_details.clinical_notes}</div>
                                  )}
                                  {c.consultation_details.prescribed_tests?.length > 0 && (
                                    <div className="text-warning-emphasis small mt-1">
                                      <strong>🧪 Prescribed Tests:</strong> {c.consultation_details.prescribed_tests.join(', ')}
                                    </div>
                                  )}
                                  {c.consultation_details.referral && (
                                    <div className="text-primary small mt-1"><strong>🔗 Referral:</strong> {c.consultation_details.referral}</div>
                                  )}
                                  {c.consultation_details.follow_up_date && (
                                    <div className="text-success small mt-1"><strong>📅 Scheduled Follow-Up:</strong> {c.consultation_details.follow_up_date}</div>
                                  )}
                                </Col>
                                <Col md={6}>
                                  <div className="fw-bold mb-1">💊 Prescribed Medicines:</div>
                                  {c.consultation_details.medications?.length ? (
                                    <ListGroup variant="flush" className="border rounded">
                                      {c.consultation_details.medications.map((m, mIdx) => (
                                        <ListGroup.Item key={mIdx} className="py-1 px-2 small">
                                          <strong>{m.name}</strong> · {m.dosage} · {m.frequency} ({m.duration})
                                        </ListGroup.Item>
                                      ))}
                                    </ListGroup>
                                  ) : (
                                    <span className="text-muted small">No medicines prescribed during this visit.</span>
                                  )}
                                </Col>
                              </Row>
                            ) : (
                              <div className="text-muted small">Appointment requested/scheduled — consultation notes pending.</div>
                            )}
                          </Card.Body>
                        </Card>
                      ))
                    ) : (
                      <Alert variant="light">No past consultations recorded for this patient yet.</Alert>
                    )}
                  </Tab.Pane>

                  {/* Tab 2: Lab Tests & Results */}
                  <Tab.Pane eventKey="labtests">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 className="fw-bold mb-0">Lab Test Orders & Diagnostic Results File</h6>
                      <Button variant="primary" size="sm" onClick={() => setShowLabTestModal(true)}>
                        + Order New Lab Test
                      </Button>
                    </div>

                    {medicalFileData.lab_tests?.length ? (
                      <Table responsive hover className="align-middle border">
                        <thead className="bg-light">
                          <tr>
                            <th>Test Name & Category</th>
                            <th>Status</th>
                            <th>Results & Observations</th>
                            <th>Ordered By / Date</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {medicalFileData.lab_tests.map((test) => (
                            <tr key={test.id}>
                              <td>
                                <strong>{test.test_name}</strong>
                                <div><small className="text-muted">{test.test_category}</small></div>
                              </td>
                              <td>
                                <Badge bg={test.status === 'COMPLETED' ? 'success' : 'warning'}>
                                  {test.status}
                                </Badge>
                              </td>
                              <td>
                                {test.result_summary ? (
                                  <div>
                                    <span className="fw-bold text-success">{test.result_summary}</span>
                                    {test.result_notes && <div className="small text-muted">{test.result_notes}</div>}
                                  </div>
                                ) : (
                                  <span className="text-muted small">Test ordered — result pending</span>
                                )}
                              </td>
                              <td>
                                <small>{test.ordered_by || 'Doctor'}</small>
                                <div className="small text-muted">{new Date(test.created_at).toLocaleDateString()}</div>
                              </td>
                              <td>
                                <Button
                                  size="sm"
                                  variant={test.status === 'COMPLETED' ? 'outline-secondary' : 'outline-success'}
                                  onClick={() => {
                                    setSelectedLabTest(test);
                                    setTestResultSummary(test.result_summary || '');
                                    setTestResultNotes(test.result_notes || '');
                                    setShowResultModal(true);
                                  }}
                                >
                                  {test.status === 'COMPLETED' ? '✏️ Edit Results' : '📝 Enter Test Results'}
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    ) : (
                      <Alert variant="light">No lab tests ordered for this patient yet.</Alert>
                    )}
                  </Tab.Pane>
                </Tab.Content>
              </Tab.Container>
            </div>
          ) : null}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowMedicalFileModal(false)}>
            Close Medical File
          </Button>
        </Modal.Footer>
      </Modal>

      {/* 🧪 Order Standalone Lab Test Modal */}
      <Modal show={showLabTestModal} onHide={() => setShowLabTestModal(false)}>
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>Order Diagnostic Lab Test</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleOrderLabTest}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Test Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g. Complete Blood Count (CBC) / Blood Sugar / Chest X-Ray"
                value={labTestName}
                onChange={(e) => setLabTestName(e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Test Category</Form.Label>
              <Form.Select value={labTestCategory} onChange={(e) => setLabTestCategory(e.target.value)}>
                <option value="Blood Test">Blood Test (Haematology / Biochemistry)</option>
                <option value="Imaging / X-Ray">Imaging (X-Ray / Ultrasound / CT)</option>
                <option value="Pathology">Pathology & Microbiology</option>
                <option value="Urine Test">Urine Analysis</option>
                <option value="ECG / Cardiac">ECG / Cardiac</option>
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowLabTestModal(false)}>Cancel</Button>
            <Button variant="primary" type="submit" disabled={submittingLabTest || !labTestName.trim()}>
              Order Test
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* 📝 Record Test Results Modal */}
      <Modal show={showResultModal} onHide={() => setShowResultModal(false)}>
        <Modal.Header closeButton className="bg-success text-white">
          <Modal.Title>Record Lab Test Results: {selectedLabTest?.test_name}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleRecordTestResults}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Result Summary / Values</Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g. Hb: 13.5 g/dL (Normal) | Fasting Glucose: 110 mg/dL"
                value={testResultSummary}
                onChange={(e) => setTestResultSummary(e.target.value)}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Pathologist / Doctor Remarks</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Detailed findings or impression notes..."
                value={testResultNotes}
                onChange={(e) => setTestResultNotes(e.target.value)}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowResultModal(false)}>Cancel</Button>
            <Button variant="success" type="submit" disabled={!testResultSummary.trim()}>
              Save Test Results
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* 🩺 Doctor Consultation Modal */}
      <Modal show={showConsultationModal} onHide={() => setShowConsultationModal(false)} size="lg" backdrop="static">
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>
            🩺 Patient Consultation — Appointment #{selectedAppointment?.id}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSaveConsultation}>
          <Modal.Body className="py-4">
            <div className="alert alert-info py-2 mb-3">
              <strong>Digital Health ID:</strong> SM-PAT-{String(selectedAppointment?.patient_id || 0).padStart(6, '0')} | {' '}
              <strong>Patient ID:</strong> #{selectedAppointment?.patient_id} | {' '}
              <strong>Case ID:</strong> #{selectedAppointment?.case_id}
            </div>

            {/* 1. Clinical Diagnosis */}
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">1. Clinical Diagnosis <span className="text-danger">*</span></Form.Label>
              <Form.Control
                type="text"
                placeholder="e.g. Acute Upper Respiratory Infection / Viral Fever / Dengue"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                required
              />
            </Form.Group>

            {/* 2. Clinical Notes */}
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">2. Doctor's Clinical Notes & Symptoms Observed</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Record patient complaints, vital signs, physical examination notes..."
                value={clinicalNotes}
                onChange={(e) => setClinicalNotes(e.target.value)}
              />
            </Form.Group>

            {/* 3. Medication Allocation / Prescription with Autocomplete Suggestions */}
            <div className="mb-4">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <label className="fw-bold mb-0">
                  3. Medication Allocation & Prescriptions 💊
                  <small className="text-muted fw-normal ms-2">(Start typing e.g. "P" or "A" for smart autosuggestions)</small>
                </label>
                <Button variant="outline-primary" size="sm" onClick={() => handleAddMedication()}>
                  + Add Medicine
                </Button>
              </div>

              {/* Quick Preset Medicine Buttons */}
              <div className="d-flex gap-1 flex-wrap mb-2">
                <span className="small text-muted align-self-center me-1">Quick Add:</span>
                {COMMON_MEDICINES.slice(0, 6).map((m, idx) => (
                  <Button
                    key={idx}
                    variant="outline-secondary"
                    size="sm"
                    className="py-0 px-2 small"
                    onClick={() => handleAddMedication({ name: m.name, dosage: m.dosage, frequency: m.frequency, duration: m.duration })}
                  >
                    + {m.name.split(' ')[0]}
                  </Button>
                ))}
              </div>

              {medications.map((med, idx) => (
                <Row key={idx} className="g-2 mb-2 align-items-center bg-light p-2 rounded border">
                  <Col md={4}>
                    <Form.Control
                      type="text"
                      list="medicine-suggestions"
                      placeholder="Type medicine name (e.g. Paracetamol)..."
                      value={med.name}
                      onChange={(e) => handleMedicationChange(idx, 'name', e.target.value)}
                      size="sm"
                      autoComplete="off"
                    />
                  </Col>
                  <Col md={2}>
                    <Form.Control
                      placeholder="Dosage (1 tab)"
                      value={med.dosage}
                      onChange={(e) => handleMedicationChange(idx, 'dosage', e.target.value)}
                      size="sm"
                    />
                  </Col>
                  <Col md={3}>
                    <Form.Control
                      placeholder="Frequency (Twice daily)"
                      value={med.frequency}
                      onChange={(e) => handleMedicationChange(idx, 'frequency', e.target.value)}
                      size="sm"
                    />
                  </Col>
                  <Col md={2}>
                    <Form.Control
                      placeholder="Duration (5 days)"
                      value={med.duration}
                      onChange={(e) => handleMedicationChange(idx, 'duration', e.target.value)}
                      size="sm"
                    />
                  </Col>
                  <Col md={1} className="text-center">
                    {medications.length > 1 && (
                      <Button variant="outline-danger" size="sm" onClick={() => handleRemoveMedication(idx)}>
                        ✕
                      </Button>
                    )}
                  </Col>
                </Row>
              ))}
            </div>

            {/* 4. Diagnostic Tests Prescribed Block 🧪 */}
            <div className="mb-4">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <label className="fw-bold mb-0">4. Diagnostic Tests Prescribed 🧪</label>
                <div className="d-flex gap-1">
                  <Button variant="outline-secondary" size="sm" onClick={() => handleAddPrescribedTest('Complete Blood Count (CBC)')}>+ CBC</Button>
                  <Button variant="outline-secondary" size="sm" onClick={() => handleAddPrescribedTest('Fasting Blood Glucose')}>+ Blood Sugar</Button>
                  <Button variant="outline-secondary" size="sm" onClick={() => handleAddPrescribedTest('Chest X-Ray (PA View)')}>+ X-Ray</Button>
                  <Button variant="outline-secondary" size="sm" onClick={() => handleAddPrescribedTest('Urine Routine & Microscopy')}>+ Urine Test</Button>
                  <Button variant="outline-primary" size="sm" onClick={() => handleAddPrescribedTest('')}>+ Custom Test</Button>
                </div>
              </div>

              {prescribedTests.map((test, idx) => (
                <Row key={idx} className="g-2 mb-2 align-items-center bg-light p-2 rounded">
                  <Col md={11}>
                    <Form.Control
                      placeholder="Enter prescribed lab/imaging test name (e.g. Complete Blood Count / Typhoid Widal Test)"
                      value={test}
                      onChange={(e) => handlePrescribedTestChange(idx, e.target.value)}
                      size="sm"
                    />
                  </Col>
                  <Col md={1} className="text-center">
                    {prescribedTests.length > 1 && (
                      <Button variant="outline-danger" size="sm" onClick={() => handleRemovePrescribedTest(idx)}>
                        ✕
                      </Button>
                    )}
                  </Col>
                </Row>
              ))}
            </div>

            {/* 5. Referral & Follow-up */}
            <Row className="g-3 mb-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-bold">5. Specialist / Hospital Referral 🔗</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="e.g. Refer to District Hospital Surgery Dept"
                    value={referral}
                    onChange={(e) => setReferral(e.target.value)}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-bold">6. Next Follow-Up Date 📅</Form.Label>
                  <Form.Control
                    type="date"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                  />
                </Form.Group>
              </Col>
            </Row>

          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowConsultationModal(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button variant="success" type="submit" disabled={submitting || !diagnosis.trim()}>
              {submitting ? <Spinner size="sm" className="me-2" /> : null}
              ✅ Save & Complete Consultation
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* ❌ Doctor Decision Modal for No-Show & ASHA Worker Selection */}
      <Modal show={showNoShowModal} onHide={() => setShowNoShowModal(false)} backdrop="static" size="lg">
        <Modal.Header closeButton className="bg-danger text-white">
          <Modal.Title>❌ Mark No-Show & Assign ASHA Field Worker</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleNoShowSubmit}>
          <Modal.Body className="py-3">
            <Alert variant="warning" className="py-2 mb-3 small">
              <strong>Patient Ref:</strong> #{selectedNoShowAppt?.patient_id} | {' '}
              <strong>Attempt Status:</strong> {selectedNoShowAppt?.appointment_status === 'REBOOKED' ? '2nd Rebooked Attempt' : 'Initial Visit'}
            </Alert>

            <Form.Group className="mb-3 border p-3 rounded bg-light">
              <Form.Check
                type="checkbox"
                id="dispatch-asha-dash-check"
                label={
                  <strong className="text-dark">
                    🚨 Assign ASHA Field Worker to Visit Patient at Home
                  </strong>
                }
                checked={dispatchAsha}
                onChange={(e) => setDispatchAsha(e.target.checked)}
              />
              <small className="text-muted d-block mt-1 ms-4">
                Check this option if you want an ASHA field worker to conduct a home visit, check vitals, and verify why the patient missed their appointment. Uncheck if no ASHA visit is needed.
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
            <Button variant="danger" type="submit" disabled={submittingNoShow}>
              {submittingNoShow ? <Spinner size="sm" className="me-2" /> : null}
              Save No-Show & Assign ASHA Worker
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
}
