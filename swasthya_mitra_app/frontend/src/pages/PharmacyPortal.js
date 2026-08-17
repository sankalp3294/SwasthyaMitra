import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, Modal, Form, InputGroup, Alert, Spinner } from 'react-bootstrap';
import { FaPills, FaPlus, FaBoxes, FaExclamationTriangle, FaSearch, FaCheckCircle, FaPrescription, FaSyncAlt } from 'react-icons/fa';
import { medicationsAPI } from '../services/api';

export default function PharmacyPortal() {
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [stockStatusFilter, setStockStatusFilter] = useState('ALL');
  const [alertMsg, setAlertMsg] = useState(null);

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [showDispenseModal, setShowDispenseModal] = useState(false);
  const [selectedMed, setSelectedMed] = useState(null);

  // Add Medication Form
  const [newMed, setNewMed] = useState({
    name: '',
    generic_name: '',
    category: 'General Medicine',
    dosage_form: 'Tablet',
    strength: '500mg',
    stock_quantity: 100,
    reorder_level: 30,
    unit: 'tablets',
    batch_number: 'BATCH-2026-A1',
    expiry_date: '2027-12-31',
    manufacturer: 'Swasthya Healthcare Pharma'
  });

  // Stock Update Form
  const [updateQty, setUpdateQty] = useState(50);
  // Dispense Form
  const [dispenseQty, setDispenseQty] = useState(1);
  const [dispensePatientName, setDispensePatientName] = useState('Ramesh Kumar');

  useEffect(() => {
    fetchMedications();
  }, []);

  const fetchMedications = async () => {
    setLoading(true);
    try {
      const res = await medicationsAPI.getMedications();
      setMedications(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMedication = async (e) => {
    e.preventDefault();
    try {
      await medicationsAPI.addMedication({
        ...newMed,
        stock_quantity: Number(newMed.stock_quantity),
        reorder_level: Number(newMed.reorder_level)
      });
      setAlertMsg({ type: 'success', text: `✅ Medicine "${newMed.name}" added to pharmacy inventory!` });
      setShowAddModal(false);
      fetchMedications();
    } catch (err) {
      setAlertMsg({ type: 'danger', text: err.response?.data?.detail || 'Failed to add medicine' });
    }
  };

  const handleUpdateStock = async (e) => {
    e.preventDefault();
    if (!selectedMed) return;
    try {
      const newStock = Number(updateQty);
      await medicationsAPI.updateStock(selectedMed.id, { stock_quantity: newStock });
      setAlertMsg({ type: 'success', text: `✅ Updated stock for ${selectedMed.name} to ${newStock} units.` });
      setShowStockModal(false);
      fetchMedications();
    } catch (err) {
      setAlertMsg({ type: 'danger', text: 'Failed to update stock' });
    }
  };

  const handleDispense = async (e) => {
    e.preventDefault();
    if (!selectedMed) return;
    try {
      const res = await medicationsAPI.dispenseMedication(selectedMed.id, Number(dispenseQty));
      setAlertMsg({ 
        type: 'success', 
        text: `💊 Dispensed ${dispenseQty} ${selectedMed.unit} of ${selectedMed.name} to ${dispensePatientName}. Remaining Stock: ${res.data.remaining_stock} units.` 
      });
      setShowDispenseModal(false);
      fetchMedications();
    } catch (err) {
      setAlertMsg({ type: 'danger', text: err.response?.data?.detail || 'Dispense failed due to insufficient stock.' });
    }
  };

  // Filter logic
  const filteredMeds = medications.filter((m) => {
    const searchLower = searchTerm.toLowerCase();
    const matchSearch = m.name?.toLowerCase().includes(searchLower) || m.generic_name?.toLowerCase().includes(searchLower) || m.category?.toLowerCase().includes(searchLower);
    if (!matchSearch) return false;

    if (categoryFilter !== 'ALL' && m.category !== categoryFilter) return false;

    if (stockStatusFilter === 'LOW') return m.stock_quantity <= m.reorder_level && m.stock_quantity > 0;
    if (stockStatusFilter === 'OUT') return m.stock_quantity === 0;
    if (stockStatusFilter === 'IN') return m.stock_quantity > m.reorder_level;

    return true;
  });

  const lowStockCount = medications.filter(m => m.stock_quantity <= m.reorder_level && m.stock_quantity > 0).length;
  const outOfStockCount = medications.filter(m => m.stock_quantity === 0).length;

  return (
    <Container fluid className="py-4 px-lg-5 fade-slide-up">
      {/* Page Header */}
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
        <div>
          <span className="eyebrow">HOSPITAL PHARMACY WORKSTATION</span>
          <h1 className="fw-extrabold mb-1" style={{ color: 'var(--text-heading)' }}>
            Pharmacy Inventory & Prescription Dispensing 💊
          </h1>
          <p className="text-muted mb-0" style={{ fontSize: '0.95rem' }}>
            Manage medicine stock levels, batch details, reorder alerts, and dispense patient prescriptions.
          </p>
        </div>
        <div className="d-flex align-items-center gap-2">
          <Button variant="outline-teal" className="rounded-pill px-3 fw-bold" onClick={fetchMedications}>
            <FaSyncAlt className="me-2" /> Refresh Inventory
          </Button>
          <Button variant="teal" className="rounded-pill px-4 fw-bold shadow-sm" onClick={() => setShowAddModal(true)}>
            <FaPlus className="me-2" /> Add New Medicine
          </Button>
        </div>
      </div>

      {alertMsg && (
        <Alert variant={alertMsg.type} dismissible onClose={() => setAlertMsg(null)} className="rounded-4 shadow-sm mb-4">
          {alertMsg.text}
        </Alert>
      )}

      {/* Overview Stat Cards */}
      <Row className="g-3 mb-4">
        <Col md={3}>
          <Card className="app-card border-0 bg-primary-subtle text-primary p-3 rounded-4 shadow-sm">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <small className="fw-bold text-uppercase opacity-75">Total Medicines</small>
                <h2 className="fw-extrabold mb-0 mt-1">{medications.length}</h2>
              </div>
              <FaBoxes size={36} className="opacity-50" />
            </div>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="app-card border-0 bg-warning-subtle text-warning p-3 rounded-4 shadow-sm">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <small className="fw-bold text-uppercase opacity-75">Low Stock Items</small>
                <h2 className="fw-extrabold mb-0 mt-1">{lowStockCount}</h2>
              </div>
              <FaExclamationTriangle size={36} className="opacity-50" />
            </div>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="app-card border-0 bg-danger-subtle text-danger p-3 rounded-4 shadow-sm">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <small className="fw-bold text-uppercase opacity-75">Out of Stock</small>
                <h2 className="fw-extrabold mb-0 mt-1">{outOfStockCount}</h2>
              </div>
              <FaPills size={36} className="opacity-50" />
            </div>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="app-card border-0 bg-teal-subtle text-teal p-3 rounded-4 shadow-sm">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <small className="fw-bold text-uppercase opacity-75">Dispensary Status</small>
                <h5 className="fw-bold mb-0 mt-2">🟢 Active & Synced</h5>
              </div>
              <FaCheckCircle size={36} className="opacity-50" />
            </div>
          </Card>
        </Col>
      </Row>

      {/* Main Inventory Card */}
      <Card className="app-card shadow-sm border-0 rounded-4 overflow-hidden">
        <Card.Header className="app-card-header bg-white p-3 border-bottom d-flex align-items-center justify-content-between flex-wrap gap-2">
          <div className="d-flex align-items-center gap-2">
            <FaPills className="text-teal fs-5" />
            <h5 className="mb-0 fw-bold">Hospital Pharmacy Inventory List</h5>
          </div>

          <div className="d-flex align-items-center gap-2 flex-wrap">
            <InputGroup style={{ width: '260px' }}>
              <InputGroup.Text className="bg-light border-0"><FaSearch className="text-muted" /></InputGroup.Text>
              <Form.Control
                placeholder="Search medicine or generic..."
                className="bg-light border-0"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </InputGroup>

            <Form.Select
              size="sm"
              className="rounded-pill bg-light border-0 fw-semibold"
              style={{ width: '180px' }}
              value={stockStatusFilter}
              onChange={(e) => setStockStatusFilter(e.target.value)}
            >
              <option value="ALL">All Stock Levels</option>
              <option value="LOW">⚠️ Low Stock Alerts</option>
              <option value="OUT">❌ Out of Stock</option>
              <option value="IN">✅ Normal Stock</option>
            </Form.Select>
          </div>
        </Card.Header>

        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="teal" />
              <p className="mt-2 text-muted fw-semibold">Loading pharmacy inventory...</p>
            </div>
          ) : (
            <Table responsive hover className="mb-0 align-middle">
              <thead className="bg-body-tertiary">
                <tr>
                  <th>Medicine Name & Generic</th>
                  <th>Category & Form</th>
                  <th>Stock Quantity</th>
                  <th>Batch & Expiry</th>
                  <th>Stock Status</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredMeds.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-4 text-muted">
                      No pharmacy medicines found matching filters.
                    </td>
                  </tr>
                ) : (
                  filteredMeds.map((m) => {
                    const isLow = m.stock_quantity <= m.reorder_level && m.stock_quantity > 0;
                    const isOut = m.stock_quantity === 0;

                    return (
                      <tr key={m.id} className={isOut ? 'table-danger' : isLow ? 'table-warning' : ''}>
                        <td>
                          <div className="fw-extrabold text-teal">{m.name}</div>
                          <small className="text-muted">{m.generic_name || 'Generic Formulation'} · {m.strength || 'Standard'}</small>
                        </td>
                        <td>
                          <Badge bg="secondary" className="me-1">{m.category}</Badge>
                          <small className="text-muted">{m.dosage_form}</small>
                        </td>
                        <td>
                          <div className="fw-bold fs-6">{m.stock_quantity} <small className="text-muted font-normal">{m.unit}</small></div>
                          <small className="text-muted">Reorder Threshold: {m.reorder_level}</small>
                        </td>
                        <td>
                          <div className="fw-semibold small">{m.batch_number || 'BATCH-2026'}</div>
                          <small className="text-muted">Exp: {m.expiry_date || '2027-12-31'}</small>
                        </td>
                        <td>
                          <Badge bg={isOut ? 'danger' : isLow ? 'warning' : 'success'} className="px-3 py-1.5 rounded-pill fw-bold">
                            {isOut ? '❌ OUT OF STOCK' : isLow ? '⚠️ LOW STOCK ALERT' : '✅ IN STOCK'}
                          </Badge>
                        </td>
                        <td className="text-end">
                          <Button
                            size="sm"
                            variant="outline-teal"
                            className="rounded-pill me-1 fw-bold"
                            onClick={() => {
                              setSelectedMed(m);
                              setUpdateQty(m.stock_quantity);
                              setShowStockModal(true);
                            }}
                          >
                            Update Stock
                          </Button>
                          <Button
                            size="sm"
                            variant="teal"
                            disabled={isOut}
                            className="rounded-pill fw-bold shadow-sm"
                            onClick={() => {
                              setSelectedMed(m);
                              setDispenseQty(1);
                              setShowDispenseModal(true);
                            }}
                          >
                            <FaPrescription className="me-1" /> Dispense
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>

      {/* Add New Medicine Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} centered size="lg">
        <Modal.Header closeButton className="bg-teal text-white">
          <Modal.Title className="fw-bold fs-5">
            <FaPlus className="me-2" /> Add New Medicine to Pharmacy Inventory
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleAddMedication}>
          <Modal.Body className="p-4">
            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-bold small">Medicine Brand Name *</Form.Label>
                  <Form.Control
                    required
                    placeholder="e.g. Paracetamol 500mg / Ciplox Eye Drops"
                    value={newMed.name}
                    onChange={(e) => setNewMed({ ...newMed, name: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-bold small">Generic Chemical Name</Form.Label>
                  <Form.Control
                    placeholder="e.g. Acetaminophen / Ciprofloxacin"
                    value={newMed.generic_name}
                    onChange={(e) => setNewMed({ ...newMed, generic_name: e.target.value })}
                  />
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group>
                  <Form.Label className="fw-bold small">Category</Form.Label>
                  <Form.Select
                    value={newMed.category}
                    onChange={(e) => setNewMed({ ...newMed, category: e.target.value })}
                  >
                    <option value="General Medicine">General Medicine</option>
                    <option value="Eye & Vision Care">Eye & Vision Care</option>
                    <option value="Cardiology & BP">Cardiology & BP</option>
                    <option value="Antibiotics">Antibiotics</option>
                    <option value="Analgesics & Pain">Analgesics & Pain</option>
                    <option value="Dermatology">Dermatology</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="fw-bold small">Dosage Form</Form.Label>
                  <Form.Select
                    value={newMed.dosage_form}
                    onChange={(e) => setNewMed({ ...newMed, dosage_form: e.target.value })}
                  >
                    <option value="Tablet">Tablet</option>
                    <option value="Capsule">Capsule</option>
                    <option value="Eye Drops">Eye Drops</option>
                    <option value="Syrup">Syrup</option>
                    <option value="Injection">Injection</option>
                    <option value="Ointment">Ointment</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="fw-bold small">Strength</Form.Label>
                  <Form.Control
                    placeholder="e.g. 500mg, 10ml, 0.5%"
                    value={newMed.strength}
                    onChange={(e) => setNewMed({ ...newMed, strength: e.target.value })}
                  />
                </Form.Group>
              </Col>

              <Col md={4}>
                <Form.Group>
                  <Form.Label className="fw-bold small">Initial Stock Quantity *</Form.Label>
                  <Form.Control
                    type="number"
                    required
                    min="1"
                    value={newMed.stock_quantity}
                    onChange={(e) => setNewMed({ ...newMed, stock_quantity: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="fw-bold small">Reorder Threshold *</Form.Label>
                  <Form.Control
                    type="number"
                    required
                    min="1"
                    value={newMed.reorder_level}
                    onChange={(e) => setNewMed({ ...newMed, reorder_level: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="fw-bold small">Unit Type</Form.Label>
                  <Form.Control
                    placeholder="e.g. tablets, bottles, vials"
                    value={newMed.unit}
                    onChange={(e) => setNewMed({ ...newMed, unit: e.target.value })}
                  />
                </Form.Group>
              </Col>

              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-bold small">Batch Number</Form.Label>
                  <Form.Control
                    value={newMed.batch_number}
                    onChange={(e) => setNewMed({ ...newMed, batch_number: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-bold small">Expiry Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={newMed.expiry_date}
                    onChange={(e) => setNewMed({ ...newMed, expiry_date: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" className="rounded-pill" onClick={() => setShowAddModal(false)}>Cancel</Button>
            <Button type="submit" variant="teal" className="rounded-pill px-4 fw-bold">Save Medicine</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Update Stock Modal */}
      <Modal show={showStockModal} onHide={() => setShowStockModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="fw-bold fs-5 text-teal">Update Inventory Stock</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleUpdateStock}>
          <Modal.Body>
            <p className="fw-semibold">Updating stock for <strong>{selectedMed?.name}</strong> ({selectedMed?.unit})</p>
            <Form.Group>
              <Form.Label className="fw-bold small">Total Current Stock Quantity</Form.Label>
              <Form.Control
                type="number"
                required
                min="0"
                value={updateQty}
                onChange={(e) => setUpdateQty(e.target.value)}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" className="rounded-pill" onClick={() => setShowStockModal(false)}>Cancel</Button>
            <Button type="submit" variant="teal" className="rounded-pill px-4 fw-bold">Save Stock</Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Dispense Modal */}
      <Modal show={showDispenseModal} onHide={() => setShowDispenseModal(false)} centered>
        <Modal.Header closeButton className="bg-teal text-white">
          <Modal.Title className="fw-bold fs-5">
            <FaPrescription className="me-2" /> Dispense Prescription Medicine
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleDispense}>
          <Modal.Body className="p-4">
            <Alert variant="info" className="rounded-3 border-0 small mb-3">
              Dispensing will automatically deduct the quantity from real-time hospital stock.
            </Alert>

            <Form.Group className="mb-3">
              <Form.Label className="fw-bold small">Patient Full Name</Form.Label>
              <Form.Control
                required
                value={dispensePatientName}
                onChange={(e) => setDispensePatientName(e.target.value)}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="fw-bold small">Selected Medicine</Form.Label>
              <Form.Control disabled value={`${selectedMed?.name} (${selectedMed?.dosage_form})`} />
              <small className="text-muted">Available Stock: {selectedMed?.stock_quantity} {selectedMed?.unit}</small>
            </Form.Group>

            <Form.Group>
              <Form.Label className="fw-bold small">Quantity to Dispense ({selectedMed?.unit})</Form.Label>
              <Form.Control
                type="number"
                required
                min="1"
                max={selectedMed?.stock_quantity}
                value={dispenseQty}
                onChange={(e) => setDispenseQty(e.target.value)}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" className="rounded-pill" onClick={() => setShowDispenseModal(false)}>Cancel</Button>
            <Button type="submit" variant="teal" className="rounded-pill px-4 fw-bold">Confirm Dispense</Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
}
