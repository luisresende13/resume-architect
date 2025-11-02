import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../services/apiService';
import { Opportunity } from '../types';
import { Modal } from '../components/Modal';
import { notifySuccess, notifyError } from '../services/notificationService';
import { OpportunityCardSkeleton } from '../components/SkeletonLoader';

const PlusIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"></path></svg>
);

const TrashIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path></svg>
);
const EditIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"></path></svg>
);

interface OpportunityCardProps {
    opportunity: Opportunity;
    onDelete: (id: string) => void;
    onSelect: (id: string) => void;
    onEdit: (opportunity: Opportunity) => void;
}

const OpportunityCard: React.FC<OpportunityCardProps> = ({ opportunity, onDelete, onSelect, onEdit }) => {
    const descriptionSnippet = opportunity.job_description.split(' ').slice(0, 20).join(' ') + '...';

    return (
        <div className="bg-slate-800 rounded-lg p-4 flex flex-col h-full transition-all duration-200 hover:bg-slate-700/50 hover:shadow-lg transform hover:-translate-y-1">
            <div onClick={() => onSelect(opportunity.id)} className="flex-grow cursor-pointer mb-4">
                <h3 className="text-lg font-bold text-white mb-1">{opportunity.title}</h3>
                <div className="flex items-center text-sm text-slate-400 space-x-4 mb-3">
                    <span>Drafts: <span className="font-semibold text-slate-300">{opportunity.draft_count}</span></span>
                    <span>Last modified: <span className="font-semibold text-slate-300">{new Date(opportunity.last_modified).toLocaleDateString()}</span></span>
                </div>
                <p className="text-sm text-slate-400">{descriptionSnippet}</p>
            </div>
            <div className="flex items-center space-x-2 flex-shrink-0">
                <button onClick={(e) => { e.stopPropagation(); onEdit(opportunity); }} className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-slate-300 bg-slate-700 rounded-md hover:bg-slate-600 transition"><EditIcon className="h-4 w-4" /><span>Edit</span></button>
                <button onClick={(e) => { e.stopPropagation(); onDelete(opportunity.id); }} className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-slate-300 bg-slate-700 rounded-md hover:bg-red-500 hover:text-white transition"><TrashIcon className="h-4 w-4" /><span>Delete</span></button>
            </div>
        </div>
    );
};

export const OpportunitiesDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newOpportunityTitle, setNewOpportunityTitle] = useState('');
    const [newOpportunityJD, setNewOpportunityJD] = useState('');
    const [editingOpportunity, setEditingOpportunity] = useState<Opportunity | null>(null);

    const loadOpportunities = async () => {
        try {
            const data = await api.getOpportunities();
            setOpportunities(data);
        } catch (error) {
            notifyError('Failed to load opportunities.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadOpportunities();
    }, []);

    const handleAddOpportunity = async () => {
        if (!newOpportunityTitle.trim() || !newOpportunityJD.trim()) {
            notifyError('Please provide a title and a job description.');
            return;
        }
        try {
            const newOpportunity = await api.addOpportunity({ title: newOpportunityTitle, job_description: newOpportunityJD });
            notifySuccess('Opportunity created successfully!');
            setIsAddModalOpen(false);
            setNewOpportunityTitle('');
            setNewOpportunityJD('');
            navigate(`/opportunities/${newOpportunity.id}`);
        } catch (error) {
            notifyError('Failed to create opportunity.');
        }
    };

    const handleDeleteOpportunity = async (id: string) => {
        try {
            await api.deleteOpportunity(id);
            notifySuccess('Opportunity deleted.');
            loadOpportunities();
        } catch (error) {
            notifyError('Failed to delete opportunity.');
        }
    };

    const handleEditOpportunity = (opportunity: Opportunity) => {
        setEditingOpportunity(opportunity);
    };

    const handleUpdateOpportunity = async () => {
        if (!editingOpportunity) return;

        try {
            await api.updateOpportunity(editingOpportunity.id, {
                title: editingOpportunity.title,
                job_description: editingOpportunity.job_description,
            });
            notifySuccess('Opportunity updated successfully!');
            setEditingOpportunity(null);
            loadOpportunities();
        } catch (error) {
            notifyError('Failed to update opportunity.');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-white">Opportunities</h1>
                <button 
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center space-x-2 px-4 py-2 font-semibold text-white bg-sky-600 rounded-md hover:bg-sky-500 transition"
                >
                    <PlusIcon className="h-6 w-6" />
                    <span>New Opportunity</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {isLoading ? (
                    <OpportunityCardSkeleton count={6} />
                ) : (
                    opportunities.map(op => (
                        <OpportunityCard
                            key={op.id}
                            opportunity={op}
                            onDelete={handleDeleteOpportunity}
                            onSelect={(id) => navigate(`/opportunities/${id}`)}
                            onEdit={handleEditOpportunity}
                        />
                    ))
                )}
            </div>

            {opportunities.length === 0 && !isLoading && (
                <div className="text-center py-10 border-2 border-dashed border-slate-700 rounded-lg">
                    <h2 className="text-xl font-semibold text-white">No Opportunities Yet</h2>
                    <p className="text-slate-400 mt-2">Click "New Opportunity" to start tracking a job application.</p>
                </div>
            )}

            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Create New Opportunity">
                <div className="space-y-4">
                    <div>
                        <label htmlFor="opTitle" className="block text-sm font-medium text-slate-300 mb-1">Opportunity Title</label>
                        <input
                            type="text"
                            id="opTitle"
                            value={newOpportunityTitle}
                            onChange={(e) => setNewOpportunityTitle(e.target.value)}
                            placeholder="e.g., Senior Frontend Developer"
                            className="w-full bg-slate-900 border border-slate-600 rounded-md p-2 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
                        />
                    </div>
                    <div>
                        <label htmlFor="opJD" className="block text-sm font-medium text-slate-300 mb-1">Job Description</label>
                        <textarea
                            id="opJD"
                            value={newOpportunityJD}
                            onChange={(e) => setNewOpportunityJD(e.target.value)}
                            rows={10}
                            placeholder="Paste the full job description here..."
                            className="w-full bg-slate-900 border border-slate-600 rounded-md p-2 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
                        />
                    </div>
                    <div className="flex justify-end space-x-2 pt-2">
                        <button onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-sm rounded-md text-slate-200 bg-slate-600 hover:bg-slate-500 transition">Cancel</button>
                        <button onClick={handleAddOpportunity} className="px-4 py-2 text-sm rounded-md text-white bg-sky-600 hover:bg-sky-500 transition">Create</button>
                    </div>
                </div>
            </Modal>

            {editingOpportunity && (
                <Modal isOpen={!!editingOpportunity} onClose={() => setEditingOpportunity(null)} title="Edit Opportunity">
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="editOpTitle" className="block text-sm font-medium text-slate-300 mb-1">Opportunity Title</label>
                            <input
                                type="text"
                                id="editOpTitle"
                                value={editingOpportunity.title}
                                onChange={(e) => setEditingOpportunity({ ...editingOpportunity, title: e.target.value })}
                                className="w-full bg-slate-900 border border-slate-600 rounded-md p-2 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
                            />
                        </div>
                        <div>
                            <label htmlFor="editOpJD" className="block text-sm font-medium text-slate-300 mb-1">Job Description</label>
                            <textarea
                                id="editOpJD"
                                value={editingOpportunity.job_description}
                                onChange={(e) => setEditingOpportunity({ ...editingOpportunity, job_description: e.target.value })}
                                rows={10}
                                className="w-full bg-slate-900 border border-slate-600 rounded-md p-2 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
                            />
                        </div>
                        <div className="flex justify-end space-x-2 pt-2">
                            <button onClick={() => setEditingOpportunity(null)} className="px-4 py-2 text-sm rounded-md text-slate-200 bg-slate-600 hover:bg-slate-500 transition">Cancel</button>
                            <button onClick={handleUpdateOpportunity} className="px-4 py-2 text-sm rounded-md text-white bg-sky-600 hover:bg-sky-500 transition">Save Changes</button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};