import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Row, Col, Alert, Badge, Spinner } from 'react-bootstrap';
import { 
  FaUser, FaIdCard, FaMobileAlt, FaMapMarkerAlt, FaTint, 
  FaGlobe, FaNotesMedical, FaCheckCircle, FaExclamationCircle, FaShieldAlt
} from 'react-icons/fa';
import { patientsAPI } from '../services/api';

export default function PatientProfileModal({ show, onHide, profileData, onSaveSuccess, isFirstTimeOnboarding }) {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'Male',
    phone_number: '',
    address: '',
    location: 'Swasthya Nagar',
    blood_group: 'O+',
    language_preference: 'en',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (profileData) {
      setFormData({
        name: profileData.name && !profileData.name.startsWith?.('Patient ') ? profileData.name : (profileData.name || ''),
        age: profileData.age || '',
        gender: profileData.gender || 'Male',
        phone_number: profileData.phone_number || '',
        address: profileData.address || '',
        location: profileData.location || 'Swasthya Nagar',
        blood_group: profileData.blood_group || 'O+',
        language_preference: profileData.language_preference || 'en',
      });
    }
  }, [profileData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || formData.name.trim() === '' || formData.name.startsWith('Patient ')) {
      setError('Please enter your valid Full Name.');
      return;
    }
    if (!formData.age || Number(formData.age) <= 0 || Number(formData.age) > 120) {
      setError('Please enter a valid age (1 to 120).');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const payload = {
        name: formData.name.trim(),
        age: Number(formData.age),
        gender: formData.gender,
        address: formData.address.trim(),
        location: formData.location,
        blood_group: formData.blood_group,
        language_preference: formData.language_preference,
        is_profile_complete: true
      };

      const response = await patientsAPI.updateProfile(payload);
      setSuccessMsg('Profile setup completed successfully!');
      if (onSaveSuccess) {
        onSaveSuccess(response.data);
      }
      setTimeout(() => {
        setSuccessMsg('');
        onHide();
      }, 1200);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update patient profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generatedHealthId = profileData?.health_id || (profileData?.phone_number ? `SM-PAT-${profileData.phone_number.slice(-6)}` : 'SM-PAT-AUTOGEN');

  return (
    <Modal 
      show={show} 
      onHide={isFirstTimeOnboarding ? undefined : onHide} 
      backdrop={isFirstTimeOnboarding ? 'static' : true}
      keyboard={!isFirstTimeOnboarding}
      centered 
      size="lg"
      className="fade-slide-up"
    >
      <Modal.Header closeButton={!isFirstTimeOnboarding} className="bg-body-tertiary border-bottom px-4 py-3">
        <Modal.Title className="fw-extrabold d-flex align-items-center gap-2" style={{ color: 'var(--text-heading)' }}>
          <div className="p-2 rounded-circle bg-teal-subtle text-teal d-inline-flex">
            <FaUser size={20} />
          </div>
          {isFirstTimeOnboarding ? 'Complete Your Patient Profile' : 'Edit Patient Profile Details'}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="p-4">
        {isFirstTimeOnboarding && (
          <Alert variant="teal" className="d-flex align-items-center gap-3 rounded-3 mb-4 border-teal">
            <FaExclamationCircle size={28} className="text-teal flex-shrink-0" />
            <div>
              <strong className="d-block text-teal">Welcome to SwasthyaMitra Digital Health Portal!</strong>
              <small className="text-muted">
                Please complete your one-time profile details below so doctors can reference your record during appointments and tele-consultations.
              </small>
            </div>
          </Alert>
        )}

        {error && <Alert variant="danger" className="rounded-3">{error}</Alert>}
        {successMsg && <Alert variant="success" className="rounded-3 d-flex align-items-center gap-2"><FaCheckCircle /> {successMsg}</Alert>}

        <Form onSubmit={handleSubmit}>
          {/* Digital Health ID & Phone Banner */}
          <div className="p-3 rounded-3 bg-body-tertiary border mb-4 d-flex flex-wrap justify-content-between align-items-center gap-3">
            <div className="d-flex align-items-center gap-2">
              <FaIdCard className="text-teal fs-5" />
              <div>
                <small className="text-muted d-block fw-semibold">DIGITAL HEALTH ID (AUTO-GENERATED)</small>
                <Badge bg="dark" className="fs-6 font-monospace px-3 py-1.5 mt-0.5">
                  {generatedHealthId}
                </Badge>
              </div>
            </div>

            <div className="d-flex align-items-center gap-2">
              <FaMobileAlt className="text-cyan fs-5" />
              <div>
                <small className="text-muted d-block fw-semibold">REGISTERED PHONE</small>
                <span className="fw-bold font-monospace text-body">{formData.phone_number || profileData?.phone_number || '10-Digit Mobile'}</span>
              </div>
            </div>
          </div>

          <Row className="g-3 mb-3">
            {/* Full Name */}
            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-semibold">Full Name <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="text"
                  name="name"
                  placeholder="e.g. Ramesh Kumar"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="rounded-3 p-2.5 border-2"
                />
              </Form.Group>
            </Col>

            {/* Age */}
            <Col md={3}>
              <Form.Group>
                <Form.Label className="fw-semibold">Age (Years) <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="number"
                  name="age"
                  placeholder="e.g. 35"
                  min="1"
                  max="120"
                  value={formData.age}
                  onChange={handleChange}
                  required
                  className="rounded-3 p-2.5 border-2"
                />
              </Form.Group>
            </Col>

            {/* Gender */}
            <Col md={3}>
              <Form.Group>
                <Form.Label className="fw-semibold">Gender <span className="text-danger">*</span></Form.Label>
                <Form.Select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="rounded-3 p-2.5 border-2 fw-semibold"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Row className="g-3 mb-3">
            {/* Address */}
            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-semibold d-flex align-items-center gap-1">
                  <FaMapMarkerAlt className="text-danger" /> Residential Address / Village
                </Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  name="address"
                  placeholder="House No., Street / Village, District"
                  value={formData.address}
                  onChange={handleChange}
                  className="rounded-3 p-2 border-2"
                />
              </Form.Group>
            </Col>

            {/* Zone / Location */}
            <Col md={6}>
              <Form.Group className="mb-2">
                <Form.Label className="fw-semibold">Health Zone / Ward</Form.Label>
                <Form.Select
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="rounded-3 p-2.5 border-2 fw-semibold"
                >
                  <option value="Swasthya Nagar">Swasthya Nagar</option>
                  <option value="Wellness Ward">Wellness Ward</option>
                  <option value="Central Zone">Central Zone</option>
                  <option value="North District">North District</option>
                  <option value="South Ward">South Ward</option>
                  <option value="East Region">East Region</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          <Row className="g-3 mb-4">
            {/* Blood Group */}
            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-semibold d-flex align-items-center gap-1">
                  <FaTint className="text-danger" /> Blood Group
                </Form.Label>
                <Form.Select
                  name="blood_group"
                  value={formData.blood_group}
                  onChange={handleChange}
                  className="rounded-3 p-2.5 border-2 fw-semibold"
                >
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </Form.Select>
              </Form.Group>
            </Col>

            {/* Language Preference */}
            <Col md={6}>
              <Form.Group>
                <Form.Label className="fw-semibold d-flex align-items-center gap-1">
                  <FaGlobe className="text-teal" /> Preferred Communication Language
                </Form.Label>
                <Form.Select
                  name="language_preference"
                  value={formData.language_preference}
                  onChange={handleChange}
                  className="rounded-3 p-2.5 border-2 fw-semibold"
                >
                  <option value="en">English</option>
                  <option value="hi">Hindi (हिन्दी)</option>
                  <option value="mr">Marathi (मराठी)</option>
                  <option value="bn">Bengali (বাংলা)</option>
                  <option value="ta">Tamil (தமிழ்)</option>
                  <option value="te">Telugu (తెలుగు)</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>

          {/* Automatic Clinical History Info Card */}
          <div className="p-3 rounded-3 bg-teal-subtle border border-teal mb-4 d-flex align-items-start gap-3">
            <FaNotesMedical size={24} className="text-teal flex-shrink-0 mt-1" />
            <div>
              <h6 className="fw-bold text-teal mb-1 d-flex align-items-center gap-2">
                <FaShieldAlt /> Automatic Medical History & Consultations Tracking
              </h6>
              <p className="text-muted small mb-0">
                Your medical history is automatically updated by doctors, lab technicians, and AI triage assessments following each of your visits and tele-consultations.
              </p>
            </div>
          </div>

          <div className="d-flex justify-content-end gap-2 pt-2 border-top">
            {!isFirstTimeOnboarding && (
              <Button variant="outline-secondary" className="px-4 rounded-3 fw-bold" onClick={onHide} disabled={loading}>
                Cancel
              </Button>
            )}
            <Button className="primary-action px-5 py-2.5 rounded-3 fw-bold d-flex align-items-center gap-2" type="submit" disabled={loading}>
              {loading ? <Spinner size="sm" /> : <FaCheckCircle />} Save Profile Details
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
}
