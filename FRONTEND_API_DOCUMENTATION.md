# KitaabSe API Documentation for Frontend

**Base URL:** `https://kiaatbse-backend.onrender.com`

**Last Updated:** November 2, 2025

---

## Table of Contents

1. [Authentication Flow](#authentication-flow)
2. [User APIs](#user-apis)
3. [Audiobook APIs](#audiobook-apis)
4. [Error Handling](#error-handling)
5. [Complete User Journey Examples](#complete-user-journey-examples)

---

## Authentication Flow

KitaabSe uses JWT (JSON Web Token) authentication with OTP verification.

### Flow Diagram:
```
1. User Signup → Receive OTP via email
2. Verify OTP → Get verification confirmation
3. Login → Receive JWT tokens (access + refresh)
4. Use Access Token in all authenticated requests
5. Refresh token when access token expires
```

### Authentication Header Format:
```
Authorization: Bearer <access_token>
```

---

## User APIs

### 1. User Signup

**Endpoint:** `POST /api/users/signup/`

**Description:** Register a new user account. An OTP will be sent to the provided email address for verification.

**Authentication:** Not required

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "user@example.com"
}
```

**Request Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | User's full name (2-100 characters) |
| email | string | Yes | Valid email address |

**Success Response (201 Created):**
```json
{
  "data": {
    "email": "user@example.com",
    "message": "OTP sent successfully"
  },
  "status": "PASS",
  "http_code": 201,
  "message": "User registered successfully. Please verify OTP sent to your email."
}
```

**Error Response (400 Bad Request):**
```json
{
  "data": null,
  "status": "FAIL",
  "http_code": 400,
  "message": "User already exists. Please login.",
  "errors": {}
}
```

**Next Step:** Call `/api/users/verify/` with the OTP received via email

---

### 2. Verify OTP

**Endpoint:** `POST /api/users/verify/`

**Description:** Verify the OTP sent to user's email during signup. Upon successful verification, the user account is activated.

**Authentication:** Not required

**Request Body:**
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Request Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | User's email address |
| otp | string | Yes | 6-digit OTP received via email |

**Success Response (200 OK):**
```json
{
  "data": {
    "email": "user@example.com",
    "message": "Account verified successfully"
  },
  "status": "PASS",
  "http_code": 200,
  "message": "OTP verified successfully. You can now login."
}
```

**Error Responses:**

*Invalid OTP (400 Bad Request):*
```json
{
  "data": null,
  "status": "FAIL",
  "http_code": 400,
  "message": "Invalid OTP. Please try again.",
  "errors": {}
}
```

*Expired OTP (400 Bad Request):*
```json
{
  "data": null,
  "status": "FAIL",
  "http_code": 400,
  "message": "OTP has expired. Please request a new one.",
  "errors": {}
}
```

**Next Step:** Call `/api/users/login/` with email and password

---

### 3. User Login

**Endpoint:** `POST /api/users/login/`

**Description:** Authenticate user and receive JWT access and refresh tokens. These tokens are required for all authenticated endpoints.

**Authentication:** Not required

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "userpassword123"
}
```

**Request Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | User's email address |
| password | string | Yes | User's password |

**Success Response (200 OK):**
```json
{
  "data": {
    "user": {
      "id": 123,
      "name": "John Doe",
      "email": "user@example.com",
      "is_verified": true,
      "joined_at": "2025-11-02T10:30:00Z"
    },
    "tokens": {
      "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  },
  "status": "PASS",
  "http_code": 200,
  "message": "Login successful"
}
```

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| user.id | integer | User's unique ID |
| user.name | string | User's full name |
| user.email | string | User's email address |
| user.is_verified | boolean | Email verification status |
| user.joined_at | datetime | Account creation timestamp |
| tokens.access | string | JWT access token (valid for 60 minutes) |
| tokens.refresh | string | JWT refresh token (valid for 7 days) |

**Error Responses:**

*Invalid Credentials (401 Unauthorized):*
```json
{
  "data": null,
  "status": "FAIL",
  "http_code": 401,
  "message": "Invalid email or password",
  "errors": {}
}
```

*Unverified Account (403 Forbidden):*
```json
{
  "data": null,
  "status": "FAIL",
  "http_code": 403,
  "message": "Please verify your email before logging in",
  "errors": {}
}
```

**Next Step:** Store the access token and use it in the Authorization header for all authenticated requests

---

## Audiobook APIs

### 4. Upload Book

**Endpoint:** `POST /api/books/upload/`

**Description:** Upload a PDF book for audio conversion. The PDF will be processed using OCR to extract Hindi text, then converted to audio using edge-tts. This is an asynchronous process - the API returns immediately and processing happens in the background.

**Authentication:** Required (JWT token)

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Request Body (multipart/form-data):**
```
title: "Premchand Ki Kahaniya"
author: "Munshi Premchand"
description: "Collection of famous Hindi stories"
language: "hindi"
genre: "literature"
pdf_file: <file upload>
cover_image: <file upload> (optional)
is_public: true
```

**Request Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| title | string | Yes | Book title (max 300 chars) |
| author | string | No | Author name (max 200 chars) |
| description | text | No | Book description |
| language | string | Yes | Book language: `hindi`, `english`, `urdu`, `bengali`, `tamil`, `telugu`, `marathi`, `gujarati`, `other` |
| genre | string | No | Book genre: `literature`, `fiction`, `non_fiction`, `poetry`, `drama`, `biography`, `history`, `science`, `philosophy`, `religion`, `other` |
| pdf_file | file | Yes | PDF file (max 50MB) |
| cover_image | file | No | Book cover image (JPG/PNG) |
| is_public | boolean | No | Make book public (default: true) |

**Success Response (201 Created):**
```json
{
  "data": {
    "book": {
      "id": 456,
      "title": "Premchand Ki Kahaniya",
      "author": "Munshi Premchand",
      "description": "Collection of famous Hindi stories",
      "language": "hindi",
      "genre": "literature",
      "pdf_file": "https://res.cloudinary.com/.../kitaabse/pdfs/book_456.pdf",
      "cover_image": "https://res.cloudinary.com/.../kitaabse/covers/book_456.jpg",
      "total_pages": 120,
      "processing_status": "processing",
      "processing_progress": 0,
      "is_public": true,
      "uploader": {
        "id": 123,
        "name": "John Doe"
      },
      "uploaded_at": "2025-11-02T12:00:00Z"
    }
  },
  "status": "PASS",
  "http_code": 201,
  "message": "Book uploaded successfully. Processing started in background."
}
```

**Processing Status Values:**
- `uploaded` - Book uploaded, not yet started processing
- `processing` - Currently extracting text and generating audio
- `completed` - All pages processed successfully
- `failed` - Processing failed (check `processing_error` field)

**Error Response (400 Bad Request):**
```json
{
  "data": null,
  "status": "FAIL",
  "http_code": 400,
  "message": "Invalid input data",
  "errors": {
    "pdf_file": ["This field is required"],
    "language": ["This field is required"]
  }
}
```

**Next Steps:**
1. Poll `/api/books/<book_id>/` to check processing progress
2. When `processing_status` is `completed`, call `/api/books/<book_id>/pages/` to get audio files

---

### 5. Get All Books (Public Library)

**Endpoint:** `GET /api/books/books/`

**Description:** Get a list of all public books with pagination, filtering, and search capabilities.

**Authentication:** Required (JWT token)

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | integer | No | Page number (default: 1) |
| page_size | integer | No | Items per page (default: 20, max: 100) |
| search | string | No | Search in title, author, description |
| language | string | No | Filter by language |
| genre | string | No | Filter by genre |
| sort_by | string | No | Sort by: `recent`, `popular`, `title`, `author` |

**Example Request:**
```
GET /api/books/books/?page=1&page_size=20&language=hindi&sort_by=popular
```

**Success Response (200 OK):**
```json
{
  "data": {
    "count": 150,
    "next": "https://kiaatbse-backend.onrender.com/api/books/books/?page=2",
    "previous": null,
    "results": [
      {
        "id": 456,
        "title": "Premchand Ki Kahaniya",
        "author": "Munshi Premchand",
        "description": "Collection of famous Hindi stories",
        "language": "hindi",
        "genre": "literature",
        "cover_image": "https://res.cloudinary.com/.../covers/book_456.jpg",
        "total_pages": 120,
        "total_duration": 7200,
        "processing_status": "completed",
        "processing_progress": 100,
        "is_public": true,
        "listen_count": 1523,
        "favorite_count": 342,
        "uploader": {
          "id": 123,
          "name": "John Doe"
        },
        "uploaded_at": "2025-11-02T12:00:00Z",
        "is_in_library": false,
        "is_favorite": false
      }
    ]
  },
  "status": "PASS",
  "http_code": 200,
  "message": "Books retrieved successfully"
}
```

---

### 6. Get My Uploaded Books

**Endpoint:** `GET /api/books/my/`

**Description:** Get all books uploaded by the authenticated user, including private books.

**Authentication:** Required (JWT token)

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | integer | No | Page number (default: 1) |
| status | string | No | Filter by processing status |

**Success Response (200 OK):**
```json
{
  "data": {
    "count": 5,
    "results": [
      {
        "id": 456,
        "title": "Premchand Ki Kahaniya",
        "author": "Munshi Premchand",
        "language": "hindi",
        "genre": "literature",
        "cover_image": "https://res.cloudinary.com/.../covers/book_456.jpg",
        "total_pages": 120,
        "processing_status": "completed",
        "processing_progress": 100,
        "is_public": true,
        "listen_count": 1523,
        "uploaded_at": "2025-11-02T12:00:00Z"
      }
    ]
  },
  "status": "PASS",
  "http_code": 200,
  "message": "Your books retrieved successfully"
}
```

---

### 7. Get Book Details

**Endpoint:** `GET /api/books/<book_id>/`

**Description:** Get detailed information about a specific book, including processing status and progress.

**Authentication:** Required (JWT token)

**Headers:**
```
Authorization: Bearer <access_token>
```

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| book_id | integer | Yes | Book ID |

**Example Request:**
```
GET /api/books/456/
```

**Success Response (200 OK):**
```json
{
  "data": {
    "book": {
      "id": 456,
      "title": "Premchand Ki Kahaniya",
      "author": "Munshi Premchand",
      "description": "Collection of famous Hindi stories",
      "language": "hindi",
      "genre": "literature",
      "pdf_file": "https://res.cloudinary.com/.../pdfs/book_456.pdf",
      "cover_image": "https://res.cloudinary.com/.../covers/book_456.jpg",
      "total_pages": 120,
      "total_duration": 7200,
      "processing_status": "completed",
      "processing_progress": 100,
      "processing_error": null,
      "is_public": true,
      "listen_count": 1523,
      "favorite_count": 342,
      "uploader": {
        "id": 123,
        "name": "John Doe",
        "email": "john@example.com"
      },
      "uploaded_at": "2025-11-02T12:00:00Z",
      "processed_at": "2025-11-02T12:45:00Z",
      "user_progress": {
        "current_page": 5,
        "total_pages": 120,
        "percentage": 4.17,
        "last_listened": "2025-11-02T14:30:00Z"
      },
      "is_in_library": true,
      "is_favorite": false
    }
  },
  "status": "PASS",
  "http_code": 200,
  "message": "Book details retrieved successfully"
}
```

**Error Response (404 Not Found):**
```json
{
  "data": null,
  "status": "FAIL",
  "http_code": 404,
  "message": "Book not found",
  "errors": {}
}
```

---

### 8. Get Book Pages with Audio

**Endpoint:** `GET /api/books/<book_id>/pages/`

**Description:** Get all pages of a book with their audio files, text content, and metadata. Use this to get audio URLs for playback.

**Authentication:** Required (JWT token)

**Headers:**
```
Authorization: Bearer <access_token>
```

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| book_id | integer | Yes | Book ID |

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | integer | No | Specific page number to retrieve |

**Example Request:**
```
GET /api/books/456/pages/
```

**Success Response (200 OK):**
```json
{
  "data": {
    "book": {
      "id": 456,
      "title": "Premchand Ki Kahaniya",
      "total_pages": 120
    },
    "pages": [
      {
        "page_number": 1,
        "text_content": "पहला अध्याय\n\nयह कहानी एक छोटे से गाँव की है...",
        "audio_file": "https://res.cloudinary.com/.../audio/book_456/page_0001.mp3",
        "audio_duration": 290,
        "processing_status": "completed",
        "created_at": "2025-11-02T12:10:00Z"
      },
      {
        "page_number": 2,
        "text_content": "दूसरा अध्याय\n\nगाँव में एक बूढ़ा...",
        "audio_file": "https://res.cloudinary.com/.../audio/book_456/page_0002.mp3",
        "audio_duration": 315,
        "processing_status": "completed",
        "created_at": "2025-11-02T12:11:00Z"
      }
    ]
  },
  "status": "PASS",
  "http_code": 200,
  "message": "Book pages retrieved successfully"
}
```

**Get Single Page:**
```
GET /api/books/456/pages/?page=5
```

Response will contain only page 5 data.

---

### 9. Update Listening Progress

**Endpoint:** `POST /api/books/<book_id>/progress/`

**Description:** Update user's listening progress for a book. Call this API when user finishes listening to a page or changes the current page.

**Authentication:** Required (JWT token)

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| book_id | integer | Yes | Book ID |

**Request Body:**
```json
{
  "current_page": 15,
  "current_position": 45
}
```

**Request Fields:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| current_page | integer | Yes | Page number user is currently on (1-indexed) |
| current_position | integer | No | Position in seconds within the audio file |

**Success Response (200 OK):**
```json
{
  "data": {
    "progress": {
      "book_id": 456,
      "current_page": 15,
      "total_pages": 120,
      "percentage": 12.5,
      "current_position": 45,
      "last_listened": "2025-11-02T14:30:00Z"
    }
  },
  "status": "PASS",
  "http_code": 200,
  "message": "Progress updated successfully"
}
```

---

### 10. Get My Progress (All Books)

**Endpoint:** `GET /api/books/progress/`

**Description:** Get listening progress for all books the user has started listening to.

**Authentication:** Required (JWT token)

**Headers:**
```
Authorization: Bearer <access_token>
```

**Success Response (200 OK):**
```json
{
  "data": {
    "progress": [
      {
        "book": {
          "id": 456,
          "title": "Premchand Ki Kahaniya",
          "author": "Munshi Premchand",
          "cover_image": "https://res.cloudinary.com/.../covers/book_456.jpg"
        },
        "current_page": 15,
        "total_pages": 120,
        "percentage": 12.5,
        "last_listened": "2025-11-02T14:30:00Z"
      },
      {
        "book": {
          "id": 789,
          "title": "Godan",
          "author": "Munshi Premchand",
          "cover_image": "https://res.cloudinary.com/.../covers/book_789.jpg"
        },
        "current_page": 45,
        "total_pages": 200,
        "percentage": 22.5,
        "last_listened": "2025-11-01T10:15:00Z"
      }
    ]
  },
  "status": "PASS",
  "http_code": 200,
  "message": "Progress retrieved successfully"
}
```

---

### 11. Get My Library

**Endpoint:** `GET /api/books/library/`

**Description:** Get all books in user's personal library (bookshelf). These are books the user has added for easy access.

**Authentication:** Required (JWT token)

**Headers:**
```
Authorization: Bearer <access_token>
```

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| page | integer | No | Page number (default: 1) |
| favorites_only | boolean | No | Show only favorite books |

**Success Response (200 OK):**
```json
{
  "data": {
    "count": 12,
    "results": [
      {
        "book": {
          "id": 456,
          "title": "Premchand Ki Kahaniya",
          "author": "Munshi Premchand",
          "language": "hindi",
          "genre": "literature",
          "cover_image": "https://res.cloudinary.com/.../covers/book_456.jpg",
          "total_pages": 120,
          "total_duration": 7200
        },
        "is_favorite": true,
        "added_at": "2025-11-01T08:00:00Z",
        "progress": {
          "current_page": 15,
          "percentage": 12.5
        }
      }
    ]
  },
  "status": "PASS",
  "http_code": 200,
  "message": "Library retrieved successfully"
}
```

---

### 12. Add Book to Library

**Endpoint:** `POST /api/books/library/add/`

**Description:** Add a book to user's personal library for easy access.

**Authentication:** Required (JWT token)

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "book_id": 456
}
```

**Success Response (201 Created):**
```json
{
  "data": {
    "book_id": 456,
    "message": "Book added to library"
  },
  "status": "PASS",
  "http_code": 201,
  "message": "Book added to your library successfully"
}
```

**Error Response (400 Bad Request - Already in library):**
```json
{
  "data": null,
  "status": "FAIL",
  "http_code": 400,
  "message": "Book already in your library",
  "errors": {}
}
```

---

### 13. Remove Book from Library

**Endpoint:** `DELETE /api/books/library/<book_id>/`

**Description:** Remove a book from user's personal library.

**Authentication:** Required (JWT token)

**Headers:**
```
Authorization: Bearer <access_token>
```

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| book_id | integer | Yes | Book ID to remove |

**Success Response (200 OK):**
```json
{
  "data": {
    "book_id": 456,
    "message": "Book removed from library"
  },
  "status": "PASS",
  "http_code": 200,
  "message": "Book removed from your library successfully"
}
```

---

### 14. Toggle Favorite

**Endpoint:** `POST /api/books/library/<book_id>/favorite/`

**Description:** Toggle favorite status for a book in user's library. Book must be in library first.

**Authentication:** Required (JWT token)

**Headers:**
```
Authorization: Bearer <access_token>
```

**Path Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| book_id | integer | Yes | Book ID |

**Success Response (200 OK):**
```json
{
  "data": {
    "book_id": 456,
    "is_favorite": true,
    "message": "Added to favorites"
  },
  "status": "PASS",
  "http_code": 200,
  "message": "Favorite status updated"
}
```

---

## Error Handling

All API responses follow a consistent format:

### Standard Response Format:
```json
{
  "data": {},
  "status": "PASS" | "FAIL",
  "http_code": 200,
  "message": "Human readable message",
  "errors": {}
}
```

### Common HTTP Status Codes:

| Code | Meaning | When It Occurs |
|------|---------|----------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid input data or validation error |
| 401 | Unauthorized | Missing or invalid authentication token |
| 403 | Forbidden | User doesn't have permission |
| 404 | Not Found | Resource doesn't exist |
| 500 | Internal Server Error | Server-side error |

### Authentication Errors:

**Missing Token (401):**
```json
{
  "data": null,
  "status": "FAIL",
  "http_code": 401,
  "message": "Authentication credentials were not provided",
  "errors": {}
}
```

**Invalid Token (401):**
```json
{
  "data": null,
  "status": "FAIL",
  "http_code": 401,
  "message": "Token is invalid or expired",
  "errors": {}
}
```

**Token Expired (401):**
```json
{
  "data": null,
  "status": "FAIL",
  "http_code": 401,
  "message": "Token has expired",
  "errors": {}
}
```

**Validation Errors (400):**
```json
{
  "data": null,
  "status": "FAIL",
  "http_code": 400,
  "message": "Invalid input data",
  "errors": {
    "email": ["This field is required"],
    "name": ["Ensure this field has at least 2 characters"]
  }
}
```

---

## Complete User Journey Examples

### Example 1: New User Registration and First Book Listen

```javascript
// Step 1: User Signup
POST https://kiaatbse-backend.onrender.com/api/users/signup/
Body: {
  "name": "Rahul Kumar",
  "email": "rahul@example.com"
}
// Response: { status: "PASS", message: "OTP sent to email" }

// Step 2: User checks email and enters OTP
POST https://kiaatbse-backend.onrender.com/api/users/verify/
Body: {
  "email": "rahul@example.com",
  "otp": "123456"
}
// Response: { status: "PASS", message: "Account verified" }

// Step 3: User logs in
POST https://kiaatbse-backend.onrender.com/api/users/login/
Body: {
  "email": "rahul@example.com",
  "password": "rahul123"
}
// Response: {
//   data: {
//     tokens: {
//       access: "eyJhbGc...",
//       refresh: "eyJhbGc..."
//     }
//   }
// }
// Store access token: localStorage.setItem('accessToken', response.data.tokens.access)

// Step 4: Browse books
GET https://kiaatbse-backend.onrender.com/api/books/books/?language=hindi
Headers: {
  Authorization: "Bearer eyJhbGc..."
}
// Response: List of Hindi books

// Step 5: User clicks on a book to see details
GET https://kiaatbse-backend.onrender.com/api/books/456/
Headers: {
  Authorization: "Bearer eyJhbGc..."
}
// Response: Full book details including processing status

// Step 6: Add book to library
POST https://kiaatbse-backend.onrender.com/api/books/library/add/
Headers: {
  Authorization: "Bearer eyJhbGc..."
}
Body: {
  "book_id": 456
}
// Response: { status: "PASS", message: "Added to library" }

// Step 7: Get book pages to start listening
GET https://kiaatbse-backend.onrender.com/api/books/456/pages/
Headers: {
  Authorization: "Bearer eyJhbGc..."
}
// Response: Array of pages with audio URLs

// Step 8: User starts listening to page 1
// Play audio from: response.data.pages[0].audio_file

// Step 9: User finishes page 1, update progress
POST https://kiaatbse-backend.onrender.com/api/books/456/progress/
Headers: {
  Authorization: "Bearer eyJhbGc..."
}
Body: {
  "current_page": 1,
  "current_position": 290
}
// Response: { status: "PASS", message: "Progress updated" }

// Step 10: User marks book as favorite
POST https://kiaatbse-backend.onrender.com/api/books/library/456/favorite/
Headers: {
  Authorization: "Bearer eyJhbGc..."
}
// Response: { data: { is_favorite: true } }
```

---

### Example 2: User Uploads a New Book

```javascript
// Step 1: User is already logged in (has access token)

// Step 2: User selects PDF and cover image files
const formData = new FormData();
formData.append('title', 'Godan');
formData.append('author', 'Munshi Premchand');
formData.append('description', 'A classic Hindi novel');
formData.append('language', 'hindi');
formData.append('genre', 'literature');
formData.append('pdf_file', pdfFile); // File object from input
formData.append('cover_image', coverImage); // File object from input
formData.append('is_public', 'true');

// Step 3: Upload book
POST https://kiaatbse-backend.onrender.com/api/books/upload/
Headers: {
  Authorization: "Bearer eyJhbGc...",
  Content-Type: "multipart/form-data"
}
Body: formData
// Response: {
//   data: {
//     book: {
//       id: 789,
//       processing_status: "processing",
//       processing_progress: 0
//     }
//   }
// }

// Step 4: Poll for processing status (every 10 seconds)
setInterval(async () => {
  const response = await fetch(
    'https://kiaatbse-backend.onrender.com/api/books/789/',
    {
      headers: { Authorization: "Bearer eyJhbGc..." }
    }
  );
  const data = await response.json();

  console.log('Progress:', data.data.book.processing_progress + '%');

  if (data.data.book.processing_status === 'completed') {
    console.log('Book processing completed!');
    clearInterval(intervalId);

    // Step 5: Get pages with audio
    fetchBookPages(789);
  }
}, 10000);

// Step 6: View my uploaded books
GET https://kiaatbse-backend.onrender.com/api/books/my/
Headers: {
  Authorization: "Bearer eyJhbGc..."
}
// Response: List of books uploaded by user
```

---

### Example 3: Resuming Listening from Last Position

```javascript
// Step 1: User opens app, get their library
GET https://kiaatbse-backend.onrender.com/api/books/library/
Headers: {
  Authorization: "Bearer eyJhbGc..."
}
// Response: List of books in library with progress

// Step 2: User selects a book they were listening to
// From response, we see user was on page 15

// Step 3: Get book details
GET https://kiaatbse-backend.onrender.com/api/books/456/
Headers: {
  Authorization: "Bearer eyJhbGc..."
}
// Response includes: user_progress: { current_page: 15, percentage: 12.5 }

// Step 4: Get specific page to resume
GET https://kiaatbse-backend.onrender.com/api/books/456/pages/?page=15
Headers: {
  Authorization: "Bearer eyJhbGc..."
}
// Response: Page 15 data with audio URL

// Step 5: Resume playback from current_position
// audioPlayer.src = response.data.pages[0].audio_file
// audioPlayer.currentTime = userProgress.current_position || 0
// audioPlayer.play()

// Step 6: Update progress as user listens
// Every 30 seconds or when user changes page:
POST https://kiaatbse-backend.onrender.com/api/books/456/progress/
Headers: {
  Authorization: "Bearer eyJhbGc..."
}
Body: {
  "current_page": 16,
  "current_position": 45
}
```

---

## Important Notes for Frontend

### 1. Token Management:
- **Access token expires after 60 minutes** - Store it in localStorage or sessionStorage
- **Refresh token expires after 7 days** - Use it to get new access tokens
- Implement automatic token refresh when you receive 401 errors

### 2. File Upload:
- Maximum PDF size: **50MB**
- Supported image formats: **JPG, PNG**
- Use `multipart/form-data` content type for file uploads

### 3. Polling for Processing Status:
- After uploading a book, poll `/api/books/<book_id>/` every **10-15 seconds**
- Check `processing_progress` (0-100%) to show progress bar
- Stop polling when `processing_status` is `completed` or `failed`

### 4. Audio Playback:
- Audio files are hosted on Cloudinary CDN (fast, reliable)
- Audio format: **MP3**
- Use HTML5 `<audio>` element or any audio library
- Update progress every **30 seconds** or when user navigates to next page

### 5. Error Handling:
- Always check `response.data.status` field (`PASS` or `FAIL`)
- Display `response.data.message` to user for feedback
- Handle `401` errors by prompting user to login again
- Handle `404` errors by showing "Not Found" message

### 6. Search and Filters:
- Use query parameters for filtering books
- Implement debouncing for search input (wait 500ms after user stops typing)
- Store filter preferences in localStorage for better UX

### 7. Pagination:
- Default page size is 20 items
- Use `next` and `previous` URLs from response for navigation
- Show page numbers based on `count` field

---

## Testing the APIs

You can test these APIs using:

1. **Postman** - Import the endpoints and test with your tokens
2. **cURL** - Command line testing
3. **Browser DevTools** - For debugging AJAX requests

### Example cURL Commands:

```bash
# Signup
curl -X POST https://kiaatbse-backend.onrender.com/api/users/signup/ \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com"}'

# Login
curl -X POST https://kiaatbse-backend.onrender.com/api/users/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'

# Get Books (with token)
curl -X GET https://kiaatbse-backend.onrender.com/api/books/books/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Support

For any API issues or questions, contact the backend team or check the server logs.

**Backend Server:** https://kiaatbse-backend.onrender.com

**Health Check:** https://kiaatbse-backend.onrender.com/admin/ (Django admin panel)

---

**End of Documentation**
