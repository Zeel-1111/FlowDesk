import { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import api from '../api/axios';

const validationSchema = Yup.object({
  otp: Yup.string()
    .length(6, 'Code must be exactly 6 digits')
    .matches(/^\d+$/, 'Code must be numbers only')
    .required('Code is required'),
});

export default function VerifyOtp() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || '';
  const [serverError, setServerError] = useState('');
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  const handleResend = async () => {
    setResending(true);
    setResent(false);
    try {
      await api.post('/Auth/resend-otp', { email });
      setResent(true);
    } catch {
      setServerError('Failed to resend OTP. Try again.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">📬</div>
          <h1 className="text-2xl font-bold">Check your email</h1>
          <p className="text-gray-500 text-sm mt-2">
            We sent a 6-digit code to{' '}
            <span className="font-semibold text-blue-600">{email}</span>
          </p>
        </div>

        {serverError && (
          <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">{serverError}</div>
        )}

        {resent && (
          <div className="bg-green-50 text-green-600 p-3 rounded mb-4 text-sm">
            ✅ New OTP sent! Check your inbox.
          </div>
        )}

        <Formik
          initialValues={{ otp: '' }}
          validationSchema={validationSchema}
          onSubmit={async (values, { setSubmitting }) => {
            setServerError('');
            try {
              await api.post('/Auth/verify-otp', { email, otp: values.otp });
              navigate('/login', {
                state: { message: 'Email verified! You can now log in.' }
              });
            } catch (err: any) {
              setServerError(err.response?.data?.message || 'Invalid or expired code.');
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({ isSubmitting }) => (
            <Form className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-center">
                  Enter verification code
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

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Verifying...' : 'Verify Email'}
              </button>
            </Form>
          )}
        </Formik>

        <div className="text-center mt-4 space-y-2">
          <p className="text-sm text-gray-500">
            Didn't receive it?{' '}
            <button
              onClick={handleResend}
              disabled={resending}
              className="text-blue-600 hover:underline disabled:opacity-50"
            >
              {resending ? 'Sending...' : 'Resend OTP'}
            </button>
          </p>
          <Link to="/register" className="text-xs text-gray-400 hover:underline block">
            Back to register
          </Link>
        </div>
      </div>
    </div>
  );
}