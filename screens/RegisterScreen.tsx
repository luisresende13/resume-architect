
import React, { useState, useContext, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { AuthLayout } from '../components/AuthLayout';
import { FcGoogle } from 'react-icons/fc';

const CheckIcon = ({ className }: { className: string }) => <svg className={className} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>;
const CrossIcon = ({ className }: { className: string }) => <svg className={className} viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.697a1 1 0 010-1.414z" clipRule="evenodd" /></svg>;

export const RegisterScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const auth = useContext(AuthContext);

  const passwordValidations = useMemo(() => {
    const hasLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const passwordsMatch = password && password === confirmPassword;
    return { hasLength, hasUppercase, hasNumber, passwordsMatch };
  }, [password, confirmPassword]);

  const isFormValid = Object.values(passwordValidations).every(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;
    setIsLoading(true);
    const success = await auth.register(email, password);
    // The new register function will show a notification
    // We don't navigate to dashboard immediately, user must verify email first.
    // A better UX would be to show a "Check your email" message.
    // For now, we'll just rely on the toast notification.
    setIsLoading(false);
  };

  const inputClass = "w-full bg-slate-900 border border-slate-600 rounded-md p-3 text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors";
  const buttonClass = "w-full flex justify-center items-center bg-sky-600 text-white font-semibold py-3 px-4 rounded-md hover:bg-sky-500 transition-colors disabled:bg-slate-500 disabled:cursor-not-allowed";
  
  const ValidationIndicator: React.FC<{ isValid: boolean, text: string }> = ({ isValid, text }) => (
    <div className={`flex items-center text-xs transition-colors ${isValid ? 'text-green-400' : 'text-slate-400'}`}>
        {isValid ? <CheckIcon className="h-4 w-4 mr-1.5 transform scale-100 transition-transform" /> : <CrossIcon className="h-4 w-4 mr-1.5 text-slate-500" />}
        {text}
    </div>
  );
  
  return (
    <AuthLayout title="Create a New Account">
      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email Address" className={inputClass} required />
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" className={inputClass} required />
        <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm Password" className={inputClass} required />
        
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-1">
            <ValidationIndicator isValid={passwordValidations.hasLength} text="8+ characters" />
            <ValidationIndicator isValid={passwordValidations.hasUppercase} text="1 uppercase" />
            <ValidationIndicator isValid={passwordValidations.hasNumber} text="1 number" />
            <ValidationIndicator isValid={passwordValidations.passwordsMatch} text="Passwords match" />
        </div>

        <button type="submit" className={`${buttonClass} mt-2`} disabled={isLoading || !isFormValid}>
            {isLoading && <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
            {isLoading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>

      <div className="relative my-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-600"></div></div>
          <div className="relative flex justify-center text-sm"><span className="px-2 bg-slate-800 text-slate-400">Or continue with</span></div>
      </div>

      <div className="grid gap-4">
          <button onClick={auth.loginWithGoogle} className="w-full flex items-center justify-center space-x-2 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-md text-white font-medium text-sm transition"><FcGoogle className="h-5 w-5" /><span>Google</span></button>
      </div>

      <p className="text-center text-sm text-slate-400 mt-8">
        Already have an account? <Link to="/login" className="font-medium text-sky-400 hover:text-sky-300">Log In</Link>
      </p>
    </AuthLayout>
  );
};
