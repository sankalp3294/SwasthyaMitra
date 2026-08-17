import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  sessionToken: localStorage.getItem('session_token') || null,
  patientId: localStorage.getItem('patient_id') || null,
  role: localStorage.getItem('user_role') || 'patient',
  isAuthenticated: !!localStorage.getItem('session_token'),

  setSession: (token, patientId, role = 'patient') => {
    localStorage.setItem('session_token', token);
    if (patientId) {
      localStorage.setItem('patient_id', patientId);
    } else {
      localStorage.removeItem('patient_id');
    }
    localStorage.setItem('user_role', role);
    set({
      sessionToken: token,
      patientId,
      role,
      isAuthenticated: true,
    });
  },

  clearSession: () => {
    localStorage.removeItem('session_token');
    localStorage.removeItem('patient_id');
    localStorage.removeItem('user_role');
    set({
      sessionToken: null,
      patientId: null,
      role: 'patient',
      isAuthenticated: false,
    });
  },
}));

export const useCaseStore = create((set) => ({
  currentCase: null,
  cases: [],

  setCurrentCase: (caseData) => set({ currentCase: caseData }),
  setCases: (cases) => set({ cases }),
}));

export const useAppointmentStore = create((set) => ({
  appointments: [],
  currentAppointment: null,

  setAppointments: (appointments) => set({ appointments }),
  setCurrentAppointment: (appointment) => set({ currentAppointment: appointment }),
}));
