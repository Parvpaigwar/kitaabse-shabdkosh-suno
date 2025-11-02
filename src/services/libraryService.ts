import api, { APIResponse, PaginatedResponse } from './api';
import { Book, UserProgress } from './bookService';

// Types
export interface LibraryItem {
  book: Book;
  is_favorite: boolean;
  added_at: string;
  progress?: {
    current_page: number;
    percentage: number;
  };
}

export interface GetLibraryParams {
  page?: number;
  favorites_only?: boolean;
}

export interface AddToLibraryRequest {
  book_id: number;
}

export interface AddToLibraryResponse {
  book_id: number;
  message: string;
}

export interface RemoveFromLibraryResponse {
  book_id: number;
  message: string;
}

export interface ToggleFavoriteResponse {
  book_id: number;
  is_favorite: boolean;
  message: string;
}

// API Functions

/**
 * Get My Library
 * Get all books in user's personal library (bookshelf).
 */
export const getMyLibrary = async (
  params?: GetLibraryParams
): Promise<APIResponse<PaginatedResponse<LibraryItem>>> => {
  const response = await api.get<APIResponse<PaginatedResponse<LibraryItem>>>('/api/books/library/', {
    params,
  });
  return response.data;
};

/**
 * Add Book to Library
 * Add a book to user's personal library for easy access.
 */
export const addToLibrary = async (data: AddToLibraryRequest): Promise<APIResponse<AddToLibraryResponse>> => {
  const response = await api.post<APIResponse<AddToLibraryResponse>>('/api/books/library/add/', data);
  return response.data;
};

/**
 * Remove Book from Library
 * Remove a book from user's personal library.
 */
export const removeFromLibrary = async (bookId: number): Promise<APIResponse<RemoveFromLibraryResponse>> => {
  const response = await api.delete<APIResponse<RemoveFromLibraryResponse>>(`/api/books/library/${bookId}/`);
  return response.data;
};

/**
 * Toggle Favorite
 * Toggle favorite status for a book in user's library.
 */
export const toggleFavorite = async (bookId: number): Promise<APIResponse<ToggleFavoriteResponse>> => {
  const response = await api.post<APIResponse<ToggleFavoriteResponse>>(`/api/books/library/${bookId}/favorite/`);
  return response.data;
};
