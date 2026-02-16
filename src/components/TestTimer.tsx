import React from 'react';
import './TestTimer.css';
import { useTestTimer } from '../hooks/useTestTimer';

export interface TestTimerProps {
  durationMinutes: number;
  testId: string;
  onExpire: () => void;
  onWarning?: (minutesRemaining: number) => void;
}

const TestTimer: React.FC<TestTimerProps> = ({ durationMinutes, testId, onExpire, onWarning }) => {
  // Use custom hook for timer management with background persistence
  const { remainingSeconds, isWarning } = useTestTimer(
    durationMinutes,
    testId,
    onExpire,
    onWarning
  );

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerColor = (): string => {
    return remainingSeconds <= 300 ? 'red' : 'black'; // 300 seconds = 5 minutes
  };

  return (
    <div
      className={`test-timer ${isWarning ? 'test-timer-warning' : ''}`}
      style={{ color: getTimerColor() }}
      role="timer"
      aria-label={`Time remaining: ${formatTime(remainingSeconds)}`}
    >
      <svg
        className="test-timer-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
      <span className="test-timer-text">{formatTime(remainingSeconds)}</span>
    </div>
  );
};

export default TestTimer;
