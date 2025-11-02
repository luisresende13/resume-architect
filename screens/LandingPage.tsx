import React, { useState } from 'react';
import { AppView } from '../types';

interface LandingPageProps {
  navigateTo: (view: AppView) => void;
}

// Icons
const SparklesIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0L14.59 8.41L23 11L14.59 13.59L12 22L9.41 13.59L1 11L9.41 8.41L12 0Z" />
    <path d="M19 4L20.18 7.82L24 9L20.18 10.18L19 14L17.82 10.18L14 9L17.82 7.82L19 4Z" />
  </svg>
);

const RocketIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C12 2 7 4 7 10C7 10 5 11 5 13C5 13 7 14 9 14C9 16 10 18 12 18C14 18 15 16 15 14C17 14 19 13 19 13C19 11 17 10 17 10C17 4 12 2 12 2M12 8C10.9 8 10 8.9 10 10C10 11.11 10.9 12 12 12C13.11 12 14 11.11 14 10C14 8.9 13.11 8 12 8M7 18C7 18 6 19 6 20C6 21 7 22 7 22H17C17 22 18 21 18 20C18 19 17 18 17 18H7Z" />
  </svg>
);

const BoltIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M7 2v11h3v9l7-12h-4l4-8z" />
  </svg>
);

const CheckCircleIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
  </svg>
);

const UploadIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z" />
  </svg>
);

const ProfileIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
  </svg>
);

const DocumentIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
  </svg>
);

const QuoteIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z" />
  </svg>
);

export const LandingPage: React.FC<LandingPageProps> = ({ navigateTo }) => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const features = [
    {
      icon: <UploadIcon className="h-8 w-8" />,
      title: "Upload Your Documents",
      description: "Simply upload your existing resumes, CVs, or career documents. We support multiple formats.",
    },
    {
      icon: <ProfileIcon className="h-8 w-8" />,
      title: "AI-Powered Master Profile",
      description: "Our AI extracts and consolidates all your career information into one comprehensive master profile.",
    },
    {
      icon: <DocumentIcon className="h-8 w-8" />,
      title: "Tailored Resumes in Seconds",
      description: "Paste a job description and generate a perfectly tailored resume highlighting your most relevant experience.",
    },
    {
      icon: <BoltIcon className="h-8 w-8" />,
      title: "Instant Refinements",
      description: "Use natural language commands to refine your resume. 'Make it more concise' or 'emphasize leadership skills'.",
    },
    {
      icon: <SparklesIcon className="h-8 w-8" />,
      title: "Smart Content Selection",
      description: "AI intelligently selects the most relevant information from your master profile for each opportunity.",
    },
    {
      icon: <RocketIcon className="h-8 w-8" />,
      title: "Export & Apply",
      description: "Download your tailored resume in multiple formats and apply to jobs with confidence.",
    },
  ];

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Software Engineer",
      avatar: "SJ",
      quote: "Resume Architect helped me land 3 interviews in my first week. The AI tailoring is incredible!",
    },
    {
      name: "Michael Chen",
      role: "Product Manager",
      avatar: "MC",
      quote: "I used to spend hours customizing resumes. Now it takes minutes and the results are better.",
    },
    {
      name: "Emily Rodriguez",
      role: "Marketing Director",
      avatar: "ER",
      quote: "The master profile approach is genius. I maintain one source of truth and generate perfect resumes on demand.",
    },
  ];

  const faqs = [
    {
      question: "How does the AI tailor my resume?",
      answer: "Our AI analyzes the job description and your master profile, then intelligently selects and rephrases your most relevant experience, skills, and achievements to match what employers are looking for.",
    },
    {
      question: "Is my data secure?",
      answer: "Absolutely. We use enterprise-grade encryption and secure cloud storage. Your documents and data are private and never shared with third parties.",
    },
    {
      question: "Can I edit the AI-generated resumes?",
      answer: "Yes! Every resume is fully editable. You can make manual changes, refine with AI commands, or start fresh. You have complete control.",
    },
    {
      question: "What file formats are supported?",
      answer: "You can upload PDF, DOC, DOCX, and TXT files. Generated resumes can be exported as PDF or copied as Markdown text.",
    },
    {
      question: "How is this different from other resume builders?",
      answer: "Unlike traditional builders, Resume Architect maintains a master profile of ALL your experience, then generates tailored versions for each job. No more maintaining multiple resume versions manually.",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header/Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-sm border-b border-slate-800">
        <nav className="container mx-auto px-4 sm:px-6 md:px-8 flex justify-between items-center h-16">
          <div className="flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-sky-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z" />
            </svg>
            <h1 className="text-xl font-bold text-white">Resume Architect</h1>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigateTo('login')}
              className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition"
            >
              Log In
            </button>
            <button
              onClick={() => navigateTo('register')}
              className="px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-500 transition"
            >
              Get Started Free
            </button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 md:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-sky-900/20 via-slate-900 to-slate-900"></div>
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-sky-900/30 rounded-full mb-6 border border-sky-800/50">
              <SparklesIcon className="h-4 w-4 text-sky-400" />
              <span className="text-sm text-sky-300 font-medium">AI-Powered Resume Builder</span>
            </div>
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Build Tailored Resumes
              <br />
              <span className="bg-gradient-to-r from-sky-400 to-blue-500 bg-clip-text text-transparent">
                In Seconds, Not Hours
              </span>
            </h1>
            <p className="text-xl text-slate-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              Stop maintaining multiple resume versions. Create one master profile and let AI generate perfectly tailored resumes for every job opportunity.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
              <button
                onClick={() => navigateTo('register')}
                className="px-8 py-4 text-lg font-semibold text-white bg-sky-600 rounded-lg hover:bg-sky-500 transition shadow-lg shadow-sky-900/50 hover:shadow-xl hover:shadow-sky-900/60 transform hover:scale-105"
              >
                Start Building Free
              </button>
              <button
                onClick={() => {
                  document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-8 py-4 text-lg font-semibold text-white bg-slate-700 rounded-lg hover:bg-slate-600 transition"
              >
                See How It Works
              </button>
            </div>
            <div className="flex flex-wrap justify-center gap-8 text-sm text-slate-400">
              <div className="flex items-center space-x-2">
                <CheckCircleIcon className="h-5 w-5 text-green-500" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircleIcon className="h-5 w-5 text-green-500" />
                <span>Free forever plan</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircleIcon className="h-5 w-5 text-green-500" />
                <span>Export anytime</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 sm:px-6 md:px-8 bg-slate-800/50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Everything You Need to Stand Out</h2>
            <p className="text-xl text-slate-400">Powerful features that make resume creation effortless</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-slate-800 rounded-xl p-6 border border-slate-700 hover:border-sky-500/50 transition-all duration-300 hover:transform hover:scale-105 group"
              >
                <div className="flex items-center justify-center w-16 h-16 bg-sky-900/30 rounded-lg mb-4 text-sky-400 group-hover:bg-sky-500 group-hover:text-white transition-all">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-slate-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 md:px-8">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Three Simple Steps</h2>
            <p className="text-xl text-slate-400">From documents to dream job in minutes</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="flex items-center justify-center w-20 h-20 bg-gradient-to-br from-sky-500 to-blue-600 rounded-full mx-auto mb-6 text-white text-2xl font-bold shadow-lg shadow-sky-900/50">
                1
              </div>
              <h3 className="text-2xl font-semibold text-white mb-4">Upload Documents</h3>
              <p className="text-slate-400 leading-relaxed">
                Upload your existing resumes, CVs, or career documents. Our AI will extract all your professional information.
              </p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-20 h-20 bg-gradient-to-br from-sky-500 to-blue-600 rounded-full mx-auto mb-6 text-white text-2xl font-bold shadow-lg shadow-sky-900/50">
                2
              </div>
              <h3 className="text-2xl font-semibold text-white mb-4">Build Master Profile</h3>
              <p className="text-slate-400 leading-relaxed">
                Review and edit your consolidated master profile. This becomes your single source of truth for all resumes.
              </p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-20 h-20 bg-gradient-to-br from-sky-500 to-blue-600 rounded-full mx-auto mb-6 text-white text-2xl font-bold shadow-lg shadow-sky-900/50">
                3
              </div>
              <h3 className="text-2xl font-semibold text-white mb-4">Generate & Apply</h3>
              <p className="text-slate-400 leading-relaxed">
                Paste a job description and instantly generate a tailored resume. Refine with AI and export when ready.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof/Testimonials */}
      <section className="py-20 px-4 sm:px-6 md:px-8 bg-slate-800/50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Loved by Job Seekers</h2>
            <p className="text-xl text-slate-400">See what our users have to say</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="bg-slate-800 rounded-xl p-6 border border-slate-700 relative"
              >
                <QuoteIcon className="h-10 w-10 text-sky-500/30 absolute top-4 right-4" />
                <p className="text-slate-300 mb-6 leading-relaxed italic">"{testimonial.quote}"</p>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-12 h-12 bg-sky-600 rounded-full text-white font-bold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="text-white font-semibold">{testimonial.name}</div>
                    <div className="text-slate-400 text-sm">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 sm:px-6 md:px-8">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Frequently Asked Questions</h2>
            <p className="text-xl text-slate-400">Everything you need to know</p>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-slate-700/50 transition"
                >
                  <span className="text-lg font-semibold text-white">{faq.question}</span>
                  <svg
                    className={`h-6 w-6 text-sky-400 transform transition-transform ${
                      openFaq === index ? 'rotate-180' : ''
                    }`}
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
                  </svg>
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-4">
                    <p className="text-slate-400 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 md:px-8 bg-gradient-to-br from-sky-900/20 to-slate-900">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6">
            Ready to Land Your Dream Job?
          </h2>
          <p className="text-xl text-slate-300 mb-8 leading-relaxed">
            Join thousands of job seekers who are already creating better resumes with AI.
          </p>
          <button
            onClick={() => navigateTo('register')}
            className="px-12 py-5 text-xl font-semibold text-white bg-sky-600 rounded-lg hover:bg-sky-500 transition shadow-xl shadow-sky-900/50 hover:shadow-2xl hover:shadow-sky-900/60 transform hover:scale-105"
          >
            Get Started Free - No Credit Card Required
          </button>
          <p className="text-sm text-slate-400 mt-6">
            Free forever plan • Export anytime • No hidden fees
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 md:px-8 bg-slate-800/50 border-t border-slate-800">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-sky-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z" />
              </svg>
              <span className="text-white font-semibold">Resume Architect</span>
            </div>
            <div className="text-slate-400 text-sm">
              © 2025 Resume Architect. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};