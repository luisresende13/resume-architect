import React, { useState, useContext, useRef, useEffect } from 'react';
import { Link, NavLink } from 'react-router-dom';
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
const MenuIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
);
const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
);


const UserMenu: React.FC<{ onLogout: () => void; userEmail: string; }> = ({ onLogout, userEmail }) => {
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
                <div className="absolute right-0 mt-2 w-56 bg-slate-700 rounded-md shadow-lg z-20 ring-1 ring-black ring-opacity-5 transition-all duration-200 ease-out transform opacity-100 scale-100">
                    <div className="py-1">
                        <Link
                            to="/account"
                            onClick={() => setIsOpen(false)}
                            className="w-full text-left flex items-center px-4 py-2 text-sm text-slate-200 hover:bg-slate-600"
                        >
                           <UserIcon className="h-5 w-5 mr-3" />
                           Account
                        </Link>
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

export const Header: React.FC = () => {
  const auth = useContext(AuthContext);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
    `px-4 py-2 text-sm font-medium rounded-md transition-colors ${
      isActive ? 'bg-sky-600 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'
    }`;

  const mobileNavLinkClasses = ({ isActive }: { isActive: boolean }) =>
    `block px-4 py-2 text-base font-medium rounded-md transition-colors ${
      isActive ? 'bg-sky-600 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'
    }`;

  const renderLinks = (isMobile = false) => (
    <>
      {auth.isAuthenticated && auth.user ? (
        <>
          <NavLink to="/master-profile" className={isMobile ? mobileNavLinkClasses : navLinkClasses} onClick={() => setIsMobileMenuOpen(false)}>Master Profile</NavLink>
          <NavLink to="/opportunities" className={isMobile ? mobileNavLinkClasses : navLinkClasses} onClick={() => setIsMobileMenuOpen(false)}>Opportunities</NavLink>
          <div className={`border-slate-600 ${isMobile ? 'border-t mt-4 pt-4' : 'border-l ml-2 pl-2'}`}>
            <UserMenu userEmail={auth.user.email!} onLogout={auth.logout} />
          </div>
        </>
      ) : (
        <>
          <Link to="/login" className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition">Log In</Link>
          <Link to="/register" className="px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-500 transition">Sign Up</Link>
        </>
      )}
    </>
  );

  return (
    <header className="bg-slate-800/50 backdrop-blur-sm sticky top-0 z-10">
      <nav className="container mx-auto px-4 sm:px-6 md:px-8 flex justify-between items-center h-16">
        <Link to={auth.isAuthenticated ? "/master-profile" : "/"} className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-sky-400" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z"></path></svg>
          <h1 className="text-xl font-bold text-white">Resume Architect</h1>
        </Link>
        
        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-2">
          {renderLinks()}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <CloseIcon className="h-6 w-6 text-white" /> : <MenuIcon className="h-6 w-6 text-white" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div className={`md:hidden bg-slate-800 transition-all duration-300 ease-in-out overflow-hidden ${isMobileMenuOpen ? 'max-h-60' : 'max-h-0'}`}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          {renderLinks(true)}
        </div>
      </div>
    </header>
  );
};
