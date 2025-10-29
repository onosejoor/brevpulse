# **Brevpulse API: Intelligent Digest Generation** 🧠

<!-- Dokugen Badge - will be added at the very bottom -->

## Overview
Brevpulse is a sophisticated monorepo project designed to transform your digital noise into clear, actionable insights. This backend service, built with **TypeScript**, **NestJS**, and **MongoDB (Mongoose)**, leverages **Google's Gemini AI** for intelligent digest generation, integrates with third-party services like **Gmail**, and utilizes **Redis (BullMQ)** for robust background job processing and caching.

## Getting Started

To get Brevpulse up and running on your local machine, follow these steps. This monorepo uses `bun` as the package manager and `turbo` for optimized builds.

### Prerequisites
*   Node.js (v18 or higher)
*   Bun (package manager)
*   MongoDB instance (local or cloud)
*   Redis instance (local or cloud)
*   Google Cloud Project with Gemini API, OAuth 2.0 Client ID/Secret
*   Cloudinary account
*   Email sending API (e.g., Mailgun, SendGrid)

### Installation

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/onosejoor/brevpulse.git
    cd brevpulse
    ```

2.  **Install Dependencies:**
    This command will install dependencies for all workspaces in the monorepo.
    ```bash
    bun install
    ```

3.  **Navigate to the Server Application:**
    ```bash
    cd apps/server
    ```

4.  **Build the Server Application:**
    ```bash
    bun run build
    ```

### Environment Variables
Create a `.env` file in the `apps/server` directory and populate it with the following required variables:

```dotenv
# Server Configuration
PORT=8080
NODE_ENV=development # or production

# Database
MONGODB_URL="mongodb://localhost:27017/brevpulse"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT Secrets (use strong, unique keys)
REFRESH_TOKEN_SECRET="your_refresh_token_secret_key"
EMAIL_SECRET="your_email_verification_secret_key"
ACCESS_TOKEN_SECRET="your_access_token_secret_key"

# Cloudinary (for avatar uploads)
CLOUDINARY_CLOUD_NAME="your_cloudinary_cloud_name"
CLOUDINARY_API_KEY="your_cloudinary_api_key"
CLOUDINARY_API_SECRET="your_cloudinary_api_secret"

# Digest Encryption (must be 32 characters long)
DIGEST_ENCRYPTION_KEY="your_32_char_digest_encryption_key"

# Google OAuth (for Google Sign-in)
G_CLIENT_ID="your_google_client_id"
G_CLIENT_SECRET="your_google_client_secret"
G_REDIRECT_URI="http://localhost:8080/v1/api/auth/callback/google" # Update if your frontend URL differs

# Gmail Integration OAuth
GMAIL_REDIRECT_URI="http://localhost:8080/v1/api/connect/callback/gmail" # Update if your frontend URL differs

# Email Sending API (e.g., for verification emails)
FRONTEND_DOMAIN="http://localhost:3000" # Your frontend application's domain
EMAIL_API_URL="https://your-email-api-service.com" # URL to your email sending service
EMAIL_API_TOKEN="your_email_api_token"

# Gemini AI (for digest generation)
GEMINI_API_KEY="your_gemini_api_key"
```

### Running the Application

1.  **Start the Server in Development Mode (with watch):**
    ```bash
    bun run dev
    ```
2.  **Start the Server in Production Mode:**
    ```bash
    bun run start:prod
    ```

The API server will typically run on `http://localhost:8080`.

## Features
*   **User Authentication & Authorization**: Secure user registration, login, and session management using JWT (Access & Refresh tokens), enhanced with Google OAuth.
*   **Email Verification**: Background job processing for email verification using BullMQ.
*   **User Profile Management**: Retrieve and update user details, including avatar uploads to Cloudinary.
*   **AI-Powered Digest Generation**: Integration with Google Gemini AI to transform raw data (e.g., emails) into concise, personalized digests based on user preferences and subscription plans.
*   **Third-Party Integrations**: Seamlessly connect user accounts with services like Gmail for data ingestion.
*   **Rate Limiting**: Throttling implemented using Redis to protect against abuse and ensure API stability.
*   **Background Job Processing**: Utilizes BullMQ with Redis for asynchronous tasks like sending emails and image processing.
*   **Data Caching**: Redis integration for caching frequently accessed data to improve response times.
*   **Cron Jobs**: Scheduled tasks for daily digest generation and delivery.
*   **Robust Error Handling**: Centralized exception filtering for consistent API error responses.

## API Documentation

### Base URL
`http://localhost:8080/v1/api`

### Endpoints

#### `POST /auth/signup`
Registers a new user account.
**Request**:
```json
{
  "email": "user@example.com",
  "password": "StrongPassword123",
  "name": "Jane Doe"
}
```
**Response**:
```json
{
  "status": "success",
  "message": "A verification mail has been sent to user@example.com, kindly verify your mail to continue"
}
```
**Errors**:
- `400 Bad Request`: User Already Exist, Validation failed.
- `500 Internal Server Error`: An unexpected error occurred.

#### `POST /auth/signin`
Authenticates a user and issues access and refresh tokens.
**Request**:
```json
{
  "email": "user@example.com",
  "password": "StrongPassword123"
}
```
**Response**:
(Sets `bp_rtoken` and `bp_atoken` cookies)
```json
{
  "status": "success",
  "message": "Welcome Jane Doe"
}
```
**Errors**:
- `404 Not Found`: Invalid Credentials.
- `400 Bad Request`: Validation failed.
- `500 Internal Server Error`: An unexpected error occurred.

#### `GET /auth/verify-email`
Verifies a user's email address using a token received via email.
**Request**:
Query parameter `token`: `?token=your_email_verification_token`
**Response**:
(Sets `bp_rtoken` and `bp_atoken` cookies)
```json
{
  "status": "success",
  "message": "Email Verified Successfully"
}
```
**Errors**:
- `404 Not Found`: User does not exist.
- `400 Bad Request`: User already verified, Invalid token.
- `500 Internal Server Error`: An unexpected error occurred.

#### `GET /auth/refresh-token`
Refreshes the access token using a valid refresh token.
**Request**:
Cookie `bp_rtoken`: `your_refresh_token`
**Response**:
(Sets `bp_atoken` cookie)
```json
{
  "status": "success",
  "message": "Access Token Sent"
}
```
**Errors**:
- `401 Unauthorized`: No Refresh Token, Invalid Refresh Token.

#### `GET /auth/oauth/google`
Redirects to Google's OAuth consent screen for user sign-in/sign-up.
**Request**:
None (direct browser navigation)
**Response**:
`307 Redirect` to Google OAuth URL.

#### `GET /auth/callback/google`
Handles the callback from Google OAuth after user consent.
**Request**:
Query parameters: `code` (authorization code), `state` (optional, for security)
**Response**:
(Sets `bp_rtoken` and `bp_atoken` cookies)
```json
{
  "status": "success",
  "message": "Signin successfully"
}
```
**Errors**:
- `400 Bad Request`: Email Not Provided By Google, User not identified, Failed to connect.

#### `GET /user/me`
Retrieves the authenticated user's profile information.
**Request**:
Auth token: In `bp_atoken` cookie.
**Response**:
```json
{
  "status": "success",
  "data": {
    "_id": "654321098765432109876543",
    "email": "user@example.com",
    "name": "Jane Doe",
    "email_verified": true,
    "avatar": "https://example.com/avatar.jpg",
    "preferences": {
      "deliveryTime": "09:00",
      "filters": { "keywords": ["important", "urgent"] }
    },
    "subscription": "pro",
    "isActive": true,
    "createdAt": "2024-01-01T12:00:00.000Z",
    "updatedAt": "2024-01-01T12:00:00.000Z",
    "synchedTokens": ["gmail"]
  }
}
```
**Errors**:
- `401 Unauthorized`: Invalid access token.
- `404 Not Found`: User not found.

#### `PATCH /user/me`
Updates the authenticated user's profile.
**Request**:
Auth token: In `bp_atoken` cookie.
`Body` (JSON):
```json
{
  "name": "Jane Smith",
  "preferences": {
    "deliveryTime": "10:00"
  }
}
```
`Form-data`:
Optional `avatar` file (JPEG, PNG, JPG, WEBP, max 5MB).
**Response**:
```json
{
  "status": "success",
  "message": "Profile update received, your new changes will reflect shortly"
}
```
**Errors**:
- `401 Unauthorized`: Invalid access token.
- `415 Unsupported Media Type`: Invalid file type for avatar.
- `400 Bad Request`: Validation failed.

#### `GET /connect/oauth/gmail`
Redirects to Google's OAuth consent screen to connect a Gmail account.
**Request**:
Auth token: In `bp_atoken` cookie.
**Response**:
`307 Redirect` to Google Gmail OAuth URL.
**Errors**:
- `401 Unauthorized`: Invalid access token.

#### `GET /connect/callback/gmail`
Handles the callback from Google OAuth after connecting a Gmail account.
**Request**:
Query parameters: `code` (authorization code), `state` (user ID)
**Response**:
```json
{
  "status": "success",
  "message": "Gmail connected"
}
```
**Errors**:
- `400 Bad Request`: User not identified, User not found, Failed to connect Gmail.

#### `GET /digest/all`
Generates and retrieves a digest of all connected providers' data for the authenticated user.
**Request**:
Auth token: In `bp_atoken` cookie.
**Response**:
```json
{
  "status": "success",
  "data": [
    {
      "account": "gmail",
      "messages": [
        {
          "id": "message_id_1",
          "subject": "Important Meeting Update",
          "from": "Team Lead <lead@example.com>",
          "date": "Mon, 29 Jul 2024 10:00:00 +0000",
          "snippet": "Quick update on the Q3 planning meeting."
        }
      ]
    }
  ]
}
```
**Errors**:
- `401 Unauthorized`: Invalid access token.
- `400 Bad Request`: No Gmail account connected.
- `500 Internal Server Error`: An unexpected error occurred.

#### `GET /digest/with-ai`
Generates an AI-powered digest based on connected data (e.g., Gmail) and user's subscription plan.
**Request**:
Auth token: In `bp_atoken` cookie.
**Response**:
```json
{
  "period": "daily",
  "items": [
    {
      "source": "gmail",
      "priority": "high",
      "title": "Your Team Lead shared an important update",
      "description": "Just dropped! A critical update regarding the Q3 planning meeting. Please review the details promptly.",
      "count": 1,
      "actions": [
        {
          "url": "https://mail.google.com/mail/u/0/#inbox/message_id_1",
          "type": "link"
        }
      ]
    }
  ],
  "summary": {
    "totalItems": 1,
    "bySource": {
      "gmail": 1,
      "calendar": 0,
      "github": 0,
      "slack": 0,
      "figma": 0
    },
    "byPriority": {
      "high": 1,
      "medium": 0,
      "low": 0
    },
    "integrations": ["gmail"],
    "plan": "pro"
  }
}
```
**Errors**:
- `401 Unauthorized`: Invalid access token.
- `400 Bad Request`: No Gmail account connected, Failed to generate digest, Malformed digest response from AI.
- `500 Internal Server Error`: An unexpected error occurred.

#### `GET /digest/with-ai-email`
Manually triggers the daily digest cron job to enqueue email digests for all users.
**Request**:
None (typically for internal/admin use or testing cron functionality)
**Response**:
```json
{
  "status": "success",
  "message": "email queue added user1@example.com, user2@example.com"
}
```
**Errors**:
- `500 Internal Server Error`: Internal Server Error during job enqueuing.

---

## Usage

Once the Brevpulse API is running and configured, it serves as the backend for an intelligent digest generation system.

### User Flow
1.  **Registration/Login**: Users can sign up via email/password or use Google OAuth for quick access. Upon email registration, a verification email is sent.
2.  **Email Verification**: Users verify their email through a link, which authenticates them and sets their initial session cookies.
3.  **Connect Integrations**: Authenticated users can connect their third-party accounts (e.g., Gmail) to allow Brevpulse to access their data. This is typically done through OAuth flows initiated from the frontend and handled by the API's `/connect/oauth` and `/connect/callback` endpoints.
4.  **Profile Management**: Users can update their profile details and avatar. Avatar updates are processed asynchronously in the background.
5.  **Digest Retrieval**: Users can request an immediate digest of their connected data using `/digest/all` or an AI-summarized digest using `/digest/with-ai`.
6.  **Scheduled Digests**: Based on user preferences (e.g., daily delivery time), the system will automatically generate and email personalized digests. This is handled by a cron job (`handleDailyDigestCron`) that enqueues digest generation and email sending tasks to the BullMQ queue.

### Example Scenario
A user logs into their Brevpulse account and connects their Gmail. The system fetches unread emails from the last day. The `/digest/with-ai` endpoint then sends this raw email data to Google's Gemini AI, which processes it according to the user's subscription plan (e.g., summarizing only high-priority emails for a 'free' plan) and returns a structured, human-readable digest. This digest can then be displayed on the frontend or sent as an email.

## Technologies Used
| Technology         | Description                                                                 |
| :----------------- | :-------------------------------------------------------------------------- |
| **Node.js**        | JavaScript runtime for building scalable server-side applications.            |
| **NestJS**         | Progressive Node.js framework for building efficient and scalable server-side applications. |
| **TypeScript**     | Superset of JavaScript that adds static types, enhancing code quality and maintainability. |
| **Mongoose**       | MongoDB object modeling tool for Node.js, providing schema-based data solutions. |
| **MongoDB**        | NoSQL database used for flexible, scalable data storage.                      |
| **Redis**          | In-memory data store, used for caching, rate limiting, and BullMQ task queues. |
| **BullMQ**         | Robust message queue for Node.js based on Redis, for handling background jobs. |
| **Google Gemini AI** | Advanced generative AI for creating intelligent, summarized digests.         |
| **Google OAuth2**  | Secure authentication and authorization for Google services.                  |
| **Cloudinary**     | Cloud-based image and video management for media asset storage and delivery. |
| **Argon2**         | Password hashing function for secure storage of user credentials.             |
| **JWT**            | JSON Web Tokens for stateless authentication and authorization.             |
| **Helmet**         | Express middleware for securing Node.js apps by setting various HTTP headers. |
| **TurboRepo**      | High-performance build system for JavaScript and TypeScript monorepos.        |
| **Zod**            | TypeScript-first schema declaration and validation library.                   |

## License
This project is currently unlicensed.

## Author Info

👋 **Onosejoor**
- LinkedIn: [Your LinkedIn Profile](https://linkedin.com/in/yourusername)
- Twitter: [Your Twitter Profile](https://twitter.com/yourusername)

---
[![Build Status](https://img.shields.io/github/workflow/status/onosejoor/brevpulse/Node.js%20CI?style=flat-square&label=Build)](https://github.com/onosejoor/brevpulse/actions/workflows/node.js.yml)
[![License](https://img.shields.io/badge/License-UNLICENSED-red.svg?style=flat-square)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/nestjs-%23E0234E.svg?style=flat-square&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-%234ea94b.svg?style=flat-square&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Redis](https://img.shields.io/badge/redis-%23DD0031.svg?style=flat-square&logo=redis&logoColor=white)](https://redis.io/)
[![GoogleGenerativeAI](https://img.shields.io/badge/Google%20Generative%20AI-4285F4?style=flat-square&logo=google&logoColor=white)](https://ai.google.dev/)

[![Readme was generated by Dokugen](https://img.shields.io/badge/Readme%20was%20generated%20by-Dokugen-brightgreen)](https://www.npmjs.com/package/dokugen)