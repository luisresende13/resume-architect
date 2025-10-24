import React from 'react';
import { Modal } from './Modal';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const InfoCard: React.FC<{ number: number; title: string; children: React.ReactNode }> = ({ number, title, children }) => (
    <div className="flex items-start space-x-4">
        <div className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full bg-sky-600 text-white font-bold">
            {number}
        </div>
        <div>
            <h4 className="font-semibold text-lg text-white">{title}</h4>
            <p className="text-slate-400">{children}</p>
        </div>
    </div>
);

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Welcome to Resume Architect!">
      <div className="space-y-6">
        <p className="text-slate-300">
          This tool helps you build a master professional profile and generate tailored resumes in three simple steps.
        </p>

        <div className="space-y-5">
            <InfoCard number={1} title="Upload Documents">
                Start by uploading your existing resumes, cover letters, or any career-related documents.
            </InfoCard>
            <InfoCard number={2} title="Generate Master Profile">
                Use AI to extract and consolidate all your career information into one central, editable profile.
            </InfoCard>
             <InfoCard number={3} title="Create Tailored Resumes">
                Paste a job description to generate a new resume, perfectly tailored with the most relevant information from your profile.
            </InfoCard>
        </div>

        <div className="flex justify-end pt-4">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-md font-semibold text-white bg-sky-600 hover:bg-sky-500 transition"
          >
            Get Started
          </button>
        </div>
      </div>
    </Modal>
  );
};