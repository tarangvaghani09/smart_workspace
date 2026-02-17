import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('https://localhost/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const firstError = data?.errors ? Object.values(data.errors).flat().find(Boolean) : null;
        throw new Error(firstError || data.message || 'Failed to process request');
      }
      toast.success(data.message || 'If this email exists, reset link has been sent.');
      setEmail('');
    } catch (err) {
      toast.error(err.message || 'Failed to process request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <Helmet>
        <title>Forgot Password</title>
      </Helmet>
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100">
          <span className="text-2xl">📩</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Forgot Password</h1>
        <p className="mt-2 text-sm text-slate-500">Enter your registered email to receive reset link.</p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-gray-300 p-3 text-gray-700 outline-none transition focus:border-blue-800 focus:ring-1 focus:ring-blue-800"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className={`w-full rounded-xl px-4 py-2 text-sm font-semibold text-white ${
              loading ? 'cursor-not-allowed bg-gray-400' : 'cursor-pointer bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          Back to{' '}
          <Link to="/" className="font-medium text-indigo-600 hover:text-indigo-500">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
