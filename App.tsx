
import React, { useState, useCallback, useContext } from 'react';
import { Toaster } from 'react-hot-toast';
import { Header } from './components/Header';
import { Dashboard } from './screens/Dashboard';
import { GenerateResume } from './screens/GenerateResume';
import { ReviewScreen } from './screens/ReviewScreen';
import { LoginScreen } from './screens/LoginScreen';
import { RegisterScreen } from './screens/RegisterScreen';
import { PasswordResetScreen } from './screens/PasswordResetScreen';
import { AccountScreen } from './screens/AccountScreen';
import { AppView, MasterProfileSection } from './types';
import type { GeneratedItem } from './types';
import { AuthContext } from './contexts/AuthContext';

const App: React.FC = () => {
  const auth = useContext(AuthContext);
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [reviewData, setReviewData] = useState<{
    items: GeneratedItem[];
    section: MasterProfileSection;
    mode: 'replace' | 'complement';
  } | null>(null);

  const navigateTo = useCallback((view: AppView) => {
    setCurrentView(view);
  }, []);

  const startReview = useCallback((items: GeneratedItem[], section: MasterProfileSection, mode: 'replace' | 'complement') => {
    setReviewData({ items, section, mode });
    setCurrentView('review');
  }, []);

  const renderContent = () => {
    const protectedViews: AppView[] = ['dashboard', 'generate-resume', 'review', 'account'];

    if (!auth.isAuthenticated && protectedViews.includes(currentView)) {
        // Redirect to login if trying to access a protected route while not authenticated
        return <LoginScreen navigateTo={navigateTo} />;
    }

    switch (currentView) {
      case 'dashboard':
        return <Dashboard onStartGenerate={startReview} />;
      case 'generate-resume':
        return <GenerateResume />;
      case 'review':
        if (reviewData) {
          return (
            <ReviewScreen
              items={reviewData.items}
              section={reviewData.section}
              mode={reviewData.mode}
              onComplete={() => navigateTo('dashboard')}
            />
          );
        }
        navigateTo('dashboard');
        return null;
      case 'login':
        return <LoginScreen navigateTo={navigateTo} />;
      case 'register':
        return <RegisterScreen navigateTo={navigateTo} />;
      case 'password-reset':
        return <PasswordResetScreen navigateTo={navigateTo} />;
      case 'account':
        return <AccountScreen />;
      default:
        return <Dashboard onStartGenerate={startReview} />;
    }
  };
  
  // Set initial view based on auth state
  if (auth.isLoading) {
    return (
        <div className="min-h-screen bg-slate-900 flex justify-center items-center">
            <svg className="animate-spin h-10 w-10 text-sky-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 font-sans">
      <Toaster 
        position="top-center"
        toastOptions={{
          style: {
            background: '#334155', // slate-700
            color: '#e2e8f0', // slate-200
          },
        }}
      />
      {auth.isAuthenticated && <Header currentView={currentView} navigateTo={navigateTo} />}
      <main className={auth.isAuthenticated ? "p-4 sm:p-6 md:p-8" : ""}>
        {renderContent()}
      </main>
    </div>
  );
};

export default App;
