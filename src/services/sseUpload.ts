import { UploadBookRequest } from './bookService';

export interface SSEEvent {
  type: 'status' | 'processing_started' | 'page_progress' | 'audio_generation_started' | 'completed' | 'error';
  data: any;
}

export interface UploadProgress {
  currentPage: number;
  totalPages: number;
  progress: number;
  message: string;
  status: 'idle' | 'uploading' | 'processing' | 'audio_generation' | 'completed' | 'error';
}

export interface SSEUploadCallbacks {
  onProgress?: (progress: UploadProgress) => void;
  onCompleted?: (data: any) => void;
  onError?: (error: string) => void;
}

/**
 * Upload a book with SSE real-time progress updates
 */
export const uploadBookWithSSE = async (
  data: UploadBookRequest,
  callbacks: SSEUploadCallbacks
): Promise<void> => {
  const formData = new FormData();

  // Add all form fields
  formData.append('title', data.title);
  if (data.author) formData.append('author', data.author);
  if (data.description) formData.append('description', data.description);
  formData.append('language', data.language);
  if (data.genre) formData.append('genre', data.genre);
  formData.append('pdf_file', data.pdf_file);
  if (data.cover_image) formData.append('cover_image', data.cover_image);
  if (data.is_public !== undefined) formData.append('is_public', String(data.is_public));

  const token = localStorage.getItem('token');

  try {
    // Use query parameter ?stream=true instead of Accept header
    const response = await fetch('https://kiaatbse-backend.onrender.com/api/books/upload/?stream=true', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // No Accept header needed - using query param instead
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    const readStream = async (): Promise<void> => {
      const { done, value } = await reader.read();

      if (done) {
        return;
      }

      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split('\n\n');

      // Keep the last incomplete event in buffer
      buffer = events.pop() || '';

      for (const eventText of events) {
        if (!eventText.trim()) continue;

        try {
          const event = parseSSEEvent(eventText);
          handleSSEEvent(event, callbacks);
        } catch (error) {
          console.error('Error parsing SSE event:', error, eventText);
        }
      }

      // Continue reading
      return readStream();
    };

    await readStream();
  } catch (error: any) {
    const errorMessage = error.message || 'Upload failed';
    callbacks.onError?.(errorMessage);
    throw error;
  }
};

/**
 * Parse SSE event text into structured event object
 */
function parseSSEEvent(eventText: string): SSEEvent {
  const lines = eventText.split('\n');
  let eventType = 'message';
  let eventData = '';

  for (const line of lines) {
    if (line.startsWith('event:')) {
      eventType = line.substring(6).trim();
    } else if (line.startsWith('data:')) {
      eventData = line.substring(5).trim();
    }
  }

  return {
    type: eventType as SSEEvent['type'],
    data: JSON.parse(eventData),
  };
}

/**
 * Handle different SSE event types
 */
function handleSSEEvent(event: SSEEvent, callbacks: SSEUploadCallbacks): void {
  switch (event.type) {
    case 'status':
      callbacks.onProgress?.({
        currentPage: 0,
        totalPages: 0,
        progress: 0,
        message: event.data.message,
        status: 'uploading',
      });
      break;

    case 'processing_started':
      callbacks.onProgress?.({
        currentPage: 0,
        totalPages: event.data.total_pages,
        progress: 0,
        message: event.data.message || `Processing ${event.data.total_pages} pages with OCR`,
        status: 'processing',
      });
      break;

    case 'page_progress':
      callbacks.onProgress?.({
        currentPage: event.data.current_page,
        totalPages: event.data.total_pages,
        progress: event.data.progress,
        message: event.data.message || `Processing page ${event.data.current_page} of ${event.data.total_pages}`,
        status: 'processing',
      });
      break;

    case 'audio_generation_started':
      callbacks.onProgress?.({
        currentPage: 0,
        totalPages: event.data.total_pages,
        progress: 100, // OCR is done
        message: event.data.message || 'Starting audio generation...',
        status: 'audio_generation',
      });
      break;

    case 'completed':
      callbacks.onProgress?.({
        currentPage: event.data.total_pages,
        totalPages: event.data.total_pages,
        progress: 100,
        message: 'Upload completed successfully!',
        status: 'completed',
      });
      callbacks.onCompleted?.(event.data);
      break;

    case 'error':
      callbacks.onError?.(event.data.error || 'An error occurred during upload');
      break;

    default:
      console.warn('Unknown SSE event type:', event.type);
  }
}
