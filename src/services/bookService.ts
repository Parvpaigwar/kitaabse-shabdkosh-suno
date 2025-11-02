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
  pdf_file?: string;
  cover_image: string | null;
  total_pages: number;
  total_duration?: number;
  processing_status: 'uploaded' | 'processing' | 'completed' | 'failed';
  processing_progress: number;
  processing_error?: string | null;
  is_public: boolean;
  listen_count?: number;
  favorite_count?: number;
  uploader: Uploader;
  uploaded_at: string;
  processed_at?: string | null;
  user_progress?: UserProgress;
  is_in_library?: boolean;
  is_favorite?: boolean;
}

export interface UserProgress {
  current_page: number;
  total_pages: number;
  percentage: number;
  current_position?: number;
  last_listened: string;
}

export interface BookPage {
  page_number: number;
  text_content: string;
  audio_file: string;
  audio_duration: number;
  processing_status: string;
  created_at: string;
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
  current_page: number;
  current_position?: number;
}

export interface ProgressItem {
  book: {
    id: number;
    title: string;
    author: string | null;
    cover_image: string | null;
  };
  current_page: number;
  total_pages: number;
  percentage: number;
  last_listened: string;
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
export const getBookDetails = async (bookId: number): Promise<APIResponse<{ book: Book }>> => {
  const response = await api.get<APIResponse<{ book: Book }>>(`/api/books/${bookId}/`);
  return response.data;
};

/**
 * Get Book Pages with Audio
 * Get all pages of a book with their audio files, text content, and metadata.
 */
export const getBookPages = async (
  bookId: number,
  page?: number
): Promise<APIResponse<{ book: { id: number; title: string; total_pages: number }; pages: BookPage[] }>> => {
  const params = page ? { page } : undefined;
  const response = await api.get<APIResponse<{ book: { id: number; title: string; total_pages: number }; pages: BookPage[] }>>(
    `/api/books/${bookId}/pages/`,
    { params }
  );
  return response.data;
};

/**
 * Update Listening Progress
 * Update user's listening progress for a book.
 */
export const updateProgress = async (
  bookId: number,
  data: UpdateProgressRequest
): Promise<APIResponse<{ progress: UserProgress }>> => {
  const response = await api.post<APIResponse<{ progress: UserProgress }>>(`/api/books/${bookId}/progress/`, data);
  return response.data;
};

/**
 * Get My Progress (All Books)
 * Get listening progress for all books the user has started listening to.
 */
export const getMyProgress = async (): Promise<APIResponse<{ progress: ProgressItem[] }>> => {
  const response = await api.get<APIResponse<{ progress: ProgressItem[] }>>('/api/books/progress/');
  return response.data;
};
