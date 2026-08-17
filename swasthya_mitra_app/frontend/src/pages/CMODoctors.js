import React, { useState, useEffect } from 'react';
import { Container, Card, Badge, Alert, Spinner, Table, Button, Modal } from 'react-bootstrap';
import { dashboardAPI } from '../services/api';

export default function CMODoctors() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Doctor Patients List Modal
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [showDoctorModal, setShowDoctorModal] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const response = await dashboardAPI.getChiefDoctorDashboard();
      setDashboard(response.data);
    } catch (err) {
      setError('Failed to load CMO doctors directory.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openDoctorPatients = (doc) => {
    setSelectedDoctor(doc);
    setShowDoctorModal(true);
  };

  if (loading) return <Container className="text-center py-5"><Spinner animation="border" variant="primary" /></Container>;

  return (
    <Container className="py-4">
      <div className="page-intro mb-4">
        <span className="eyebrow">DISTRICT MEDICAL ROSTER & CLINICAL LOAD</span>
        <h1>District Doctors — Treating & Treated Patients Directory</h1>
        <p className="lead text-muted">
          Monitor medical staff registration, clinical load distribution, and inspect patient rosters per doctor.
        </p>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {dashboard && (
        <>
          {/* 👨‍⚕️ District Doctors Performance Table */}
          <Card className="shadow-sm border-0 mb-4">
            <Card.Header className="bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
              <h5 className="mb-0 text-primary fw-bold">👨‍⚕️ District Medical Staff Clinical Directory ({dashboard.doctor_stats?.length || 0})</h5>
              <small className="text-muted">Live Doctor Performance & Patient Load</small>
            </Card.Header>
            <Card.Body className="p-0">
              <Table responsive hover className="mb-0 align-middle">
                <thead className="bg-light">
                  <tr>
                    <th>Doctor Name & Reg #</th>
                    <th>Hospital & Department</th>
                    <th>Specialization</th>
                    <th>🟢 Treated & Discharged</th>
                    <th>🟡 Currently In Treatment</th>
                    <th>Total Handled</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.doctor_stats?.length ? (
                    dashboard.doctor_stats.map((doc) => (
                      <tr key={doc.id}>
                        <td>
                          <div className="fw-bold fs-6">{doc.name}</div>
                          <small className="text-muted">{doc.qualification} · Reg: {doc.registration_number || 'N/A'}</small>
                        </td>
                        <td>
                          <div className="fw-bold">{doc.hospital_name}</div>
                          <small className="text-muted">{doc.department_name}</small>
                        </td>
                        <td>
                          <Badge bg="info">{doc.specialization}</Badge>
                        </td>
                        <td>
                          <span className="badge bg-success-subtle text-success border border-success fs-6">
                            🟢 {doc.treated_count} Treated
                          </span>
                        </td>
                        <td>
                          <span className="badge bg-warning-subtle text-dark border border-warning fs-6">
                            🟡 {doc.in_treatment_count} In Treatment
                          </span>
                        </td>
                        <td>
                          <strong className="fs-6">{doc.total_handled}</strong> visits
                        </td>
                        <td>
                          <Button size="sm" variant="outline-primary" onClick={() => openDoctorPatients(doc)}>
                            📋 View Patient Roster ({doc.patients?.length || 0})
                          </Button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center py-4 text-muted">
                        No doctors registered in the district system.
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>

          {/* 📋 Doctor Patient List Modal for CMO */}
          <Modal show={showDoctorModal} onHide={() => setShowDoctorModal(false)} size="lg" backdrop="static">
            <Modal.Header closeButton className="bg-dark text-white">
              <Modal.Title>
                🩺 Patient Case Roster — {selectedDoctor?.name} ({selectedDoctor?.hospital_name})
              </Modal.Title>
            </Modal.Header>
            <Modal.Body className="py-3">
              <div className="alert alert-info py-2 mb-3">
                <strong>Doctor:</strong> {selectedDoctor?.name} | {' '}
                <strong>Department:</strong> {selectedDoctor?.department_name} | {' '}
                <strong>Treated:</strong> {selectedDoctor?.treated_count} | {' '}
                <strong>In Treatment:</strong> {selectedDoctor?.in_treatment_count}
              </div>

              {selectedDoctor?.patients?.length ? (
                <Table responsive hover className="align-middle border">
                  <thead className="bg-light">
                    <tr>
                      <th>Patient & Digital Health ID</th>
                      <th>Visit Date</th>
                      <th>Clinical Treatment Status</th>
                      <th>Diagnosis / Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedDoctor.patients.map((p, pIdx) => {
                      let diag = null;
                      try {
                        if (p.notes && p.notes.startsWith('{')) {
                          diag = JSON.parse(p.notes);
                        }
                      } catch (e) {}

                      return (
                        <tr key={pIdx}>
                          <td>
                            <div className="fw-bold">{p.patient_name}</div>
                            <span className="badge bg-secondary font-monospace">{p.health_id}</span>
                          </td>
                          <td>{p.appointment_date}</td>
                          <td>
                            <Badge bg={
                              p.status === 'COMPLETED' ? 'success' :
                              p.status === 'ATTENDED' ? 'info' : 'warning'
                            }>
                              {p.status === 'COMPLETED' ? '🟢 TREATED & DISCHARGED' : `🟡 IN TREATMENT (${p.status})`}
                            </Badge>
                          </td>
                          <td>
                            {diag?.diagnosis ? (
                              <div>
                                <strong className="text-success d-block">Diagnosis: {diag.diagnosis}</strong>
                                {diag.medications?.length > 0 && (
                                  <small className="text-muted">💊 Medicines: {diag.medications.map(m => m.name).join(', ')}</small>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted small">Consultation pending / Scheduled visit</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              ) : (
                <Alert variant="light">No patients assigned to this doctor yet.</Alert>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowDoctorModal(false)}>
                Close Doctor Roster
              </Button>
            </Modal.Footer>
          </Modal>
        </>
      )}
    </Container>
  );
}
