import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { gmailAPI } from '../services/api';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import useAuthStore from '../store/authStore';

const GoogleCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing'); // processing, success, error
  const [message, setMessage] = useState('Connecting your Gmail account...');
  const { user } = useAuthStore();

  useEffect(() => {
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // specific state passed from backend, e.g., childId
    const error = searchParams.get('error');

    if (error) {
      setStatus('error');
      setMessage(`Google Auth Error: ${error}`);
      return;
    }

    if (!code) {
      setStatus('error');
      setMessage('No authorization code found.');
      return;
    }

    // Call backend to exchange code for tokens
    gmailAPI.handleCallback(code, state)
      .then(() => {
        setStatus('success');
        setMessage('Successfully connected Gmail! Redirecting...');
        setTimeout(() => {
          if (user?.role === 'ROLE_CHILD') {
            navigate('/child-dashboard');
          } else if (user?.role === 'ROLE_PARENT') {
            navigate('/parent-dashboard');
          } else {
            // user state unavailable — go to landing page to re-login
            navigate('/');
          }
        }, 2000);
      })
      .catch((err) => {
        console.error(err);
        setStatus('error');
        setMessage(err.response?.data?.error || 'Failed to connect Gmail.');
      });
  }, [searchParams, navigate, user]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-4">
      <div className="bg-slate-800 p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-slate-700">
        
        {status === 'processing' && (
          <>
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Connecting...</h2>
            <p className="text-gray-400">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Connected!</h2>
            <p className="text-gray-400">{message}</p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Connection Failed</h2>
            <p className="text-red-300 mb-6">{message}</p>
            <button 
              onClick={() => navigate('/')}
              className="px-6 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg font-medium transition-colors"
            >
              Back to Home
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default GoogleCallback;
