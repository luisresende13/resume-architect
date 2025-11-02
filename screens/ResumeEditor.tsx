import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Breadcrumb } from '../components/Breadcrumb';
import { EditorToolbar } from '../components/EditorToolbar';
import * as api from '../services/apiService';
import * as gemini from '../services/geminiService';
import { ResumeDraft, Opportunity, MasterProfile, MasterProfileSection } from '../types';
import { notifyError, notifySuccess } from '../services/notificationService';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { ThinkingUI, ThinkingStep } from '../components/ThinkingUI';

const ClipboardIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M19 2h-4.18C14.4.84 13.3 0 12 0S9.6.84 9.18 2H5c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm7 18H5V4h2v3h10V4h2v16z"></path></svg>
);

const ChevronDownIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"></path></svg>
);

const InfoIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"></path></svg>
);


interface ResumeEditorProps {
    draftId: string;
}

export const ResumeEditor: React.FC<ResumeEditorProps> = ({ draftId }) => {
    const navigate = useNavigate();
    const [draft, setDraft] = useState<ResumeDraft | null>(null);
    const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
    const [masterProfile, setMasterProfile] = useState<MasterProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState<string>('');
    const [savedContent, setSavedContent] = useState<string>('');
    const [instruction, setInstruction] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [thinkingSteps, setThinkingSteps] = useState<ThinkingStep[]>([]);
    const [isGeneratingText, setIsGeneratingText] = useState(false);
    const [showThinkingUI, setShowThinkingUI] = useState(false);
    const [selectedSections, setSelectedSections] = useState<MasterProfileSection[]>([]);
    const [isSectionSelectorOpen, setIsSectionSelectorOpen] = useState(false);
    const generationAbortController = useRef<AbortController | null>(null);
    const editorRef = useRef<HTMLTextAreaElement>(null);
    const thinkingContainerRef = useRef<HTMLDivElement>(null);
    const resumePreviewRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (resumePreviewRef.current) {
            const { scrollHeight, clientHeight } = resumePreviewRef.current;
            resumePreviewRef.current.scrollTop = scrollHeight - clientHeight;
        }
    }, [editedContent]);

    useEffect(() => {
        if (thinkingContainerRef.current) {
            const { scrollHeight, clientHeight } = thinkingContainerRef.current;
            thinkingContainerRef.current.scrollTop = scrollHeight - clientHeight;
        }
    }, [thinkingSteps]);

    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (editedContent !== savedContent) {
                e.preventDefault();
                e.returnValue = '';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [editedContent, savedContent]);

    useEffect(() => {
        const loadData = async () => {
            try {
                const draftData = await api.getResumeDraft(draftId);
                setDraft(draftData);
                if (draftData) {
                    setSavedContent(draftData.markdown_content);
                    setEditedContent(draftData.markdown_content);
                    const oppData = await api.getOpportunity(draftData.opportunity_id);
                    setOpportunity(oppData);
                    const profileData = await api.getMasterProfile();
                    setMasterProfile(profileData);
                    if (profileData) {
                        setSelectedSections(Object.keys(profileData) as MasterProfileSection[]);
                    }
                }
            } catch (error) {
                notifyError('Failed to load data.');
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [draftId]);

    const handleSave = async () => {
        if (!draft) return;
        try {
            await api.updateResumeDraft(draft.id, { markdown_content: editedContent });
            const updatedDraft = { ...draft, markdown_content: editedContent };
            setDraft(updatedDraft);
            setSavedContent(editedContent);
            notifySuccess('Draft saved!');
        } catch (error) {
            notifyError('Failed to save draft.');
        }
    };

    const handleCopyMarkdown = () => {
        if (!draft) return;
        navigator.clipboard.writeText(draft.markdown_content).then(() => {
            notifySuccess('Markdown copied to clipboard!');
        }).catch(() => {
            notifyError('Failed to copy to clipboard.');
        });
    };

    const handleCopyText = () => {
        if (!draft) return;
        const text = draft.markdown_content.replace(/#/g, '').replace(/\*/g, '').replace(/>/g, '');
        navigator.clipboard.writeText(text).then(() => {
            notifySuccess('Text copied to clipboard!');
        }).catch(() => {
            notifyError('Failed to copy to clipboard.');
        });
    };

    const handleRevert = () => {
        if (window.confirm('Are you sure you want to revert all changes since the last save?')) {
            setEditedContent(savedContent);
            notifySuccess('Changes have been reverted.');
        }
    };

    const handleSectionToggle = (section: MasterProfileSection) => {
        setSelectedSections(prev =>
            prev.includes(section)
                ? prev.filter(s => s !== section)
                : [...prev, section]
        );
    };

    const handleGenerate = async () => {
        if (!masterProfile || !opportunity || !draft) return;

        generationAbortController.current = new AbortController();
        const originalContent = savedContent;
        setIsGenerating(true);
        setIsEditing(false); // Switch to preview mode when generation starts
        setShowThinkingUI(true);
        setThinkingSteps([]);
        setIsGeneratingText(false);
        let currentContent = "";

        const profileForPrompt = { ...masterProfile };
        (Object.keys(profileForPrompt) as MasterProfileSection[]).forEach(key => {
            if (!selectedSections.includes(key)) {
                delete (profileForPrompt as any)[key];
            }
        });

        try {
            const stream = gemini.generateTailoredResumeStream(
                profileForPrompt,
                opportunity.job_description,
                instruction,
                generationAbortController.current.signal
            );

            for await (const chunk of stream) {
                const parts = chunk.candidates?.[0]?.content?.parts || [];
                for (const part of parts) {
                    if (part.thought) {
                        const thoughtText = part.text || '';
                        if (thoughtText) {
                            const newlineIndex = thoughtText.indexOf('\n');
                            const title = newlineIndex !== -1 ? thoughtText.substring(0, newlineIndex) : thoughtText;
                            const content = newlineIndex !== -1 ? thoughtText.substring(newlineIndex + 1) : '';
                            setThinkingSteps(prev => [...prev, { title, content }]);
                        }
                    } else if (part.text) {
                        if (!isGeneratingText) setIsGeneratingText(true);
                        currentContent += part.text;
                        setEditedContent(currentContent);
                    }
                }
            }
        } catch (error: any) {
            if (error.name !== 'AbortError') {
                notifyError('Failed to generate resume.');
            } else {
                setEditedContent(originalContent);
            }
        } finally {
            setIsGenerating(false);
            setInstruction('');
        }
    };

    const handleCancelGeneration = () => {
        if (generationAbortController.current) {
            generationAbortController.current.abort();
            notifySuccess('Generation cancelled.');
        }
    };

    const handleRefine = async () => {
        if (editedContent !== savedContent) {
            notifyError('Please save or revert your changes before refining.');
            return;
        }
        if (!draft || !masterProfile || !instruction.trim()) {
            notifyError('Please enter an instruction.');
            return;
        }

        generationAbortController.current = new AbortController();
        const originalContent = savedContent;
        setIsGenerating(true);
        setIsEditing(false); // Switch to preview mode when refinement starts
        setShowThinkingUI(true);
        setThinkingSteps([]);
        setIsGeneratingText(false);
        let currentContent = "";

        const profileForPrompt = { ...masterProfile };
        (Object.keys(profileForPrompt) as MasterProfileSection[]).forEach(key => {
            if (!selectedSections.includes(key)) {
                delete (profileForPrompt as any)[key];
            }
        });

        try {
            const stream = gemini.refineResumeStream(
                profileForPrompt,
                draft.markdown_content,
                instruction,
                generationAbortController.current.signal
            );

            for await (const chunk of stream) {
                const parts = chunk.candidates?.[0]?.content?.parts || [];
                for (const part of parts) {
                    if (part.thought) {
                        console.log('Received THOUGHT part:', part.text?.substring(0, 80));
                        const thoughtText = part.text || '';
                        if (thoughtText) {
                            const newlineIndex = thoughtText.indexOf('\n');
                            const title = newlineIndex !== -1 ? thoughtText.substring(0, newlineIndex) : thoughtText;
                            const content = newlineIndex !== -1 ? thoughtText.substring(newlineIndex + 1) : '';
                            setThinkingSteps(prev => [...prev, { title, content }]);
                        }
                    } else if (part.text) {
                        console.log('Received TEXT part:', part.text?.substring(0, 80));
                        if (!isGeneratingText) {
                            console.log('Setting isGeneratingText to TRUE');
                            setIsGeneratingText(true);
                        }
                        currentContent += part.text;
                        setEditedContent(currentContent);
                    }
                }
            }
        } catch (error: any) {
            if (error.name !== 'AbortError') {
                notifyError('Failed to refine resume.');
            } else {
                setEditedContent(originalContent);
            }
        } finally {
            setIsGenerating(false);
            setInstruction('');
        }
    };

    const handleClearContent = () => {
        setEditedContent('');
    };

    if (isLoading) {
        return <p className="text-slate-400">Loading editor...</p>;
    }

    if (!draft) {
        return <p className="text-red-500">Failed to load resume draft.</p>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <Breadcrumb
                        items={[
                            { label: 'Opportunities', to: '/opportunities' },
                            ...(opportunity ? [{ label: opportunity.title, to: `/opportunities/${opportunity.id}` }] : []),
                            { label: draft.name },
                        ]}
                    />
                    <h1 className="text-3xl font-bold text-white">{draft.name}</h1>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-[75vh]">
                {/* Left Panel: Input & Controls */}
                <div className="bg-slate-800 rounded-lg p-6 space-y-4 flex flex-col min-h-0">
                    <div className="flex-grow flex flex-col min-h-0">
                        <h2 className="text-xl font-bold text-white">{savedContent ? 'Refinement Toolkit' : 'Generation Instructions'}</h2>
                        <p className="text-slate-400">{savedContent ? 'Use high-level commands to refine your resume.' : 'Provide initial instructions to generate the first draft.'}</p>
                        <textarea
                            rows={5}
                            value={instruction}
                            onChange={(e) => setInstruction(e.target.value)}
                            placeholder={savedContent ? "e.g., Make it more concise. Emphasize leadership skills." : "e.g., Emphasize my experience with React and state management. Target a senior role."}
                            className="w-full bg-slate-900 border border-slate-600 rounded-md p-2 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition my-4"
                            disabled={isGenerating}
                        />

                        <div className="my-4">
                            <button
                                onClick={() => setIsSectionSelectorOpen(!isSectionSelectorOpen)}
                                className="w-full flex justify-between items-center p-2 bg-slate-700 rounded-md hover:bg-slate-600 transition"
                            >
                                <div className="flex items-center space-x-2">
                                    <span className="font-semibold text-white">Customize AI Context</span>
                                    <div className="group relative">
                                        <InfoIcon className="h-4 w-4 text-slate-400" />
                                        <div className="absolute bottom-full mb-2 w-64 bg-slate-900 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                            Select the profile sections to provide as context to the AI for generation and refinement.
                                        </div>
                                    </div>
                                </div>
                                <ChevronDownIcon className={`h-6 w-6 text-white transition-transform ${isSectionSelectorOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {isSectionSelectorOpen && masterProfile && (
                                <div className="grid grid-cols-2 gap-2 p-4 bg-slate-900 rounded-b-md">
                                    {(Object.keys(masterProfile) as MasterProfileSection[])
                                        .filter(section => !['id', 'user_id', 'created_at', 'updated_at'].includes(section))
                                        .map(section => (
                                        <label key={section} className="flex items-center space-x-2 text-slate-300">
                                            <input
                                                type="checkbox"
                                                checked={selectedSections.includes(section)}
                                                onChange={() => handleSectionToggle(section)}
                                                disabled={section === 'personal_info'}
                                                className="form-checkbox h-4 w-4 bg-slate-800 border-slate-600 text-sky-500 focus:ring-sky-500"
                                            />
                                            <span>{section.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button
                            onClick={savedContent ? handleRefine : handleGenerate}
                            disabled={isGenerating || (!!savedContent && !instruction.trim())}
                            className="w-full py-2 font-semibold text-white bg-sky-600 rounded-md hover:bg-sky-500 transition disabled:bg-sky-800 disabled:cursor-not-allowed"
                        >
                            {isGenerating ? 'Generating...' : (savedContent ? 'Generate Refinements' : 'Generate First Draft')}
                        </button>

                        {showThinkingUI && (
                            <div className="flex-grow mt-4 flex flex-col min-h-0">
                                <ThinkingUI
                                    ref={thinkingContainerRef}
                                    steps={thinkingSteps}
                                    onCancel={handleCancelGeneration}
                                    isThinking={isGenerating}
                                    isCancellable={true}
                                    isGenerating={isGeneratingText}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Panel: Output & Preview */}
                <div className="bg-slate-800 rounded-lg flex flex-col min-h-0">
                    <EditorToolbar
                        isEditing={isEditing}
                        onToggleEditing={() => setIsEditing(!isEditing)}
                        onSave={handleSave}
                        onRevert={handleRevert}
                        onCopyText={handleCopyText}
                        onCopyMarkdown={handleCopyMarkdown}
                        onClearContent={handleClearContent}
                        isSaveDisabled={editedContent === savedContent}
                        isRevertDisabled={editedContent === savedContent}
                        isGenerating={isGenerating}
                    />
                    <div className="flex-grow p-1 flex flex-col min-h-0">
                        {isEditing ? (
                            <textarea
                                ref={editorRef}
                                value={editedContent}
                                onChange={(e) => setEditedContent(e.target.value)}
                                className="w-full h-full bg-slate-900 text-slate-200 p-4 font-mono text-sm resize-none border-0 focus:ring-2 focus:ring-sky-500 rounded-b-md"
                            />
                        ) : (
                            <div ref={resumePreviewRef} className="markdown-body p-4 overflow-y-auto h-full">
                                {editedContent ? (
                                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>{editedContent}</ReactMarkdown>
                                ) : (
                                    <div className="flex justify-center items-center h-full">
                                        <p className="text-slate-400">Your tailored resume will appear here.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};