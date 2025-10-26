import React from 'react';

interface SkeletonLoaderProps {
    className?: string;
    width?: string;
    height?: string;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ 
    className = '', 
    width = 'w-full', 
    height = 'h-4' 
}) => {
    return (
        <div 
            className={`${width} ${height} bg-slate-700 rounded animate-pulse ${className}`}
            aria-hidden="true"
        />
    );
};

interface OpportunityCardSkeletonProps {
    count?: number;
}

export const OpportunityCardSkeleton: React.FC<OpportunityCardSkeletonProps> = ({ count = 3 }) => {
    return (
        <>
            {Array.from({ length: count }).map((_, index) => (
                <div 
                    key={index}
                    className="bg-slate-800 rounded-lg p-4 flex flex-col h-full"
                    aria-label="Loading opportunity"
                >
                    {/* Title skeleton */}
                    <div className="mb-3">
                        <SkeletonLoader height="h-6" width="w-3/4" className="mb-2" />
                    </div>
                    
                    {/* Meta info skeleton */}
                    <div className="flex items-center space-x-4 mb-3">
                        <SkeletonLoader height="h-4" width="w-20" />
                        <SkeletonLoader height="h-4" width="w-32" />
                    </div>
                    
                    {/* Description skeleton */}
                    <div className="flex-grow mb-4 space-y-2">
                        <SkeletonLoader height="h-3" width="w-full" />
                        <SkeletonLoader height="h-3" width="w-full" />
                        <SkeletonLoader height="h-3" width="w-2/3" />
                    </div>
                    
                    {/* Action buttons skeleton */}
                    <div className="flex items-center space-x-2 flex-shrink-0">
                        <SkeletonLoader height="h-9" width="w-20" className="rounded-md" />
                        <SkeletonLoader height="h-9" width="w-24" className="rounded-md" />
                    </div>
                </div>
            ))}
        </>
    );
};

export const MasterProfileSkeleton: React.FC = () => {
    return (
        <div className="space-y-6" aria-label="Loading profile">
            {/* Section header skeleton */}
            {Array.from({ length: 3 }).map((_, sectionIndex) => (
                <div key={sectionIndex} className="space-y-4">
                    <div className="flex items-center justify-between">
                        <SkeletonLoader height="h-7" width="w-48" />
                        <SkeletonLoader height="h-10" width="w-32" className="rounded-md" />
                    </div>
                    
                    {/* Content items skeleton */}
                    <div className="space-y-3">
                        {Array.from({ length: 2 }).map((_, itemIndex) => (
                            <div 
                                key={itemIndex}
                                className="bg-slate-800 rounded-lg p-4 space-y-3"
                            >
                                <SkeletonLoader height="h-5" width="w-2/3" />
                                <SkeletonLoader height="h-4" width="w-full" />
                                <SkeletonLoader height="h-4" width="w-full" />
                                <SkeletonLoader height="h-4" width="w-4/5" />
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};