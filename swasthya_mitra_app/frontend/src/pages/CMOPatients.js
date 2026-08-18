import React, { useState, useEffect } from 'react';
import { Container, Card, Badge, Alert, Spinner, Table, ProgressBar, Row, Col, Button, Modal } from 'react-bootstrap';
import { dashboardAPI, patientAPI } from '../services/api';

export default function CMOPatients() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Patient Search & EHR Viewer State
  const [medicalFile, setMedicalFile] = useState(null);
  const [showFileModal, setShowFileModal] = useState(false);
  const [loadingFile, setLoadingFile] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const response = await dashboardAPI.getChiefDoctorDashboard();
      setDashboard(response.data);
    } catch (err) {
      setError('Failed to load CMO patient load statistics.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenMedicalFile = async (patientId) => {
    setSelectedPatientId(patientId);
    setLoadingFile(true);
    setShowFileModal(true);
    try {
      const res = await patientAPI.getMedicalFile(patientId);
      setMedicalFile(res.data);
    } catch (err) {
      setError('Failed to fetch patient digital health record.');
    } finally {
      setLoadingFile(false);
    }
  };

  if (loading) return <Container className="text-center py-5"><Spinner animation="border" variant="primary" /></Container>;

  return (
    <Container className="py-4">
      <div className="page-intro mb-4">
        <span className="eyebrow">DISTRICT PATIENT ANALYTICS & HOSPITAL CAPACITY</span>
        <h1>District Patients Load & Hospital Attendance</h1>
        <p className="lead text-muted">
          Comprehensive statistics on patients visited, treated & discharged, and currently under care across district healthcare facilities.
        </p>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {dashboard && (
        <>
          {/* Top District Patient Metrics */}
          <Row className="g-3 mb-4">
            <Col md={4}>
              <Card className="border-0 shadow-sm bg-primary text-white text-center py-3">
                <Card.Body>
                  <span className="fs-6 text-white-50 d-block mb-1">🏥 Total Patients Visited</span>
                  <h2 className="display-5 fw-bold mb-0">{dashboard.total_patients_visited || 0}</h2>
                  <small className="text-white-50">Across All District PHCs & Hospitals</small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="border-0 shadow-sm bg-success text-white text-center py-3">
                <Card.Body>
                  <span className="fs-6 text-white-50 d-block mb-1">🟢 Patients Treated & Discharged</span>
                  <h2 className="display-5 fw-bold mb-0">{dashboard.total_patients_treated || 0}</h2>
                  <small className="text-white-50">Completed Consultations & Care</small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="border-0 shadow-sm bg-warning text-dark text-center py-3">
                <Card.Body>
                  <span className="fs-6 text-dark-50 d-block mb-1">🟡 Currently In Treatment</span>
                  <h2 className="display-5 fw-bold mb-0">{dashboard.total_patients_in_treatment || 0}</h2>
                  <small className="text-dark-50">Active OPD / Follow-Up Patients</small>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Hospital-wise Patient Breakdown Table */}
          <Card className="shadow-sm border-0 mb-4">
            <Card.Header className="bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
              <h5 className="mb-0 text-primary fw-bold">📊 Hospital-wise Patient Attendance & Care Progress</h5>
              <small className="text-muted">Live Facility Capacity Breakdown</small>
            </Card.Header>
            <Card.Body className="p-0">
              <Table responsive hover className="mb-0 align-middle">
                <thead className="bg-light">
                  <tr>
                    <th>Facility Name & Zone</th>
                    <th>Facility Type</th>
                    <th>Total Visited</th>
                    <th>Treated & Discharged</th>
                    <th>Currently In Treatment</th>
                    <th>Treatment Completion Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.hospital_stats?.length ? (
                    dashboard.hospital_stats.map((hosp) => {
                      const rate = hosp.total_visited > 0 
                        ? Math.round((hosp.total_treated / hosp.total_visited) * 100) 
                        : 0;

                      return (
                        <tr key={hosp.id}>
                          <td>
                            <div className="fw-bold">{hosp.name}</div>
                            <small className="text-muted">Zone: {hosp.zone}</small>
                          </td>
                          <td>
                            <Badge bg="secondary">{hosp.type}</Badge>
                          </td>
                          <td>
                            <strong className="fs-6">{hosp.total_visited}</strong> patients
                          </td>
                          <td>
                            <span className="badge bg-success-subtle text-success border border-success fs-6">
                              🟢 {hosp.total_treated} Treated
                            </span>
                          </td>
                          <td>
                            <span className="badge bg-warning-subtle text-dark border border-warning fs-6">
                              🟡 {hosp.in_treatment} In Care
                            </span>
                          </td>
                          <td style={{ width: '220px' }}>
                            <div className="d-flex align-items-center gap-2">
                              <ProgressBar 
                                now={rate} 
                                variant={rate >= 70 ? 'success' : rate >= 40 ? 'warning' : 'info'} 
                                className="flex-grow-1" 
                                style={{ height: '8px' }}
                              />
                              <span className="fw-bold small">{rate}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center py-4 text-muted">
                        No hospital statistics recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </Card.Body>
          </Card>

          {/* Digital EHR Lookup Modal */}
          <Modal show={showFileModal} onHide={() => setShowFileModal(false)} size="lg" backdrop="static">
            <Modal.Header closeButton className="bg-primary text-white">
              <Modal.Title>📋 Digital EHR Medical File — {medicalFile?.patient?.name}</Modal.Title>
            </Modal.Header>
            <Modal.Body className="py-3">
              {loadingFile ? (
                <div className="text-center py-5"><Spinner animation="border" /></div>
              ) : medicalFile ? (
                <div>
                  <div className="alert alert-info py-2 mb-3">
                    <strong>Health ID:</strong> {medicalFile.patient?.health_id} | {' '}
                    <strong>Age:</strong> {medicalFile.patient?.age || 'N/A'} | {' '}
                    <strong>Gender:</strong> {medicalFile.patient?.gender || 'N/A'} | {' '}
                    <strong>Phone:</strong> {medicalFile.patient?.phone}
                  </div>
                  <h6 className="fw-bold text-primary">Consultation History ({medicalFile.consultations?.length || 0})</h6>
                  {medicalFile.consultations?.map((c, idx) => (
                    <Card key={idx} className="mb-2 border-0 bg-light">
                      <Card.Body className="py-2">
                        <div className="fw-bold">{c.diagnosis}</div>
                        <small className="text-muted">Doctor: {c.doctor_name} · Date: {c.appointment_date}</small>
                      </Card.Body>
                    </Card>
                  ))}
                </div>
              ) : (
                <div>No records found</div>
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowFileModal(false)}>Close EHR</Button>
            </Modal.Footer>
          </Modal>
        </>
      )}
    </Container>
  );
}
