import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import OTPLogin from '../pages/OTPLogin';
import { authAPI } from '../services/api';

jest.mock('../services/api', () => ({
  authAPI: { requestOTP: jest.fn(), verifyOTP: jest.fn() },
}));

const renderLogin = () => render(<BrowserRouter><OTPLogin /></BrowserRouter>);

describe('OTPLogin', () => {
  beforeEach(() => jest.clearAllMocks());

  test('renders a mobile-number input initially', () => {
    renderLogin();
    expect(screen.getByPlaceholderText(/10-digit mobile number/i)).toBeTruthy();
  });

  test('shows an error for an invalid phone number', async () => {
    renderLogin();
    fireEvent.change(screen.getByPlaceholderText(/10-digit mobile number/i), { target: { value: '123' } });
    fireEvent.click(screen.getByRole('button', { name: /request otp/i }));
    expect(screen.getByText(/valid phone number/i)).toBeTruthy();
    expect(authAPI.requestOTP).not.toHaveBeenCalled();
  });

  test('moves to the OTP step after a successful request', async () => {
    authAPI.requestOTP.mockResolvedValue({ data: { otp: '123456' } });
    renderLogin();
    fireEvent.change(screen.getByPlaceholderText(/10-digit mobile number/i), { target: { value: '9876543210' } });
    fireEvent.click(screen.getByRole('button', { name: /request otp/i }));
    expect(await screen.findByPlaceholderText(/6-digit otp/i)).toBeTruthy();
  });
});
