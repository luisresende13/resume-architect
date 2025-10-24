
import React from 'react';

interface AuthLayoutProps {
  title: string;
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ title, children }) => {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-slate-900 p-4">
       <div className="flex items-center space-x-3 mb-8">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-sky-400" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"></path></svg>
          <h1 className="text-3xl font-bold text-white">Resume Architect</h1>
        </div>
      <div className="w-full max-w-md">
        <div className="bg-slate-800 rounded-lg shadow-xl p-6 sm:p-8">
          <h2 className="text-2xl font-bold text-center text-white mb-6">{title}</h2>
          {children}
        </div>
      </div>
    </div>
  );
};
