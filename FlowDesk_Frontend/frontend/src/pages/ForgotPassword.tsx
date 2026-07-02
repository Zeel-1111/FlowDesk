import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import api from '../api/axios';

type Step = 'email' | 'reset' | 'success';

const emailSchema = Yup.object({
  email: Yup.string().email('Enter a valid email').required('Email is required'),
});

const resetSchema = Yup.object({
  otp: Yup.string()
    .length(6, 'Code must be exactly 6 digits')
    .matches(/^\d+$/, 'Code must be numbers only')
    .required('Code is required'),
  newPassword: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(/[a-z]/, 'Must contain at least one lowercase letter')
    .matches(/[A-Z]/, 'Must contain at least one uppercase letter')
    .matches(/\d/, 'Must contain at least one digit')
    .matches(/[@$!%*?&]/, 'Must contain at least one special character (@$!%*?&)')
    .required('New password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('newPassword')], 'Passwords must match')
    .required('Please confirm your password'),
});

function getPasswordStrength(password: string): { level: number; label: string; color: string } {
  if (!password) return { level: 0, label: '', color: 'transparent' };

  let score = 0;
  if (password.length >= 8) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[@$!%*?&]/.test(password)) score++;

  if (score <= 2) return { level: 1, label: 'Weak', color: '#ef4444' };
  if (score === 3) return { level: 2, label: 'Fair', color: '#f59e0b' };
  if (score === 4) return { level: 3, label: 'Good', color: '#3b82f6' };
  return { level: 4, label: 'Strong', color: '#22c55e' };
}

export default function ForgotPassword() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [serverError, setServerError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleEmailSubmit = async (values: { email: string }) => {
    setServerError('');
    try {
      await api.post('/Auth/forgot-password', { email: values.email });
      setEmail(values.email);
      setStep('reset');
    } catch (err: any) {
      setServerError(err.response?.data?.message || 'Something went wrong. Please try again.');
    }
  };

  const handleResetSubmit = async (values: { otp: string; newPassword: string; confirmPassword: string }) => {
    setServerError('');
    try {
      await api.post('/Auth/reset-password', {
        email,
        otp: values.otp,
        newPassword: values.newPassword,
      });
      setStep('success');
    } catch (err: any) {
      setServerError(err.response?.data?.message || 'Invalid or expired code. Please try again.');
    }
  };

  const handleResendOtp = async () => {
    setServerError('');
    try {
      await api.post('/Auth/forgot-password', { email });
      setServerError('');
    } catch {
      setServerError('Failed to resend code. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">

        {/* Step 1: Enter Email */}
        {step === 'email' && (
          <>
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">🔒</div>
              <h1 className="text-2xl font-bold">Forgot your password?</h1>
              <p className="text-gray-500 text-sm mt-2">
                Enter your email and we'll send you a code to reset your password.
              </p>
            </div>

            {serverError && (
              <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">{serverError}</div>
            )}

            <Formik
              initialValues={{ email: '' }}
              validationSchema={emailSchema}
              onSubmit={handleEmailSubmit}
            >
              {({ isSubmitting }) => (
                <Form className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <Field
                      type="email"
                      name="email"
                      className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="you@example.com"
                    />
                    <ErrorMessage name="email" component="div" className="text-red-500 text-xs mt-1" />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Sending...' : 'Send Reset Code'}
                  </button>
                </Form>
              )}
            </Formik>

            <p className="text-center text-sm mt-4">
              Remember your password?{' '}
              <Link to="/login" className="text-blue-600 hover:underline">Back to Login</Link>
            </p>
          </>
        )}

        {/* Step 2: OTP + New Password */}
        {step === 'reset' && (
          <>
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">📬</div>
              <h1 className="text-2xl font-bold">Reset your password</h1>
              <p className="text-gray-500 text-sm mt-2">
                We sent a 6-digit code to{' '}
                <span className="font-semibold text-blue-600">{email}</span>
              </p>
            </div>

            {serverError && (
              <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">{serverError}</div>
            )}

            <Formik
              initialValues={{ otp: '', newPassword: '', confirmPassword: '' }}
              validationSchema={resetSchema}
              onSubmit={handleResetSubmit}
            >
              {({ isSubmitting, values }) => {
                const strength = getPasswordStrength(values.newPassword);

                return (
                  <Form className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-center">
                        Verification Code
                      </label>
                      <Field
                        type="text"
                        name="otp"
                        maxLength={6}
                        placeholder="000000"
                        className="w-full border rounded px-3 py-3 text-center text-3xl tracking-widest font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <ErrorMessage name="otp" component="div" className="text-red-500 text-xs mt-1 text-center" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">New Password</label>
                      <div className="relative">
                        <Field
                          type={showPassword ? 'text' : 'password'}
                          name="newPassword"
                          className="w-full border rounded px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
                          tabIndex={-1}
                        >
                          {showPassword ? '🙈' : '👁️'}
                        </button>
                      </div>
                      <ErrorMessage name="newPassword" component="div" className="text-red-500 text-xs mt-1" />

                      {/* Password strength meter */}
                      {values.newPassword && (
                        <div className="mt-2">
                          <div className="flex gap-1 mb-1">
                            {[1, 2, 3, 4].map((i) => (
                              <div
                                key={i}
                                className="h-1.5 flex-1 rounded-full transition-all duration-300"
                                style={{
                                  backgroundColor: i <= strength.level ? strength.color : '#e5e7eb',
                                }}
                              />
                            ))}
                          </div>
                          <p className="text-xs font-medium" style={{ color: strength.color }}>
                            {strength.label}
                          </p>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Confirm Password</label>
                      <div className="relative">
                        <Field
                          type={showConfirmPassword ? 'text' : 'password'}
                          name="confirmPassword"
                          className="w-full border rounded px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
                          tabIndex={-1}
                        >
                          {showConfirmPassword ? '🙈' : '👁️'}
                        </button>
                      </div>
                      <ErrorMessage name="confirmPassword" component="div" className="text-red-500 text-xs mt-1" />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isSubmitting ? 'Resetting...' : 'Reset Password'}
                    </button>
                  </Form>
                );
              }}
            </Formik>

            <div className="text-center mt-4 space-y-2">
              <p className="text-sm text-gray-500">
                Didn't receive it?{' '}
                <button
                  onClick={handleResendOtp}
                  className="text-blue-600 hover:underline"
                >
                  Resend Code
                </button>
              </p>
              <button
                onClick={() => { setStep('email'); setServerError(''); }}
                className="text-xs text-gray-400 hover:underline block mx-auto"
              >
                Use a different email
              </button>
            </div>
          </>
        )}

        {/* Step 3: Success */}
        {step === 'success' && (
          <div className="text-center">
            <div className="text-5xl mb-4">✅</div>
            <h1 className="text-2xl font-bold mb-2">Password reset!</h1>
            <p className="text-gray-500 text-sm mb-6">
              Your password has been updated successfully. You can now log in with your new password.
            </p>
            <Link
              to="/login"
              className="inline-block w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 text-center"
            >
              Go to Login
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}
