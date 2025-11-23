import api, { APIResponse, PaginatedResponse } from './api';

// Types
export interface Uploader {
  id: number;
  name: string;
  email?: string;
}

export interface Book {
  id: number;
  title: string;
  author: string | null;
  description: string | null;
  language: string;
  genre: string | null;
  pdf_url?: string;
  cover_url?: string | null;
  cover_image?: string | null;
  total_pages: number;
  total_duration?: number;
  processing_status: 'uploaded' | 'processing' | 'completed' | 'failed';
  processing_progress: number;
  processing_error?: string | null;
  is_public: boolean;
  is_active?: boolean;
  listen_count?: number;
  favorite_count?: number;
  uploader: Uploader;
  uploaded_at: string;
  processed_at?: string | null;
  modified_at?: string;
  pages_count?: number;
  user_progress?: UserProgress;
  is_in_library?: boolean;
  is_favorite?: boolean;
}

export interface UserProgress {
  current_page: number;
  current_position?: number;
  completion_percentage: number;
  total_listened_time: number;
  is_completed: boolean;
  last_listened_at: string;
}

export interface BookPage {
  id: number;
  page_number: number;
  text_content: string;
  audio_url: string | null;
  audio_duration: number;
  processing_status: string;
  processing_error?: string | null;
  processed_at?: string | null;
}

export interface UploadBookRequest {
  title: string;
  author?: string;
  description?: string;
  language: string;
  genre?: string;
  pdf_file: File;
  cover_image?: File;
  is_public?: boolean;
}

export interface GetBooksParams {
  page?: number;
  page_size?: number;
  search?: string;
  language?: string;
  genre?: string;
  sort_by?: 'recent' | 'popular' | 'title' | 'author';
}

export interface GetMyBooksParams {
  page?: number;
  status?: 'uploaded' | 'processing' | 'completed' | 'failed';
}

export interface UpdateProgressRequest {
  page_number: number;
  position?: number;
  listened_time?: number;
}

export interface ProgressItem {
  id: number;
  book: Book;
  current_page: number;
  current_position: number;
  total_listened_time: number;
  is_completed: boolean;
  completion_percentage: number;
  started_at: string;
  last_listened_at: string;
  completed_at: string | null;
}

export interface UpdateBookRequest {
  title?: string;
  author?: string;
  description?: string;
  genre?: string;
  is_public?: boolean;
}

export interface BookProcessingStatus {
  book_id: number;
  title: string;
  processing_status: string;
  processing_progress: number;
  total_pages: number;
  pages_status: {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  };
  audio_ready: boolean;
  pages_with_audio: number;
  estimated_time_remaining: string;
  created_at: string;
  last_updated: string;
}

// API Functions

/**
 * Upload Book
 * Upload a PDF book for audio conversion.
 */
export const uploadBook = async (data: UploadBookRequest): Promise<APIResponse<{ book: Book }>> => {
  const formData = new FormData();
  formData.append('title', data.title);
  if (data.author) formData.append('author', data.author);
  if (data.description) formData.append('description', data.description);
  formData.append('language', data.language);
  if (data.genre) formData.append('genre', data.genre);
  formData.append('pdf_file', data.pdf_file);
  if (data.cover_image) formData.append('cover_image', data.cover_image);
  if (data.is_public !== undefined) formData.append('is_public', String(data.is_public));

  const response = await api.post<APIResponse<{ book: Book }>>('/api/books/upload/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

/**
 * Get All Books (Public Library)
 * Get a list of all public books with pagination, filtering, and search capabilities.
 */
export const getAllBooks = async (params?: GetBooksParams): Promise<APIResponse<PaginatedResponse<Book>>> => {
  const response = await api.get<APIResponse<PaginatedResponse<Book>>>('/api/books/books/', {
    params,
  });
  return response.data;
};

/**
 * Get My Uploaded Books
 * Get all books uploaded by the authenticated user, including private books.
 */
export const getMyBooks = async (params?: GetMyBooksParams): Promise<APIResponse<PaginatedResponse<Book>>> => {
  const response = await api.get<APIResponse<PaginatedResponse<Book>>>('/api/books/my/', {
    params,
  });
  return response.data;
};

/**
 * Get Book Details
 * Get detailed information about a specific book.
 */
export const getBookDetails = async (bookId: number): Promise<APIResponse<Book>> => {
  const response = await api.get<APIResponse<Book>>(`/api/books/${bookId}/`);
  return response.data;
};

/**
 * Get Book Pages with Audio
 * Get all pages of a book with their audio files, text content, and metadata.
 */
export const getBookPages = async (
  bookId: number,
  page?: number
): Promise<APIResponse<{ book: { id: number; title: string; total_pages: number; processing_status: string }; pages: BookPage[] }>> => {
  const params = page ? { page } : undefined;
  const response = await api.get<APIResponse<{ book: { id: number; title: string; total_pages: number; processing_status: string }; pages: BookPage[] }>>(
    `/api/books/${bookId}/pages/`,
    { params }
  );
  return response.data;
};

/**
 * Get Book Progress
 * Get user's listening progress for a specific book.
 */
export const getBookProgress = async (bookId: number): Promise<APIResponse<UserProgress>> => {
  const response = await api.get<APIResponse<UserProgress>>(`/api/books/${bookId}/progress/`);
  return response.data;
};

/**
 * Update Listening Progress
 * Update user's listening progress for a book.
 */
export const updateProgress = async (
  bookId: number,
  data: UpdateProgressRequest
): Promise<APIResponse<UserProgress>> => {
  const response = await api.put<APIResponse<UserProgress>>(`/api/books/${bookId}/progress/`, data);
  return response.data;
};

/**
 * Get My Progress (All Books)
 * Get listening progress for all books the user has started listening to.
 */
export const getMyProgress = async (params?: { in_progress?: boolean; completed?: boolean }): Promise<APIResponse<ProgressItem[]>> => {
  const response = await api.get<APIResponse<ProgressItem[]>>('/api/books/progress/', { params });
  return response.data;
};

/**
 * Update Book Details
 * Update book metadata (only by the uploader).
 */
export const updateBook = async (bookId: number, data: UpdateBookRequest): Promise<APIResponse<Book>> => {
  const response = await api.patch<APIResponse<Book>>(`/api/books/${bookId}/`, data);
  return response.data;
};

/**
 * Delete Book
 * Soft delete a book (only by the uploader).
 */
export const deleteBook = async (bookId: number): Promise<APIResponse<{ id: number }>> => {
  const response = await api.delete<APIResponse<{ id: number }>>(`/api/books/${bookId}/`);
  return response.data;
};

/**
 * Get Book Processing Status
 * Get detailed processing status for a book including page-by-page progress.
 */
export const getBookStatus = async (bookId: number): Promise<APIResponse<BookProcessingStatus>> => {
  const response = await api.get<APIResponse<BookProcessingStatus>>(`/api/books/${bookId}/status/`);
  return response.data;
};
