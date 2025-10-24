import React, { useState, useRef, useEffect } from 'react';
import * as api from '../services/apiService';
import { generateTailoredResumeStream } from '../services/geminiService';
import { notifySuccess, notifyError } from '../services/notificationService';
import { MasterProfile, SavedResume, SavedJobDescription } from '../types';
import { Modal } from '../components/Modal';
import { ThinkingUI, ThinkingStep } from '../components/ThinkingUI';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

type Template = 'modern' | 'classic' | 'compact';

// Icons
const ClipboardIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M19 2h-4.18C14.4.84 13.3 0 12 0S9.6.84 9.18 2H5c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-7 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm7 18H5V4h2v3h10V4h2v16z"></path></svg>
);
const TrashIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"></path></svg>
);
const ChevronDownIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
);

const DotsVerticalIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 5v.01M12 12v.01M12 19v.01M12 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
);

const SaveIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"></path></svg>
);

const EditIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"></path></svg>
);

const ExportIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"></path></svg>
);

const PreviewIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"></path></svg>
);


export const GenerateResume: React.FC = () => {
  const [jobDescription, setJobDescription] = useState('');
  const [generatedResume, setGeneratedResume] = useState('');
  const [template, setTemplate] = useState<Template>('modern');
  
  // New state for generation lifecycle
  type GenerationState = 'idle' | 'thinking' | 'generating' | 'completed' | 'cancelled' | 'error';
  const [generationState, setGenerationState] = useState<GenerationState>('idle');
  const [thinkingSteps, setThinkingSteps] = useState<ThinkingStep[]>([]);
  const generationController = useRef<AbortController | null>(null);
  const [isEditingResume, setIsEditingResume] = useState(false);
  const [isTemplateDropdownOpen, setTemplateDropdownOpen] = useState(false);
  const [isActionsDropdownOpen, setActionsDropdownOpen] = useState(false);
  
  // Decoupled state for JDs and Resumes
  const [savedJDs, setSavedJDs] = useState<SavedJobDescription[]>([]);
  const [isJDSaveModalOpen, setIsJDSaveModalOpen] = useState(false);
  const [jdToSaveName, setJDToSaveName] = useState('');
  const [isJDPanelOpen, setIsJDPanelOpen] = useState(true);
  const [jdToDelete, setJDToDelete] = useState<SavedJobDescription | null>(null);

  const [savedResumes, setSavedResumes] = useState<SavedResume[]>([]);
  const [isResumeSaveModalOpen, setIsResumeSaveModalOpen] = useState(false);
  const [resumeToSaveName, setResumeToSaveName] = useState('');
  const [isResumePanelOpen, setIsResumePanelOpen] = useState(true);
  const [resumeToDelete, setResumeToDelete] = useState<SavedResume | null>(null);

  const resumeRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const resumeContainerRef = useRef<HTMLDivElement>(null);
  const jobDescriptionEditorRef = useRef<HTMLDivElement>(null);
  const templateDropdownRef = useRef<HTMLDivElement>(null);
  const actionsDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (templateDropdownRef.current && !templateDropdownRef.current.contains(event.target as Node)) {
        setTemplateDropdownOpen(false);
      }
      if (actionsDropdownRef.current && !actionsDropdownRef.current.contains(event.target as Node)) {
        setActionsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const loadSavedData = async () => {
    try {
        const [jds, resumes] = await Promise.all([
            api.getJobDescriptions(),
            api.getResumes()
        ]);
        setSavedJDs(jds);
        setSavedResumes(resumes);
    } catch (error) {
        notifyError("Failed to load saved data.");
    }
  };

  useEffect(() => {
    loadSavedData();
  }, []);

  useEffect(() => {
    if (isEditingResume && editorRef.current) {
        editorRef.current.innerText = generatedResume;
    }
  }, [isEditingResume, generatedResume]);
  
  useEffect(() => {
    if (generationState === 'generating' && resumeContainerRef.current) {
      resumeContainerRef.current.scrollTop = resumeContainerRef.current.scrollHeight;
    }
  }, [generatedResume, generationState]);

  useEffect(() => {
    if (!isEditingResume && resumeRef.current) {
      resumeRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isEditingResume]);
  
  const handleGenerate = async () => {
    if (generationState === 'thinking' || generationState === 'generating') return;

    setGeneratedResume('');
    setThinkingSteps([]);
    setGenerationState('thinking');
    setIsEditingResume(false);

    generationController.current = new AbortController();
    const signal = generationController.current.signal;

    try {
      const profile = await api.getMasterProfile();
      if (!profile) {
        notifyError("Master profile not found. Please complete your profile first.");
        setGenerationState('error');
        return;
      }

      const stream = generateTailoredResumeStream(profile, jobDescription, signal);
      let accumulatedResume = '';
      let currentThought = '';

      for await (const chunk of stream) {
        if (signal.aborted) break;

        for (const part of chunk.candidates[0].content.parts) {
          if (part.thought) {
            currentThought += part.text;
            // Use a regex to find the last bolded title
            const titles = currentThought.match(/\*\*(.*?)\*\*/g);
            if (titles) {
              const lastTitle = titles[titles.length - 1].replace(/\*\*/g, '');
              const lastTitleIndex = currentThought.lastIndexOf(titles[titles.length - 1]);
              const content = currentThought.substring(lastTitleIndex + titles[titles.length - 1].length).trim();

              setThinkingSteps(prev => {
                const newSteps = [...prev];
                const lastStep = newSteps[newSteps.length - 1];

                if (lastStep && lastStep.title === lastTitle) {
                  lastStep.content = content;
                } else {
                  newSteps.push({ title: lastTitle, content: content });
                }
                return newSteps;
              });
            }
          } else if (part.text) {
            if (generationState !== 'generating') {
              setGenerationState('generating');
            }
            accumulatedResume += part.text;
            setGeneratedResume(accumulatedResume);
          }
        }
      }

      if (signal.aborted) {
        setGenerationState('cancelled');
        notifySuccess("Resume generation cancelled.");
      } else {
        setGenerationState('completed');
      }

    } catch (error: any) {
      if (error.name === 'AbortError') {
        setGenerationState('cancelled');
        notifySuccess("Resume generation cancelled.");
      } else {
        setGenerationState('error');
        notifyError("Failed to generate resume. The AI may be busy or unavailable. Please try again.");
      }
    }
  };

  const handleCancelGeneration = () => {
    if (generationController.current) {
      generationController.current.abort();
    }
  };

  const handleCopyMarkdown = () => {
    if (!generatedResume) return;
    navigator.clipboard.writeText(generatedResume).then(() => {
        notifySuccess('Markdown copied to clipboard!');
    }).catch(err => {
        console.error("Failed to copy markdown: ", err);
        notifyError('Failed to copy to clipboard.');
    });
  };

  const handleCopyText = () => {
    if (!generatedResume) return;
    // Simple markdown to text conversion
    const text = generatedResume
      .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Links
      .replace(/(\*\*|__)(.*?)\1/g, '$2') // Bold
      .replace(/(\*|_)(.*?)\1/g, '$2')   // Italic
      .replace(/`{1,3}(.*?)`{1,3}/g, '$1') // Code
      .replace(/^(#+\s*)/gm, '')          // Headers
      .replace(/^-{3,}\s*$/gm, '')         // Horizontal rules
      .replace(/^\s*[-*+]\s+/gm, '')      // Lists
      .replace(/^\s*>\s+/gm, '');         // Blockquotes

    navigator.clipboard.writeText(text).then(() => {
        notifySuccess('Resume text copied to clipboard!');
    }).catch(err => {
        console.error("Failed to copy text: ", err);
        notifyError('Failed to copy to clipboard.');
    });
  };
  
  const handleExport = () => {
    if (!resumeRef.current || isEditingResume) return;
    html2canvas(resumeRef.current, { scale: 2, useCORS: true }).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const ratio = canvasWidth / canvasHeight;
      const width = pdfWidth;
      const height = width / ratio;
      let finalHeight = height > pdfHeight ? pdfHeight : height;
      let finalWidth = finalHeight === pdfHeight ? pdfHeight * ratio : width;
      pdf.addImage(imgData, 'PNG', 0, 0, finalWidth, finalHeight);
      pdf.save('Resume.pdf');
      notifySuccess('Resume exported as PDF.');
    }).catch(err => {
      console.error("Error generating PDF:", err);
      notifyError("Could not export PDF. Please try again.");
    });
  };

  const handleEditorInput = (e: React.FormEvent<HTMLDivElement>) => {
    setGeneratedResume(e.currentTarget.innerText);
  };

  const handleDescriptionInput = (e: React.FormEvent<HTMLDivElement>) => {
    setJobDescription(e.currentTarget.innerText);
  };

  // --- JD Save/Load Logic ---
  const handleOpenJDSaveModal = () => {
    const firstLine = jobDescription.split('\n')[0].trim();
    setJDToSaveName(firstLine ? `JD for ${firstLine}` : 'My Saved JD');
    setIsJDSaveModalOpen(true);
  };

  const handleSaveJD = async () => {
    if (!jdToSaveName.trim()) {
      notifyError("Please enter a name for the job description.");
      return;
    }
    try {
        await api.addJobDescription({ name: jdToSaveName, content: jobDescription, user_id: '', created_at: new Date().toISOString() });
        notifySuccess("Job description saved!");
        setIsJDSaveModalOpen(false);
        setJDToSaveName('');
        loadSavedData();
    } catch (error) {
        notifyError("Failed to save job description.");
    }
  };

  const handleLoadJD = (jd: SavedJobDescription) => {
    setJobDescription(jd.content);
    if (jobDescriptionEditorRef.current) {
        jobDescriptionEditorRef.current.innerText = jd.content;
    }
    notifySuccess(`Loaded "${jd.name}"`);
  };

  const handleDeleteJD = (jd: SavedJobDescription) => {
    setJDToDelete(jd);
  };

  const handleConfirmJDDelete = async () => {
    if (jdToDelete) {
        try {
            await api.deleteJobDescription(jdToDelete.id);
            notifySuccess(`Deleted "${jdToDelete.name}"`);
            setJDToDelete(null);
            loadSavedData();
        } catch (error) {
            notifyError("Failed to delete job description.");
        }
    }
  };

  // --- Resume Save/Load Logic ---
  const handleOpenResumeSaveModal = () => {
    setResumeToSaveName(`Resume - ${new Date().toLocaleDateString()}`);
    setIsResumeSaveModalOpen(true);
  };

  const handleSaveResume = async () => {
    if (!resumeToSaveName.trim()) {
        notifyError("Please enter a name for the resume.");
        return;
    }
    try {
        await api.addResume({ name: resumeToSaveName, markdown_content: generatedResume, user_id: '', created_at: new Date().toISOString() });
        notifySuccess("Resume saved successfully!");
        setIsResumeSaveModalOpen(false);
        setResumeToSaveName('');
        loadSavedData();
    } catch (error) {
        notifyError("Failed to save resume.");
    }
  };

  const handleLoadResume = (resume: SavedResume) => {
    setGeneratedResume(resume.markdown_content);
    setIsEditingResume(false); // Ensure we are in preview mode
    setGenerationState('idle');
    setThinkingSteps([]);
    notifySuccess(`Loaded "${resume.name}"`);
  };

  const handleDeleteResume = (resume: SavedResume) => {
    setResumeToDelete(resume);
  };

  const handleConfirmResumeDelete = async () => {
    if (resumeToDelete) {
        try {
            await api.deleteResume(resumeToDelete.id);
            notifySuccess(`Deleted "${resumeToDelete.name}"`);
            setResumeToDelete(null);
            loadSavedData();
        } catch (error) {
            notifyError("Failed to delete resume.");
        }
    }
  };

  const TemplateButton: React.FC<{ value: Template, label: string, disabled?: boolean }> = ({ value, label, disabled }) => (
    <button
      onClick={() => setTemplate(value)}
      disabled={disabled}
      className={`px-3 py-1 text-xs rounded-md transition ${template === value ? 'bg-sky-600 text-white' : 'bg-slate-700 hover:bg-slate-600'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {label}
    </button>
  );

  return (
    <>
    <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
      {/* Left Column */}
      <div className="md:col-span-2 bg-slate-800 p-6 rounded-lg flex flex-col h-[85vh]">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">Target Job Description</h2>
            <button
                onClick={handleOpenJDSaveModal}
                disabled={!jobDescription}
                className="px-3 py-2 text-sm font-medium text-white bg-slate-600 rounded-md hover:bg-slate-500 transition disabled:bg-slate-500 disabled:cursor-not-allowed"
            >
                Save JD
            </button>
        </div>
        <div
          ref={jobDescriptionEditorRef}
          contentEditable={true}
          suppressContentEditableWarning={true}
          onInput={handleDescriptionInput}
          data-placeholder="Paste the job description here..."
          className="job-description-editor flex-1 min-h-0 w-full bg-slate-900 border border-slate-600 rounded-md p-3 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition resize-none overflow-y-auto whitespace-pre-wrap outline-none"
        />
        <button
          onClick={handleGenerate}
          disabled={['thinking', 'generating'].includes(generationState) || !jobDescription}
          className="w-full mt-4 bg-sky-600 text-white font-semibold py-3 px-4 rounded-md hover:bg-sky-500 transition disabled:bg-slate-500 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {['thinking', 'generating'].includes(generationState) ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              Generating...
            </>
          ) : 'Generate Tailored Resume'}
        </button>

        {/* Saved Job Descriptions Panel */}
        <div className="mt-6 border-t border-slate-700 pt-6 flex-shrink-0">
          <div className="flex justify-between items-center cursor-pointer" onClick={() => setIsJDPanelOpen(!isJDPanelOpen)}>
            <h3 className="text-lg font-bold text-white">Saved Job Descriptions</h3>
            <ChevronDownIcon className={`h-6 w-6 text-slate-400 transition-transform ${isJDPanelOpen ? 'rotate-180' : ''}`} />
          </div>
          {isJDPanelOpen && (
            <div className="mt-4 space-y-2 max-h-48 overflow-y-auto pr-2">
              {savedJDs.length > 0 ? (
                savedJDs.map(jd => (
                  <div key={jd.id} className="bg-slate-700 p-3 rounded-md flex justify-between items-center">
                    <div>
                        <p className="text-sm font-medium text-slate-100">{jd.name}</p>
                        <p className="text-xs text-slate-400">{new Date(jd.created_at).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button onClick={() => handleLoadJD(jd)} className="text-xs px-2 py-1 bg-sky-600 hover:bg-sky-500 rounded text-white transition">Load</button>
                        <button onClick={() => handleDeleteJD(jd)} className="p-1.5 text-slate-400 hover:text-red-500 rounded-full hover:bg-slate-600 transition">
                            <TrashIcon className="h-4 w-4" />
                        </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-slate-500 text-sm text-center py-4">No job descriptions saved yet.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Column */}
      <div className="md:col-span-3 bg-slate-800 p-6 rounded-lg h-[85vh] flex flex-col">
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
            <h2 className="text-xl font-bold text-white">Generated Resume</h2>
            <div className="flex items-center space-x-2">
                {/* Template Dropdown */}
                <div className="relative" ref={templateDropdownRef}>
                    <button
                        onClick={() => setTemplateDropdownOpen(!isTemplateDropdownOpen)}
                        disabled={isEditingResume}
                        className="px-3 py-2 text-sm font-medium text-white bg-slate-600 rounded-md hover:bg-slate-500 transition disabled:bg-slate-500 disabled:cursor-not-allowed flex items-center"
                    >
                        Template: {template.charAt(0).toUpperCase() + template.slice(1)}
                        <ChevronDownIcon className={`h-4 w-4 ml-2 transition-transform ${isTemplateDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isTemplateDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-40 bg-slate-700 rounded-md shadow-lg z-10">
                            <button onClick={() => { setTemplate('modern'); setTemplateDropdownOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-slate-600">Modern</button>
                            <button onClick={() => { setTemplate('classic'); setTemplateDropdownOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-slate-600">Classic</button>
                            <button onClick={() => { setTemplate('compact'); setTemplateDropdownOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-slate-600">Compact</button>
                        </div>
                    )}
                </div>

                <button
                    onClick={handleExport}
                    disabled={!generatedResume || isEditingResume}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-500 transition disabled:bg-slate-500 disabled:cursor-not-allowed flex items-center"
                >
                    <ExportIcon className="h-4 w-4 mr-2" />
                    Export to PDF
                </button>

                <button
                    onClick={() => setIsEditingResume(!isEditingResume)}
                    disabled={!generatedResume}
                    className="px-3 py-2 text-sm font-medium text-white bg-slate-600 rounded-md hover:bg-slate-500 transition disabled:bg-slate-500 disabled:cursor-not-allowed flex items-center"
                >
                    {isEditingResume ? <PreviewIcon className="h-4 w-4 mr-2" /> : <EditIcon className="h-4 w-4 mr-2" />}
                    {isEditingResume ? 'Preview' : 'Edit'}
                </button>

                {/* More Actions Dropdown */}
                <div className="relative" ref={actionsDropdownRef}>
                    <button
                        onClick={() => setActionsDropdownOpen(!isActionsDropdownOpen)}
                        disabled={!generatedResume}
                        className="p-2 text-sm font-medium text-white bg-slate-600 rounded-md hover:bg-slate-500 transition disabled:bg-slate-500 disabled:cursor-not-allowed"
                    >
                        <DotsVerticalIcon className="h-5 w-5" />
                    </button>
                    {isActionsDropdownOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-slate-700 rounded-md shadow-lg z-10">
                            <button
                                onClick={() => { handleOpenResumeSaveModal(); setActionsDropdownOpen(false); }}
                                className="flex items-center w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-slate-600"
                            >
                                <SaveIcon className="h-4 w-4 mr-2" />
                                Save Resume
                            </button>
                            <button
                                onClick={() => { handleCopyText(); setActionsDropdownOpen(false); }}
                                className="flex items-center w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-slate-600"
                            >
                                <ClipboardIcon className="h-4 w-4 mr-2" />
                                Copy Text
                            </button>
                            <button
                                onClick={() => { handleCopyMarkdown(); setActionsDropdownOpen(false); }}
                                className="flex items-center w-full text-left px-4 py-2 text-sm text-slate-200 hover:bg-slate-600"
                            >
                                <ClipboardIcon className="h-4 w-4 mr-2" />
                                Copy Markdown
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
        <div ref={resumeContainerRef} className="bg-slate-900 rounded-md flex-1 overflow-y-auto min-h-0 flex flex-col">
            {generationState === 'idle' && !generatedResume && (
                <div className="flex justify-center items-center h-full">
                    <p className="text-slate-500">Your generated resume will appear here.</p>
                </div>
            )}
            {['thinking', 'generating', 'completed', 'cancelled', 'error'].includes(generationState) && !isEditingResume && (
                <ThinkingUI 
                    steps={thinkingSteps} 
                    onCancel={handleCancelGeneration}
                    isThinking={generationState === 'thinking'}
                    isCancellable={['thinking', 'generating'].includes(generationState)}
                />
            )}
            {generatedResume && (
                <div key={isEditingResume ? 'editor' : 'preview'} className="w-full flex-1">
                    {isEditingResume ? (
                        <div
                            ref={editorRef}
                            contentEditable={true}
                            suppressContentEditableWarning={true}
                            onInput={handleEditorInput}
                            className="w-full h-full bg-slate-900 text-slate-200 p-4 font-mono text-sm resize-none border-0 focus:ring-2 focus:ring-sky-500 whitespace-pre-wrap outline-none"
                            aria-label="Edit Resume Content"
                        />
                    ) : (
                        <div ref={resumeRef} className={`resume-preview ${template}-template`}>
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{generatedResume}</ReactMarkdown>
                        </div>
                    )}
                </div>
            )}
        </div>
        
        {/* Saved Resumes Panel */}
        <div className="mt-6 border-t border-slate-700 pt-6 flex-shrink-0">
          <div className="flex justify-between items-center cursor-pointer" onClick={() => setIsResumePanelOpen(!isResumePanelOpen)}>
            <h3 className="text-lg font-bold text-white">Saved Resumes</h3>
            <ChevronDownIcon className={`h-6 w-6 text-slate-400 transition-transform ${isResumePanelOpen ? 'rotate-180' : ''}`} />
          </div>
          {isResumePanelOpen && (
            <div className="mt-4 space-y-2 max-h-48 overflow-y-auto pr-2">
              {savedResumes.length > 0 ? (
                savedResumes.map(resume => (
                  <div key={resume.id} className="bg-slate-700 p-3 rounded-md flex justify-between items-center">
                    <div>
                        <p className="text-sm font-medium text-slate-100">{resume.name}</p>
                        <p className="text-xs text-slate-400">{new Date(resume.created_at).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button onClick={() => handleLoadResume(resume)} className="text-xs px-2 py-1 bg-sky-600 hover:bg-sky-500 rounded text-white transition">Load</button>
                        <button onClick={() => handleDeleteResume(resume)} className="p-1.5 text-slate-400 hover:text-red-500 rounded-full hover:bg-slate-600 transition">
                            <TrashIcon className="h-4 w-4" />
                        </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-slate-500 text-sm text-center py-4">No resumes saved yet.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
    
    {/* Modals */}
    <Modal isOpen={isJDSaveModalOpen} onClose={() => setIsJDSaveModalOpen(false)} title="Save Job Description">
      <div className="space-y-4">
        <label htmlFor="jdName" className="block text-sm font-medium text-slate-300">Job Description Name</label>
        <input
            type="text"
            id="jdName"
            value={jdToSaveName}
            onChange={(e) => setJDToSaveName(e.target.value)}
            className="w-full bg-slate-900 border border-slate-600 rounded-md p-2 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
        />
        <div className="flex justify-end space-x-2 pt-2">
            <button onClick={() => setIsJDSaveModalOpen(false)} className="px-3 py-1.5 text-sm rounded-md text-slate-200 bg-slate-600 hover:bg-slate-500 transition">Cancel</button>
            <button onClick={handleSaveJD} className="px-3 py-1.5 text-sm rounded-md text-white bg-sky-600 hover:bg-sky-500 transition">Save</button>
        </div>
      </div>
    </Modal>

    <Modal isOpen={isResumeSaveModalOpen} onClose={() => setIsResumeSaveModalOpen(false)} title="Save Resume">
      <div className="space-y-4">
        <label htmlFor="resumeName" className="block text-sm font-medium text-slate-300">Resume Name</label>
        <input
            type="text"
            id="resumeName"
            value={resumeToSaveName}
            onChange={(e) => setResumeToSaveName(e.target.value)}
            className="w-full bg-slate-900 border border-slate-600 rounded-md p-2 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition"
        />
        <div className="flex justify-end space-x-2 pt-2">
            <button onClick={() => setIsResumeSaveModalOpen(false)} className="px-3 py-1.5 text-sm rounded-md text-slate-200 bg-slate-600 hover:bg-slate-500 transition">Cancel</button>
            <button onClick={handleSaveResume} className="px-3 py-1.5 text-sm rounded-md text-white bg-sky-600 hover:bg-sky-500 transition">Save</button>
        </div>
      </div>
    </Modal>

    <Modal isOpen={!!jdToDelete} onClose={() => setJDToDelete(null)} title="Confirm Deletion">
      <div>
        <p className="text-slate-300">Are you sure you want to delete "{jdToDelete?.name}"? This action cannot be undone.</p>
        <div className="flex justify-end space-x-3 mt-6">
            <button onClick={() => setJDToDelete(null)} className="px-4 py-2 rounded-md text-slate-200 bg-slate-600 hover:bg-slate-500 transition">Cancel</button>
            <button onClick={handleConfirmJDDelete} className="px-4 py-2 rounded-md text-white bg-red-600 hover:bg-red-500 transition">Delete</button>
        </div>
      </div>
    </Modal>

    <Modal isOpen={!!resumeToDelete} onClose={() => setResumeToDelete(null)} title="Confirm Deletion">
      <div>
        <p className="text-slate-300">Are you sure you want to delete "{resumeToDelete?.name}"? This action cannot be undone.</p>
        <div className="flex justify-end space-x-3 mt-6">
            <button onClick={() => setResumeToDelete(null)} className="px-4 py-2 rounded-md text-slate-200 bg-slate-600 hover:bg-slate-500 transition">Cancel</button>
            <button onClick={handleConfirmResumeDelete} className="px-4 py-2 rounded-md text-white bg-red-600 hover:bg-red-500 transition">Delete</button>
        </div>
      </div>
    </Modal>
    </>
  );
};
