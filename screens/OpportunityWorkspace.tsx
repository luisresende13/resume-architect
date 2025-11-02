import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import * as api from '../services/apiService';
import * as gemini from '../services/geminiService';
import { Opportunity, ResumeDraft } from '../types';
import { notifyError, notifySuccess } from '../services/notificationService';

const PlusIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"></path></svg>
);

const ChevronLeftIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"></path></svg>
);

import { Modal } from '../components/Modal';

const TrashIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path></svg>
);
const RenameIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"></path></svg>
);
const DuplicateIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"></path></svg>
);

const MoreVertIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"></path></svg>
);

interface DraftCardProps {
    draft: ResumeDraft;
    onDelete: (id: string) => void;
    onSelect: (id: string) => void;
    onRename: (draft: ResumeDraft) => void;
    onDuplicate: (id: string) => void;
}

const DraftCard: React.FC<DraftCardProps> = ({ draft, onDelete, onSelect, onRename, onDuplicate }) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [menuRef]);

    return (
        <div className="bg-slate-800 rounded-lg p-4 flex justify-between items-center transition-all duration-200 hover:bg-slate-700/50 hover:shadow-lg">
            <div onClick={() => onSelect(draft.id)} className="flex-grow cursor-pointer mr-4">
                <h3 className="text-lg font-bold text-white">{draft.name}</h3>
                <p className="text-sm text-slate-400">Last updated: {new Date(draft.updated_at).toLocaleDateString()}</p>
            </div>
            <div className="relative flex-shrink-0" ref={menuRef}>
                <button onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }} className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-slate-700">
                    <MoreVertIcon className="h-5 w-5" />
                </button>
                {menuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-700 rounded-md shadow-lg z-10 py-1">
                        <button onClick={(e) => { e.stopPropagation(); onRename(draft); setMenuOpen(false); }} className="w-full text-left flex items-center space-x-3 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 transition">
                            <RenameIcon className="h-4 w-4" /><span>Rename</span>
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); onDuplicate(draft.id); setMenuOpen(false); }} className="w-full text-left flex items-center space-x-3 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 transition">
                            <DuplicateIcon className="h-4 w-4" /><span>Duplicate</span>
                        </button>
                        <div className="border-t border-slate-700 my-1"></div>
                        <button onClick={(e) => { e.stopPropagation(); onDelete(draft.id); setMenuOpen(false); }} className="w-full text-left flex items-center space-x-3 px-4 py-2 text-sm text-red-400 hover:bg-slate-800 transition">
                            <TrashIcon className="h-4 w-4" /><span>Delete</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

interface OpportunityWorkspaceProps {
    opportunityId: string;
}

export const OpportunityWorkspace: React.FC<OpportunityWorkspaceProps> = ({ opportunityId }) => {
    const navigate = useNavigate();
    const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
    const [drafts, setDrafts] = useState<ResumeDraft[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [renamingDraft, setRenamingDraft] = useState<ResumeDraft | null>(null);
    const [newName, setNewName] = useState("");

    const loadData = async () => {
        try {
            const oppData = await api.getOpportunity(opportunityId);
            setOpportunity(oppData);

            const draftData = await api.getResumeDrafts(opportunityId);
            setDrafts(draftData);
        } catch (error) {
            notifyError('Failed to load opportunity data.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [opportunityId]);

    const handleAddDraft = async () => {
        try {
            const newDraft = await api.addResumeDraft({
                opportunity_id: opportunityId,
                name: `Draft ${drafts.length + 1}`,
                markdown_content: ''
            });
            // The draft is created empty, and the user is taken to the editor to generate it.
            navigate(`/drafts/${newDraft.id}/edit`);
        } catch (error) {
            notifyError('Failed to create new draft.');
        }
    };

    const handleDeleteDraft = async (id: string) => {
        try {
            await api.deleteResumeDraft(id);
            setDrafts(drafts.filter(d => d.id !== id));
            notifySuccess('Draft deleted.');
        } catch (error) {
            notifyError('Failed to delete draft.');
        }
    };

    const handleRenameDraft = (draft: ResumeDraft) => {
        setRenamingDraft(draft);
        setNewName(draft.name);
    };

    const handleConfirmRename = async () => {
        if (renamingDraft && newName) {
            try {
                await api.updateResumeDraft(renamingDraft.id, { name: newName });
                loadData();
                notifySuccess('Draft renamed successfully!');
            } catch (error) {
                notifyError('Failed to rename draft.');
            } finally {
                setRenamingDraft(null);
                setNewName("");
            }
        }
    };

    const handleDuplicateDraft = async (id: string) => {
        try {
            await api.duplicateResumeDraft(id);
            loadData();
            notifySuccess('Draft duplicated successfully!');
        } catch (error) {
            notifyError('Failed to duplicate draft.');
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Context Panel */}
            <div className="md:col-span-1 bg-slate-800 rounded-lg h-[85vh] flex flex-col">
                <div className="p-6 border-b border-slate-700">
                    <Link
                        to="/opportunities"
                        className="inline-flex items-center space-x-2 text-sm text-sky-400 hover:text-sky-300 transition-colors mb-4 group"
                    >
                        <ChevronLeftIcon className="h-5 w-5 transform group-hover:-translate-x-1 transition-transform" />
                        <span>Back to Opportunities</span>
                    </Link>
                    <h2 className="text-2xl font-bold text-white">{opportunity?.title || 'Loading...'}</h2>
                </div>
                <div className="p-6 overflow-y-auto">
                    <h3 className="text-lg font-semibold text-slate-300 mb-3">Job Description</h3>
                    <div className="text-slate-300 whitespace-pre-wrap">
                        {opportunity?.job_description || 'Loading job description...'}
                    </div>
                </div>
            </div>

            {/* Workspace Panel */}
            <div className="md:col-span-2 space-y-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-white">Resume Drafts</h1>
                    <button
                        onClick={handleAddDraft}
                        className="flex items-center space-x-2 px-4 py-2 font-semibold text-white bg-sky-600 rounded-md hover:bg-sky-500 transition"
                    >
                        <PlusIcon className="h-6 w-6" />
                        <span>New Resume Draft</span>
                    </button>
                </div>

                {isLoading ? (
                    <p className="text-slate-400">Loading drafts...</p>
                ) : (
                    <div className="space-y-4">
                        {drafts.map(draft => (
                            <DraftCard 
                                key={draft.id}
                                draft={draft}
                                onDelete={handleDeleteDraft}
                                onSelect={(id) => navigate(`/drafts/${id}/edit`)}
                                onRename={handleRenameDraft}
                                onDuplicate={handleDuplicateDraft}
                            />
                        ))}
                    </div>
                )}

                {drafts.length === 0 && !isLoading && (
                    <div className="text-center py-16 border-2 border-dashed border-slate-700 rounded-lg flex flex-col items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-slate-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <h2 className="text-xl font-semibold text-white">No Drafts Yet</h2>
                        <p className="text-slate-400 mt-2">Click "New Resume Draft" to start tailoring your resume for this opportunity.</p>
                    </div>
                )}
            </div>

            <Modal
                isOpen={!!renamingDraft}
                onClose={() => setRenamingDraft(null)}
                title="Rename Draft"
            >
                <div>
                    <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="w-full bg-slate-700 text-white p-2 rounded-md"
                    />
                    <div className="flex justify-end space-x-3 mt-4">
                        <button onClick={() => setRenamingDraft(null)} className="px-4 py-2 rounded-md text-slate-200 bg-slate-600 hover:bg-slate-500 transition">Cancel</button>
                        <button onClick={handleConfirmRename} className="px-4 py-2 rounded-md text-white bg-sky-600 hover:bg-sky-500 transition">Save</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};