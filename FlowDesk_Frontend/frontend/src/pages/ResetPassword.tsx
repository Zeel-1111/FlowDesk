import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import api from '../api/axios';

const validationSchema = Yup.object({
  otp: Yup.string()
    .length(6, 'Code must be 6 digits')
    .matches(/^\d+$/, 'Numbers only')
    .required('Code is required'),
  newPassword: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('New password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('newPassword')], 'Passwords must match')
    .required('Please confirm your password'),
});

export default function ResetPassword() {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || '';
  const [serverError, setServerError] = useState('');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">🔑</div>
          <h1 className="text-2xl font-bold">Reset Password</h1>
          <p className="text-gray-500 text-sm mt-2">
            Enter the code sent to{' '}
            <span className="font-semibold text-blue-600">{email}</span>
          </p>
        </div>

        {serverError && (
          <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm">{serverError}</div>
        )}

        <Formik
          initialValues={{ otp: '', newPassword: '', confirmPassword: '' }}
          validationSchema={validationSchema}
          onSubmit={async (values, { setSubmitting }) => {
            setServerError('');
            try {
              await api.post('/Auth/reset-password', {
                email,
                otp: values.otp,
                newPassword: values.newPassword,
              });
              navigate('/login', {
                state: { message: 'Password reset successful! You can now log in.' }
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
                  Verification Code
                </label>
                <Field
                  type="text"
                  name="otp"
                  maxLength={6}
                  placeholder="000000"
                  className="w-full border rounded px-3 py-3 text-center text-2xl tracking-widest font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <ErrorMessage name="otp" component="div" className="text-red-500 text-xs mt-1 text-center" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">New Password</label>
                <Field
                  type="password"
                  name="newPassword"
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <ErrorMessage name="newPassword" component="div" className="text-red-500 text-xs mt-1" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Confirm Password</label>
                <Field
                  type="password"
                  name="confirmPassword"
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
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
          )}
        </Formik>

        <p className="text-center text-sm mt-4">
          <Link to="/forgot-password" className="text-blue-600 hover:underline">
            Resend reset code
          </Link>
        </p>
      </div>
    </div>
  );
}