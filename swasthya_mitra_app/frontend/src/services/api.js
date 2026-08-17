import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: parseInt(process.env.REACT_APP_API_TIMEOUT || '30000'),
});

// Add session token to all requests
api.interceptors.request.use((config) => {
  const sessionToken = localStorage.getItem('session_token');
  if (sessionToken) {
    config.params = config.params || {};
    config.params.session_token = sessionToken;
  }
  return config;
});

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('session_token');
      window.location.href = `${process.env.PUBLIC_URL || ''}/login`;
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  requestOTP: (phoneNumber) =>
    api.post('/auth/request-otp', { phone_number: phoneNumber }),
  verifyOTP: (phoneNumber, otpCode) =>
    api.post('/auth/verify-otp', { phone_number: phoneNumber, otp_code: otpCode }),
  registerPatient: (patientData) =>
    api.post('/auth/register', patientData),
  staffLogin: (email, password) =>
    api.post('/auth/staff/login', { email, password }),
  logout: () => api.post('/auth/logout'),
};

// Patient APIs
export const patientAPI = {
  getProfile: () => api.get('/patients/me'),
  getCurrentProfile: () => api.get('/patients/me'),
  updateProfile: (data) => api.put('/patients/me', data),
  getPatient: (id) => api.get(`/patients/${id}`),
  getMedicalFile: (id) => api.get(`/patients/${id}/medical-file`),
  createLabTest: (id, data) => api.post(`/patients/${id}/lab-tests`, data),
  updateLabTestResult: (testId, data) => api.put(`/patients/lab-tests/${testId}/results`, data),
};
export const patientsAPI = patientAPI;

// Case APIs
export const caseAPI = {
  createCase: (data) => api.post('/cases/', data),
  getCase: (caseId) => api.get(`/cases/${caseId}`),
  getCases: () => api.get('/cases/patient/all'),
  updateCase: (caseId, data) => api.put(`/cases/${caseId}`, data),
  triageCase: (caseId, symptoms) =>
    api.post(`/cases/${caseId}/triage`, { case_id: caseId, symptoms }),
};

// Appointment APIs
export const appointmentAPI = {
  createAppointment: (data) => api.post('/appointments/', data),
  getAppointment: (id) => api.get(`/appointments/${id}`),
  getAppointments: () => api.get('/appointments/patient/all'),
  updateAppointment: (id, data) => api.put(`/appointments/${id}`, data),
  confirmAppointment: (id) => api.post(`/appointments/${id}/confirm`),
  checkIn: (id) => api.post(`/appointments/${id}/check-in`),
  markNoShow: (id, data = {}) => api.post(`/appointments/${id}/no-show`, data),
  recordConsultation: (id, data) => api.post(`/appointments/${id}/consultation`, data),
  rebook: (id, newSlotId) =>
    api.post(`/appointments/${id}/rebook`, { new_slot_id: newSlotId }),
};

// Medication Inventory APIs
export const medicationAPI = {
  getMedications: (params) => api.get('/medications/', { params }),
  addMedication: (data) => api.post('/medications/', data),
  updateMedication: (id, data) => api.put(`/medications/${id}`, data),
  deleteMedication: (id) => api.delete(`/medications/${id}`),
};

// Hospital APIs
export const hospitalAPI = {
  listHospitals: () => api.get('/hospitals/'),
  searchHospitals: (latitude, longitude, radiusKm = 10) =>
    api.post('/hospitals/search', { latitude, longitude, radius_km: radiusKm }),
  getHospital: (id) => api.get(`/hospitals/${id}`),
  getDepartments: (id) => api.get(`/hospitals/${id}/departments`),
  getSlots: (id, date = null) => {
    const params = date ? { date } : {};
    return api.get(`/hospitals/${id}/slots`, { params });
  },
  dispatchEmergency: (data) => api.post('/hospitals/emergency-dispatch', data),
  cancelEmergency: (data) => api.post('/hospitals/emergency-cancel', data),
};

// Analytics APIs
export const analyticsAPI = {
  getZones: () => api.get('/analytics/zones'),
  getZoneSignals: (zone) => api.get(`/analytics/zones/${zone}/signals`),
  getZoneAnalytics: (zone) => api.get(`/analytics/zones/${zone}/analytics`),
  getSignals: () => api.get('/analytics/signals'),
  detectAnomalies: () => api.post('/analytics/signals/detect'),
  createIntervention: (data) => api.post('/analytics/interventions', data),
  updateIntervention: (id, data) => api.put(`/analytics/interventions/${id}`, data),
  authorizeIntervention: (id, data) => api.post(`/analytics/interventions/${id}/authorize`, data),
};

// ASHA APIs
export const ashaAPI = {
  getAssignments: () => api.get('/asha/assignments'),
  getAssignment: (id) => api.get(`/asha/assignments/${id}`),
  getWorkers: () => api.get('/asha/workers'),
  submitFollowup: (id, data) =>
    api.post(`/asha/assignments/${id}/submit-followup`, data),
  dispatchEmergency: (data) => api.post('/asha/emergency-dispatch', data),
};

// Medication Pharmacy APIs
export const medicationsAPI = {
  getMedications: (params) => api.get('/medications', { params }),
  addMedication: (data) => api.post('/medications', data),
  updateStock: (id, data) => api.put(`/medications/${id}`, data),
  dispenseMedication: (id, quantity = 1) => api.post(`/medications/dispense/${id}?quantity=${quantity}`),
  deleteMedication: (id) => api.delete(`/medications/${id}`),
};

// Pathology Lab APIs
export const labAPI = {
  getLabTests: (params) => api.get('/lab/tests', { params }),
  createLabTest: (data) => api.post('/lab/tests/create', data),
  uploadLabResult: (testId, data) => api.post(`/lab/tests/${testId}/upload-result`, data),
  getMyLabTests: () => api.get('/lab/tests/patient/me'),
};

// Dashboard APIs
export const dashboardAPI = {
  getStats: () => api.get('/dashboards/stats'),
  getHospitalDashboard: (hospitalId = 1) =>
    api.get(`/dashboards/hospital/${hospitalId || 1}`),
  getChiefDoctorDashboard: () => api.get('/dashboards/chief-doctor'),
  getASHADashboard: (workerId) => api.get(`/dashboards/asha-worker/${workerId}`),
  getMyDoctorDashboard: () => api.get('/dashboards/doctor/me'),
  getMyASHADashboard: () => api.get('/dashboards/asha/me'),
};

export default api;
