/**
 * PDF Download Service
 * 
 * Frontend service for managing PDF generation requests and downloads with
 * loading states, error handling, and user feedback.
 * 
 * Requirements: P2 Requirements 5.1, 5.2
 */

/**
 * Student metadata for PDF personalization
 */
export interface StudentMetadata {
  name: string;
  grade: string;
  date: string;
  testId: string;
}

/**
 * Download state for tracking PDF generation progress
 */
export interface DownloadState {
  loading: boolean;
  error: string | null;
  success: boolean;
  progress: string | null;
}

/**
 * Error messages for different failure scenarios
 */
export const ERROR_MESSAGES = {
  NETWORK_ERROR: "Network error. Please check your connection and try again.",
  SERVER_ERROR: "Server error. Please try again later.",
  TIMEOUT: "Request timed out. Please try again.",
  UNKNOWN: "An unexpected error occurred. Please try again.",
} as const;

/**
 * PDFDownloadService class
 * 
 * Manages PDF download requests with state management, timeout handling,
 * and user feedback for loading, error, and success states.
 */
export class PDFDownloadService {
  private state: DownloadState;
  private stateListeners: Set<(state: DownloadState) => void>;
  private readonly TIMEOUT_MS = 30000; // 30 seconds

  constructor() {
    this.state = {
      loading: false,
      error: null,
      success: false,
      progress: null,
    };
    this.stateListeners = new Set();
  }

  /**
   * Get current download state
   */
  getState(): DownloadState {
    return { ...this.state };
  }

  /**
   * Set download state and notify listeners
   */
  setState(newState: Partial<DownloadState>): void {
    this.state = { ...this.state, ...newState };
    this.notifyListeners();
  }

  /**
   * Reset state to initial values
   */
  reset(): void {
    this.state = {
      loading: false,
      error: null,
      success: false,
      progress: null,
    };
    this.notifyListeners();
  }

  /**
   * Subscribe to state changes
   */
  subscribe(listener: (state: DownloadState) => void): () => void {
    this.stateListeners.add(listener);
    return () => {
      this.stateListeners.delete(listener);
    };
  }

  /**
   * Notify all state listeners
   */
  private notifyListeners(): void {
    this.stateListeners.forEach(listener => listener(this.getState()));
  }

  /**
   * Download test PDF (question paper without answers)
   * 
   * Requirements: 5.1, 5.2
   * 
   * @param testId - The test ID to download
   * @param studentMetadata - Optional student metadata for personalization
   * @returns Promise resolving to PDF Blob
   */
  async downloadTestPDF(testId: string, studentMetadata?: StudentMetadata): Promise<Blob> {
    // Set loading state
    this.setState({
      loading: true,
      error: null,
      success: false,
      progress: null,
    });

    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT_MS);

      // Construct API URL
      const apiUrl = this.getApiUrl(`/api/tests/${testId}/download/questions`);

      // Make request with timeout
      const response = await fetch(apiUrl, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Check response status
      if (!response.ok) {
        if (response.status >= 500) {
          throw new Error(ERROR_MESSAGES.SERVER_ERROR);
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Get PDF blob
      const blob = await response.blob();

      // Set success state
      this.setState({
        loading: false,
        success: true,
        error: null,
      });

      return blob;
    } catch (error) {
      // Handle different error types
      let errorMessage: string;

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = ERROR_MESSAGES.TIMEOUT;
        } else if (error.message.includes('fetch') || error.message.includes('network')) {
          errorMessage = ERROR_MESSAGES.NETWORK_ERROR;
        } else if (Object.values(ERROR_MESSAGES).includes(error.message as any)) {
          errorMessage = error.message;
        } else {
          errorMessage = ERROR_MESSAGES.UNKNOWN;
        }
      } else {
        errorMessage = ERROR_MESSAGES.UNKNOWN;
      }

      // Set error state
      this.setState({
        loading: false,
        error: errorMessage,
        success: false,
      });

      throw new Error(errorMessage);
    }
  }

  /**
   * Download answer key PDF (with answers and solutions)
   * 
   * Requirements: 5.1, 5.2
   * 
   * @param testId - The test ID to download
   * @returns Promise resolving to PDF Blob
   */
  async downloadAnswerKeyPDF(testId: string): Promise<Blob> {
    // Set loading state
    this.setState({
      loading: true,
      error: null,
      success: false,
      progress: null,
    });

    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT_MS);

      // Construct API URL
      const apiUrl = this.getApiUrl(`/api/tests/${testId}/download/answers`);

      // Make request with timeout
      const response = await fetch(apiUrl, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Check response status
      if (!response.ok) {
        if (response.status >= 500) {
          throw new Error(ERROR_MESSAGES.SERVER_ERROR);
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Get PDF blob
      const blob = await response.blob();

      // Set success state
      this.setState({
        loading: false,
        success: true,
        error: null,
      });

      return blob;
    } catch (error) {
      // Handle different error types
      let errorMessage: string;

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = ERROR_MESSAGES.TIMEOUT;
        } else if (error.message.includes('fetch') || error.message.includes('network')) {
          errorMessage = ERROR_MESSAGES.NETWORK_ERROR;
        } else if (Object.values(ERROR_MESSAGES).includes(error.message as any)) {
          errorMessage = error.message;
        } else {
          errorMessage = ERROR_MESSAGES.UNKNOWN;
        }
      } else {
        errorMessage = ERROR_MESSAGES.UNKNOWN;
      }

      // Set error state
      this.setState({
        loading: false,
        error: errorMessage,
        success: false,
      });

      throw new Error(errorMessage);
    }
  }

  /**
   * Helper to construct API URL
   * Handles both development and production environments
   */
  private getApiUrl(path: string): string {
    // Check if we're in development or production
    const isDevelopment = import.meta.env.DEV;
    const baseUrl = isDevelopment 
      ? 'http://localhost:3000' 
      : window.location.origin;
    
    return `${baseUrl}${path}`;
  }

  /**
   * Trigger browser download for a blob
   * 
   * @param blob - The PDF blob to download
   * @param filename - The filename for the download
   */
  triggerDownload(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

/**
 * Singleton instance for use across the application
 */
export const pdfDownloadService = new PDFDownloadService();
