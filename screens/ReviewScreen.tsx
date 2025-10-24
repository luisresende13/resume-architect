
import React from 'react';
import * as api from '../services/apiService';
import { notifySuccess, notifyError } from '../services/notificationService';
import type { GeneratedItem, MasterProfileSection } from '../types';

interface ReviewScreenProps {
  items: GeneratedItem[];
  section: MasterProfileSection;
  mode: 'replace' | 'complement';
  onComplete: () => void;
}

const ProfileItemCard: React.FC<{ item: GeneratedItem; section: MasterProfileSection }> = ({ item, section }) => {
    const renderContent = () => {
        switch (section) {
            case 'personal_info':
                const info = item as any;
                return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm text-slate-300">
                        <div><strong>Name:</strong> {info.name}</div>
                        <div><strong>Email:</strong> {info.email}</div>
                        <div><strong>Phone:</strong> {info.phone}</div>
                        <div><strong>LinkedIn:</strong> {info.linkedin}</div>
                        <div><strong>Portfolio:</strong> {info.portfolio}</div>
                        <div><strong>GitHub:</strong> {info.github}</div>
                    </div>
                );
            case 'experience':
                const exp = item as any;
                return <>
                    <h4 className="font-semibold text-white">{exp.title}</h4>
                    <p className="text-sm text-sky-400">{exp.company} | {exp.dates}</p>
                    <p className="text-sm mt-1 text-slate-300">{exp.description}</p>
                </>;
            case 'skills':
                 return <span className="font-medium text-white bg-sky-800/50 px-3 py-1 rounded-full text-sm">{ (item as any).name }</span>;
            case 'projects':
                const proj = item as any;
                return <>
                    <h4 className="font-semibold text-white">{proj.name}</h4>
                    <p className="text-sm mt-1 text-slate-300">{proj.description}</p>
                </>;
            case 'education':
                const edu = item as any;
                return <>
                    <h4 className="font-semibold text-white">{edu.institution}</h4>
                    <p className="text-sm text-sky-400">{edu.degree} | {edu.dates}</p>
                    {edu.description && <p className="text-sm mt-1 text-slate-300">{edu.description}</p>}
                </>;
            case 'certifications':
                const cert = item as any;
                return <>
                    <h4 className="font-semibold text-white">{cert.name}</h4>
                    <p className="text-sm text-sky-400">{cert.issuingOrganization} | {cert.date}</p>
                </>;
            case 'awards':
                const award = item as any;
                return <>
                    <h4 className="font-semibold text-white">{award.name}</h4>
                    <p className="text-sm text-sky-400">{award.issuer} | {award.date}</p>
                </>;
            case 'languages':
                const lang = item as any;
                return <span className="font-medium text-white bg-sky-800/50 px-3 py-1 rounded-full text-sm">{lang.name} ({lang.proficiency})</span>;
        }
    }
    const isPill = ['skills', 'languages'].includes(section);
    if (section === 'personal_info') {
        return <div className="bg-slate-700/50 p-4 rounded-md">{renderContent()}</div>;
    }
    return <div className={isPill ? '' : 'bg-slate-700/50 p-4 rounded-md'}>{renderContent()}</div>
};


export const ReviewScreen: React.FC<ReviewScreenProps> = ({ items, section, mode, onComplete }) => {
  
  const handleConfirm = async () => {
    try {
        let currentProfile = await api.getMasterProfile();
        
        // If no profile exists, create a default structure.
        if (!currentProfile) {
            console.log("No master profile found, creating a new one.");
            currentProfile = {
                personal_info: { name: '', email: '', phone: '', linkedin: '', portfolio: '', github: '' },
                experience: [],
                skills: [],
                projects: [],
                education: [],
                certifications: [],
                awards: [],
                languages: [],
            };
        }

        if (section === 'personal_info') {
            // Personal info is an object, not an array.
            // The 'items' for personal_info should be a single object.
            const newInfo = items[0] as any; 
            const updatedProfile = { ...currentProfile, personal_info: { ...currentProfile.personal_info, ...newInfo } };
            await api.updateMasterProfile(updatedProfile);
        } else {
            let updatedItems;
            if (mode === 'replace') {
                updatedItems = items;
            } else {
                const currentItems = (currentProfile[section] as GeneratedItem[]) || [];
                updatedItems = [...currentItems, ...items];
            }
            await api.updateMasterProfile({ ...currentProfile, [section]: updatedItems });
        }
        
        notifySuccess('Master Profile has been updated!');
        onComplete();
    } catch (error) {
        notifyError("Failed to update master profile.");
    }
  };

  const handleDiscard = () => {
    onComplete();
  };

  const capitalizedSection = section.charAt(0).toUpperCase() + section.slice(1);
  const confirmButtonText = mode === 'replace' ? 'Confirm & Replace Section' : 'Confirm & Add to Profile';

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-slate-800 rounded-lg p-6">
        <h2 className="text-2xl font-bold text-white mb-4">Review Generated Items for {capitalizedSection}</h2>
        
        {items.length > 0 ? (
          <div className={`grid gap-4 ${section === 'skills' || section === 'languages' ? 'flex flex-wrap gap-2 items-center' : 'grid-cols-1'}`}>
            {items.map((item, index) => (
              <ProfileItemCard key={item.id || index} item={item} section={section} />
            ))}
          </div>
        ) : (
          <div className="text-center py-10">
              <p className="text-slate-400">The AI didn't find any new items for this section from the selected documents.</p>
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-slate-700">
           {items.length > 0 ? (
              <div className="flex justify-end space-x-4">
                <button onClick={handleDiscard} className="px-6 py-2 rounded-md font-semibold text-slate-200 bg-slate-600 hover:bg-slate-500 transition">
                  Discard
                </button>
                <button onClick={handleConfirm} className="px-6 py-2 rounded-md font-semibold text-white bg-sky-600 hover:bg-sky-500 transition">
                  {confirmButtonText}
                </button>
              </div>
           ) : (
              <div className="flex justify-end">
                <button onClick={handleDiscard} className="px-6 py-2 rounded-md font-semibold text-white bg-sky-600 hover:bg-sky-500 transition">
                  Back to Dashboard
                </button>
              </div>
           )}
        </div>
      </div>
    </div>
  );
};
