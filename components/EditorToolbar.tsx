import React, { useState, useRef, useEffect } from 'react';

// Icons for the toolbar
const EditIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"></path></svg>
);

const PreviewIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5C21.27 7.61 17 4.5 12 4.5zm0 13c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm-3-5c0-1.66 1.34-3 3-3s3 1.34 3 3-1.34 3-3 3-3-1.34-3-3z"></path></svg>
);

const SaveIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"></path></svg>
);

const RevertIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"></path></svg>
);

const MoreVertIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"></path></svg>
);

const CopyIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"></path></svg>
);

const BackspaceIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M22 3H7c-.69 0-1.23.35-1.59.88L0 12l5.41 8.12c.36.53.9.88 1.59.88h15c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-3 12.59L17.59 17 14 13.41 10.41 17 9 15.59 12.59 12 9 8.41 10.41 7 14 10.59 17.59 7 19 8.41 15.41 12 19 15.59z"></path></svg>
);

const CheckCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"></path></svg>
);


interface EditorToolbarProps {
    isEditing: boolean;
    onToggleEditing: () => void;
    onSave: () => void;
    onRevert: () => void;
    onCopyText: () => void;
    onCopyMarkdown: () => void;
    onClearContent: () => void;
    isSaveDisabled: boolean;
    isRevertDisabled: boolean;
    isGenerating: boolean;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
    isEditing,
    onToggleEditing,
    onSave,
    onRevert,
    onCopyText,
    onCopyMarkdown,
    onClearContent,
    isSaveDisabled,
    isRevertDisabled,
    isGenerating
}) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleClearContent = () => {
        if (window.confirm('Are you sure you want to clear the content?')) {
            onClearContent();
            setIsMenuOpen(false);
        }
    };

    return (
        <div className="bg-slate-800 rounded-t-lg p-2 flex justify-between items-center border-b border-slate-700">
            {/* Left Group: View Mode */}
            <div className="flex items-center space-x-2">
                <button
                    onClick={onToggleEditing}
                    disabled={isGenerating}
                    className={`px-3 py-1.5 text-sm font-semibold rounded-md flex items-center space-x-2 transition ${isEditing ? 'bg-sky-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'}`}
                >
                    <EditIcon className="h-4 w-4" />
                    <span>Edit</span>
                </button>
                <button
                    onClick={onToggleEditing}
                    disabled={isGenerating}
                    className={`px-3 py-1.5 text-sm font-semibold rounded-md flex items-center space-x-2 transition ${!isEditing ? 'bg-sky-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'}`}
                >
                    <PreviewIcon className="h-4 w-4" />
                    <span>Preview</span>
                </button>
            </div>

            {/* Center Group: Core Actions */}
            <div className="flex items-center space-x-2">
                <button
                    onClick={onSave}
                    disabled={isSaveDisabled || isGenerating}
                    title="Save"
                    className={`p-2 rounded-full transition-colors disabled:opacity-50 ${isSaveDisabled
                            ? 'text-slate-400'
                            : 'text-sky-400 hover:bg-slate-700'
                        }`}
                >
                    <SaveIcon className="h-5 w-5" />
                </button>
                <button
                    onClick={onRevert}
                    disabled={isRevertDisabled || isGenerating}
                    title="Restore Checkpoint"
                    className={`p-2 rounded-full transition-colors disabled:opacity-50 ${isRevertDisabled
                            ? 'text-slate-600'
                            : 'text-yellow-400 hover:bg-slate-700'
                        }`}
                >
                    <RevertIcon className="h-5 w-5" />
                </button>
                <div className="flex items-center">
                    {!isSaveDisabled ? (
                        <div className="flex items-center space-x-2 text-slate-400 text-xs pl-2">
                            <div className="w-2 h-2 bg-sky-500 rounded-full animate-pulse"></div>
                            <span>Unsaved changes</span>
                        </div>
                    ) : (
                        <div className="flex items-center space-x-2 text-green-400 text-xs">
                            <CheckCircleIcon className="h-3 w-3" />
                            <span>All changes saved</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Right Group: Utility Dropdown Menu */}
            <div className="relative" ref={menuRef}>
                <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    disabled={isGenerating}
                    className="p-2 rounded-full hover:bg-slate-700 transition disabled:opacity-50"
                >
                    <MoreVertIcon className="h-5 w-5 text-white" />
                </button>
                {isMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-700 rounded-md shadow-lg z-10">
                        <button
                            onClick={() => { onCopyMarkdown(); setIsMenuOpen(false); }}
                            className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 flex items-center space-x-3"
                        >
                            <CopyIcon className="h-4 w-4" />
                            <span>Copy Markdown</span>
                        </button>
                        <button
                            onClick={() => { onCopyText(); setIsMenuOpen(false); }}
                            className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 flex items-center space-x-3"
                        >
                            <CopyIcon className="h-4 w-4" />
                            <span>Copy Text</span>
                        </button>
                        <div className="border-t border-slate-700 my-1"></div>
                        <button
                            onClick={handleClearContent}
                            className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 flex items-center space-x-3"
                        >
                            <BackspaceIcon className="h-4 w-4" />
                            <span>Clear Content</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};