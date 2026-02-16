/**
 * Custom React hooks for test timer functionality
 * Provides timer state management with background persistence
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export interface TimerState {
  remainingSeconds: number;
  isWarning: boolean;
  isExpired: boolean;
}

/**
 * Hook for managing test timer state
 * Updates every second and tracks warning/expired states
 * 
 * @param durationMinutes - Initial timer duration in minutes
 * @param testId - Unique identifier for the test (used for localStorage key)
 * @param onExpire - Callback when timer reaches zero
 * @param onWarning - Optional callback when timer reaches warning threshold
 * @returns TimerState object with current timer state
 */
export function useTestTimer(
  durationMinutes: number,
  testId: string,
  onExpire: () => void,
  onWarning?: (minutesRemaining: number) => void
): TimerState {
  const initialSeconds = durationMinutes * 60;
  
  // Use background timer hook for persistence
  const remainingSeconds = useBackgroundTimer(testId, initialSeconds);
  
  const [hasWarned, setHasWarned] = useState(false);
  const onExpireRef = useRef(onExpire);
  const onWarningRef = useRef(onWarning);

  // Keep refs updated
  useEffect(() => {
    onExpireRef.current = onExpire;
    onWarningRef.current = onWarning;
  }, [onExpire, onWarning]);

  // Check for expiration
  useEffect(() => {
    if (remainingSeconds <= 0) {
      onExpireRef.current();
    }
  }, [remainingSeconds]);

  // Check for warning at 1 minute
  useEffect(() => {
    if (remainingSeconds === 60 && !hasWarned && onWarningRef.current) {
      setHasWarned(true);
      onWarningRef.current(1);
    }
  }, [remainingSeconds, hasWarned]);

  const isWarning = remainingSeconds <= 300; // 5 minutes
  const isExpired = remainingSeconds <= 0;

  return {
    remainingSeconds,
    isWarning,
    isExpired
  };
}

/**
 * Hook for managing timer with background persistence using localStorage
 * Continues counting down even when page is not visible or user navigates away
 * 
 * @param key - Unique key for localStorage (typically testId)
 * @param initialSeconds - Initial timer duration in seconds
 * @returns Current remaining seconds
 */
export function useBackgroundTimer(key: string, initialSeconds: number): number {
  const storageKey = `timer_${key}`;
  const startTimeKey = `timer_start_${key}`;

  // Initialize timer state from localStorage or use initial value
  const [remainingSeconds, setRemainingSeconds] = useState<number>(() => {
    const stored = localStorage.getItem(storageKey);
    const startTime = localStorage.getItem(startTimeKey);
    
    if (stored && startTime) {
      // Calculate actual remaining time based on elapsed time
      const storedSeconds = parseInt(stored, 10);
      const storedStartTime = parseInt(startTime, 10);
      const now = Date.now();
      const elapsedSeconds = Math.floor((now - storedStartTime) / 1000);
      const remaining = Math.max(0, storedSeconds - elapsedSeconds);
      
      return remaining;
    }
    
    // First time - store initial values
    localStorage.setItem(storageKey, initialSeconds.toString());
    localStorage.setItem(startTimeKey, Date.now().toString());
    return initialSeconds;
  });

  // Update timer every second
  useEffect(() => {
    const interval = setInterval(() => {
      setRemainingSeconds(prev => {
        const newValue = Math.max(0, prev - 1);
        
        // Update localStorage with current remaining time
        localStorage.setItem(storageKey, newValue.toString());
        
        // Clear storage when timer expires
        if (newValue === 0) {
          localStorage.removeItem(storageKey);
          localStorage.removeItem(startTimeKey);
        }
        
        return newValue;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [storageKey, startTimeKey]);

  // Sync with actual elapsed time when component mounts or becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        const startTime = localStorage.getItem(startTimeKey);
        const stored = localStorage.getItem(storageKey);
        
        if (startTime && stored) {
          const storedStartTime = parseInt(startTime, 10);
          const storedSeconds = parseInt(stored, 10);
          const now = Date.now();
          const elapsedSeconds = Math.floor((now - storedStartTime) / 1000);
          const remaining = Math.max(0, initialSeconds - elapsedSeconds);
          
          setRemainingSeconds(remaining);
          
          if (remaining === 0) {
            localStorage.removeItem(storageKey);
            localStorage.removeItem(startTimeKey);
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [storageKey, startTimeKey, initialSeconds]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Don't clear storage on unmount - we want persistence
      // Storage is only cleared when timer expires
    };
  }, []);

  return remainingSeconds;
}

/**
 * Utility function to clear timer storage
 * Useful for manual cleanup or test reset
 * 
 * @param testId - Test identifier used as storage key
 */
export function clearTimerStorage(testId: string): void {
  localStorage.removeItem(`timer_${testId}`);
  localStorage.removeItem(`timer_start_${testId}`);
}
