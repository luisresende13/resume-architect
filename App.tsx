import React, { useContext } from 'react';
import { Toaster } from 'react-hot-toast';
import { Routes, Route, useLocation, Navigate, Outlet, useParams } from 'react-router-dom';
import { Header } from './components/Header';
import { LandingPage } from './screens/LandingPage';
import { ReviewScreen } from './screens/ReviewScreen';
import { LoginScreen } from './screens/LoginScreen';
import { RegisterScreen } from './screens/RegisterScreen';
import { PasswordResetScreen } from './screens/PasswordResetScreen';
import { AccountScreen } from './screens/AccountScreen';
import { MasterProfileScreen } from './screens/MasterProfileScreen';
import { OpportunitiesDashboard } from './screens/OpportunitiesDashboard';
import { OpportunityWorkspace } from './screens/OpportunityWorkspace';
import { ResumeEditor } from './screens/ResumeEditor';
import { MasterProfileSection, GenerationMode, GeneratedItem } from './types';
import { AuthContext } from './contexts/AuthContext';
import './components/styles.css';

const ProtectedRoute: React.FC = () => {
  const { isAuthenticated } = useContext(AuthContext);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};


const OpportunityWorkspaceWrapper = () => {
    const { opportunityId } = useParams<{ opportunityId: string }>();
    if (!opportunityId) return <Navigate to="/opportunities" />;
    return <OpportunityWorkspace opportunityId={opportunityId} />;
};

const ResumeEditorWrapper = () => {
    const { draftId } = useParams<{ draftId: string }>();
    if (!draftId) return <Navigate to="/opportunities" />;
    return <ResumeEditor draftId={draftId} />;
};


const App: React.FC = () => {
  const auth = useContext(AuthContext);
  const location = useLocation();

  if (auth.isLoading) {
    return (
        <div className="min-h-screen bg-slate-900 flex justify-center items-center">
            <svg className="animate-spin h-10 w-10 text-sky-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
        </div>
    );
  }

  const useGlobalPadding = !(location.pathname === '/') && !(location.pathname === '/login');
  const reviewState = location.state as {
    items: GeneratedItem[];
    section: MasterProfileSection;
    mode: GenerationMode;
  } | null;

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
      <Header />
      <main className="relative">
        <div key={location.pathname} className={`${useGlobalPadding ? "p-4 sm:p-6 md:p-8" : ""} page-transition`}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginScreen />} />
            <Route path="/register" element={<RegisterScreen />} />
            <Route path="/password-reset" element={<PasswordResetScreen />} />
            
            <Route element={<ProtectedRoute />}>
              <Route path="/account" element={<AccountScreen />} />
              <Route path="/master-profile" element={<MasterProfileScreen />} />
              <Route path="/opportunities" element={<OpportunitiesDashboard />} />
              <Route path="/opportunities/:opportunityId" element={<OpportunityWorkspaceWrapper />} />
              <Route path="/drafts/:draftId/edit" element={<ResumeEditorWrapper />} />
              <Route
                path="/review"
                element={
                  reviewState ? (
                    <ReviewScreen
                      items={reviewState.items}
                      section={reviewState.section}
                      mode={reviewState.mode}
                    />
                  ) : (
                    <Navigate to="/master-profile" replace />
                  )
                }
              />
            </Route>
          </Routes>
        </div>
      </main>
    </div>
  );
};

export default App;
