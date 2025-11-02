
import React, { useState, useContext, useRef, useEffect } from 'react';
import type { AppView } from '../types';
import { AuthContext } from '../contexts/AuthContext';

// Icons
const UserIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"></path></svg>
);
const LogoutIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"></path></svg>
);
const ChevronDownIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
);


interface HeaderProps {
  currentView: AppView;
  navigateTo: (view: AppView) => void;
}

const UserMenu: React.FC<{ onLogout: () => void; navigateTo: (view: AppView) => void; userEmail: string; }> = ({ onLogout, navigateTo, userEmail }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
    return (
        <div className="relative" ref={menuRef}>
            <button onClick={() => setIsOpen(!isOpen)} className="flex items-center space-x-2 text-slate-300 hover:text-white transition rounded-full p-1 hover:bg-slate-700">
                <UserIcon className="h-6 w-6 bg-slate-600 rounded-full p-0.5" />
                <span className="text-sm font-medium hidden sm:block">{userEmail}</span>
                <ChevronDownIcon className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-slate-700 rounded-md shadow-lg z-20 ring-1 ring-black ring-opacity-5">
                    <div className="py-1">
                        <button 
                            onClick={() => { navigateTo('account'); setIsOpen(false); }} 
                            className="w-full text-left flex items-center px-4 py-2 text-sm text-slate-200 hover:bg-slate-600"
                        >
                           <UserIcon className="h-5 w-5 mr-3" />
                           Account
                        </button>
                        <button 
                            onClick={onLogout}
                            className="w-full text-left flex items-center px-4 py-2 text-sm text-slate-200 hover:bg-slate-600"
                        >
                           <LogoutIcon className="h-5 w-5 mr-3" />
                           Logout
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export const Header: React.FC<HeaderProps> = ({ currentView, navigateTo }) => {
  const auth = useContext(AuthContext);

  const NavLink: React.FC<{ view: AppView; children: React.ReactNode }> = ({ view, children }) => {
    const isActive = currentView === view;
    return (
      <button
        onClick={() => navigateTo(view)}
        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
          isActive ? 'bg-sky-600 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'
        }`}
      >
        {children}
      </button>
    );
  };

  const handleLogoClick = () => {
    if (auth.isAuthenticated) {
      navigateTo('master-profile');
    } else {
      navigateTo('landing');
    }
  };

  return (
    <header className="bg-slate-800/50 backdrop-blur-sm sticky top-0 z-10">
      <nav className="container mx-auto px-4 sm:px-6 md:px-8 flex justify-between items-center h-16">
        <button onClick={handleLogoClick} className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-sky-400" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"></path></svg>
          <h1 className="text-xl font-bold text-white">Resume Architect</h1>
        </button>
        <div className="flex items-center space-x-2">
            {auth.isAuthenticated && auth.user ? (
                <>
                    <NavLink view="master-profile">Master Profile</NavLink>
                    <NavLink view="opportunities">Opportunities</NavLink>
                    <div className="border-l border-slate-600 ml-2 pl-2">
                       <UserMenu userEmail={auth.user.email} onLogout={auth.logout} navigateTo={navigateTo} />
                    </div>
                </>
            ) : (
                <>
                    <button onClick={() => navigateTo('login')} className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition">Log In</button>
                    <button onClick={() => navigateTo('register')} className="px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-500 transition">Sign Up</button>
                </>
            )}
        </div>
      </nav>
    </header>
  );
};
