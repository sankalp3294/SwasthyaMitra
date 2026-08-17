import React from 'react';
import { Container, Card, Row, Col, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';

export default function AdminHome() {
  const navigate = useNavigate();

  return (
    <Container className="py-4">
      <h1 className="mb-4">Admin Portal</h1>
      <Row className="g-3">
        <Col md={4}>
          <Card className="h-100 shadow-sm">
            <Card.Body>
              <h5>All Users</h5>
              <p className="text-muted">Manage patients, doctors, and staff accounts.</p>
              <Button variant="primary" onClick={() => navigate('/admin/users')}>Manage Users</Button>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="h-100 shadow-sm">
            <Card.Body>
              <h5>Hospitals</h5>
              <p className="text-muted">Review hospital data, departments, and facilities.</p>
              <Button variant="primary" onClick={() => navigate('/admin/hospitals')}>View Hospitals</Button>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="h-100 shadow-sm">
            <Card.Body>
              <h5>Reports</h5>
              <p className="text-muted">Access all reports and system-wide analytics.</p>
              <Button variant="primary" onClick={() => navigate('/admin/reports')}>Open Reports</Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
