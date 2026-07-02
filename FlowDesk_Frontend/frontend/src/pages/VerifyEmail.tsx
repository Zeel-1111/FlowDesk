import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../api/axios';

type Status = 'loading' | 'success' | 'error';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<Status>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link.');
      return;
    }

    api.post('/Auth/verify-email', { token })
      .then(() => {
        setStatus('success');
        setMessage('Your email has been verified!');
      })
      .catch((err) => {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Verification failed. The link may have expired.');
      });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
        {status === 'loading' && (
          <>
            <div className="text-5xl mb-4 animate-spin">⏳</div>
            <h1 className="text-xl font-semibold">Verifying your email...</h1>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="text-6xl mb-4">✅</div>
            <h1 className="text-2xl font-bold mb-2 text-green-600">Email Verified!</h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <Link
              to="/login"
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 inline-block"
            >
              Login to FlowDesk
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="text-6xl mb-4">❌</div>
            <h1 className="text-2xl font-bold mb-2 text-red-600">Verification Failed</h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <Link to="/register" className="text-blue-600 hover:underline text-sm">
              Register again
            </Link>
          </>
        )}
      </div>
    </div>
  );
}