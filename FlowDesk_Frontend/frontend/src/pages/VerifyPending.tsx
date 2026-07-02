import { useLocation, Link } from 'react-router-dom';

export default function VerifyPending() {
  const location = useLocation();
  const email = location.state?.email || 'your email';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
        <div className="text-6xl mb-4">📧</div>
        <h1 className="text-2xl font-bold mb-2">Check your inbox</h1>
        <p className="text-gray-600 mb-4">
          We sent a verification link to <span className="font-semibold text-blue-600">{email}</span>
        </p>
        <p className="text-sm text-gray-500 mb-6">
          Click the link in the email to verify your account. The link expires in 24 hours.
        </p>

        <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-700 mb-6">
          Didn't receive it? Check your spam folder or{' '}
          <button className="underline font-medium">resend the email</button>
        </div>

        <Link to="/login" className="text-sm text-gray-500 hover:underline">
          Back to login
        </Link>
      </div>
    </div>
  );
}