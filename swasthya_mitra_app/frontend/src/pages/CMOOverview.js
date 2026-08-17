import React, { useState, useEffect } from 'react';
import { Container, Card, ListGroup, Badge, Alert, Spinner, Row, Col, ProgressBar, Button, Modal, Form } from 'react-bootstrap';
import { dashboardAPI, analyticsAPI } from '../services/api';

export default function CMOOverview() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Selected Zone for Interactive Map Detail
  const [selectedZone, setSelectedZone] = useState(null);

  // CMO New Emergency Action Modal State
  const [showInterventionModal, setShowInterventionModal] = useState(false);
  const [submittingAction, setSubmittingAction] = useState(false);
  const [actionZone, setActionZone] = useState('Swasthya Nagar');
  const [actionType, setActionType] = useState('Mobile Medical Unit & Emergency Doctor Camp Deployment');
  const [actionNotes, setActionNotes] = useState('');

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const response = await dashboardAPI.getChiefDoctorDashboard();
      setDashboard(response.data);
      if (response.data.zone_analytics?.length) {
        setSelectedZone(response.data.zone_analytics[0]);
      }
    } catch (err) {
      setError('Failed to load CMO overview analytics.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthorizeIntervention = async (interventionId, decision) => {
    try {
      setError('');
      await analyticsAPI.authorizeIntervention(interventionId, {
        decision: decision,
        notes: decision === 'APPROVED' 
          ? 'Approved by Chief Medical Officer for immediate deployment.' 
          : 'Rejected by Chief Medical Officer after evaluation.'
      });
      setSuccessMsg(`Intervention ${decision.toLowerCase()} successfully!`);
      setTimeout(() => setSuccessMsg(''), 4000);
      loadDashboard();
    } catch (err) {
      setError('Failed to process intervention decision.');
    }
  };

  const handleCreateEmergencyAction = async (e) => {
    e.preventDefault();
    if (!actionNotes.trim()) return;
    setSubmittingAction(true);
    setError('');

    try {
      await analyticsAPI.createIntervention({
        zone: actionZone,
        intervention_type: actionType,
        decision_notes: actionNotes.trim(),
        intervention_details: { authorized_at: new Date().toISOString() }
      });
      setShowInterventionModal(false);
      setActionNotes('');
      setSuccessMsg(`Emergency public health action authorized & deployed for ${actionZone}!`);
      setTimeout(() => setSuccessMsg(''), 4000);
      loadDashboard();
    } catch (err) {
      setError('Failed to trigger emergency public health action.');
    } finally {
      setSubmittingAction(false);
    }
  };

  const getRiskColor = (risk) => {
    const colors = {
      RED: 'danger',
      ORANGE: 'warning',
      YELLOW: 'info',
      GREEN: 'success',
    };
    return colors[risk] || 'secondary';
  };

  if (loading) return <Container className="text-center py-5"><Spinner animation="border" variant="primary" /></Container>;

  return (
    <Container className="py-4">
      <div className="page-intro mb-4 d-flex justify-content-between align-items-center flex-wrap gap-2">
        <div>
          <span className="eyebrow">DISTRICT SYSTEM OVERVIEW & EPIDEMIOLOGY MAPS</span>
          <h1 className="mb-0">CMO System Overview & Outbreak Command</h1>
          <p className="lead text-muted mb-0">
            Monitor zone-level GIS risk maps, outbreak symptom signals, and authorize emergency public health containment actions.
          </p>
        </div>
        <Button variant="danger" size="lg" onClick={() => setShowInterventionModal(true)}>
          ⚡ Trigger Emergency Public Health Action
        </Button>
      </div>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
      {successMsg && <Alert variant="success" dismissible onClose={() => setSuccessMsg('')}>{successMsg}</Alert>}

      {dashboard && (
        <>
          {/* Top Overview Metrics */}
          <Row className="g-3 mb-4">
            <Col md={3}>
              <Card className="border-0 shadow-sm bg-primary text-white text-center py-3">
                <Card.Body>
                  <span className="fs-6 text-white-50 d-block mb-1">🗺️ Public Health Zones</span>
                  <h2 className="display-6 fw-bold mb-0">{dashboard.total_zones_monitoring || 0}</h2>
                  <small className="text-white-50">Active Monitored Zones</small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="border-0 shadow-sm bg-danger text-white text-center py-3">
                <Card.Body>
                  <span className="fs-6 text-white-50 d-block mb-1">🚨 Outbreak Signals</span>
                  <h2 className="display-6 fw-bold mb-0">{dashboard.critical_signals?.length || 0}</h2>
                  <small className="text-white-50">Epidemiological Alerts</small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="border-0 shadow-sm bg-warning text-dark text-center py-3">
                <Card.Body>
                  <span className="fs-6 text-dark-50 d-block mb-1">⚡ Pending Authorizations</span>
                  <h2 className="display-6 fw-bold mb-0">{dashboard.pending_interventions?.length || 0}</h2>
                  <small className="text-dark-50">Interventions Awaiting CMO Approval</small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="border-0 shadow-sm bg-success text-white text-center py-3">
                <Card.Body>
                  <span className="fs-6 text-white-50 d-block mb-1">📢 Deployed Actions</span>
                  <h2 className="display-6 fw-bold mb-0">{dashboard.recent_interventions?.length || 0}</h2>
                  <small className="text-white-50">Active Public Health Containments</small>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* ⚡ CMO PUBLIC HEALTH AUTHORIZATION PANEL */}
          <Row className="g-4 mb-4">
            <Col md={7}>
              <Card className="shadow-sm border-0 h-100">
                <Card.Header className="bg-primary text-white py-3 d-flex justify-content-between align-items-center">
                  <h5 className="mb-0 fw-bold">⚡ Pending Public Health Actions Needing CMO Authorization</h5>
                  <Badge bg="warning" text="dark">{dashboard.pending_interventions?.length || 0} Pending</Badge>
                </Card.Header>
                <ListGroup variant="flush">
                  {!dashboard.pending_interventions?.length ? (
                    <ListGroup.Item className="text-muted py-4 text-center">
                      ✅ All public health interventions authorized. No pending items.
                    </ListGroup.Item>
                  ) : (
                    dashboard.pending_interventions.map((intervention) => (
                      <ListGroup.Item key={intervention.id} className="py-3">
                        <Row className="align-items-center">
                          <Col md={7}>
                            <div className="d-flex align-items-center gap-2 mb-1">
                              <Badge bg="warning" text="dark">Zone: {intervention.zone}</Badge>
                              <strong className="text-dark">{intervention.intervention_type}</strong>
                            </div>
                            <small className="text-muted d-block">{intervention.decision_notes}</small>
                            <small className="text-secondary">Requested on: {intervention.start_date || 'Today'}</small>
                          </Col>
                          <Col md={5} className="text-end">
                            <div className="d-flex gap-2 justify-content-end">
                              <Button
                                variant="success"
                                size="sm"
                                onClick={() => handleAuthorizeIntervention(intervention.id, 'APPROVED')}
                              >
                                ✅ Authorize & Deploy
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleAuthorizeIntervention(intervention.id, 'REJECTED')}
                              >
                                ❌ Reject
                              </Button>
                            </div>
                          </Col>
                        </Row>
                      </ListGroup.Item>
                    ))
                  )}
                </ListGroup>
              </Card>
            </Col>

            {/* Approved & Deployed Actions History */}
            <Col md={5}>
              <Card className="shadow-sm border-0 h-100">
                <Card.Header className="bg-success text-white py-3">
                  <h5 className="mb-0 fw-bold">📢 Deployed Interventions History</h5>
                </Card.Header>
                <ListGroup variant="flush">
                  {!dashboard.recent_interventions?.length ? (
                    <ListGroup.Item className="text-muted py-4 text-center">
                      No deployed interventions recorded.
                    </ListGroup.Item>
                  ) : (
                    dashboard.recent_interventions.slice(0, 5).map((item) => (
                      <ListGroup.Item key={item.id} className="py-3">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <strong className="text-dark">{item.zone}</strong>
                          <Badge bg={item.decision === 'APPROVED' ? 'success' : 'secondary'}>
                            {item.decision}
                          </Badge>
                        </div>
                        <div className="small fw-bold text-primary mb-1">{item.intervention_type}</div>
                        <small className="text-muted d-block">{item.decision_notes}</small>
                      </ListGroup.Item>
                    ))
                  )}
                </ListGroup>
              </Card>
            </Col>
          </Row>

          {/* 🗺️ Zone-Level GIS Map & Visual Risk Heatmap */}
          <Row className="g-4 mb-4">
            <Col md={7}>
              <Card className="shadow-sm border-0 h-100">
                <Card.Header className="bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
                  <h5 className="mb-0 text-primary fw-bold">🗺️ District Zone Risk Map & GIS Heatmap</h5>
                  <small className="text-muted">Interactive District Overview</small>
                </Card.Header>
                <Card.Body className="bg-light p-4">
                  <div 
                    className="position-relative border rounded p-4 text-center bg-white shadow-sm"
                    style={{ minHeight: '320px', backgroundImage: 'radial-gradient(#e9ecef 1px, transparent 1px)', backgroundSize: '20px 20px' }}
                  >
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <span className="badge bg-dark">📍 District Zone Map View</span>
                      <small className="text-muted">Click a Zone Marker below to inspect epidemiology</small>
                    </div>

                    <Row className="g-3 my-2">
                      {dashboard.zone_analytics?.map((z, idx) => {
                        const isSelected = selectedZone?.zone_name === z.zone_name;
                        return (
                          <Col key={idx} md={6}>
                            <Card 
                              className={`cursor-pointer transition-all border-${getRiskColor(z.risk_level)} ${isSelected ? 'shadow border-2 bg-light' : 'shadow-sm'}`}
                              style={{ cursor: 'pointer' }}
                              onClick={() => setSelectedZone(z)}
                            >
                              <Card.Body className="p-3 text-start">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                  <strong className="fs-6 text-dark">📍 {z.zone_name}</strong>
                                  <Badge bg={getRiskColor(z.risk_level)}>{z.risk_level}</Badge>
                                </div>
                                <div className="small text-muted mb-1">
                                  Hospitals: <strong>{z.hospitals_count}</strong> · GPS: {z.latitude?.toFixed(2)}, {z.longitude?.toFixed(2)}
                                </div>
                                <div className="d-flex justify-content-between align-items-center mt-2 pt-2 border-top small">
                                  <span>Visited: <strong>{z.total_visited}</strong></span>
                                  <span className="text-success">Treated: <strong>{z.total_treated}</strong></span>
                                  <span className="text-warning-emphasis">In Care: <strong>{z.in_treatment}</strong></span>
                                </div>
                              </Card.Body>
                            </Card>
                          </Col>
                        );
                      })}
                    </Row>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            {/* Selected Zone Deep-Dive Details */}
            <Col md={5}>
              <Card className="shadow-sm border-0 h-100">
                <Card.Header className="bg-dark text-white py-3">
                  <Card.Title className="mb-0 fs-6 fw-bold">
                    🔍 Zone Public Health Profile — {selectedZone?.zone_name || 'Select Zone'}
                  </Card.Title>
                </Card.Header>
                <Card.Body className="py-4">
                  {selectedZone ? (
                    <div>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h4 className="fw-bold text-primary mb-0">{selectedZone.zone_name}</h4>
                        <Badge bg={getRiskColor(selectedZone.risk_level)} className="fs-6">
                          {selectedZone.risk_level} ALERT
                        </Badge>
                      </div>

                      <ListGroup variant="flush" className="border rounded mb-4">
                        <ListGroup.Item className="d-flex justify-content-between align-items-center">
                          <span>Primary Symptom Cluster</span>
                          <strong className="text-danger">{selectedZone.top_symptom}</strong>
                        </ListGroup.Item>
                        <ListGroup.Item className="d-flex justify-content-between align-items-center">
                          <span>Total Patients Visited</span>
                          <strong className="fs-6">{selectedZone.total_visited}</strong>
                        </ListGroup.Item>
                        <ListGroup.Item className="d-flex justify-content-between align-items-center">
                          <span>Patients Treated & Discharged</span>
                          <strong className="text-success fs-6">{selectedZone.total_treated}</strong>
                        </ListGroup.Item>
                        <ListGroup.Item className="d-flex justify-content-between align-items-center">
                          <span>Patients Currently In Treatment</span>
                          <strong className="text-warning-emphasis fs-6">{selectedZone.in_treatment}</strong>
                        </ListGroup.Item>
                        <ListGroup.Item className="d-flex justify-content-between align-items-center">
                          <span>Public Health Facilities</span>
                          <strong>{selectedZone.hospitals_count} Hospitals / PHCs</strong>
                        </ListGroup.Item>
                      </ListGroup>

                      <div className="mb-3">
                        <div className="d-flex justify-content-between small text-muted mb-1">
                          <span>Care Completion Rate</span>
                          <strong>
                            {selectedZone.total_visited > 0 
                              ? Math.round((selectedZone.total_treated / selectedZone.total_visited) * 100) 
                              : 0}%
                          </strong>
                        </div>
                        <ProgressBar 
                          now={selectedZone.total_visited > 0 ? (selectedZone.total_treated / selectedZone.total_visited) * 100 : 0} 
                          variant="success" 
                          style={{ height: '10px' }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-5 text-muted">Select a zone on the map to view deep analytics.</div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* 📊 Zone-Level Analytics Chart */}
          <Card className="shadow-sm border-0 mb-4">
            <Card.Header className="bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
              <h5 className="mb-0 text-primary fw-bold">📊 Zone-Level Patient Analytics & Outbreak Risk Comparison Chart</h5>
              <small className="text-muted">Visual Distribution Across District Zones</small>
            </Card.Header>
            <Card.Body className="py-4">
              <Row className="g-4 align-items-center">
                {dashboard.zone_analytics?.map((z, idx) => {
                  const maxVal = Math.max(...dashboard.zone_analytics.map(item => item.total_visited || 1), 1);
                  const visitedPct = Math.round(((z.total_visited || 0) / maxVal) * 100);
                  const treatedPct = Math.round(((z.total_treated || 0) / maxVal) * 100);
                  const carePct = Math.round(((z.in_treatment || 0) / maxVal) * 100);

                  return (
                    <Col key={idx} md={6}>
                      <Card className="border p-3 bg-light rounded">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <strong className="fs-6">{z.zone_name}</strong>
                          <Badge bg={getRiskColor(z.risk_level)}>{z.risk_level} Risk</Badge>
                        </div>

                        <div className="mb-2">
                          <div className="d-flex justify-content-between small text-muted">
                            <span>Visited Patients ({z.total_visited})</span>
                            <span>{visitedPct}%</span>
                          </div>
                          <ProgressBar now={visitedPct} variant="primary" style={{ height: '8px' }} />
                        </div>

                        <div className="mb-2">
                          <div className="d-flex justify-content-between small text-muted">
                            <span>Treated & Discharged ({z.total_treated})</span>
                            <span>{treatedPct}%</span>
                          </div>
                          <ProgressBar now={treatedPct} variant="success" style={{ height: '8px' }} />
                        </div>

                        <div>
                          <div className="d-flex justify-content-between small text-muted">
                            <span>Currently In Care ({z.in_treatment})</span>
                            <span>{carePct}%</span>
                          </div>
                          <ProgressBar now={carePct} variant="warning" style={{ height: '8px' }} />
                        </div>
                      </Card>
                    </Col>
                  );
                })}
              </Row>
            </Card.Body>
          </Card>

          {/* Emergency Action Modal */}
          <Modal show={showInterventionModal} onHide={() => setShowInterventionModal(false)} size="lg" backdrop="static">
            <Modal.Header closeButton className="bg-danger text-white">
              <Modal.Title>⚡ Trigger & Deploy Emergency Public Health Action</Modal.Title>
            </Modal.Header>
            <Form onSubmit={handleCreateEmergencyAction}>
              <Modal.Body className="py-4">
                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Target Public Health Zone</Form.Label>
                  <Form.Select value={actionZone} onChange={(e) => setActionZone(e.target.value)}>
                    {dashboard.zone_analytics?.map((z, idx) => (
                      <option key={idx} value={z.zone_name}>{z.zone_name} ({z.risk_level} Risk)</option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">Intervention Action Type</Form.Label>
                  <Form.Select value={actionType} onChange={(e) => setActionType(e.target.value)}>
                    <option value="Mobile Medical Unit & Emergency Doctor Camp Deployment">
                      🚑 Mobile Medical Unit & Emergency Doctor Van Deployment
                    </option>
                    <option value="Public Health Advisory & ASHA Vector Screening">
                      📢 Public Health Advisory & Community Door-to-Door Screening
                    </option>
                    <option value="PHC Emergency Medicine Stock Replenishment">
                      📦 PHC Pharmacy Stock Emergency Replenishment
                    </option>
                    <option value="Specialist Surge & Hospital Capacity Reallocation">
                      🏥 Specialist Surge & Hospital Bed Capacity Reallocation
                    </option>
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-bold">CMO Authorization Rationale & Directives <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    placeholder="Specify deployment details, doctor counts, supply quantities, and emergency instructions..."
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    required
                  />
                </Form.Group>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onClick={() => setShowInterventionModal(false)} disabled={submittingAction}>
                  Cancel
                </Button>
                <Button variant="danger" type="submit" disabled={submittingAction || !actionNotes.trim()}>
                  {submittingAction ? <Spinner size="sm" className="me-2" /> : null}
                  🚀 Authorize & Deploy Action
                </Button>
              </Modal.Footer>
            </Form>
          </Modal>
        </>
      )}
    </Container>
  );
}
