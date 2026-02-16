/**
 * Unit tests for PDFDownloadService
 * 
 * Tests state management, timeout handling, error handling, and download functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PDFDownloadService, ERROR_MESSAGES, type DownloadState } from './pdfDownloadService';

describe('PDFDownloadService', () => {
  let service: PDFDownloadService;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    service = new PDFDownloadService();
    
    // Mock fetch with proper typing
    fetchMock = vi.fn() as any;
    global.fetch = fetchMock as any;

    // Mock setTimeout and clearTimeout
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('State Management', () => {
    it('should initialize with default state', () => {
      const state = service.getState();
      expect(state).toEqual({
        loading: false,
        error: null,
        success: false,
        progress: null,
      });
    });

    it('should update state correctly', () => {
      service.setState({ loading: true });
      expect(service.getState().loading).toBe(true);

      service.setState({ error: 'Test error' });
      expect(service.getState().error).toBe('Test error');
      expect(service.getState().loading).toBe(true); // Previous state preserved
    });

    it('should reset state to initial values', () => {
      service.setState({ loading: true, error: 'Error', success: true });
      service.reset();
      
      const state = service.getState();
      expect(state).toEqual({
        loading: false,
        error: null,
        success: false,
        progress: null,
      });
    });

    it('should clear error timer when reset is called', async () => {
      fetchMock.mockRejectedValue(new Error('Failed to fetch'));

      await expect(service.downloadTestPDF('test-123')).rejects.toThrow(
        ERROR_MESSAGES.NETWORK_ERROR
      );
      
      // Error should be set
      expect(service.getState().error).toBe(ERROR_MESSAGES.NETWORK_ERROR);
      
      // Reset before timer expires
      service.reset();
      
      // Advance time - error should not be cleared because timer was cancelled
      vi.advanceTimersByTime(2000);
      
      // State should remain reset (null error)
      expect(service.getState().error).toBe(null);
      expect(service.getState().loading).toBe(false);
    });

    it('should clear success timer when reset is called', async () => {
      const mockBlob = new Blob(['test pdf'], { type: 'application/pdf' });
      fetchMock.mockResolvedValue({
        ok: true,
        blob: async () => mockBlob,
      });

      await service.downloadTestPDF('test-123');
      
      // Success should be set
      expect(service.getState().success).toBe(true);
      
      // Reset before timer expires
      service.reset();
      
      // Advance time - success should not be reset again because timer was cancelled
      vi.advanceTimersByTime(3000);
      
      // State should remain reset (false success)
      expect(service.getState().success).toBe(false);
      expect(service.getState().loading).toBe(false);
    });

    it('should notify listeners on state change', () => {
      const listener = vi.fn();
      service.subscribe(listener);

      service.setState({ loading: true });
      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({ loading: true })
      );
    });

    it('should allow unsubscribing from state changes', () => {
      const listener = vi.fn();
      const unsubscribe = service.subscribe(listener);

      service.setState({ loading: true });
      expect(listener).toHaveBeenCalledTimes(1);

      unsubscribe();
      service.setState({ loading: false });
      expect(listener).toHaveBeenCalledTimes(1); // Should not be called again
    });
  });

  describe('downloadTestPDF', () => {
    it('should set loading state on initiation', async () => {
      // Mock successful response
      const mockBlob = new Blob(['test pdf'], { type: 'application/pdf' });
      fetchMock.mockResolvedValue({
        ok: true,
        blob: async () => mockBlob,
      });

      const downloadPromise = service.downloadTestPDF('test-123');
      
      // Check loading state immediately
      expect(service.getState().loading).toBe(true);
      expect(service.getState().error).toBe(null);
      expect(service.getState().success).toBe(false);

      await downloadPromise;
    });

    it('should show progress message after 2 seconds (Requirement 5.3)', async () => {
      // Mock a slow response
      const mockBlob = new Blob(['test pdf'], { type: 'application/pdf' });
      let resolveDownload: (value: any) => void;
      const downloadPromise = new Promise((resolve) => {
        resolveDownload = resolve;
      });
      
      fetchMock.mockReturnValue(downloadPromise);

      const servicePromise = service.downloadTestPDF('test-123');
      
      // Initially no progress message
      expect(service.getState().progress).toBe(null);
      
      // After 2 seconds, progress message should appear
      vi.advanceTimersByTime(2000);
      expect(service.getState().progress).toBe('This may take a moment...');
      
      // Complete the download
      resolveDownload!({
        ok: true,
        blob: async () => mockBlob,
      });
      
      await servicePromise;
      
      // Progress message should be cleared after completion
      expect(service.getState().progress).toBe(null);
    });

    it('should successfully download test PDF', async () => {
      const mockBlob = new Blob(['test pdf'], { type: 'application/pdf' });
      fetchMock.mockResolvedValue({
        ok: true,
        blob: async () => mockBlob,
      });

      const result = await service.downloadTestPDF('test-123');

      expect(result).toBe(mockBlob);
      expect(service.getState()).toEqual({
        loading: false,
        error: null,
        success: true,
        progress: null,
      });
    });

    it('should display success message for 3 seconds then reset (Requirement 5.6)', async () => {
      const mockBlob = new Blob(['test pdf'], { type: 'application/pdf' });
      fetchMock.mockResolvedValue({
        ok: true,
        blob: async () => mockBlob,
      });

      await service.downloadTestPDF('test-123');

      // Success should be set immediately
      expect(service.getState().success).toBe(true);
      expect(service.getState().loading).toBe(false);
      expect(service.getState().error).toBe(null);

      // After 3 seconds, state should be reset
      vi.advanceTimersByTime(3000);
      expect(service.getState()).toEqual({
        loading: false,
        error: null,
        success: false,
        progress: null,
      });
    });

    it('should handle 30-second timeout', async () => {
      // Mock AbortController
      const mockAbort = vi.fn();
      const mockController = { abort: mockAbort, signal: {} as AbortSignal };
      vi.spyOn(global, 'AbortController').mockImplementation(() => mockController as any);

      // Mock a request that rejects with AbortError
      fetchMock.mockRejectedValue(Object.assign(new Error('The operation was aborted'), { name: 'AbortError' }));

      const downloadPromise = service.downloadTestPDF('test-123');

      // Fast-forward time by 30 seconds to trigger timeout
      vi.advanceTimersByTime(30000);

      await expect(downloadPromise).rejects.toThrow(ERROR_MESSAGES.TIMEOUT);
      expect(service.getState().error).toBe(ERROR_MESSAGES.TIMEOUT);
      expect(service.getState().loading).toBe(false);
    }, 15000);

    it('should handle server errors (500+)', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(service.downloadTestPDF('test-123')).rejects.toThrow(
        ERROR_MESSAGES.SERVER_ERROR
      );
      expect(service.getState().error).toBe(ERROR_MESSAGES.SERVER_ERROR);
    });

    it('should handle network errors', async () => {
      fetchMock.mockRejectedValue(new Error('Failed to fetch'));

      await expect(service.downloadTestPDF('test-123')).rejects.toThrow(
        ERROR_MESSAGES.NETWORK_ERROR
      );
      expect(service.getState().error).toBe(ERROR_MESSAGES.NETWORK_ERROR);
    });

    it('should clear error after 2 seconds (Requirement 5.5)', async () => {
      fetchMock.mockRejectedValue(new Error('Failed to fetch'));

      await expect(service.downloadTestPDF('test-123')).rejects.toThrow(
        ERROR_MESSAGES.NETWORK_ERROR
      );
      
      // Error should be set immediately
      expect(service.getState().error).toBe(ERROR_MESSAGES.NETWORK_ERROR);
      expect(service.getState().loading).toBe(false);
      
      // After 2 seconds, error should be cleared to re-enable button
      vi.advanceTimersByTime(2000);
      expect(service.getState().error).toBe(null);
    });

    it('should call correct API endpoint', async () => {
      const mockBlob = new Blob(['test pdf'], { type: 'application/pdf' });
      fetchMock.mockResolvedValue({
        ok: true,
        blob: async () => mockBlob,
      });

      await service.downloadTestPDF('test-123');

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/api/tests/test-123/download/questions'),
        expect.objectContaining({
          method: 'GET',
        })
      );
    });
  });

  describe('downloadAnswerKeyPDF', () => {
    it('should set loading state on initiation', async () => {
      const mockBlob = new Blob(['answer key pdf'], { type: 'application/pdf' });
      fetchMock.mockResolvedValue({
        ok: true,
        blob: async () => mockBlob,
      });

      const downloadPromise = service.downloadAnswerKeyPDF('test-123');
      
      expect(service.getState().loading).toBe(true);
      expect(service.getState().error).toBe(null);
      expect(service.getState().success).toBe(false);

      await downloadPromise;
    });

    it('should show progress message after 2 seconds (Requirement 5.3)', async () => {
      // Mock a slow response
      const mockBlob = new Blob(['answer key pdf'], { type: 'application/pdf' });
      let resolveDownload: (value: any) => void;
      const downloadPromise = new Promise((resolve) => {
        resolveDownload = resolve;
      });
      
      fetchMock.mockReturnValue(downloadPromise);

      const servicePromise = service.downloadAnswerKeyPDF('test-123');
      
      // Initially no progress message
      expect(service.getState().progress).toBe(null);
      
      // After 2 seconds, progress message should appear
      vi.advanceTimersByTime(2000);
      expect(service.getState().progress).toBe('This may take a moment...');
      
      // Complete the download
      resolveDownload!({
        ok: true,
        blob: async () => mockBlob,
      });
      
      await servicePromise;
      
      // Progress message should be cleared after completion
      expect(service.getState().progress).toBe(null);
    });

    it('should successfully download answer key PDF', async () => {
      const mockBlob = new Blob(['answer key pdf'], { type: 'application/pdf' });
      fetchMock.mockResolvedValue({
        ok: true,
        blob: async () => mockBlob,
      });

      const result = await service.downloadAnswerKeyPDF('test-123');

      expect(result).toBe(mockBlob);
      expect(service.getState()).toEqual({
        loading: false,
        error: null,
        success: true,
        progress: null,
      });
    });

    it('should display success message for 3 seconds then reset (Requirement 5.6)', async () => {
      const mockBlob = new Blob(['answer key pdf'], { type: 'application/pdf' });
      fetchMock.mockResolvedValue({
        ok: true,
        blob: async () => mockBlob,
      });

      await service.downloadAnswerKeyPDF('test-123');

      // Success should be set immediately
      expect(service.getState().success).toBe(true);
      expect(service.getState().loading).toBe(false);
      expect(service.getState().error).toBe(null);

      // After 3 seconds, state should be reset
      vi.advanceTimersByTime(3000);
      expect(service.getState()).toEqual({
        loading: false,
        error: null,
        success: false,
        progress: null,
      });
    });

    it('should handle 30-second timeout', async () => {
      // Mock AbortController
      const mockAbort = vi.fn();
      const mockController = { abort: mockAbort, signal: {} as AbortSignal };
      vi.spyOn(global, 'AbortController').mockImplementation(() => mockController as any);

      // Mock a request that rejects with AbortError
      fetchMock.mockRejectedValue(Object.assign(new Error('The operation was aborted'), { name: 'AbortError' }));

      const downloadPromise = service.downloadAnswerKeyPDF('test-123');

      // Fast-forward time by 30 seconds to trigger timeout
      vi.advanceTimersByTime(30000);

      await expect(downloadPromise).rejects.toThrow(ERROR_MESSAGES.TIMEOUT);
      expect(service.getState().error).toBe(ERROR_MESSAGES.TIMEOUT);
    }, 15000);

    it('should handle server errors', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
      });

      await expect(service.downloadAnswerKeyPDF('test-123')).rejects.toThrow(
        ERROR_MESSAGES.SERVER_ERROR
      );
      expect(service.getState().error).toBe(ERROR_MESSAGES.SERVER_ERROR);
    });

    it('should clear error after 2 seconds (Requirement 5.5)', async () => {
      fetchMock.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(service.downloadAnswerKeyPDF('test-123')).rejects.toThrow(
        ERROR_MESSAGES.SERVER_ERROR
      );
      
      // Error should be set immediately
      expect(service.getState().error).toBe(ERROR_MESSAGES.SERVER_ERROR);
      expect(service.getState().loading).toBe(false);
      
      // After 2 seconds, error should be cleared to re-enable button
      vi.advanceTimersByTime(2000);
      expect(service.getState().error).toBe(null);
    });

    it('should call correct API endpoint', async () => {
      const mockBlob = new Blob(['answer key pdf'], { type: 'application/pdf' });
      fetchMock.mockResolvedValue({
        ok: true,
        blob: async () => mockBlob,
      });

      await service.downloadAnswerKeyPDF('test-123');

      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/api/tests/test-123/download/answers'),
        expect.objectContaining({
          method: 'GET',
        })
      );
    });
  });

  describe('triggerDownload', () => {
    it('should trigger browser download', () => {
      const mockBlob = new Blob(['test content'], { type: 'application/pdf' });
      const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
      const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
      
      // Mock document methods
      const mockAnchor = {
        href: '',
        download: '',
        click: vi.fn(),
      };
      
      // Create mock document if it doesn't exist
      if (typeof document === 'undefined') {
        (global as any).document = {
          createElement: vi.fn().mockReturnValue(mockAnchor),
          body: {
            appendChild: vi.fn(),
            removeChild: vi.fn(),
          },
        };
      } else {
        vi.spyOn(document, 'createElement').mockReturnValue(mockAnchor as any);
        vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockAnchor as any);
        vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockAnchor as any);
      }

      service.triggerDownload(mockBlob, 'test.pdf');

      expect(createObjectURLSpy).toHaveBeenCalledWith(mockBlob);
      expect(mockAnchor.href).toBe('blob:mock-url');
      expect(mockAnchor.download).toBe('test.pdf');
      expect(mockAnchor.click).toHaveBeenCalled();
      expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-url');

      // Cleanup
      createObjectURLSpy.mockRestore();
      revokeObjectURLSpy.mockRestore();
    });
  });

  describe('Error handling integration (Requirements 5.4, 5.5, 5.7)', () => {
    it('should display network error and re-enable button after 2 seconds', async () => {
      // Simulate network error
      fetchMock.mockRejectedValue(new Error('Failed to fetch'));

      // Attempt download
      const downloadPromise = service.downloadTestPDF('test-123');

      // Initially loading
      expect(service.getState().loading).toBe(true);
      expect(service.getState().error).toBe(null);

      // Wait for download to fail
      await expect(downloadPromise).rejects.toThrow(ERROR_MESSAGES.NETWORK_ERROR);

      // Error should be displayed (Requirement 5.4, 5.7)
      expect(service.getState().loading).toBe(false);
      expect(service.getState().error).toBe(ERROR_MESSAGES.NETWORK_ERROR);

      // Button would be enabled here (loading is false)
      // But error message is still shown

      // After 2 seconds, error is cleared (Requirement 5.5)
      vi.advanceTimersByTime(2000);
      expect(service.getState().error).toBe(null);
      expect(service.getState().loading).toBe(false);

      // Button remains enabled and ready for retry
    });

    it('should handle different error types with specific messages', async () => {
      // Test timeout error
      const mockController = { abort: vi.fn(), signal: {} as AbortSignal };
      vi.spyOn(global, 'AbortController').mockImplementation(() => mockController as any);
      fetchMock.mockRejectedValue(Object.assign(new Error('The operation was aborted'), { name: 'AbortError' }));

      await expect(service.downloadTestPDF('test-123')).rejects.toThrow(ERROR_MESSAGES.TIMEOUT);
      expect(service.getState().error).toBe(ERROR_MESSAGES.TIMEOUT);

      // Clear for next test
      service.reset();

      // Test server error
      fetchMock.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      await expect(service.downloadTestPDF('test-123')).rejects.toThrow(ERROR_MESSAGES.SERVER_ERROR);
      expect(service.getState().error).toBe(ERROR_MESSAGES.SERVER_ERROR);
    });
  });
});
