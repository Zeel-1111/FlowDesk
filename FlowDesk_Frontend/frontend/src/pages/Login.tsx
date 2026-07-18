import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const validationSchema = Yup.object({
  email: Yup.string().email('Enter a valid email').required('Email is required'),
  password: Yup.string().min(8, 'Password must be at least 8 characters').required('Password is required'),
});

interface LoginFormValues {
  email: string;
  password: string;
}

export default function Login() {
  const [serverError, setServerError] = useState('');
  const [unverifiedEmail, setUnverifiedEmail] = useState(''); // ← tracks which email needs verification
  const [resending, setResending] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const successMessage = location.state?.message || '';

  const handleSubmit = async (values: LoginFormValues) => {
    setServerError('');
    setUnverifiedEmail('');
    try {
      await login(values);
      navigate('/dashboard');
    } catch (err: any) {
      if (err.response?.status === 403) {
        setUnverifiedEmail(values.email); // ← store email for resend
        setServerError('Your email is not verified yet.');
      } else {
        setServerError('Invalid email or password');
      }
    }
  };

  const handleResendOtp = async () => {
    setResending(true);
    try {
      await api.post('/Auth/resend-otp', { email: unverifiedEmail });
      // Navigate to OTP page with email pre-filled
      navigate('/verify-otp', { state: { email: unverifiedEmail } });
    } catch {
      setServerError('Failed to resend OTP. Please try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">FlowDesk Login</h1>

        {successMessage && (
          <div className="bg-green-50 text-green-600 p-3 rounded mb-4 text-sm">
            ✅ {successMessage}
          </div>
        )}

        {/* Unverified email banner */}
        {unverifiedEmail && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
            <p className="text-amber-800 text-sm font-medium">📧 Email not verified</p>
            <p className="text-amber-700 text-xs mt-1 mb-3">
              Please verify <span className="font-semibold">{unverifiedEmail}</span> before logging in.
            </p>
            <button
              onClick={handleResendOtp}
              disabled={resending}
              className="w-full bg-amber-500 text-white py-2 rounded text-sm hover:bg-amber-600 disabled:opacity-50"
            >
              {resending ? 'Sending OTP...' : '📨 Send verification code'}
            </button>
          </div>
        )}

        {serverError && !unverifiedEmail && (
          <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">
            {serverError}
          </div>
        )}

        <Formik
          initialValues={{ email: '', password: '' }}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
          validateOnMount={false}
        >
          {({ isSubmitting }) => (
            <Form className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <Field
                  type="email"
                  name="email"
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <ErrorMessage name="email" component="div" className="text-red-500 text-xs mt-1" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Password</label>
                <Field
                  type="password"
                  name="password"
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <ErrorMessage name="password" component="div" className="text-red-500 text-xs mt-1" />
                <div className="text-right mt-1">
                  <Link to="/forgot-password" className="text-xs text-blue-600 hover:underline">
                    Forgot password?
                  </Link>
                </div>
              </div>


              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Logging in...' : 'Login'}
              </button>
            </Form>
          )}
        </Formik>

        <p className="text-center text-sm mt-4">
          Don't have an account?{' '}
          <Link to="/register" className="text-blue-600 hover:underline">Register</Link>
        </p>
      </div>
    </div>
  );
}