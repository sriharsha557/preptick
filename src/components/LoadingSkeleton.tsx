import React from 'react';
import './LoadingSkeleton.css';

interface SkeletonProps {
  width?: string;
  height?: string;
  borderRadius?: string;
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '1rem',
  borderRadius = 'var(--radius-md)',
  className = '',
}) => (
  <div
    className={`skeleton ${className}`}
    style={{ width, height, borderRadius }}
    aria-hidden="true"
  />
);

interface SkeletonTextProps {
  lines?: number;
  className?: string;
}

export const SkeletonText: React.FC<SkeletonTextProps> = ({ lines = 3, className = '' }) => (
  <div className={`skeleton-text ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        height="0.875rem"
        width={i === lines - 1 ? '70%' : '100%'}
        className="skeleton-line"
      />
    ))}
  </div>
);

interface SkeletonCardProps {
  className?: string;
}

export const SkeletonCard: React.FC<SkeletonCardProps> = ({ className = '' }) => (
  <div className={`skeleton-card ${className}`}>
    <Skeleton height="1.5rem" width="60%" className="skeleton-title" />
    <SkeletonText lines={2} />
  </div>
);

interface SkeletonAvatarProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const SkeletonAvatar: React.FC<SkeletonAvatarProps> = ({ size = 'md', className = '' }) => {
  const sizes = { sm: '32px', md: '48px', lg: '80px' };
  return (
    <Skeleton
      width={sizes[size]}
      height={sizes[size]}
      borderRadius="var(--radius-full)"
      className={className}
    />
  );
};

interface SkeletonButtonProps {
  width?: string;
  className?: string;
}

export const SkeletonButton: React.FC<SkeletonButtonProps> = ({ width = '120px', className = '' }) => (
  <Skeleton width={width} height="2.5rem" borderRadius="var(--radius-md)" className={className} />
);

// Dashboard skeleton
export const DashboardSkeleton: React.FC = () => (
  <div className="dashboard-skeleton" aria-label="Loading dashboard">
    <div className="dashboard-skeleton-header">
      <SkeletonAvatar size="lg" />
      <div className="dashboard-skeleton-header-text">
        <Skeleton width="200px" height="1.5rem" />
        <Skeleton width="150px" height="1rem" />
      </div>
    </div>
    <div className="dashboard-skeleton-cards">
      {Array.from({ length: 4 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  </div>
);

// Topics grid skeleton
export const TopicsGridSkeleton: React.FC = () => (
  <div className="topics-grid-skeleton" aria-label="Loading topics">
    {Array.from({ length: 8 }).map((_, i) => (
      <Skeleton key={i} height="3rem" borderRadius="var(--radius-md)" />
    ))}
  </div>
);

// Test results skeleton
export const TestResultsSkeleton: React.FC = () => (
  <div className="test-results-skeleton" aria-label="Loading test results">
    <div className="test-results-skeleton-score">
      <Skeleton width="120px" height="120px" borderRadius="var(--radius-full)" />
    </div>
    <div className="test-results-skeleton-details">
      <Skeleton width="100%" height="1.5rem" />
      <Skeleton width="80%" height="1rem" />
      <Skeleton width="90%" height="1rem" />
    </div>
  </div>
);

// Spinner component for inline loading
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  color = 'var(--color-primary)',
  className = ''
}) => {
  const sizes = { sm: '16px', md: '24px', lg: '32px' };
  return (
    <div
      className={`spinner ${className}`}
      style={{
        width: sizes[size],
        height: sizes[size],
        borderColor: `${color}20`,
        borderTopColor: color,
      }}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

// Full page loading
export const PageLoading: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => (
  <div className="page-loading">
    <Spinner size="lg" />
    <p className="page-loading-text">{message}</p>
  </div>
);

export default Skeleton;
