import React, { useEffect, useState } from 'react';
import { Container, Card, Table, Button, Badge, Alert, Spinner, Modal, Form, Row, Col, InputGroup } from 'react-bootstrap';
import { medicationAPI } from '../services/api';

export default function DoctorMedications() {
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Modal State for Adding / Updating Stock
  const [showModal, setShowModal] = useState(false);
  const [editingMed, setEditingMed] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    generic_name: '',
    category: 'Analgesic & Antipyretic',
    dosage_form: 'Tablet',
    strength: '500mg',
    stock_quantity: 100,
    reorder_level: 50,
    unit: 'tablets',
    batch_number: '',
    expiry_date: '',
    manufacturer: ''
  });

  const loadMedications = () => {
    setLoading(true);
    medicationAPI.getMedications()
      .then((res) => setMedications(res.data))
      .catch((err) => setError(err.response?.data?.detail || 'Failed to load medicine inventory.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadMedications();
  }, []);

  const openAddModal = () => {
    setEditingMed(null);
    setFormData({
      name: '',
      generic_name: '',
      category: 'Analgesic & Antipyretic',
      dosage_form: 'Tablet',
      strength: '500mg',
      stock_quantity: 100,
      reorder_level: 50,
      unit: 'tablets',
      batch_number: `BN-${new Date().getFullYear()}-${Math.floor(Math.random() * 90 + 10)}`,
      expiry_date: '2027-12-31',
      manufacturer: 'Generic Pharma'
    });
    setShowModal(true);
  };

  const openEditModal = (med) => {
    setEditingMed(med);
    setFormData({
      name: med.name,
      generic_name: med.generic_name || '',
      category: med.category,
      dosage_form: med.dosage_form,
      strength: med.strength || '',
      stock_quantity: med.stock_quantity,
      reorder_level: med.reorder_level,
      unit: med.unit,
      batch_number: med.batch_number || '',
      expiry_date: med.expiry_date || '',
      manufacturer: med.manufacturer || ''
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    setSubmitting(true);
    setError('');

    try {
      if (editingMed) {
        await medicationAPI.updateMedication(editingMed.id, {
          name: formData.name,
          stock_quantity: parseInt(formData.stock_quantity, 10),
          reorder_level: parseInt(formData.reorder_level, 10),
          batch_number: formData.batch_number,
          expiry_date: formData.expiry_date
        });
      } else {
        await medicationAPI.addMedication({
          ...formData,
          stock_quantity: parseInt(formData.stock_quantity, 10),
          reorder_level: parseInt(formData.reorder_level, 10)
        });
      }
      setShowModal(false);
      loadMedications();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save medication.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this medicine from inventory?')) return;
    try {
      await medicationAPI.deleteMedication(id);
      loadMedications();
    } catch (err) {
      setError('Failed to delete medication.');
    }
  };

  // Filtered Medications
  const filteredMeds = medications.filter(med => {
    const matchesSearch = med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (med.generic_name && med.generic_name.toLowerCase().includes(searchTerm.toLowerCase()));
    
    let matchesStatus = true;
    if (selectedStatus === 'IN_STOCK') matchesStatus = med.stock_quantity > med.reorder_level;
    if (selectedStatus === 'LOW_STOCK') matchesStatus = med.stock_quantity > 0 && med.stock_quantity <= med.reorder_level;
    if (selectedStatus === 'OUT_OF_STOCK') matchesStatus = med.stock_quantity === 0;

    let matchesCategory = true;
    if (selectedCategory !== 'ALL') matchesCategory = med.category === selectedCategory;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Calculate Metrics
  const totalCount = medications.length;
  const inStockCount = medications.filter(m => m.stock_quantity > m.reorder_level).length;
  const lowStockCount = medications.filter(m => m.stock_quantity > 0 && m.stock_quantity <= m.reorder_level).length;
  const outOfStockCount = medications.filter(m => m.stock_quantity === 0).length;

  if (loading) return <Container className="py-5 text-center"><Spinner animation="border" variant="primary" /></Container>;

  return (
    <Container className="py-4">
      <div className="page-intro mb-4">
        <span className="eyebrow">HOSPITAL PHARMACY & INVENTORY CONTROL</span>
        <h1>Medicine Stock & Pharmacy Inventory</h1>
        <p className="lead text-muted">
          Check active pharmacy stock availability before prescribing to ensure essential medicines are in stock for patients.
        </p>
      </div>

      {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}

      {/* Metrics Row */}
      <Row className="g-3 mb-4">
        <Col md={3}>
          <Card className="border-0 shadow-sm bg-primary text-white text-center py-3">
            <Card.Body>
              <h3 className="mb-0 fw-bold">{totalCount}</h3>
              <small className="text-white-50">Total Medicines in Catalog</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm bg-success text-white text-center py-3">
            <Card.Body>
              <h3 className="mb-0 fw-bold">{inStockCount}</h3>
              <small className="text-white-50">🟢 Available In Stock</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm bg-warning text-dark text-center py-3">
            <Card.Body>
              <h3 className="mb-0 fw-bold">{lowStockCount}</h3>
              <small className="text-dark-50">🟡 Low Stock Alert (Reorder)</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-0 shadow-sm bg-danger text-white text-center py-3">
            <Card.Body>
              <h3 className="mb-0 fw-bold">{outOfStockCount}</h3>
              <small className="text-white-50">🔴 Out of Stock (Do Not Prescribe)</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Search & Filter Bar */}
      <Card className="app-card shadow-sm border-0 mb-4">
        <Card.Body className="py-3">
          <Row className="g-2 align-items-center">
            <Col md={5}>
              <InputGroup size="sm">
                <InputGroup.Text>🔍</InputGroup.Text>
                <Form.Control
                  placeholder="Search by medicine or generic name (e.g. Paracetamol)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={3}>
              <Form.Select size="sm" value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
                <option value="ALL">All Stock Statuses</option>
                <option value="IN_STOCK">🟢 In Stock Only</option>
                <option value="LOW_STOCK">🟡 Low Stock Only</option>
                <option value="OUT_OF_STOCK">🔴 Out of Stock Only</option>
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Select size="sm" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                <option value="ALL">All Categories</option>
                <option value="Analgesic & Antipyretic">Analgesics & Fever</option>
                <option value="Antibiotic">Antibiotics</option>
                <option value="Antacid / PPI">Antacids / PPI</option>
                <option value="Antidiabetic">Antidiabetic</option>
                <option value="Antihypertensive">Antihypertensive</option>
              </Form.Select>
            </Col>
            <Col md={2} className="text-end">
              <Button variant="primary" size="sm" className="w-100" onClick={openAddModal}>
                + Add New Medicine
              </Button>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Pharmacy Stock Inventory Table */}
      <Card className="app-card shadow-sm border-0 mb-4">
        <Card.Header className="bg-white py-3 border-bottom d-flex justify-content-between align-items-center">
          <h5 className="mb-0 text-primary fw-bold">💊 Pharmacy Stock Availability & Expiry Status</h5>
          <small className="text-muted">Showing {filteredMeds.length} of {medications.length} items</small>
        </Card.Header>
        <Card.Body className="p-0">
          <Table responsive hover className="mb-0 align-middle">
            <thead className="bg-light">
              <tr>
                <th>Medicine Name & Generic Name</th>
                <th>Formulation & Category</th>
                <th>Available Quantity & Status</th>
                <th>Batch # & Expiry</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMeds.length ? (
                filteredMeds.map((med) => {
                  const isLow = med.stock_quantity > 0 && med.stock_quantity <= med.reorder_level;
                  const isOut = med.stock_quantity === 0;

                  return (
                    <tr key={med.id} className={isOut ? 'table-danger-subtle' : isLow ? 'table-warning-subtle' : ''}>
                      <td>
                        <div className="fw-bold fs-6 text-dark">{med.name}</div>
                        {med.generic_name && (
                          <small className="text-muted d-block">Generic: {med.generic_name}</small>
                        )}
                        {med.is_essential && (
                          <Badge bg="info" className="mt-1">EDL Essential Drug</Badge>
                        )}
                      </td>
                      <td>
                        <Badge bg="secondary" className="me-1">{med.dosage_form}</Badge>
                        <small className="text-muted d-block mt-1">{med.category}</small>
                      </td>
                      <td>
                        <div className="fw-bold fs-5">
                          {med.stock_quantity} <small className="fs-6 text-muted">{med.unit}</small>
                        </div>
                        {isOut ? (
                          <Badge bg="danger">🔴 Out of Stock — Do Not Prescribe</Badge>
                        ) : isLow ? (
                          <Badge bg="warning" text="dark">🟡 Low Stock (Threshold: {med.reorder_level})</Badge>
                        ) : (
                          <Badge bg="success">🟢 Available In Stock</Badge>
                        )}
                      </td>
                      <td>
                        <small className="d-block">Batch: <strong>{med.batch_number || 'N/A'}</strong></small>
                        <small className="text-muted">Exp: {med.expiry_date || 'N/A'}</small>
                      </td>
                      <td>
                        <div className="d-flex gap-2">
                          <Button size="sm" variant="outline-primary" onClick={() => openEditModal(med)}>
                            ⚡ Update Stock
                          </Button>
                          <Button size="sm" variant="outline-danger" onClick={() => handleDelete(med.id)}>
                            🗑️
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-4 text-muted">
                    No medications matching your filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* Modal for Add / Edit Medicine Stock */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" backdrop="static">
        <Modal.Header closeButton className="bg-primary text-white">
          <Modal.Title>{editingMed ? `⚡ Update Stock: ${editingMed.name}` : '➕ Add New Medicine Stock'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSave}>
          <Modal.Body className="py-3">
            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-bold">Medicine Brand Name <span className="text-danger">*</span></Form.Label>
                  <Form.Control
                    placeholder="e.g. Paracetamol 500mg"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="fw-bold">Generic Salt Name</Form.Label>
                  <Form.Control
                    placeholder="e.g. Acetaminophen"
                    value={formData.generic_name}
                    onChange={(e) => setFormData({ ...formData, generic_name: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="fw-bold">Category</Form.Label>
                  <Form.Select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="Analgesic & Antipyretic">Analgesic & Antipyretic</option>
                    <option value="Antibiotic">Antibiotic</option>
                    <option value="Antacid / PPI">Antacid / PPI</option>
                    <option value="Antihistamine">Antihistamine</option>
                    <option value="Antidiabetic">Antidiabetic</option>
                    <option value="Antihypertensive">Antihypertensive</option>
                    <option value="Electrolytes">Electrolytes & Fluids</option>
                    <option value="Corticosteroid">Corticosteroid</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="fw-bold">Dosage Form</Form.Label>
                  <Form.Select
                    value={formData.dosage_form}
                    onChange={(e) => setFormData({ ...formData, dosage_form: e.target.value })}
                  >
                    <option value="Tablet">Tablet</option>
                    <option value="Capsule">Capsule</option>
                    <option value="Syrup">Syrup (Liquid)</option>
                    <option value="Injection">Injection (Vial)</option>
                    <option value="Sachet">Sachet</option>
                    <option value="Ointment">Ointment / Gel</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="fw-bold">Current Stock Quantity</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="fw-bold">Low Stock Alert Threshold</Form.Label>
                  <Form.Control
                    type="number"
                    min="0"
                    value={formData.reorder_level}
                    onChange={(e) => setFormData({ ...formData, reorder_level: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="fw-bold">Batch Number</Form.Label>
                  <Form.Control
                    placeholder="BN-2026-XX"
                    value={formData.batch_number}
                    onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label className="fw-bold">Expiry Date</Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.expiry_date}
                    onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)} disabled={submitting}>Cancel</Button>
            <Button variant="success" type="submit" disabled={submitting || !formData.name.trim()}>
              {submitting ? <Spinner size="sm" className="me-2" /> : null}
              Save Inventory Item
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
}
