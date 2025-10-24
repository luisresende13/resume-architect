import React, { useState } from 'react';
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
}

const ThinkingStepComponent: React.FC<{ step: ThinkingStep; isLastStep: boolean; isThinking: boolean }> = ({ step, isLastStep, isThinking }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const showLoading = isLastStep && isThinking;

  return (
    <div className="border-b border-slate-700 last:border-b-0">
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-800/50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3">
          {showLoading ? <LoadingIcon /> : <CheckmarkIcon />}
          <h3 className={`font-semibold ${showLoading ? 'text-sky-400' : 'text-slate-400'}`}>
            {step.title}
          </h3>
        </div>
        <ChevronDown className={isExpanded ? 'rotate-180' : ''} />
      </div>
      {isExpanded && (
        <div className="p-4 pt-0 text-slate-300 prose prose-invert prose-sm max-w-none">
          <p>{step.content}</p>
        </div>
      )}
    </div>
  );
};

export const ThinkingUI: React.FC<ThinkingUIProps> = ({ steps, onCancel, isThinking, isCancellable }) => {
  return (
    <div className="bg-slate-900 rounded-lg h-full flex flex-col animate-fade-in">
      {isThinking && (
        <div className="p-4 border-b border-slate-700">
          <h2 className="text-lg font-bold text-white text-center">AI is Thinking...</h2>
        </div>
      )}
      <div className="flex-1 overflow-y-auto">
        {steps.map((step, index) => (
          <ThinkingStepComponent
            key={index}
            step={step}
            isLastStep={index === steps.length - 1}
            isThinking={isThinking}
          />
        ))}
      </div>
      {isCancellable && (
        <div className="p-4 border-t border-slate-700">
            <button
            onClick={onCancel}
            className="w-full px-4 py-2 font-semibold text-white bg-slate-600 rounded-md hover:bg-slate-500 transition"
            >
            Cancel Generation
            </button>
        </div>
      )}
    </div>
  );
};
