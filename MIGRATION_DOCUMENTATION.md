# KitaabSe Frontend Migration Documentation

**Date:** November 2, 2025
**Migration:** Supabase → Django REST API Backend
**Backend URL:** `https://kiaatbse-backend.onrender.com`

---

## Table of Contents

1. [Overview](#overview)
2. [Changes Made](#changes-made)
3. [File Structure](#file-structure)
4. [Implementation Details](#implementation-details)
5. [Still Pending](#still-pending)
6. [Testing Guide](#testing-guide)
7. [API Reference](#api-reference)
8. [Troubleshooting](#troubleshooting)

---

## Overview

### What Was Done

The KitaabSe frontend has been migrated from Supabase backend to a Django REST API backend. This migration involved:

- ✅ Replacing all Supabase client calls with Django REST API calls
- ✅ Implementing new authentication flow (JWT-based)
- ✅ Creating comprehensive API service layer
- ✅ Updating all major components to use new backend
- ✅ Adding axios for HTTP requests with token management

### What Changed

**Before:** Supabase (PostgreSQL + Auth + Storage + Realtime)
**After:** Django REST API (Custom backend at `kiaatbse-backend.onrender.com`)

**Key Differences:**
- Authentication: Supabase Auth → JWT tokens (access + refresh)
- Data fetching: Supabase client → Axios HTTP requests
- File uploads: Supabase Storage → Django multipart/form-data
- Real-time updates: Removed (can be added later with WebSockets)
- Data structure: Chunks → Pages (for book audio)

---

## Changes Made

### 1. New Dependencies Added

```json
{
  "axios": "^1.x.x"  // HTTP client for API calls
}
```

**Installation:**
```bash
npm install axios
```

### 2. New Files Created

#### API Service Layer (`src/services/`)

| File | Purpose | Lines |
|------|---------|-------|
| `api.ts` | Axios instance with interceptors for auth | ~90 |
| `authService.ts` | Authentication APIs (signup, verify, login) | ~100 |
| `bookService.ts` | Book management APIs | ~180 |
| `libraryService.ts` | Library/bookshelf APIs | ~80 |

**Total:** 4 new files, ~450 lines of code

### 3. Files Modified

#### Core Components

| File | Changes | Status |
|------|---------|--------|
| `src/contexts/AuthContext.tsx` | Complete rewrite for Django backend | ✅ Done |
| `src/pages/Auth.tsx` | Updated login/signup logic | ✅ Done |
| `src/components/OTPVerification.tsx` | Updated OTP verification | ✅ Done |
| `src/pages/Library.tsx` | Complete rewrite for new API | ✅ Done |
| `src/pages/Upload.tsx` | Not directly modified | ✅ Done |
| `src/components/upload/BookForm.tsx` | Updated upload logic | ✅ Done |
| `src/components/FeaturedBooks.tsx` | Updated book fetching | ✅ Done |
| `src/pages/BookPlayer.tsx` | **NOT YET UPDATED** | ❌ Pending |

#### Navigation Components

| File | Changes | Status |
|------|---------|--------|
| `src/components/Navbar.tsx` | Uses new AuthContext | ✅ Auto-updated |
| `src/components/upload/AuthGuard.tsx` | Uses new AuthContext | ✅ Auto-updated |

---

## File Structure

```
src/
├── services/                    # NEW: API service layer
│   ├── api.ts                   # Axios configuration + interceptors
│   ├── authService.ts           # Authentication APIs
│   ├── bookService.ts           # Book APIs
│   └── libraryService.ts        # Library APIs
│
├── contexts/
│   └── AuthContext.tsx          # MODIFIED: JWT auth instead of Supabase
│
├── pages/
│   ├── Auth.tsx                 # MODIFIED: New signup/login flow
│   ├── Library.tsx              # MODIFIED: New book listing
│   ├── BookPlayer.tsx           # PENDING: Needs update
│   └── Upload.tsx               # MODIFIED via BookForm
│
└── components/
    ├── OTPVerification.tsx      # MODIFIED: New OTP API
    ├── FeaturedBooks.tsx        # MODIFIED: New book API
    ├── Navbar.tsx               # Auto-updated (uses AuthContext)
    └── upload/
        ├── BookForm.tsx         # MODIFIED: New upload API
        └── AuthGuard.tsx        # Auto-updated (uses AuthContext)
```

---

## Implementation Details

### 1. API Service (`src/services/api.ts`)

**Features:**
- Axios instance with base URL configuration
- Request interceptor: Auto-adds JWT token to headers
- Response interceptor: Handles 401 errors (token expiration)
- Timeout: 30 seconds
- Standard response types

**Key Code:**
```typescript
const api = axios.create({
  baseURL: 'https://kiaatbse-backend.onrender.com',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// Auto-add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
      localStorage.clear();
      window.location.href = '/auth';
    }
    return Promise.reject(error);
  }
);
```

### 2. Authentication Flow

#### Before (Supabase):
```typescript
const { data, error } = await supabase.auth.signUp({ email, password });
await supabase.auth.verifyOtp({ email, token: otp, type: 'email' });
const { data, error } = await supabase.auth.signInWithPassword({ email, password });
```

#### After (Django):
```typescript
// Signup
const response = await signup({ name, email });
// Returns: { status: 'PASS', data: { email, message }, http_code: 201 }

// Verify OTP
const response = await verifyOTP({ email, otp });
// Returns: { status: 'PASS', data: { email, message }, http_code: 200 }

// Login
const response = await login({ email, password });
// Returns: {
//   status: 'PASS',
//   data: {
//     user: { id, name, email, is_verified, joined_at },
//     tokens: { access, refresh }
//   },
//   http_code: 200
// }
```

**Token Storage:**
```typescript
localStorage.setItem('accessToken', tokens.access);   // 60 min expiry
localStorage.setItem('refreshToken', tokens.refresh); // 7 days expiry
localStorage.setItem('user', JSON.stringify(user));
```

### 3. Book Upload

#### Before (Supabase):
```typescript
// 1. Insert metadata
const { data: bookData } = await supabase.from('books').insert({...}).select();

// 2. Upload cover
await supabase.storage.from('book-covers').upload(path, file);

// 3. Upload PDF
await supabase.storage.from('books').upload(path, pdf);

// 4. Create chunk
await supabase.from('chunks').insert({...});

// 5. Trigger processing
await fetch('/api/process-book', { method: 'POST', ... });
```

#### After (Django):
```typescript
// Single API call handles everything
const response = await uploadBook({
  title,
  author,
  description,
  language,
  genre,
  pdf_file,      // File object
  cover_image,   // File object (optional)
  is_public,
});

// Backend handles:
// - File uploads to Cloudinary
// - OCR processing
// - Audio generation
// - Progress tracking
```

**Upload Format:**
```typescript
FormData:
  title: string
  author: string (optional)
  description: string (optional)
  language: 'hindi' | 'english' | 'urdu' | ...
  genre: 'literature' | 'fiction' | ... (optional)
  pdf_file: File (max 50MB)
  cover_image: File (optional)
  is_public: boolean (default: true)
```

### 4. Book Fetching

#### Before (Supabase):
```typescript
let query = supabase
  .from('books')
  .select('*, likes(count)')
  .eq('is_public', true);

if (language !== 'all') {
  query = query.eq('language', language);
}

const { data } = await query;
```

#### After (Django):
```typescript
const response = await getAllBooks({
  page: 1,
  page_size: 20,
  language: 'hindi',        // optional filter
  genre: 'literature',      // optional filter
  search: 'premchand',      // optional search
  sort_by: 'popular',       // 'popular' | 'recent' | 'title' | 'author'
});

// Returns paginated results:
// {
//   count: 150,
//   next: 'url-to-next-page',
//   previous: null,
//   results: [{ id, title, author, ... }]
// }
```

### 5. Library Management

#### New Features:
```typescript
// Get my library
const { data } = await getMyLibrary({
  page: 1,
  favorites_only: false
});

// Add book to library
await addToLibrary({ book_id: 456 });

// Remove from library
await removeFromLibrary(456);

// Toggle favorite
await toggleFavorite(456);
```

### 6. Data Type Changes

#### Book Object:

**Before (Supabase):**
```typescript
{
  id: string;              // UUID
  title: string;
  author: string;
  cover_url: string | null;
  chunks_count: number;    // Total chunks
  ready_chunks_count: number; // Completed chunks
  user_id: string;         // UUID
}
```

**After (Django):**
```typescript
{
  id: number;              // Integer
  title: string;
  author: string | null;
  cover_image: string | null;  // Cloudinary URL
  total_pages: number;     // Total pages
  processing_status: 'uploaded' | 'processing' | 'completed' | 'failed';
  processing_progress: number;  // 0-100
  uploader: {
    id: number;
    name: string;
  };
}
```

---

## Still Pending

### 1. BookPlayer Component ❌

**File:** `src/pages/BookPlayer.tsx`
**Status:** Not updated
**Complexity:** High (475 lines)

**What needs to be done:**

1. **Replace chunk-based logic with page-based logic**
   ```typescript
   // OLD: Fetch chunks
   const { data: chunks } = await supabase
     .from('chunks')
     .select('*')
     .eq('book_id', bookId);

   // NEW: Fetch pages
   const response = await getBookPages(bookId);
   const pages = response.data.pages;
   ```

2. **Update audio playback**
   ```typescript
   // OLD: chunks[currentChunk].audio_url
   // NEW: pages[currentPage].audio_file
   ```

3. **Update progress tracking**
   ```typescript
   // OLD: Update chunk progress
   await supabase.from('user_progress').upsert({...});

   // NEW: Update page progress
   await updateProgress(bookId, {
     current_page: pageNumber,
     current_position: audioCurrentTime
   });
   ```

4. **Update real-time subscriptions**
   ```typescript
   // OLD: Supabase realtime
   const channel = supabase.channel('chunks')
     .on('postgres_changes', {...}, () => {})
     .subscribe();

   // NEW: Polling or WebSocket (if available)
   // For now: Remove realtime, rely on manual refresh
   ```

5. **Update like/share functionality**
   ```typescript
   // OLD: Direct Supabase queries
   await supabase.from('likes').insert({...});

   // NEW: Use library API
   await toggleFavorite(bookId);
   ```

**Estimated effort:** 2-3 hours

**Template to start:**
```typescript
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getBookDetails, getBookPages, updateProgress } from "@/services/bookService";
import { BookPage } from "@/services/bookService";

const BookPlayer = () => {
  const { id } = useParams();
  const [book, setBook] = useState(null);
  const [pages, setPages] = useState<BookPage[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookData();
  }, [id]);

  const fetchBookData = async () => {
    // Fetch book details
    const bookResponse = await getBookDetails(Number(id));
    setBook(bookResponse.data.book);

    // Fetch all pages
    const pagesResponse = await getBookPages(Number(id));
    setPages(pagesResponse.data.pages);

    setLoading(false);
  };

  const handlePageComplete = async () => {
    await updateProgress(Number(id), {
      current_page: currentPage + 1,
      current_position: 0
    });
    setCurrentPage(prev => prev + 1);
  };

  // ... rest of the player logic
};
```

### 2. Real-time Updates (Optional)

**Status:** Removed during migration
**Impact:** Low (users can refresh manually)

**What was removed:**
- Real-time chunk status updates in Library
- Real-time like count updates in FeaturedBooks
- Real-time progress sync across devices

**Possible solutions:**
1. Add polling (check for updates every 10-30 seconds)
2. Implement WebSocket connection to Django backend
3. Use Server-Sent Events (SSE)

**Example polling implementation:**
```typescript
useEffect(() => {
  const interval = setInterval(() => {
    fetchBooks(); // Refresh every 10 seconds
  }, 10000);

  return () => clearInterval(interval);
}, []);
```

### 3. Password Reset Flow

**Files:**
- `src/components/PasswordReset.tsx`
- `src/components/UpdatePassword.tsx`

**Status:** Not updated (no password in signup)
**Impact:** None (current signup doesn't use passwords)

**Note:** The Django backend signup only requires `name` and `email`. The password field was removed from the signup form. If password authentication is needed later:

1. Update backend to include password in signup
2. Add password field to `Auth.tsx` signup form
3. Implement password reset endpoints
4. Update `PasswordReset.tsx` and `UpdatePassword.tsx`

### 4. Admin Panel Integration

**Status:** Not implemented
**Current:** User role is hardcoded to `'user'` in AuthContext

**TODO:**
1. Backend should return user role in login response
2. Update `User` type to include `role` field
3. Update AuthContext to set role from API response

```typescript
// In authService.ts
export interface User {
  id: number;
  name: string;
  email: string;
  is_verified: boolean;
  joined_at: string;
  role?: 'superadmin' | 'user';  // Add this
}

// In AuthContext.tsx
if (storedUser) {
  setUser(storedUser);
  setUserRole(storedUser.role || 'user');  // Set from user data
}
```

---

## Testing Guide

### 1. Testing Authentication

#### Signup Flow:
```bash
# 1. Open http://localhost:8080/auth
# 2. Click "Sign up" tab
# 3. Enter:
#    Name: Test User
#    Email: test@example.com
# 4. Click "Create account"
# 5. Check email for OTP (or check backend logs)
# 6. Enter 6-digit OTP
# 7. Click "Verify Email"
# 8. Should redirect to login
```

#### Login Flow:
```bash
# 1. Enter email: test@example.com
# 2. Enter password (if backend requires)
# 3. Click "Login"
# 4. Should redirect to homepage
# 5. Check localStorage for tokens:
#    - accessToken
#    - refreshToken
#    - user
```

### 2. Testing Book Upload

```bash
# 1. Login first
# 2. Navigate to /upload
# 3. Fill form:
#    Title: "Godan"
#    Author: "Munshi Premchand"
#    Language: Hindi
#    Description: "Classic Hindi novel"
#    PDF: Upload a PDF file (max 50MB)
#    Cover: Upload an image (optional)
#    Public: Yes
# 4. Click "Upload Book"
# 5. Should show success toast
# 6. Navigate to /library
# 7. Book should appear with "Processing" status
```

### 3. Testing Book Browsing

```bash
# 1. Navigate to homepage
# 2. Scroll to "Explore Books" section
# 3. Test filters:
#    - Language: All / Hindi / Urdu / Sanskrit
#    - Sort: Popular / Recent
# 4. Books should update based on filters
# 5. Click on a book card
# 6. Should navigate to /book/:id (will fail until BookPlayer is updated)
```

### 4. Testing Library

```bash
# 1. Login and navigate to /library
# 2. Test filters:
#    - All / Public / Private / Processing
# 3. Verify book cards show:
#    - Title, Author
#    - Cover image
#    - Processing status badge
#    - Progress bar (if processing)
#    - Language, Genre badges
#    - Page count, listen count
# 4. Click "Listen" (only enabled for completed books)
# 5. Should navigate to BookPlayer (will fail until updated)
```

### 5. Testing API Calls (Browser DevTools)

```javascript
// Open browser console (F12)

// Test authentication
const response = await fetch('https://kiaatbse-backend.onrender.com/api/users/signup/', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Test', email: 'test@example.com' })
});
console.log(await response.json());

// Test with token
const token = localStorage.getItem('accessToken');
const booksResponse = await fetch('https://kiaatbse-backend.onrender.com/api/books/my/', {
  headers: { 'Authorization': `Bearer ${token}` }
});
console.log(await booksResponse.json());
```

---

## API Reference

### Base URL
```
https://kiaatbse-backend.onrender.com
```

### Authentication

#### 1. Signup
```http
POST /api/users/signup/
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com"
}

Response 201:
{
  "data": {
    "email": "john@example.com",
    "message": "OTP sent successfully"
  },
  "status": "PASS",
  "http_code": 201,
  "message": "User registered successfully. Please verify OTP sent to your email."
}
```

#### 2. Verify OTP
```http
POST /api/users/verify/
Content-Type: application/json

{
  "email": "john@example.com",
  "otp": "123456"
}

Response 200:
{
  "data": {
    "email": "john@example.com",
    "message": "Account verified successfully"
  },
  "status": "PASS",
  "http_code": 200,
  "message": "OTP verified successfully. You can now login."
}
```

#### 3. Login
```http
POST /api/users/login/
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}

Response 200:
{
  "data": {
    "user": {
      "id": 123,
      "name": "John Doe",
      "email": "john@example.com",
      "is_verified": true,
      "joined_at": "2025-11-02T10:30:00Z"
    },
    "tokens": {
      "access": "eyJhbGc...",
      "refresh": "eyJhbGc..."
    }
  },
  "status": "PASS",
  "http_code": 200,
  "message": "Login successful"
}
```

### Books

#### 4. Upload Book
```http
POST /api/books/upload/
Authorization: Bearer <access_token>
Content-Type: multipart/form-data

Form Data:
  title: "Godan"
  author: "Munshi Premchand"
  description: "Classic Hindi novel"
  language: "hindi"
  genre: "literature"
  pdf_file: <File>
  cover_image: <File> (optional)
  is_public: true

Response 201:
{
  "data": {
    "book": {
      "id": 456,
      "title": "Godan",
      "processing_status": "processing",
      "processing_progress": 0,
      ...
    }
  },
  "status": "PASS",
  "http_code": 201,
  "message": "Book uploaded successfully. Processing started in background."
}
```

#### 5. Get All Books
```http
GET /api/books/books/?language=hindi&sort_by=popular&page=1&page_size=20
Authorization: Bearer <access_token>

Response 200:
{
  "data": {
    "count": 150,
    "next": "https://.../api/books/books/?page=2",
    "previous": null,
    "results": [
      {
        "id": 456,
        "title": "Godan",
        "author": "Munshi Premchand",
        "language": "hindi",
        "cover_image": "https://...",
        "total_pages": 200,
        "processing_status": "completed",
        "favorite_count": 342,
        ...
      }
    ]
  },
  "status": "PASS",
  "http_code": 200
}
```

#### 6. Get My Books
```http
GET /api/books/my/?status=processing
Authorization: Bearer <access_token>

Response 200:
{
  "data": {
    "count": 5,
    "results": [...]
  },
  "status": "PASS",
  "http_code": 200
}
```

#### 7. Get Book Pages
```http
GET /api/books/456/pages/
Authorization: Bearer <access_token>

Response 200:
{
  "data": {
    "book": {
      "id": 456,
      "title": "Godan",
      "total_pages": 200
    },
    "pages": [
      {
        "page_number": 1,
        "text_content": "पहला अध्याय...",
        "audio_file": "https://cloudinary.com/.../page_001.mp3",
        "audio_duration": 290,
        "processing_status": "completed",
        "created_at": "2025-11-02T12:10:00Z"
      },
      ...
    ]
  },
  "status": "PASS",
  "http_code": 200
}
```

#### 8. Update Progress
```http
POST /api/books/456/progress/
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "current_page": 15,
  "current_position": 45
}

Response 200:
{
  "data": {
    "progress": {
      "book_id": 456,
      "current_page": 15,
      "total_pages": 200,
      "percentage": 7.5,
      "current_position": 45,
      "last_listened": "2025-11-02T14:30:00Z"
    }
  },
  "status": "PASS",
  "http_code": 200
}
```

### Library

#### 9. Add to Library
```http
POST /api/books/library/add/
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "book_id": 456
}

Response 201:
{
  "data": {
    "book_id": 456,
    "message": "Book added to library"
  },
  "status": "PASS",
  "http_code": 201
}
```

#### 10. Toggle Favorite
```http
POST /api/books/library/456/favorite/
Authorization: Bearer <access_token>

Response 200:
{
  "data": {
    "book_id": 456,
    "is_favorite": true,
    "message": "Added to favorites"
  },
  "status": "PASS",
  "http_code": 200
}
```

---

## Troubleshooting

### 1. Authentication Issues

**Problem:** "Token is invalid or expired"

**Solution:**
```bash
# Clear localStorage
localStorage.clear();

# Refresh page
window.location.reload();

# Login again
```

**Problem:** "User not verified"

**Solution:**
- Check that OTP verification was completed
- Resend OTP from login page
- Check backend logs for OTP code

### 2. Upload Issues

**Problem:** "Failed to upload book"

**Possible causes:**
1. File too large (max 50MB for PDF)
2. Invalid file type
3. Missing required fields (title, language, pdf_file)
4. Authentication token expired

**Solution:**
```javascript
// Check file size
if (pdfFile.size > 50 * 1024 * 1024) {
  alert('PDF too large! Max 50MB');
}

// Check file type
if (!pdfFile.name.endsWith('.pdf')) {
  alert('Please upload a PDF file');
}

// Check token
const token = localStorage.getItem('accessToken');
if (!token) {
  alert('Please login again');
}
```

### 3. CORS Issues

**Problem:** "CORS policy blocked"

**Solution:**
- Backend must allow `http://localhost:8080` in CORS settings
- Contact backend team to add origin

### 4. Network Errors

**Problem:** "Network Error" or timeout

**Possible causes:**
1. Backend server down
2. Slow internet connection
3. Request timeout (30s default)

**Solution:**
```javascript
// Check backend status
fetch('https://kiaatbse-backend.onrender.com/admin/')
  .then(r => console.log('Backend is up!'))
  .catch(e => console.log('Backend is down!'));

// Increase timeout
// In src/services/api.ts
const api = axios.create({
  timeout: 60000, // 60 seconds
});
```

### 5. Data Not Loading

**Problem:** Books not appearing in Library/FeaturedBooks

**Check:**
1. Open DevTools → Network tab
2. Look for API calls to `/api/books/...`
3. Check response status (should be 200)
4. Check response body for errors

**Debug:**
```javascript
// In component
useEffect(() => {
  fetchBooks().then(data => {
    console.log('Books loaded:', data);
  }).catch(error => {
    console.error('Failed to load books:', error.response?.data);
  });
}, []);
```

---

## Next Steps

### Immediate (Required)

1. ✅ **Complete BookPlayer migration**
   - Priority: High
   - Estimated time: 2-3 hours
   - Blocking: Users can't listen to books

2. **Test end-to-end flow**
   - Signup → Verify → Login → Upload → Browse → Listen
   - Fix any bugs discovered

3. **Add error boundaries**
   - Catch runtime errors
   - Show user-friendly error messages

### Short-term (Recommended)

1. **Add polling for processing status**
   - Refresh book status every 10-30 seconds in Library
   - Show real-time progress updates

2. **Implement token refresh**
   - Auto-refresh access token when it expires
   - Use refresh token to get new access token

3. **Add loading states**
   - Skeleton loaders for book cards
   - Better UX during API calls

4. **Error handling improvements**
   - Retry failed requests
   - Better error messages
   - Offline detection

### Long-term (Optional)

1. **WebSocket integration**
   - Real-time updates for processing status
   - Live like counts
   - Cross-device progress sync

2. **Caching layer**
   - Cache book data in localStorage
   - Reduce API calls
   - Faster page loads

3. **Progressive Web App (PWA)**
   - Offline support
   - Install as mobile app
   - Background sync

4. **Analytics**
   - Track user behavior
   - Monitor API performance
   - Error logging

---

## Contact & Support

### Backend API
- **URL:** https://kiaatbse-backend.onrender.com
- **Admin Panel:** https://kiaatbse-backend.onrender.com/admin/
- **Documentation:** See `FRONTEND_API_DOCUMENTATION.md`

### Frontend Dev Server
- **Local:** http://localhost:8080
- **Network:** Check terminal for network URL

### Development Team
- Contact backend team for API issues
- Check GitHub issues for known problems
- Create new issue for bugs

---

## Appendix

### A. Token Expiry Times

| Token | Expiry | Stored In |
|-------|--------|-----------|
| Access Token | 60 minutes | localStorage |
| Refresh Token | 7 days | localStorage |

### B. Supported Languages

- Hindi (hindi)
- English (english)
- Urdu (urdu)
- Bengali (bengali)
- Tamil (tamil)
- Telugu (telugu)
- Marathi (marathi)
- Gujarati (gujarati)
- Sanskrit (sanskrit)
- Other (other)

### C. Supported Genres

- Literature (literature)
- Fiction (fiction)
- Non-fiction (non_fiction)
- Poetry (poetry)
- Drama (drama)
- Biography (biography)
- History (history)
- Science (science)
- Philosophy (philosophy)
- Religion (religion)
- Other (other)

### D. Processing Statuses

| Status | Meaning | User Action |
|--------|---------|-------------|
| uploaded | File received, queued | Wait |
| processing | OCR + TTS in progress | Wait |
| completed | Ready to listen | Can play |
| failed | Error occurred | Contact support |

---

**End of Documentation**

*Last updated: November 2, 2025*
