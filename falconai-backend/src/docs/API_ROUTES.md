# FalconAI Backend - API Routes Documentation

This document provides a comprehensive list of all available API routes in the falconai backend. This is intended for frontend developers and coding agents to understand the API structure and usage.

## Base URL

All routes are prefixed with `/v1`

**Example:** `http://localhost:3000/v1/auth/signin`

---

## Table of Contents

1. [Authentication](#authentication)
2. [Users](#users)
3. [Roles](#roles)
4. [Features](#features)
5. [Sessions](#sessions)
6. [Platform Settings](#platform-settings)
7. [Notifications](#notifications)
8. [Knowledge Base](#knowledge-base)
9. [Chat](#chat)

---

## Authentication

**Base Path:** `/v1/auth`

### POST /signin

**Description:** Sign in with email and password
**Authentication:** Not required
**Request Body:**

```json
{
  "email": "string (email, required)",
  "password": "string (required)"
}
```

**Response (200 — email verified):**

```json
{
  "code": 200,
  "message": "User signed in successfully",
  "tokens": {
    "access_token": "string",
    "refresh_token": "string"
  },
  "user": { "...user object with role..." }
}
```

**Response (201 — email not verified, OTP sent):**

```json
{
  "code": 201,
  "message": "Email not verified, OTP sent",
  "userId": "uuid"
}
```

---

### POST /google-auth

**Description:** Authenticate or sign in with a Google OAuth access token
**Authentication:** Not required
**Request Body:**

```json
{
  "token": "string (Google OAuth access token, required)"
}
```

**Response:**

```json
{
  "code": 200,
  "message": "User authenticated with google successfully"
}
```

---

### POST /verify-user

**Description:** Verify email OTP to complete sign-in. Returns tokens on success.
**Authentication:** Not required
**Request Body:**

```json
{
  "userId": "string (required)",
  "otp": "number (6-digit, required)"
}
```

**Response:**

```json
{
  "code": 200,
  "message": "User verified successfully",
  "user": { "...user object with role..." },
  "tokens": {
    "access_token": "string",
    "refresh_token": "string"
  }
}
```

---

### POST /signout

**Description:** Sign out and invalidate the current session
**Authentication:** Required (Bearer Token)
**Request Body:** None

**Response:**

```json
{
  "code": 200,
  "message": "User signed out successfully"
}
```

---

### POST /resend-otp

**Description:** Resend OTP to user's email
**Authentication:** Not required
**Request Body:**

```json
{
  "userId": "string (required)"
}
```

**Response:**

```json
{
  "code": 200,
  "message": "OTP sent successfully"
}
```

---

### POST /refresh-token

**Description:** Refresh access and refresh tokens. Send the **refresh token** in the Authorization header.
**Authentication:** Required (Bearer Refresh Token in Authorization header)
**Request Body:** None

**Response:**

```json
{
  "code": 200,
  "message": "Token refreshed successfully",
  "tokens": {
    "access_token": "string",
    "refresh_token": "string"
  },
  "user": { "...user object with role..." }
}
```

---

### POST /forget-password/send

**Description:** Send a forgot-password OTP to the user's email
**Authentication:** Not required
**Request Body:**

```json
{
  "email": "string (email, required)"
}
```

**Response:**

```json
{
  "code": 200,
  "message": "Password reset OTP has been sent to your email"
}
```

---

### POST /forget-password/verify

**Description:** Verify forgot-password OTP. Returns a short-lived reset token (15 min expiry).
**Authentication:** Not required
**Request Body:**

```json
{
  "email": "string (email, required)",
  "otp": "number (required)"
}
```

**Response:**

```json
{
  "code": 200,
  "message": "OTP verified successfully",
  "resetToken": "string (JWT, valid for 15 minutes)"
}
```

---

### POST /forget-password/change

**Description:** Set a new password using the reset token from forget-password/verify
**Authentication:** Not required
**Request Body:**

```json
{
  "resetToken": "string (required)",
  "password": "string (min: 6 characters, required)"
}
```

**Response:**

```json
{
  "code": 200,
  "message": "Password changed successfully"
}
```

---

## Users

**Base Path:** `/v1/users`

### GET /read/get-all

**Description:** Get all users with pagination, filters, and sorting
**Authentication:** Required (Bearer Token + Permissions)
**Query Parameters:**

```
page: number (optional, default: 1)
limit: number (optional, default: 10)
search: string (optional - searches in fullName and email)
roleId: string (uuid, optional)
startDate: string (date, optional - filter users created on or after this date)
endDate: string (date, optional - filter users created on or before this date)
sortBy: "name" | "createdAt" (optional, default: "createdAt")
sortOrder: "asc" | "desc" (optional, default: "desc")
```

**Response:**

```json
{
  "code": 200,
  "message": "Users retrieved successfully",
  "users": [
    {
      "id": "uuid",
      "email": "string",
      "fullName": "string",
      "location": "string | null",
      "avatarUrl": "string | null",
      "emailVerified": "boolean",
      "phoneVerified": "boolean",
      "phone": "string | null",
      "dateOfBirth": "string | null",
      "gender": "string | null",
      "country": "string | null",
      "timeZone": "string | null",
      "status": "string | null",
      "profileComplete": "boolean",
      "createdAt": "timestamp",
      "updatedAt": "timestamp",
      "role": {
        "id": "uuid",
        "name": "string",
        "description": "string"
      }
    }
  ],
  "pagination": {
    "total": 100,
    "count": 10,
    "page": 1,
    "limit": 10
  }
}
```

### GET /read/get-one

**Description:** Get comprehensive user data with all related information
**Authentication:** Required (Bearer Token + Permissions)

**Important Notes:**

- Returns **all user fields except password**
- Includes all related data: role and notifications
- Notifications: Latest 5 notifications

**Query Parameters:**

```
userId: string (uuid, required)
```

**Response:**

```json
{
  "code": 200,
  "message": "User retrieved successfully",
  "user": {
    "id": "uuid",
    "email": "string",
    "fullName": "string",
    "location": "string | null",
    "avatarUrl": "string | null",
    "emailVerified": "boolean",
    "phoneVerified": "boolean",
    "phone": "string | null",
    "dateOfBirth": "string | null",
    "gender": "string | null",
    "country": "string | null",
    "timeZone": "string | null",
    "status": "string | null",
    "profileComplete": "boolean",
    "createdAt": "timestamp",
    "updatedAt": "timestamp",
    "role": {
      "id": "uuid",
      "name": "string",
      "description": "string"
    },
    "notifications": ["array of notification objects (latest 5)"]
  }
}
```

### GET /read/get-counts

**Description:** Get user counts analytics with two groups - total (all users) and params-based (filtered by query parameters)
**Authentication:** Required (Bearer Token + Permissions)

**Important Notes:**

- Returns counts in two groups:
  - `totalCount`: All users regardless of filters (excluding super-admin)
  - `paramsCount`: Users matching the provided filters
- Each group includes:
  - Total count
  - Verified email count
  - Unverified email count

**Query Parameters:**

```
search: string (optional - searches in fullName and email)
roleId: string (uuid, optional)
startDate: string (date, optional - filter users created on or after this date)
endDate: string (date, optional - filter users created on or before this date)
```

**Response:**

```json
{
  "code": 200,
  "message": "User counts retrieved successfully",
  "totalCount": {
    "total": 1500,
    "verified": 1200,
    "unverified": 300
  },
  "paramsCount": {
    "total": 450,
    "verified": 400,
    "unverified": 50
  }
}
```

### POST /update

**Description:** Update a user's information
**Authentication:** Required (Bearer Token + Permissions)
**Request Body:**

```json
{
  "userId": "string (uuid, required)",
  "fullName": "string (min: 1, max: 255, optional)",
  "location": "string (max: 255, optional)",
  "avatarUrl": "string (url, max: 500, optional)",
  "status": "string (max: 100, optional)",
  "dateOfBirth": "string (date format, optional)",
  "gender": "string (max: 50, optional)",
  "country": "string (max: 100, optional)",
  "phone": "string (max: 20, optional)",
  "timeZone": "string (max: 100, optional)"
}
```

**Response:**

```json
{
  "code": 200,
  "message": "User updated successfully",
  "user": { "...same user object as get-all..." }
}
```

### POST /delete

**Description:** Delete a user
**Authentication:** Required (Bearer Token + Permissions)
**Request Body:**

```json
{
  "userId": "string (uuid, required)"
}
```

**Response:**

```json
{
  "code": 200,
  "message": "User deleted successfully"
}
```

### POST /sudo/assign-role

**Description:** Assign a role to a user
**Authentication:** Required (Bearer Token + Permissions)
**Request Body:**

```json
{
  "userId": "string (uuid, required)",
  "roleId": "string (uuid, optional)",
  "roleName": "string (optional)"
}
```

**Note:** Either `roleId` or `roleName` must be provided.

**Response:**

```json
{
  "code": 200,
  "message": "Role assigned successfully",
  "user": { "...user object..." },
  "role": {
    "id": "uuid",
    "name": "string",
    "description": "string"
  }
}
```

---

## Roles

**Base Path:** `/v1/roles`

### GET /read/get-all

**Description:** Get all roles with pagination
**Authentication:** Required (Bearer Token + Permissions)
**Query Parameters:**

```
page: number (optional, default: 1)
limit: number (optional, default: 10)
```

### GET /read/get-one

**Description:** Get a single role by ID
**Authentication:** Required (Bearer Token + Permissions)
**Query Parameters:**

```
roleId: string (uuid, required)
```

### POST /create

**Description:** Create a new role
**Authentication:** Required (Bearer Token + Permissions)
**Request Body:**

```json
{
  "name": "string (min: 1, max: 255, required)",
  "description": "string (min: 1, max: 500, required)"
}
```

### POST /delete

**Description:** Delete a role
**Authentication:** Required (Bearer Token + Permissions)
**Request Body:**

```json
{
  "roleId": "string (uuid, required)"
}
```

### POST /update/add-features

**Description:** Add features to a role
**Authentication:** Required (Bearer Token + Permissions)
**Request Body:**

```json
{
  "roleId": "string (uuid, required)",
  "featureIds": "array of uuids (min: 1, required)"
}
```

### POST /update/remove-features

**Description:** Remove features from a role
**Authentication:** Required (Bearer Token + Permissions)
**Request Body:**

```json
{
  "roleId": "string (uuid, required)",
  "featureIds": "array of uuids (min: 1, required)"
}
```

### POST /update/add-permissions

**Description:** Add permissions to a feature-role combination
**Authentication:** Required (Bearer Token + Permissions)
**Request Body:**

```json
{
  "roleId": "string (uuid, required)",
  "featureId": "string (uuid, required)",
  "permissionIds": "array of uuids (min: 1, required)"
}
```

### POST /update/remove-permissions

**Description:** Remove permissions from a feature-role combination
**Authentication:** Required (Bearer Token + Permissions)
**Request Body:**

```json
{
  "roleId": "string (uuid, required)",
  "featureId": "string (uuid, required)",
  "permissionIds": "array of uuids (min: 1, required)"
}
```

### GET /read/permissions/get-all

**Description:** Get all permissions with pagination
**Authentication:** Required (Bearer Token + Permissions)
**Query Parameters:**

```
page: number (optional, default: 1)
limit: number (optional, default: 10)
```

---

## Features

**Base Path:** `/v1/features`

### GET /read/get-all

**Description:** Get all features with pagination
**Authentication:** Required (Bearer Token + Permissions)
**Query Parameters:**

```
page: number (optional, default: 1)
limit: number (optional, default: 10)
```

### GET /read/get-one

**Description:** Get a single feature by ID
**Authentication:** Required (Bearer Token + Permissions)
**Query Parameters:**

```
featureId: string (uuid, required)
```

### POST /create

**Description:** Create a new feature
**Authentication:** Required (Bearer Token + Permissions)
**Request Body:**

```json
{
  "name": "string (min: 1, max: 255, required)",
  "description": "string (min: 1, max: 500, required)",
  "isActive": "boolean (optional, default: true)"
}
```

### POST /update

**Description:** Update a feature
**Authentication:** Required (Bearer Token + Permissions)
**Request Body:**

```json
{
  "featureId": "string (uuid, required)",
  "name": "string (min: 1, max: 255, optional)",
  "description": "string (min: 1, max: 500, optional)",
  "isActive": "boolean (optional)"
}
```

### POST /delete

**Description:** Delete a feature
**Authentication:** Required (Bearer Token + Permissions)
**Request Body:**

```json
{
  "featureId": "string (uuid, required)"
}
```

---

## Sessions

**Base Path:** `/v1/sessions`

### GET /read/get-all

**Description:** Get all sessions with pagination and filters
**Authentication:** Required (Bearer Token + Permissions)
**Query Parameters:**

```
page: number (optional, default: 1)
limit: number (optional, default: 10)
startDate: string (optional)
endDate: string (optional)
isValid: boolean (optional)
search: string (optional - search by userId/sessionId/accessToken/refreshToken)
```

### GET /read/get-stats

**Description:** Get session statistics
**Authentication:** Required (Bearer Token + Permissions)
**Query Parameters:**

```
startDate: string (optional)
endDate: string (optional)
```

### POST /sudo/invalidate

**Description:** Invalidate specific sessions
**Authentication:** Required (Bearer Token + Permissions)
**Request Body:**

```json
{
  "sessionIds": "array of uuids (min: 1, required)"
}
```

### POST /sudo/invalidate-all

**Description:** Invalidate all sessions
**Authentication:** Required (Bearer Token + Permissions)
**Request Body:** None

---

## Platform Settings

**Base Path:** `/v1/platform-settings`

### GET /read/public

**Description:** Get all public (non-sensitive) platform settings. This endpoint is open and does not require authentication.
**Authentication:** Not required
**Query Parameters:** None

**Response:**

```json
{
  "code": 200,
  "message": "Public platform settings retrieved successfully",
  "settings": [
    {
      "id": "uuid",
      "settingKey": "string",
      "settingValue": "string",
      "settingType": "string | number | boolean"
    }
  ]
}
```

### GET /read/get-all

**Description:** Get all platform settings
**Authentication:** Required (Bearer Token + Permissions)
**Query Parameters:** None

**Response:**

```json
{
  "code": 200,
  "message": "Platform settings retrieved successfully",
  "settings": [
    {
      "id": "uuid",
      "settingKey": "string",
      "settingValue": "string",
      "settingType": "string | number | boolean",
      "description": "string | null",
      "updatedBy": "uuid | null",
      "updatedAt": "timestamp"
    }
  ]
}
```

### POST /update

**Description:** Update platform settings
**Authentication:** Required (Bearer Token + Permissions)
**Request Body:**

```json
{
  "settings": [
    {
      "key": "string (min: 1, required)",
      "value": "string (required)"
    }
  ]
}
```

**Note:** At least one setting object is required in the array.

**Available setting keys:**

| Key                                      | Description                                            |
| ---------------------------------------- | ------------------------------------------------------ |
| `app.site_name`                          | Platform display name                                  |
| `upload_config.upload_provider`          | File upload provider: `cloudinary` or `s3`             |
| `upload_config.cloudinary_cloud_name`    | Cloudinary cloud name                                  |
| `upload_config.cloudinary_api_key`       | Cloudinary API key                                     |
| `upload_config.cloudinary_api_secret`    | Cloudinary API secret                                  |
| `upload_config.s3_region`                | AWS S3 region                                          |
| `upload_config.s3_bucket_name`           | AWS S3 bucket name                                     |
| `upload_config.s3_access_key_id`         | AWS S3 access key ID                                   |
| `upload_config.s3_secret_access_key`     | AWS S3 secret access key                               |
| `upload_config.s3_url`                   | AWS S3 endpoint URL                                    |
| `video_config.video_provider`            | Video streaming provider: `cloudflare_stream` or `mux` |
| `video_config.cloudflare_account_id`     | Cloudflare account ID for Stream                       |
| `video_config.cloudflare_api_token`      | Cloudflare Stream API token                            |
| `video_config.cloudflare_webhook_secret` | Cloudflare Stream webhook signing secret               |
| `video_config.mux_token_id`              | Mux API token ID                                       |
| `video_config.mux_token_secret`          | Mux API token secret                                   |
| `video_config.mux_webhook_secret`        | Mux webhook signing secret                             |

---

## Notifications

**Base Path:** `/v1/notifications`

### GET /read/get-all

**Description:** Get all notifications for the authenticated user with pagination and filters
**Authentication:** Required (Bearer Token + Permissions)
**Query Parameters:**

```
page: number (optional, default: 1)
limit: number (optional, default: 10)
startDate: string (YYYY-MM-DD, optional - filter from this date)
endDate: string (YYYY-MM-DD, optional - filter until this date)
type: "info" | "warn" | "error" (optional)
status: "read" | "un-read" | "archived" (optional)
```

**Response:**

```json
{
  "code": 200,
  "message": "Notifications fetched successfully",
  "notifications": [
    {
      "id": "uuid",
      "userId": "uuid",
      "type": "info | warn | error",
      "title": "string",
      "message": "string",
      "data": {},
      "status": "read | un-read | archived",
      "readAt": "timestamp | null",
      "isDeleted": "boolean",
      "createdAt": "timestamp",
      "updatedAt": "timestamp"
    }
  ],
  "pagination": {
    "total": 100,
    "count": 10,
    "page": 1,
    "limit": 10
  }
}
```

### GET /read/get-one

**Description:** Get a single notification by ID (must belong to authenticated user)
**Authentication:** Required (Bearer Token + Permissions)
**Query Parameters:**

```
id: string (uuid, required)
```

### GET /read/get-counts

**Description:** Get notification counts grouped by status and type
**Authentication:** Required (Bearer Token + Permissions)
**Query Parameters:**

```
startDate: string (YYYY-MM-DD, optional)
endDate: string (YYYY-MM-DD, optional)
type: "info" | "warn" | "error" (optional)
status: "read" | "un-read" | "archived" (optional)
```

**Response:**

```json
{
  "code": 200,
  "message": "Notification counts fetched",
  "total": 150,
  "byStatus": { "read": 100, "un-read": 45, "archived": 5 },
  "byType": { "info": 120, "warn": 25, "error": 5 }
}
```

### POST /sudo/create

**Description:** Create a notification for any user (super admin only)
**Authentication:** Required (Bearer Token + Permissions)
**Request Body:**

```json
{
  "userId": "string (uuid, required)",
  "type": "info | warn | error (optional, default: info)",
  "title": "string (min: 1, max: 255, required)",
  "message": "string (min: 1, required)",
  "data": "object (optional, default: {})"
}
```

### POST /update/mark-all-read

**Description:** Mark all unread notifications as read for the authenticated user
**Authentication:** Required (Bearer Token + Permissions)
**Request Body:** None (empty object `{}`)

### POST /update/update-status

**Description:** Update notification status
**Authentication:** Required (Bearer Token + Permissions)
**Request Body:**

```json
{
  "id": "string (uuid, required)",
  "status": "read | un-read | archived (required)"
}
```

**Note:** When marking as `read`, `readAt` is automatically set. When marking as `un-read`, `readAt` is cleared.

### POST /delete

**Description:** Soft delete a notification (sets `isDeleted` flag to true)
**Authentication:** Required (Bearer Token + Permissions)
**Request Body:**

```json
{
  "id": "string (uuid, required)"
}
```

---

## Knowledge Base

**Base Path:** `/v1/knowledge-base`

Admin-only module for uploading markdown documents that power the RAG chatbot.

### GET /read/get-all

**Description:** List knowledge documents (metadata only)
**Authentication:** Required (`knowledge-base` read)
**Query Parameters:** `page`, `limit`, `search` (optional)

### GET /read/get-one

**Description:** Get one document including chunk metadata
**Authentication:** Required (`knowledge-base` read)
**Query Parameters:** `documentId` (uuid, required)

### POST /create

**Description:** Create a markdown document, chunk it, embed with OpenAI, and upsert vectors to Pinecone
**Authentication:** Required (`knowledge-base` create)
**Request Body:**

```json
{
  "title": "string (required)",
  "filename": "string (optional, must end with .md)",
  "content": "string (markdown, required)"
}
```

### POST /update

**Description:** Update document fields and re-index when content/title/filename change
**Authentication:** Required (`knowledge-base` update)
**Request Body:**

```json
{
  "documentId": "uuid (required)",
  "title": "string (optional)",
  "filename": "string (optional)",
  "content": "string (optional)"
}
```

### POST /delete

**Description:** Delete document, chunks, and Pinecone vectors
**Authentication:** Required (`knowledge-base` delete)
**Request Body:**

```json
{
  "documentId": "uuid (required)"
}
```

---

## Chat

**Base Path:** `/v1/chat`

Named conversations with grounded RAG Q&A for any signed-in user with the `chat` feature.

### GET /read/conversations

**Description:** List the current user's conversations (newest activity first)
**Authentication:** Required (`chat` read)

### POST /create/conversation

**Description:** Create a new empty conversation (`title` optional, defaults to `New chat`)
**Authentication:** Required (`chat` create)

### POST /update/conversation

**Description:** Rename a conversation
**Authentication:** Required (`chat` update)
**Request Body:** `{ "conversationId": "uuid", "title": "string" }`

### POST /delete/conversation

**Description:** Delete a conversation and all of its messages
**Authentication:** Required (`chat` delete)
**Request Body:** `{ "conversationId": "uuid" }`

### POST /create/ask

**Description:** Ask a question in a conversation. Retrieves top chunks from Pinecone, refuses when similarity is below `ai.rag_min_score`, otherwise answers with the active LLM and citations. Auto-titles the conversation from the first question when still named `New chat`.
**Authentication:** Required (`chat` create)
**Request Body:**

```json
{
  "conversationId": "uuid",
  "question": "string (required, 3-2000 chars)"
}
```

**Response:**

```json
{
  "code": 1000,
  "message": "Answer generated",
  "answer": "string",
  "citations": [
    {
      "documentId": "uuid",
      "title": "string",
      "filename": "setup-guide.md",
      "chunkIndex": 0
    }
  ],
  "grounded": true,
  "provider": "openai",
  "conversationId": "uuid",
  "conversationTitle": "string"
}
```

When ungrounded, `grounded` is `false`, `citations` is `[]`, and `answer` explains that the docs do not cover the question.

### POST /create/ask-stream

**Description:** Same RAG pipeline as `/create/ask`, but streams the answer as Server-Sent Events (SSE).
**Authentication:** Required (`chat` create)
**Request Body:** same as `/create/ask`
**Response:** `text/event-stream` with JSON payloads:

```
data: {"type":"status","message":"Searching the knowledge base…"}

data: {"type":"token","content":"partial text"}

data: {"type":"done","answer":"full text","citations":[...],"grounded":true,"provider":"openai","conversationId":"uuid","conversationTitle":"..."}

data: [DONE]
```

Error events use `{"type":"error","message":"...","code":...}`.

### GET /read/history

**Description:** Get messages for one conversation owned by the current user
**Authentication:** Required (`chat` read)
**Query Parameters:** `conversationId` (required), `limit` (optional, default 100)

---

## Authentication Details

### Bearer Token

Most endpoints require authentication via Bearer Token in the Authorization header:

```
Authorization: Bearer <your_access_token>
```

### Middleware Order

All protected routes follow this middleware order:

1. **Validation** - Validates request parameters (query/body)
2. **verifyToken** - Verifies JWT token
3. **checkPermissions** - Checks user permissions for the route

---

## Response Format

### Success Response

```json
{
  "code": 200,
  "statusCode": 1000,
  "message": "Success message",
  "data": {}
}
```

### Error Response

```json
{
  "code": 400,
  "statusCode": 4000,
  "message": "Error message"
}
```

### Paginated Response

```json
{
  "code": 200,
  "statusCode": 1000,
  "message": "Success message",
  "data": [],
  "pagination": {
    "total": 100,
    "count": 10,
    "page": 1,
    "limit": 10
  }
}
```

---

## Common Error Codes

| Status Code | Message               | Description                             |
| ----------- | --------------------- | --------------------------------------- |
| 200         | Success               | Request completed successfully          |
| 400         | Bad Request           | Invalid request parameters              |
| 401         | Unauthorized          | Missing or invalid authentication token |
| 403         | Forbidden             | User doesn't have required permissions  |
| 404         | Not Found             | Resource not found                      |
| 409         | Conflict              | Resource already exists                 |
| 419         | Token Error           | Token is not valid, logout the user     |
| 500         | Internal Server Error | Server encountered an error             |

---

## Enums Reference

### Notification Types

- `info`
- `warn`
- `error`

### Notification Status

- `read`
- `un-read`
- `archived`

## Notes for Frontend Developers

1. **HTTP Methods:** This API primarily uses **GET** and **POST** methods. Updates and deletions are done via POST requests.

2. **UUID Format:** All IDs use UUID v4 format. Ensure proper validation on the frontend.

3. **Pagination:** All list endpoints support pagination with `page` and `limit` query parameters.

4. **Token Management:**
   - Access tokens are short-lived
   - Refresh tokens should be used to obtain new access tokens
   - Store tokens securely

5. **Error Handling:** Always check the response `code` and handle errors appropriately.

6. **Permissions:** Some routes require specific permissions. Check with the backend team for permission requirements.

---

## Version

**API Version:** 1.0.0
**Last Updated:** 2026-07-10

For any questions or issues, please contact the backend development team.
