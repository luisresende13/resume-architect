
import React, { useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { AppView } from '../types';
import { AuthLayout } from '../components/AuthLayout';

interface LoginScreenProps {
  navigateTo: (view: AppView) => void;
}

const GoogleIcon = () => <svg className="h-5 w-5" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039L38.802 6.57C34.566 2.734 29.626 0 24 0C10.745 0 0 10.745 0 24s10.745 24 24 24s24-10.745 24-24c0-1.341-.128-2.65-.359-3.917z"></path><path fill="#FF3D00" d="M6.306 14.691c-1.229 2.222-1.903 4.79-1.903 7.558s.674 5.336 1.903 7.558L12.381 26.6C10.041 22.42 10.041 17.58 12.381 13.4z"></path><path fill="#4CAF50" d="M24 48c5.636 0 10.573-2.181 14.158-5.819L32.144 36.4C29.69 38.62 26.96 40 24 40c-4.45 0-8.31-2.007-10.61-5.025L6.306 31.447C10.046 39.585 16.463 48 24 48z"></path><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-4.45 0-8.31-2.007-10.61-5.025l-7.084 6.887C10.046 39.585 16.463 48 24 48s13.954-8.415 17.694-20.553L43.611 20.083z"></path></svg>;
// const LinkedInIcon = () => <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"></path></svg>;

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigateTo }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const auth = useContext(AuthContext);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const success = await auth.login(email, password);
    if (success) {
      navigateTo('dashboard');
    }
    setIsLoading(false);
  };

  const inputClass = "w-full bg-slate-900 border border-slate-600 rounded-md p-3 text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition";
  const buttonClass = "w-full flex justify-center items-center bg-sky-600 text-white font-semibold py-3 px-4 rounded-md hover:bg-sky-500 transition disabled:bg-slate-500 disabled:cursor-not-allowed";

  return (
    <AuthLayout title="Log In to Your Account">
        <form onSubmit={handleSubmit} className="space-y-4">
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email Address" className={inputClass} required />
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" className={inputClass} required />
            <button type="submit" className={buttonClass} disabled={isLoading}>
                 {isLoading && <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                {isLoading ? 'Logging In...' : 'Log In'}
            </button>
        </form>

        <div className="text-right mt-4">
            <button onClick={() => navigateTo('password-reset')} className="text-sm text-sky-400 hover:text-sky-300">Forgot Password?</button>
        </div>

        <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-600"></div></div>
            <div className="relative flex justify-center text-sm"><span className="px-2 bg-slate-800 text-slate-400">Or continue with</span></div>
        </div>

        <div className="grid gap-4">
            <button onClick={auth.loginWithGoogle} className="w-full flex items-center justify-center space-x-2 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-md text-white font-medium text-sm transition"><GoogleIcon /><span>Google</span></button>
            {/* <button onClick={auth.loginWithLinkedIn} className="w-full flex items-center justify-center space-x-2 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-md text-white font-medium text-sm transition"><LinkedInIcon /><span>LinkedIn</span></button> */}
        </div>

        <p className="text-center text-sm text-slate-400 mt-8">
            Don't have an account? <button onClick={() => navigateTo('register')} className="font-medium text-sky-400 hover:text-sky-300">Sign Up</button>
        </p>
    </AuthLayout>
  );
};
