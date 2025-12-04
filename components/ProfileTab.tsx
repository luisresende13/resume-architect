import React, { useState, useEffect, useCallback } from 'react';
import * as api from '../services/apiService';
import { generateSection } from '../services/geminiService';
import { notifySuccess, notifyError } from '../services/notificationService';
import { Document, MasterProfile, MasterProfileSection, GeneratedItem, GenerationMode, Experience, Skill, Project, Education, Certification, Award, Language, PersonalInfo } from '../types';
import { Modal } from './Modal';
import { MasterProfileSkeleton } from './SkeletonLoader';

// Icons
const TrashIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path></svg>
);
const ChevronDownIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
);
const EditIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"></path></svg>
);

const PersonalInfoSection: React.FC<{
  info: PersonalInfo;
  onSave: (newInfo: PersonalInfo) => void;
  onGenerate: (selectedDocs: Document[], mode: GenerationMode, instructions: string) => Promise<void>;
  documents: Document[];
}> = ({ info, onSave, onGenerate, documents }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(info);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    setFormData(info);
  }, [info]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    onSave(formData);
    setIsEditing(false);
  };

  const handleGenerateSubmit = async (selectedDocs: Document[], mode: GenerationMode, instructions: string) => {
    await onGenerate(selectedDocs, mode, instructions);
    setIsGenerating(false);
  };

  const inputClass = "w-full bg-slate-900 border border-slate-600 rounded-md p-2 text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition";

  return (
    <div className="bg-slate-800 rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-white">Personal Information</h3>
        <div className="flex items-center space-x-4">
          {!isEditing && (
            <button onClick={() => { setIsEditing(true); setIsGenerating(false); }} className="flex items-center space-x-2 px-3 py-1 text-sm font-medium text-white bg-slate-600 rounded-md hover:bg-slate-500 transition">
              <EditIcon className="h-4 w-4" />
              <span>Edit</span>
            </button>
          )}
          <button onClick={() => { setIsGenerating(true); setIsEditing(false); }} className="px-3 py-1 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-500 transition">Generate</button>
        </div>
      </div>
      {isGenerating && (
        <GenerationForm
          documents={documents}
          section="personal_info"
          onSubmit={handleGenerateSubmit}
          onCancel={() => setIsGenerating(false)}
        />
      )}
      {isEditing ? (
        <div className="space-y-3 mt-4">
            <input name="name" value={formData.name} onChange={handleChange} placeholder="Name" className={inputClass} />
            <input name="email" value={formData.email} onChange={handleChange} placeholder="Email" className={inputClass} />
            <input name="phone" value={formData.phone} onChange={handleChange} placeholder="Phone" className={inputClass} />
            <input name="linkedin" value={formData.linkedin} onChange={handleChange} placeholder="LinkedIn URL" className={inputClass} />
            <input name="portfolio" value={formData.portfolio} onChange={handleChange} placeholder="Portfolio URL" className={inputClass} />
            <input name="github" value={formData.github} onChange={handleChange} placeholder="GitHub URL" className={inputClass} />
            <div className="flex justify-end space-x-2 pt-2">
                <button onClick={() => setIsEditing(false)} className="px-3 py-1.5 text-sm rounded-md text-slate-200 bg-slate-600 hover:bg-slate-500 transition">Cancel</button>
                <button onClick={handleSave} className="px-3 py-1.5 text-sm rounded-md text-white bg-sky-600 hover:bg-sky-500 transition">Save</button>
            </div>
        </div>
      ) : (
        !isGenerating && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm text-slate-300 mt-4">
                <div><strong>Name:</strong> {info.name}</div>
                <div><strong>Email:</strong> {info.email}</div>
                <div><strong>Phone:</strong> {info.phone}</div>
                <div><strong>LinkedIn:</strong> {info.linkedin}</div>
                <div><strong>Portfolio:</strong> {info.portfolio}</div>
                <div><strong>GitHub:</strong> {info.github}</div>
            </div>
        )
      )}
    </div>
  );
};

const ProfileItemCard: React.FC<{ item: GeneratedItem; section: MasterProfileSection; onEdit: (item: GeneratedItem) => void; onDelete: (item: GeneratedItem) => void; }> = ({ item, section, onEdit, onDelete }) => {
    const renderContent = () => {
        switch (section) {
            case 'experience':
                const exp = item as Experience;
                return <>
                    <h4 className="font-semibold text-white">{exp.title}</h4>
                    <p className="text-sm text-sky-400">{exp.company} | {exp.dates}</p>
                    <p className="text-sm mt-1 text-slate-300 whitespace-pre-wrap">{exp.description}</p>
                </>;
            case 'skills':
                return <span className="font-medium text-white bg-sky-800/50 px-3 py-1 rounded-full text-sm">{ (item as Skill).name }</span>;
            case 'projects':
                const proj = item as Project;
                return <>
                    <h4 className="font-semibold text-white">{proj.name}</h4>
                    <p className="text-sm mt-1 text-slate-300 whitespace-pre-wrap">{proj.description}</p>
                </>;
            case 'education':
                const edu = item as Education;
                return <>
                    <h4 className="font-semibold text-white">{edu.institution}</h4>
                    <p className="text-sm text-sky-400">{edu.degree} | {edu.dates}</p>
                    {edu.description && <p className="text-sm mt-1 text-slate-300 whitespace-pre-wrap">{edu.description}</p>}
                </>;
            case 'certifications':
                const cert = item as Certification;
                return <>
                    <h4 className="font-semibold text-white">{cert.name}</h4>
                    <p className="text-sm text-sky-400">{cert.issuingOrganization} | {cert.date}</p>
                </>;
            case 'awards':
                const award = item as Award;
                return <>
                    <h4 className="font-semibold text-white">{award.name}</h4>
                    <p className="text-sm text-sky-400">{award.issuer} | {award.date}</p>
                </>;
            case 'languages':
                const lang = item as Language;
                return <span className="font-medium text-white bg-sky-800/50 px-3 py-1 rounded-full text-sm">{lang.name} ({lang.proficiency})</span>;
        }
    }
    const isPill = ['skills', 'languages'].includes(section);

    if (isPill) {
        return (
            <div className="relative group inline-block">
                {renderContent()}
                <div className="absolute top-[-8px] right-[-8px] flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onEdit(item)} className="p-1.5 rounded-full bg-slate-600 hover:bg-sky-600 text-white" aria-label="Edit item">
                        <EditIcon className="h-4 w-4" />
                    </button>
                    <button onClick={() => onDelete(item)} className="p-1.5 rounded-full bg-slate-600 hover:bg-red-500 text-white" aria-label="Delete item">
                        <TrashIcon className="h-4 w-4" />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="relative group bg-slate-700/50 p-4 rounded-md">
            {renderContent()}
            <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => onEdit(item)} className="p-1.5 rounded-full bg-slate-600 hover:bg-sky-600 text-white" aria-label="Edit item">
                    <EditIcon className="h-4 w-4" />
                </button>
                <button onClick={() => onDelete(item)} className="p-1.5 rounded-full bg-slate-600 hover:bg-red-500 text-white" aria-label="Delete item">
                    <TrashIcon className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
};

const ProfileItemForm: React.FC<{ item: GeneratedItem; section: MasterProfileSection; onSave: (item: GeneratedItem) => void; onCancel: () => void; }> = ({ item, section, onSave, onCancel }) => {
    const [formData, setFormData] = useState(item);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const inputClass = "w-full bg-slate-900 border border-slate-600 rounded-md p-2 text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition";
    const textareaClass = `${inputClass} resize-y min-h-[100px]`;

    const renderFormFields = () => {
        switch(section) {
            case 'experience':
                return <>
                    <input name="title" value={(formData as Experience).title} onChange={handleChange} placeholder="Title" className={inputClass} />
                    <input name="company" value={(formData as Experience).company} onChange={handleChange} placeholder="Company" className={inputClass} />
                    <input name="dates" value={(formData as Experience).dates} onChange={handleChange} placeholder="Dates" className={inputClass} />
                    <textarea name="description" value={(formData as Experience).description} onChange={handleChange} placeholder="Description" className={textareaClass} />
                </>;
            case 'skills':
                return <input name="name" value={(formData as Skill).name} onChange={handleChange} placeholder="Skill Name" className={inputClass} />;
            case 'projects':
                return <>
                    <input name="name" value={(formData as Project).name} onChange={handleChange} placeholder="Project Name" className={inputClass} />
                    <textarea name="description" value={(formData as Project).description} onChange={handleChange} placeholder="Description" className={textareaClass} />
                </>;
            case 'education':
                 return <>
                    <input name="institution" value={(formData as Education).institution} onChange={handleChange} placeholder="Institution" className={inputClass} />
                    <input name="degree" value={(formData as Education).degree} onChange={handleChange} placeholder="Degree" className={inputClass} />
                    <input name="dates" value={(formData as Education).dates} onChange={handleChange} placeholder="Dates" className={inputClass} />
                    <textarea name="description" value={(formData as Education).description} onChange={handleChange} placeholder="Description" className={textareaClass} />
                </>;
            case 'certifications':
                return <>
                    <input name="name" value={(formData as Certification).name} onChange={handleChange} placeholder="Certification Name" className={inputClass} />
                    <input name="issuingOrganization" value={(formData as Certification).issuingOrganization} onChange={handleChange} placeholder="Issuing Organization" className={inputClass} />
                    <input name="date" value={(formData as Certification).date} onChange={handleChange} placeholder="Date" className={inputClass} />
                </>;
            case 'awards':
                return <>
                    <input name="name" value={(formData as Award).name} onChange={handleChange} placeholder="Award Name" className={inputClass} />
                    <input name="issuer" value={(formData as Award).issuer} onChange={handleChange} placeholder="Issuer" className={inputClass} />
                    <input name="date" value={(formData as Award).date} onChange={handleChange} placeholder="Date" className={inputClass} />
                </>;
            case 'languages':
                return <>
                    <input name="name" value={(formData as Language).name} onChange={handleChange} placeholder="Language" className={inputClass} />
                    <input name="proficiency" value={(formData as Language).proficiency} onChange={handleChange} placeholder="Proficiency" className={inputClass} />
                </>;
        }
    }
    return (
        <div className="bg-slate-700 p-4 rounded-md space-y-3">
            {renderFormFields()}
            <div className="flex justify-end space-x-2 pt-2">
                <button onClick={onCancel} className="px-3 py-1.5 text-sm rounded-md text-slate-200 bg-slate-600 hover:bg-slate-500 transition">Cancel</button>
                <button onClick={() => onSave(formData)} className="px-3 py-1.5 text-sm rounded-md text-white bg-sky-600 hover:bg-sky-500 transition">Save</button>
            </div>
        </div>
    );
}

const ConfirmationModal: React.FC<{ isOpen: boolean; onConfirm: () => void; onCancel: () => void; title: string; children: React.ReactNode; }> = ({ isOpen, onConfirm, onCancel, title, children }) => (
    <Modal isOpen={isOpen} onClose={onCancel} title={title}>
        <div>
            {children}
            <div className="flex justify-end space-x-3 mt-6">
                <button onClick={onCancel} className="px-4 py-2 rounded-md text-slate-200 bg-slate-600 hover:bg-slate-500 transition">Cancel</button>
                <button onClick={onConfirm} className="px-4 py-2 rounded-md text-white bg-red-600 hover:bg-red-500 transition">Delete</button>
            </div>
        </div>
    </Modal>
);

const GenerationForm: React.FC<{
    documents: Document[];
    section: MasterProfileSection;
    onSubmit: (selectedDocs: Document[], mode: GenerationMode, instructions: string) => Promise<void>;
    onCancel: () => void;
}> = ({ documents, section, onSubmit, onCancel }) => {
    const [selectedDocIds, setSelectedDocIds] = useState<Set<string>>(new Set(documents.map(d => d.id)));
    const [mode, setMode] = useState<GenerationMode>('complement');
    const [instructions, setInstructions] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleDocToggle = (id: string) => {
        setSelectedDocIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) newSet.delete(id);
            else newSet.add(id);
            return newSet;
        });
    };

    const handleSubmit = async () => {
        setIsLoading(true);
        try {
            const selectedDocs = documents.filter(doc => selectedDocIds.has(doc.id));
            await onSubmit(selectedDocs, mode, instructions);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-slate-700/50 p-4 rounded-md mt-4 space-y-4">
            <div>
                <h4 className="font-semibold text-white mb-2">1. Select source documents</h4>
                <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
                    {documents.map(doc => (
                        <label key={doc.id} className="flex items-center space-x-3 p-2 bg-slate-700 rounded-md cursor-pointer hover:bg-slate-600">
                            <input type="checkbox" checked={selectedDocIds.has(doc.id)} onChange={() => handleDocToggle(doc.id)} className="h-4 w-4 rounded bg-slate-800 border-slate-600 text-sky-500 focus:ring-sky-500" />
                            <span className="text-slate-200 text-sm">{doc.name}</span>
                        </label>
                    ))}
                </div>
            </div>
            <div>
                <h4 className="font-semibold text-white mb-2">2. (Optional) Add custom instructions</h4>
                <textarea value={instructions} onChange={e => setInstructions(e.target.value)} rows={2} placeholder="e.g., Focus on my leadership roles..." className="w-full bg-slate-900 border border-slate-600 rounded-md p-2 text-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"></textarea>
            </div>
            <div className="flex justify-end space-x-3 pt-2">
                <button onClick={onCancel} className="px-4 py-2 text-sm rounded-md text-slate-200 bg-slate-600 hover:bg-slate-500 transition">Cancel</button>
                <button onClick={handleSubmit} disabled={selectedDocIds.size === 0 || isLoading} className="px-4 py-2 text-sm rounded-md text-white bg-sky-600 hover:bg-sky-500 transition disabled:bg-slate-500 disabled:cursor-not-allowed flex items-center">
                    {isLoading ? 'Generating...' : 'Generate'}
                </button>
            </div>
        </div>
    );
};

interface ProfileSectionProps {
  title: string;
  sectionKey: MasterProfileSection;
  items: GeneratedItem[];
  onGenerate: (selectedDocs: Document[], mode: GenerationMode, instructions: string) => Promise<void>;
  onAddItem: (section: MasterProfileSection) => void;
  onEditItem: (item: GeneratedItem, section: MasterProfileSection) => void;
  onDeleteItem: (item: GeneratedItem, section: MasterProfileSection) => void;
  onSaveItem: (item: GeneratedItem, section: MasterProfileSection) => void;
  onCancelEdit: () => void;
  editingItem: { item: GeneratedItem; section: MasterProfileSection } | null;
  onClearSection: (section: MasterProfileSection) => void;
  documents: Document[];
}

const ProfileSection: React.FC<ProfileSectionProps> = ({ title, sectionKey, items, onGenerate, onAddItem, onEditItem, onDeleteItem, onSaveItem, onCancelEdit, editingItem, onClearSection, documents }) => {
    const [isOpen, setIsOpen] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);

    const isAddingNew = editingItem?.section === sectionKey && !items.some(i => i.id === editingItem.item.id);

    const handleGenerateClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isOpen) setIsOpen(true);
        onCancelEdit();
        setIsGenerating(true);
    };
    
    const handleGenerateSubmit = async (selectedDocs: Document[], mode: GenerationMode, instructions: string) => {
        await onGenerate(selectedDocs, mode, instructions);
        setIsGenerating(false);
    };

    return (
        <div className="bg-slate-800 rounded-lg">
            <div className="flex justify-between items-center p-4 cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
                <h3 className="text-lg font-semibold text-white">{title}</h3>
                <div className="flex items-center space-x-2">
                    {items.length > 0 && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); onClearSection(sectionKey); }} 
                            className="p-2 text-sm font-medium text-slate-300 bg-slate-700 rounded-md hover:bg-red-500 hover:text-white transition"
                            aria-label={`Clear all items from ${title}`}
                            title={`Clear all items from ${title}`}
                        >
                            <TrashIcon className="h-4 w-4" />
                        </button>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); if (!isOpen) setIsOpen(true); setIsGenerating(false); onAddItem(sectionKey); }} className="px-3 py-1 text-sm font-medium text-white bg-slate-600 rounded-md hover:bg-slate-500 transition">Add New</button>
                    <button onClick={handleGenerateClick} className="px-3 py-1 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-500 transition">Generate</button>
                    <ChevronDownIcon className={`h-6 w-6 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </div>
            {isOpen && (
                <div className="p-4 border-t border-slate-700">
                    {isGenerating && (
                        <GenerationForm 
                            documents={documents}
                            section={sectionKey}
                            onSubmit={handleGenerateSubmit}
                            onCancel={() => setIsGenerating(false)}
                        />
                    )}
                    {isAddingNew && editingItem && (
                        <div className="mb-4">
                            <ProfileItemForm
                                item={editingItem.item}
                                section={sectionKey}
                                onSave={(updatedItem) => onSaveItem(updatedItem, sectionKey)}
                                onCancel={onCancelEdit}
                            />
                        </div>
                    )}

                    {items.length > 0 ? (
                        <div className={sectionKey === 'skills' || sectionKey === 'languages' ? 'flex flex-wrap gap-4 items-center' : 'grid grid-cols-1 gap-4'}>
                           {items.map(item => (
                                editingItem?.item.id === item.id && editingItem?.section === sectionKey ? (
                                    <ProfileItemForm
                                        key={item.id}
                                        item={editingItem.item}
                                        section={sectionKey}
                                        onSave={(updatedItem) => onSaveItem(updatedItem, sectionKey)}
                                        onCancel={onCancelEdit}
                                    />
                                ) : (
                                    <ProfileItemCard 
                                        key={item.id} 
                                        item={item} 
                                        section={sectionKey} 
                                        onEdit={(itemToEdit) => onEditItem(itemToEdit, sectionKey)}
                                        onDelete={(itemToDelete) => onDeleteItem(itemToDelete, sectionKey)}
                                    />
                                )
                            ))}
                        </div>
                    ) : (
                        !isAddingNew && !isGenerating && (
                            <div className="text-center py-4">
                                <p className="text-slate-400 mb-4">No {sectionKey} added yet.</p>
                                 <button onClick={() => onAddItem(sectionKey)} className="px-3 py-1 text-sm font-medium text-white bg-slate-600 rounded-md hover:bg-slate-500 transition mr-2">Add Manually</button>
                                 <button onClick={handleGenerateClick} className="px-3 py-1 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-500 transition">Generate from Docs</button>
                            </div>
                        )
                    )}
                </div>
            )}
        </div>
    );
};

interface ProfileTabProps {
    documents: Document[];
    onStartGenerate: (items: GeneratedItem[], section: MasterProfileSection, mode: GenerationMode) => void;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({ documents, onStartGenerate }) => {
    const [profile, setProfile] = useState<MasterProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [editingItem, setEditingItem] = useState<{ item: GeneratedItem; section: MasterProfileSection } | null>(null);
    const [itemToDelete, setItemToDelete] = useState<{ item: GeneratedItem; section: MasterProfileSection } | null>(null);
    const [sectionToClear, setSectionToClear] = useState<MasterProfileSection | null>(null);

    const loadData = useCallback(async () => {
        try {
            const masterProfile = await api.getMasterProfile();
            setProfile(masterProfile);
        } catch (error) {
            notifyError('Failed to load master profile.');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleGenerate = async (selectedDocs: Document[], mode: GenerationMode, instructions: string, section: MasterProfileSection) => {
        try {
            const existingItems = (profile && profile[section] && mode === 'complement') ? profile[section] : undefined;
            const extractedData = await generateSection(selectedDocs, section, instructions, existingItems as any[]);
            
            let generatedItems: GeneratedItem[];

            if (section === 'personal_info') {
                const personalInfoObject = extractedData as PersonalInfo;
                generatedItems = [{
                    ...personalInfoObject,
                    id: `pi_${Date.now()}`
                } as any];
            } else {
                const itemsWithoutIds = extractedData as Omit<GeneratedItem, 'id'>[];
                generatedItems = itemsWithoutIds.map(item => ({
                    ...item,
                    id: `${section.slice(0, 3)}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
                } as GeneratedItem));
            }

            onStartGenerate(generatedItems, section, mode);
        } catch (error) {
            // Display user-friendly error message from service
            const errorMessage = (error as any)?.message || 'Failed to extract information from documents. Please try again.';
            notifyError(errorMessage);
        }
    };

    const handleSavePersonalInfo = async (newInfo: PersonalInfo) => {
        try {
            await api.updateMasterProfile({ ...profile, personal_info: newInfo });
            loadData();
            notifySuccess('Personal info updated.');
        } catch (error) {
            notifyError('Failed to update personal info.');
        }
    };

    const createNewItem = (section: MasterProfileSection): GeneratedItem => {
        const base = { id: `${section.slice(0, 3)}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}` };
        switch(section) {
            case 'experience': return { ...base, title: '', company: '', dates: '', description: '' };
            case 'skills': return { ...base, name: '' };
            case 'projects': return { ...base, name: '', description: '' };
            case 'education': return { ...base, institution: '', degree: '', dates: '', description: '' };
            case 'certifications': return { ...base, name: '', issuingOrganization: '', date: '' };
            case 'awards': return { ...base, name: '', issuer: '', date: '' };
            case 'languages': return { ...base, name: '', proficiency: '' };
            default:
                throw new Error(`Invalid section for new item creation: ${section}`);
        }
    }

    const handleAddItem = (section: MasterProfileSection) => {
        const newItem = createNewItem(section);
        setEditingItem({ item: newItem, section });
    };

    const handleEditItem = (item: GeneratedItem, section: MasterProfileSection) => {
        setEditingItem({ item, section });
    };

    const handleCancelEdit = () => {
        setEditingItem(null);
    };

    const handleSaveItem = async (updatedItem: GeneratedItem, section: MasterProfileSection) => {
        if (!profile) return;
        
        const sectionItems = (profile[section] as GeneratedItem[]) || [];
        const itemIndex = sectionItems.findIndex(item => item.id === updatedItem.id);
        
        let newItems;
        if (itemIndex > -1) {
            newItems = [...sectionItems];
            newItems[itemIndex] = updatedItem;
        } else {
            newItems = [...sectionItems, updatedItem];
        }

        try {
            await api.updateMasterProfile({ ...profile, [section]: newItems });
            setEditingItem(null);
            loadData();
            notifySuccess(`Profile ${itemIndex > -1 ? 'updated' : 'added'}.`);
        } catch (error) {
            notifyError('Failed to save item.');
        }
    };

    const handleDeleteItem = (item: GeneratedItem, section: MasterProfileSection) => {
        setItemToDelete({ item, section });
    };

    const handleCancelDelete = () => {
        setItemToDelete(null);
    };

    const handleConfirmDelete = async () => {
        if (itemToDelete && profile) {
            const { item, section } = itemToDelete;
            const sectionItems = (profile[section] as GeneratedItem[]) || [];
            const newItems = sectionItems.filter(i => i.id !== item.id);

            try {
                await api.updateMasterProfile({ ...profile, [section]: newItems });
                setItemToDelete(null);
                loadData();
                notifySuccess('Profile item deleted.');
            } catch (error) {
                notifyError('Failed to delete item.');
            }
        }
    };

    const handleClearSection = (section: MasterProfileSection) => {
        setSectionToClear(section);
    };

    const handleConfirmClearSection = async () => {
        if (sectionToClear && profile) {
            try {
                await api.updateMasterProfile({ ...profile, [sectionToClear]: [] as GeneratedItem[] });
                setSectionToClear(null);
                loadData();
                notifySuccess('Section cleared successfully.');
            } catch (error) {
                notifyError('Failed to clear section.');
            }
        }
    };

    const profileSectionProps = {
        onAddItem: handleAddItem,
        onClearSection: handleClearSection,
        onEditItem: handleEditItem,
        onDeleteItem: handleDeleteItem,
        onSaveItem: handleSaveItem,
        onCancelEdit: handleCancelEdit,
        editingItem: editingItem,
    };

    const emptyProfile: MasterProfile = {
        personal_info: { name: '', email: '', phone: '', linkedin: '', portfolio: '', github: '' },
        experience: [],
        skills: [],
        projects: [],
        education: [],
        certifications: [],
        awards: [],
        languages: [],
    };

    const displayProfile = profile || emptyProfile;

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Master Profile</h2>
            {isLoading ? (
                <MasterProfileSkeleton />
            ) : (
                <div className="space-y-4">
                    <PersonalInfoSection
                        info={displayProfile.personal_info}
                        onSave={handleSavePersonalInfo}
                        onGenerate={(docs, mode, instr) => handleGenerate(docs, mode, instr, 'personal_info')}
                        documents={documents}
                    />
                    <ProfileSection title="Professional Experience" sectionKey="experience" items={displayProfile.experience} {...profileSectionProps} documents={documents} onGenerate={(docs, mode, instr) => handleGenerate(docs, mode, instr, 'experience')} />
                    <ProfileSection title="Skills" sectionKey="skills" items={displayProfile.skills} {...profileSectionProps} documents={documents} onGenerate={(docs, mode, instr) => handleGenerate(docs, mode, instr, 'skills')} />
                    <ProfileSection title="Projects" sectionKey="projects" items={displayProfile.projects} {...profileSectionProps} documents={documents} onGenerate={(docs, mode, instr) => handleGenerate(docs, mode, instr, 'projects')} />
                    <ProfileSection title="Education" sectionKey="education" items={displayProfile.education} {...profileSectionProps} documents={documents} onGenerate={(docs, mode, instr) => handleGenerate(docs, mode, instr, 'education')} />
                    <ProfileSection title="Certifications" sectionKey="certifications" items={displayProfile.certifications} {...profileSectionProps} documents={documents} onGenerate={(docs, mode, instr) => handleGenerate(docs, mode, instr, 'certifications')} />
                    <ProfileSection title="Awards" sectionKey="awards" items={displayProfile.awards} {...profileSectionProps} documents={documents} onGenerate={(docs, mode, instr) => handleGenerate(docs, mode, instr, 'awards')} />
                    <ProfileSection title="Languages" sectionKey="languages" items={displayProfile.languages} {...profileSectionProps} documents={documents} onGenerate={(docs, mode, instr) => handleGenerate(docs, mode, instr, 'languages')} />
                </div>
            )}
            <ConfirmationModal 
                isOpen={!!itemToDelete}
                onConfirm={handleConfirmDelete}
                onCancel={handleCancelDelete}
                title="Confirm Item Deletion"
            >
                <p className="text-slate-300">Are you sure you want to delete this item? This action cannot be undone.</p>
            </ConfirmationModal>
            <ConfirmationModal
                isOpen={!!sectionToClear}
                onConfirm={handleConfirmClearSection}
                onCancel={() => setSectionToClear(null)}
                title={`Confirm Clear Section`}
            >
                <p className="text-slate-300">Are you sure you want to delete all items in this section? This action cannot be undone.</p>
            </ConfirmationModal>
        </div>
    );
};