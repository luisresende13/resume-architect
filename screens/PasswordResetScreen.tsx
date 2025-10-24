
import React, { useState, useContext } from 'react';
import { AppView } from '../types';
import { AuthLayout } from '../components/AuthLayout';
import { AuthContext } from '../contexts/AuthContext';

interface PasswordResetScreenProps {
  navigateTo: (view: AppView) => void;
}

export const PasswordResetScreen: React.FC<PasswordResetScreenProps> = ({ navigateTo }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const auth = useContext(AuthContext);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const success = await auth.resetPassword(email);
    if (success) {
      setSubmitted(true);
    }
    setIsLoading(false);
  };

  const inputClass = "w-full bg-slate-900 border border-slate-600 rounded-md p-3 text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition";
  const buttonClass = "w-full flex justify-center items-center bg-sky-600 text-white font-semibold py-3 px-4 rounded-md hover:bg-sky-500 transition disabled:bg-slate-500 disabled:cursor-not-allowed";

  return (
    <AuthLayout title="Reset Your Password">
      {submitted ? (
        <div className="text-center">
          <p className="text-slate-300 mb-6">A password reset link has been sent to <span className="font-medium text-white">{email}</span>. Please check your inbox.</p>
          <button onClick={() => navigateTo('login')} className="text-sm text-sky-400 hover:text-sky-300">
            &larr; Back to Log In
          </button>
        </div>
      ) : (
        <>
          <p className="text-center text-sm text-slate-400 mb-6">Enter your email address and we will send you a link to reset your password.</p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email Address" className={inputClass} required />
            <button type="submit" className={buttonClass} disabled={isLoading || !email}>
              {isLoading && <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
              {isLoading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
          <p className="text-center text-sm text-slate-400 mt-8">
            Remember your password? <button onClick={() => navigateTo('login')} className="font-medium text-sky-400 hover:text-sky-300">Log In</button>
          </p>
        </>
      )}
    </AuthLayout>
  );
};
