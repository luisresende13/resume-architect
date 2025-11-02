import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProfileTab } from '../components/ProfileTab';
import { SourcesTab } from '../components/SourcesTab';
import * as api from '../services/apiService';
import { Document, GeneratedItem, MasterProfileSection, GenerationMode } from '../types';
import { OnboardingModal } from '../components/OnboardingModal';

type Tab = 'sources' | 'profile';

export const MasterProfileScreen: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
        const docs = await api.getDocuments();
        setDocuments(docs);
    } catch (error) {
        console.error("Failed to load documents:", error);
    } finally {
        setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    if (localStorage.getItem('onboardingComplete') !== 'true') {
        setShowOnboarding(true);
    }
  }, [loadData]);

  const handleOnboardingClose = () => {
    localStorage.setItem('onboardingComplete', 'true');
    setShowOnboarding(false);
  };

  const onStartGenerate = (items: GeneratedItem[], section: MasterProfileSection, mode: GenerationMode) => {
    navigate('/review', { state: { items, section, mode } });
  };

  return (
    <div className="space-y-6">
        <OnboardingModal isOpen={showOnboarding} onClose={handleOnboardingClose} />
      <div className="flex border-b border-slate-700">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2 text-lg font-medium transition ${
            activeTab === 'profile'
              ? 'border-b-2 border-sky-500 text-white'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Master Profile
        </button>
        <button
          onClick={() => setActiveTab('sources')}
          className={`px-4 py-2 text-lg font-medium transition ${
            activeTab === 'sources'
              ? 'border-b-2 border-sky-500 text-white'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Sources
        </button>
      </div>

      <div>
        {activeTab === 'profile' && (
            <ProfileTab documents={documents} onStartGenerate={onStartGenerate} />
        )}
        {activeTab === 'sources' && (
            <SourcesTab documents={documents} loadData={loadData} isLoading={isLoading} />
        )}
      </div>
    </div>
  );
};