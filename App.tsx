import React, { useState, useCallback, useContext, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { Header } from './components/Header';
import { ReviewScreen } from './screens/ReviewScreen';
import { LoginScreen } from './screens/LoginScreen';
import { RegisterScreen } from './screens/RegisterScreen';
import { PasswordResetScreen } from './screens/PasswordResetScreen';
import { AccountScreen } from './screens/AccountScreen';
import { MasterProfileScreen } from './screens/MasterProfileScreen';
import { OpportunitiesDashboard } from './screens/OpportunitiesDashboard';
import { OpportunityWorkspace } from './screens/OpportunityWorkspace';
import { ResumeEditor } from './screens/ResumeEditor';
import { AppView, MasterProfileSection, GenerationMode, GeneratedItem } from './types';
import { AuthContext } from './contexts/AuthContext';
import './components/styles.css';

const App: React.FC = () => {
  const auth = useContext(AuthContext);
  const [currentView, setCurrentView] = useState<AppView>('master-profile');
  const [activeOpportunityId, setActiveOpportunityId] = useState<string | null>(null);
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
  const [reviewData, setReviewData] = useState<{
    items: GeneratedItem[];
    section: MasterProfileSection;
    mode: GenerationMode;
  } | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const navigateTo = useCallback((view: AppView) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentView(view);
      setIsTransitioning(false);
    }, 150); // Half of the transition duration for cross-fade effect
  }, []);

  useEffect(() => {
    setIsTransitioning(false);
  }, [currentView]);

  const startReview = useCallback((items: GeneratedItem[], section: MasterProfileSection, mode: GenerationMode) => {
    setReviewData({ items, section, mode });
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentView('review');
      setIsTransitioning(false);
    }, 150);
  }, []);

  const navigateToWorkspace = useCallback((opportunityId: string) => {
    setActiveOpportunityId(opportunityId);
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentView('opportunity-workspace');
      setIsTransitioning(false);
    }, 150);
  }, []);

  const navigateToEditor = useCallback((draftId: string) => {
    setActiveDraftId(draftId);
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentView('resume-editor');
      setIsTransitioning(false);
    }, 150);
  }, []);

  const renderContent = () => {
    const protectedViews: AppView[] = ['master-profile', 'opportunities', 'opportunity-workspace', 'resume-editor', 'review', 'account'];

    if (!auth.isAuthenticated && protectedViews.includes(currentView)) {
        return <LoginScreen navigateTo={navigateTo} />;
    }

    switch (currentView) {
      case 'master-profile':
        return <MasterProfileScreen onStartGenerate={startReview} />;
      case 'opportunities':
        return <OpportunitiesDashboard navigateToWorkspace={navigateToWorkspace} />;
      case 'opportunity-workspace':
        if (activeOpportunityId) {
          return <OpportunityWorkspace opportunityId={activeOpportunityId} navigateToEditor={navigateToEditor} navigateBack={() => setCurrentView('opportunities')} />;
        }
        setCurrentView('opportunities');
        return null;
      case 'resume-editor':
        if (activeDraftId) {
          return <ResumeEditor
            draftId={activeDraftId}
            navigateToOpportunities={() => setCurrentView('opportunities')}
            navigateToWorkspace={navigateToWorkspace}
          />;
        }
        setCurrentView('opportunity-workspace');
        return null;
      case 'review':
        if (reviewData) {
          return (
            <ReviewScreen
              items={reviewData.items}
              section={reviewData.section}
              mode={reviewData.mode}
              onComplete={() => navigateTo('master-profile')}
            />
          );
        }
        navigateTo('master-profile');
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
        return <MasterProfileScreen onStartGenerate={startReview} />;
    }
  };
  
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
            background: '#334155',
            color: '#e2e8f0',
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
