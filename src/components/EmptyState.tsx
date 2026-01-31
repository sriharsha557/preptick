import React from 'react';
import { Link } from 'react-router-dom';
import './EmptyState.css';

interface EmptyStateProps {
  icon?: 'tests' | 'topics' | 'results' | 'search' | 'error';
  title: string;
  description?: string;
  actionLabel?: string;
  actionLink?: string;
  onAction?: () => void;
}

const icons = {
  tests: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <path d="M9 12h6" />
      <path d="M9 16h6" />
    </svg>
  ),
  topics: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
      <path d="M8 7h8" />
      <path d="M8 11h8" />
      <path d="M8 15h4" />
    </svg>
  ),
  results: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 20V10" />
      <path d="M12 20V4" />
      <path d="M6 20v-6" />
    </svg>
  ),
  search: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  ),
  error: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v4" />
      <path d="M12 16h.01" />
    </svg>
  ),
};

const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'tests',
  title,
  description,
  actionLabel,
  actionLink,
  onAction,
}) => {
  return (
    <div className="empty-state" role="status" aria-label={title}>
      <div className="empty-state-icon" aria-hidden="true">
        {icons[icon]}
      </div>
      <h3 className="empty-state-title">{title}</h3>
      {description && <p className="empty-state-description">{description}</p>}
      {(actionLabel && actionLink) && (
        <Link to={actionLink} className="empty-state-action">
          {actionLabel}
        </Link>
      )}
      {(actionLabel && onAction && !actionLink) && (
        <button onClick={onAction} className="empty-state-action">
          {actionLabel}
        </button>
      )}
    </div>
  );
};

// Preset empty states for common scenarios
export const NoTestsYet: React.FC = () => (
  <EmptyState
    icon="tests"
    title="No tests yet"
    description="You haven't taken any tests yet. Start practicing to improve your scores!"
    actionLabel="Generate Your First Test"
    actionLink="/generate-test"
  />
);

export const NoTopicsFound: React.FC = () => (
  <EmptyState
    icon="topics"
    title="No topics available"
    description="No topics found for this selection. Try changing the subject or grade."
  />
);

export const NoResultsFound: React.FC = () => (
  <EmptyState
    icon="search"
    title="No results found"
    description="We couldn't find what you're looking for. Try adjusting your search."
  />
);

export const ErrorState: React.FC<{ onRetry?: () => void }> = ({ onRetry }) => (
  <EmptyState
    icon="error"
    title="Something went wrong"
    description="We encountered an error. Please try again."
    actionLabel={onRetry ? "Try Again" : undefined}
    onAction={onRetry}
  />
);

export default EmptyState;
