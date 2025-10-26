import React, { useState, useEffect, forwardRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import './styles.css';

// Icons for different states
const CheckmarkIcon = () => (
  <svg className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
  </svg>
);

const LoadingIcon = () => (
  <div className="h-5 w-5">
    <div className="sine-wave">
      <div className="dot"></div>
      <div className="dot"></div>
      <div className="dot"></div>
    </div>
  </div>
);

const ChevronDown = ({ className }: { className?: string }) => (
  <svg className={`h-5 w-5 transition-transform ${className}`} viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
  </svg>
);

export interface ThinkingStep {
  title: string;
  content: string;
}

interface ThinkingUIProps {
  steps: ThinkingStep[];
  onCancel: () => void;
  isThinking: boolean;
  isCancellable: boolean;
  isGenerating?: boolean;
}

const ThinkingStepComponent: React.FC<{ step: ThinkingStep; isLastStep: boolean; isThinking: boolean, isGenerating?: boolean }> = ({ step, isLastStep, isThinking, isGenerating }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);

  const showLoading = isLastStep && isThinking && !isGenerating;

  useEffect(() => {
    if (!isLastStep && !isCompleted) {
      setIsCompleted(true);
      setJustCompleted(true);
      // Remove the completion animation class after it finishes
      const timer = setTimeout(() => setJustCompleted(false), 600);
      return () => clearTimeout(timer);
    }
  }, [isLastStep, isCompleted]);

  return (
    <div className={`border-b border-slate-700 last:border-b-0 animate-step-enter ${justCompleted ? 'animate-step-complete' : ''}`}>
      <div
        className={`flex items-center justify-between p-4 cursor-pointer hover:bg-slate-800/50 transition-colors ${showLoading ? 'animate-pulse-glow' : ''}`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3">
          <div className="w-5 h-5">
            {showLoading ? (
              <LoadingIcon />
            ) : (
              <div className="animate-checkmark">
                <CheckmarkIcon />
              </div>
            )}
          </div>
          <h3 className={`font-semibold transition-all ${showLoading ? 'animate-shimmer' : 'text-slate-400'}`}>
            {step.title.replace(/\*\*/g, '')}
          </h3>
        </div>
        <ChevronDown className={isExpanded ? 'rotate-180' : ''} />
      </div>
      {isExpanded && (
        <div className="p-4 pt-0 text-slate-300 prose prose-invert prose-sm max-w-none step-content-enter">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{step.content}</ReactMarkdown>
        </div>
      )}
    </div>
  );
};

export const ThinkingUI = forwardRef<HTMLDivElement, ThinkingUIProps>(({ steps, onCancel, isThinking, isCancellable, isGenerating }, ref) => {
  return (
    <div className="bg-slate-900 rounded-lg h-full flex flex-col animate-fade-in">
      <div className="p-4 border-b border-slate-700">
        <h2 className="text-lg font-bold text-white text-center">
          {isThinking && !isGenerating ? 'AI is Thinking...' : (isThinking && isGenerating ? 'Generating Resume...' : 'Process Complete')}
        </h2>
      </div>
      <div ref={ref} className="flex-1 overflow-y-auto">
        {steps.map((step, index) => (
          <ThinkingStepComponent
            key={`${step.title}-${index}`}
            step={step}
            isLastStep={index === steps.length - 1}
            isThinking={isThinking}
            isGenerating={isGenerating}
          />
        ))}
      </div>
      {isCancellable && isThinking && (
        <div className="p-4 border-t border-slate-700 animate-fade-in">
            <button
            onClick={onCancel}
            className="w-full px-4 py-2 font-semibold text-white bg-slate-600 rounded-md hover:bg-slate-500 transition-all duration-200"
            >
            Cancel Generation
            </button>
        </div>
      )}
    </div>
  );
});
