
import React, { useState, useEffect } from 'react';
import * as api from '../services/apiService';
import { notifySuccess, notifyError } from '../services/notificationService';
import type { GeneratedItem, MasterProfileSection } from '../types';

interface ReviewScreenProps {
  items: GeneratedItem[];
  section: MasterProfileSection;
  mode: 'replace' | 'complement';
  onComplete: () => void;
}

const ProfileItemCard: React.FC<{
  item: GeneratedItem;
  section: MasterProfileSection;
  isSelected: boolean;
  onToggle: () => void;
}> = ({ item, section, isSelected, onToggle }) => {
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
        return (
            <div
                onClick={onToggle}
                className={`bg-slate-700/50 p-4 rounded-md cursor-pointer transition-all ${
                    isSelected ? 'ring-2 ring-sky-500 bg-slate-700' : 'hover:bg-slate-700/70'
                }`}
            >
                <div className="flex items-start space-x-3">
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={onToggle}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-1 h-5 w-5 rounded border-slate-600 bg-slate-800 text-sky-500 focus:ring-sky-500 focus:ring-offset-slate-900 cursor-pointer"
                    />
                    <div className="flex-grow">{renderContent()}</div>
                </div>
            </div>
        );
    }
    
    if (isPill) {
        return (
            <div
                onClick={onToggle}
                className={`inline-flex items-center space-x-2 cursor-pointer transition-all ${
                    isSelected ? 'ring-2 ring-sky-500' : ''
                } rounded-full`}
            >
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={onToggle}
                    onClick={(e) => e.stopPropagation()}
                    className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-sky-500 focus:ring-sky-500 focus:ring-offset-slate-900 cursor-pointer"
                />
                {renderContent()}
            </div>
        );
    }
    
    return (
        <div
            onClick={onToggle}
            className={`bg-slate-700/50 p-4 rounded-md cursor-pointer transition-all ${
                isSelected ? 'ring-2 ring-sky-500 bg-slate-700' : 'hover:bg-slate-700/70'
            }`}
        >
            <div className="flex items-start space-x-3">
                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={onToggle}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-1 h-5 w-5 rounded border-slate-600 bg-slate-800 text-sky-500 focus:ring-sky-500 focus:ring-offset-slate-900 cursor-pointer"
                />
                <div className="flex-grow">{renderContent()}</div>
            </div>
        </div>
    );
};


export const ReviewScreen: React.FC<ReviewScreenProps> = ({ items, section, mode, onComplete }) => {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  
  // Initialize all items as selected by default
  useEffect(() => {
    const allIds = new Set(items.map((item, index) => item.id || `temp-${index}`));
    setSelectedItems(allIds);
  }, [items]);
  
  const handleToggleItem = (itemId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };
  
  const handleSelectAll = () => {
    const allIds = new Set(items.map((item, index) => item.id || `temp-${index}`));
    setSelectedItems(allIds);
  };
  
  const handleDeselectAll = () => {
    setSelectedItems(new Set());
  };
  
  const handleConfirm = async () => {
    // Filter items to only include selected ones
    const itemsToSave = items.filter((item, index) => {
      const itemId = item.id || `temp-${index}`;
      return selectedItems.has(itemId);
    });
    
    if (itemsToSave.length === 0) {
      notifyError("Please select at least one item to add.");
      return;
    }
    
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
            const newInfo = itemsToSave[0] as any;
            // Destructure to remove the temporary 'id' field before saving.
            const { id, ...infoToSave } = newInfo;
            const updatedProfile = { ...currentProfile, personal_info: infoToSave };
            await api.updateMasterProfile(updatedProfile);
        } else {
            let updatedItems;
            if (mode === 'replace') {
                updatedItems = itemsToSave;
            } else {
                const currentItems = (currentProfile[section] as GeneratedItem[]) || [];
                updatedItems = [...currentItems, ...itemsToSave];
            }
            await api.updateMasterProfile({ ...currentProfile, [section]: updatedItems });
        }
        
        notifySuccess(`Master Profile updated with ${itemsToSave.length} item${itemsToSave.length > 1 ? 's' : ''}!`);
        onComplete();
    } catch (error) {
        notifyError("Failed to update master profile.");
    }
  };

  const handleDiscard = () => {
    onComplete();
  };

  const capitalizedSection = section.charAt(0).toUpperCase() + section.slice(1);
  const selectedCount = selectedItems.size;
  const totalCount = items.length;
  const allSelected = selectedCount === totalCount;
  const noneSelected = selectedCount === 0;
  
  const confirmButtonText = mode === 'replace'
    ? `Confirm & Replace Section (${selectedCount} item${selectedCount !== 1 ? 's' : ''})`
    : `Confirm & Add to Profile (${selectedCount} item${selectedCount !== 1 ? 's' : ''})`;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-slate-800 rounded-lg p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Review Generated Items for {capitalizedSection}</h2>
            <p className="text-slate-400 mt-1">Select the items you want to add to your profile</p>
          </div>
          {items.length > 0 && (
            <div className="text-right">
              <div className="text-sm font-medium text-slate-300 mb-2">
                {selectedCount} of {totalCount} selected
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleSelectAll}
                  disabled={allSelected}
                  className="px-3 py-1 text-sm rounded-md font-medium text-sky-400 bg-sky-900/30 hover:bg-sky-900/50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Select All
                </button>
                <button
                  onClick={handleDeselectAll}
                  disabled={noneSelected}
                  className="px-3 py-1 text-sm rounded-md font-medium text-slate-400 bg-slate-700 hover:bg-slate-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Deselect All
                </button>
              </div>
            </div>
          )}
        </div>
        
        {items.length > 0 ? (
          <div className={`grid gap-4 ${section === 'skills' || section === 'languages' ? 'flex flex-wrap gap-2 items-center' : 'grid-cols-1'}`}>
            {items.map((item, index) => {
              const itemId = item.id || `temp-${index}`;
              return (
                <ProfileItemCard
                  key={itemId}
                  item={item}
                  section={section}
                  isSelected={selectedItems.has(itemId)}
                  onToggle={() => handleToggleItem(itemId)}
                />
              );
            })}
          </div>
        ) : (
          <div className="text-center py-10">
              <p className="text-slate-400">The AI didn't find any new items for this section from the selected documents.</p>
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-slate-700">
           {items.length > 0 ? (
              <div className="flex justify-between items-center">
                <div className="text-sm text-slate-400">
                  {noneSelected && (
                    <span className="text-amber-400">⚠ Please select at least one item</span>
                  )}
                </div>
                <div className="flex space-x-4">
                  <button onClick={handleDiscard} className="px-6 py-2 rounded-md font-semibold text-slate-200 bg-slate-600 hover:bg-slate-500 transition">
                    Discard All
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={noneSelected}
                    className="px-6 py-2 rounded-md font-semibold text-white bg-sky-600 hover:bg-sky-500 transition disabled:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {confirmButtonText}
                  </button>
                </div>
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
