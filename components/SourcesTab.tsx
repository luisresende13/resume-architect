import React, { useRef, useState } from 'react';
import { Document, MasterProfile } from '../types';
import * as api from '../services/apiService';
import * as gemini from '../services/geminiService';
import { notifySuccess, notifyError } from '../services/notificationService';
import { Modal } from './Modal';
import { DocumentViewerModal } from './DocumentViewerModal';

// Icons
const FileIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"></path></svg>
);
const TrashIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path></svg>
);
const RenameIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"></path></svg>
);
const ViewIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5C21.27 7.61 17 4.5 12 4.5zm0 13c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm-3-5c0-1.66 1.34-3 3-3s3 1.34 3 3-1.34 3-3 3-3-1.34-3-3z"></path></svg>
);

const DocumentCard: React.FC<{ document: Document; onDelete: (id: string) => void; onView: (doc: Document) => void; onRename: (doc: Document) => void; }> = ({ document, onDelete, onView, onRename }) => (
    <div className="flex items-center bg-slate-700 p-3 rounded-md hover:bg-slate-600/50 transition">
        <FileIcon className="h-6 w-6 text-sky-400 mr-3 flex-shrink-0" />
        <span className="text-sm text-slate-200 truncate flex-grow" title={document.name}>{document.name}</span>
        <button onClick={(e) => { e.stopPropagation(); onView(document); }} className="text-slate-400 hover:text-green-400 ml-3 flex-shrink-0 p-1 rounded-full hover:bg-slate-600 transition">
            <ViewIcon className="h-5 w-5" />
        </button>
        <button onClick={(e) => { e.stopPropagation(); onRename(document); }} className="text-slate-400 hover:text-sky-400 ml-2 flex-shrink-0 p-1 rounded-full hover:bg-slate-600 transition">
            <RenameIcon className="h-5 w-5" />
        </button>
        <button onClick={(e) => { e.stopPropagation(); onDelete(document.id); }} className="text-slate-400 hover:text-red-500 ml-2 flex-shrink-0 p-1 rounded-full hover:bg-slate-600 transition">
            <TrashIcon className="h-5 w-5" />
        </button>
    </div>
);

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

interface SourcesTabProps {
    documents: Document[];
    loadData: () => void;
    navigateToReview: (generatedProfile: MasterProfile) => void;
}

export const SourcesTab: React.FC<SourcesTabProps> = ({ documents, loadData, navigateToReview }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [docToDelete, setDocToDelete] = useState<Document | null>(null);
    const [viewingDocument, setViewingDocument] = useState<Document | null>(null);
    const [renamingDocument, setRenamingDocument] = useState<Document | null>(null);
    const [newName, setNewName] = useState("");
    const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            try {
                await api.addDocument(file);
                loadData();
                notifySuccess('Document uploaded successfully!');
            } catch (error) {
                notifyError('Failed to upload document.');
            } finally {
                if(event.target) event.target.value = '';
            }
        }
    };

    const handleDeleteDocument = (id: string) => {
        const doc = documents.find(d => d.id === id);
        if (doc) setDocToDelete(doc);
    };

    const handleConfirmDeleteDocument = async () => {
        if (docToDelete) {
            try {
                await api.deleteDocument(docToDelete.id, docToDelete.storage_path);
                loadData();
                notifySuccess('Document deleted.');
            } catch (error) {
                notifyError('Failed to delete document.');
            } finally {
                setDocToDelete(null);
            }
        }
    };

    const handleViewDocument = (doc: Document) => {
        setViewingDocument(doc);
    };

    const handleRenameDocument = (doc: Document) => {
        setRenamingDocument(doc);
        setNewName(doc.name);
    };

    const handleConfirmRename = async () => {
        if (renamingDocument && newName) {
            try {
                await api.updateDocument(renamingDocument.id, newName);
                loadData();
                notifySuccess('Document renamed successfully!');
            } catch (error) {
                notifyError('Failed to rename document.');
            } finally {
                setRenamingDocument(null);
                setNewName("");
            }
        }
    };

    const handleSelectDocument = (id: string) => {
        setSelectedDocs(prev =>
            prev.includes(id) ? prev.filter(docId => docId !== id) : [...prev, id]
        );
    };

    const handleGenerateFullProfile = async () => {
        if (selectedDocs.length === 0) {
            notifyError('Please select at least one document.');
            return;
        }
        setIsGenerating(true);
        try {
            const docsToProcess = documents.filter(doc => selectedDocs.includes(doc.id));
            const generatedProfile = await gemini.generateFullProfile(docsToProcess);
            navigateToReview(generatedProfile);
        } catch (error) {
            notifyError('Failed to generate profile.');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="bg-slate-800 p-6 rounded-lg">
            <h2 className="text-xl font-bold text-white mb-4">Source Documents</h2>
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".pdf,.doc,.docx,.txt" />
            <div className="flex space-x-4 mb-4">
                <button onClick={() => fileInputRef.current?.click()} className="flex-1 bg-sky-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-sky-500 transition">
                    Upload Document
                </button>
                {/* <button
                    onClick={handleGenerateFullProfile}
                    disabled={selectedDocs.length === 0 || isGenerating}
                    className="flex-1 bg-green-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-green-500 transition disabled:bg-green-800 disabled:cursor-not-allowed"
                >
                    {isGenerating ? 'Generating...' : `Generate Full Profile (${selectedDocs.length})`}
                </button> */}
            </div>
            <div className="space-y-3">
                {documents.map(doc => (
                    <DocumentCard
                        key={doc.id}
                        document={doc}
                        onDelete={handleDeleteDocument}
                        onView={handleViewDocument}
                        onRename={handleRenameDocument}
                    />
                ))}
                 {documents.length === 0 && (
                    <div className="text-center pt-4 text-slate-400">
                        <p className="font-semibold">Start by uploading a document.</p>
                        <p className="text-sm">Your resumes and career documents will appear here.</p>
                    </div>
                 )}
            </div>
            <ConfirmationModal 
                isOpen={!!docToDelete}
                onConfirm={handleConfirmDeleteDocument}
                onCancel={() => setDocToDelete(null)}
                title="Confirm Document Deletion"
            >
                <p className="text-slate-300">Are you sure you want to delete the document "{docToDelete?.name}"? This action cannot be undone.</p>
            </ConfirmationModal>
            <DocumentViewerModal
                isOpen={!!viewingDocument}
                onClose={() => setViewingDocument(null)}
                document={viewingDocument}
            />
            <Modal
                isOpen={!!renamingDocument}
                onClose={() => setRenamingDocument(null)}
                title="Rename Document"
            >
                <div>
                    <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="w-full bg-slate-700 text-white p-2 rounded-md"
                    />
                    <div className="flex justify-end space-x-3 mt-4">
                        <button onClick={() => setRenamingDocument(null)} className="px-4 py-2 rounded-md text-slate-200 bg-slate-600 hover:bg-slate-500 transition">Cancel</button>
                        <button onClick={handleConfirmRename} className="px-4 py-2 rounded-md text-white bg-sky-600 hover:bg-sky-500 transition">Save</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};