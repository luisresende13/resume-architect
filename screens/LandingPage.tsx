import React, { useState, useContext, useEffect } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import {
  IoRocket,
  IoFlash,
  IoCheckmarkCircle,
  IoCloudUpload,
  IoPersonCircle,
  IoDocumentText,
} from 'react-icons/io5';
import { FaQuoteRight, FaGem } from 'react-icons/fa';

export const LandingPage: React.FC = () => {
  const { isAuthenticated } = useContext(AuthContext);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  if (isAuthenticated) {
    return <Navigate to="/master-profile" replace />;
  }

  const features = [
    {
      icon: <IoCloudUpload className="h-8 w-8" />,
      title: "Upload Your Documents",
      description: "Simply upload your existing resumes, CVs, or career documents. We support multiple formats.",
    },
    {
      icon: <IoPersonCircle className="h-8 w-8" />,
      title: "AI-Powered Master Profile",
      description: "Our AI extracts and consolidates all your career information into one comprehensive master profile.",
    },
    {
      icon: <IoDocumentText className="h-8 w-8" />,
      title: "Tailored Resumes in Seconds",
      description: "Paste a job description and generate a perfectly tailored resume highlighting your most relevant experience.",
    },
    {
      icon: <IoFlash className="h-8 w-8" />,
      title: "Instant Refinements",
      description: "Use natural language commands to refine your resume. 'Make it more concise' or 'emphasize leadership skills'.",
    },
    {
      icon: <FaGem className="h-8 w-8" />,
      title: "Smart Content Selection",
      description: "AI intelligently selects the most relevant information from your master profile for each opportunity.",
    },
    {
      icon: <IoRocket className="h-8 w-8" />,
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

  useEffect(() => {
    const jsonLdData = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'SoftwareApplication',
          name: 'Resume Architect',
          applicationCategory: 'ProductivityApplication',
          operatingSystem: 'Web',
          description: 'An AI-powered resume builder that helps users create perfectly tailored resumes for every job opportunity in seconds.',
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: '4.9', // Placeholder
            reviewCount: '125', // Placeholder
          },
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
          },
        },
        {
          '@type': 'FAQPage',
          mainEntity: faqs.map((faq) => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: {
              '@type': 'Answer',
              text: faq.answer,
            },
          })),
        },
      ],
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.innerHTML = JSON.stringify(jsonLdData);
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []); // Empty dependency array ensures this runs only once on mount

  return (
    <div className="bg-slate-900 text-white">
      {/* Hero Section */}
      <section className="pt-20 pb-20 px-4 sm:px-6 md:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-sky-900/20 via-slate-900 to-slate-900"></div>
        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center">
            <div className="inline-flex items-center space-x-2 px-4 py-2 bg-sky-900/30 rounded-full mb-6 border border-sky-800/50">
              <FaGem className="h-4 w-4 text-sky-400" />
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
              <Link
                to="/register"
                className="px-8 py-4 text-lg font-semibold text-white bg-sky-600 rounded-lg hover:bg-sky-500 transition shadow-lg shadow-sky-900/50 hover:shadow-xl hover:shadow-sky-900/60 transform hover:scale-105"
              >
                Start Building Free
              </Link>
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
                <IoCheckmarkCircle className="h-5 w-5 text-green-500" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center space-x-2">
                <IoCheckmarkCircle className="h-5 w-5 text-green-500" />
                <span>Free forever plan</span>
              </div>
              <div className="flex items-center space-x-2">
                <IoCheckmarkCircle className="h-5 w-5 text-green-500" />
                <span>Export anytime</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 px-4 sm:px-6 md:px-8 bg-slate-800/50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Everything You Need to Stand Out</h2>
            <p className="text-xl text-slate-400">Powerful features that make resume creation effortless</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-slate-800 rounded-xl p-6 border border-slate-700 hover:border-sky-500/50 transition-all duration-300 transform hover:scale-105 group"
              >
                <div className="flex items-center justify-center w-16 h-16 bg-sky-900/30 rounded-lg mb-4 text-sky-400 group-hover:bg-sky-500 group-hover:text-white transition-all duration-300">
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
      <section id="testimonials" className="py-20 px-4 sm:px-6 md:px-8 bg-slate-800/50">
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
                <FaQuoteRight className="h-5 w-5 text-sky-500/30 absolute top-6 right-6" />
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
      <section id="faq" className="py-20 px-4 sm:px-6 md:px-8">
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
                    className={`h-6 w-6 text-sky-400 transform transition-transform duration-300 ${
                      openFaq === index ? 'rotate-180' : ''
                    }`}
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
                  </svg>
                </button>
                <div
                  className={`transition-all duration-500 ease-in-out overflow-hidden ${
                    openFaq === index ? 'max-h-40' : 'max-h-0'
                  }`}
                >
                  <div className="px-6 pb-4 pt-2">
                    <p className="text-slate-400 leading-relaxed">{faq.answer}</p>
                  </div>
                </div>
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
          <Link
            to="/register"
            className="px-12 py-5 text-xl font-semibold text-white bg-sky-600 rounded-lg hover:bg-sky-500 transition shadow-xl shadow-sky-900/50 hover:shadow-2xl hover:shadow-sky-900/60 transform hover:scale-105"
          >
            <span className="hidden sm:inline">Get Started Free - No Credit Card Required</span>
            <span className="sm:hidden">Get Started Free</span>
          </Link>
          <p className="text-sm text-slate-400 mt-6">
            Free forever plan • Export anytime • No hidden fees
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 px-4 sm:px-6 md:px-8 bg-slate-900 border-t border-slate-800">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Column 1: Brand and Copyright */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <IoDocumentText className="h-7 w-7 text-sky-400" />
                <span className="text-xl text-white font-semibold">Resume Architect</span>
              </div>
              <p className="text-slate-400 text-sm">
                © 2025 Resume Architect. All rights reserved. <br />
                AI-powered resumes, tailored in seconds.
              </p>
            </div>

            {/* Column 2: Navigation */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-white">Navigate</h4>
              <ul className="space-y-2">
                <li><a href="#features" onClick={(e) => { e.preventDefault(); document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }); }} className="text-slate-400 hover:text-sky-400 transition">Features</a></li>
                <li><a href="#how-it-works" onClick={(e) => { e.preventDefault(); document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' }); }} className="text-slate-400 hover:text-sky-400 transition">How It Works</a></li>
                <li><a href="#testimonials" onClick={(e) => { e.preventDefault(); document.getElementById('testimonials')?.scrollIntoView({ behavior: 'smooth' }); }} className="text-slate-400 hover:text-sky-400 transition">Testimonials</a></li>
                <li><a href="#faq" onClick={(e) => { e.preventDefault(); document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' }); }} className="text-slate-400 hover:text-sky-400 transition">FAQ</a></li>
              </ul>
            </div>

            {/* Column 3: Call to Action / Back to Top */}
            <div className="space-y-4 md:text-right">
              <h4 className="text-lg font-semibold text-white">Ready to Start?</h4>
              <Link
                to="/register"
                className="inline-block px-6 py-3 font-semibold text-white bg-sky-600 rounded-lg hover:bg-sky-500 transition shadow-lg shadow-sky-900/50"
              >
                Build Your Resume
              </Link>
               <p className="text-sm text-slate-400 pt-4">
                <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="hover:text-sky-400 transition">
                  Back to top &uarr;
                </a>
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};