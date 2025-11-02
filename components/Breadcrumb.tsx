import React from 'react';
import { Link } from 'react-router-dom';

const ChevronRightIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"></path></svg>
);

type BreadcrumbItem = {
  label: string;
  to?: string;
};

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
  return (
    <nav className="flex items-center space-x-2 text-sm text-slate-400 mb-2">
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {item.to ? (
            <Link
              to={item.to}
              className="hover:underline text-sky-400 hover:text-sky-300 transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="font-medium text-slate-300">{item.label}</span>
          )}
          {index < items.length - 1 && (
            <ChevronRightIcon className="h-4 w-4 text-slate-500" />
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};