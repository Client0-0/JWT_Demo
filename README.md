# JWT Authentication Demo Application

This is a complete end-to-end demonstration of a secure authentication flow using **JSON Web Tokens (JWT)**. It features a React frontend and a Node.js/Express backend, implementing the industry-standard Access Token and Refresh Token pattern.

## Features

- 🔐 **Dual Token System**: Uses short-lived Access Tokens for API requests and long-lived Refresh Tokens to maintain sessions.
- 🍪 **Secure Cookie Storage**: Refresh Tokens are sent via HTTP-only, secure cookies, making them inaccessible to JavaScript and mitigating XSS attacks.
- 🔄 **Silent Token Refresh**: The frontend utilizes Axios interceptors to automatically catch `401 Unauthorized` errors, silently fetch a new Access Token using the Refresh Token, and retry the failed request without interrupting the user experience.
- ✨ **Modern Glassmorphism UI**: A sleek, dark-themed UI built with React and custom CSS.
- 🛡️ **Protected Routes**: React Router is configured to guard protected dashboard pages from unauthenticated access.

## Tech Stack

**Frontend (`/client`)**
*   [React](https://react.dev/) (Bootstrapped with Vite)
*   [React Router](https://reactrouter.com/) (Routing & Navigation guards)
*   [Axios](https://axios-http.com/) (HTTP client with interceptors)

**Backend (`/server`)**
*   [Node.js](https://nodejs.org/) & [Express](https://expressjs.com/)
*   [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) (JWT generation and verification)
*   [cookie-parser](https://github.com/expressjs/cookie-parser) (Parsing secure cookies)
*   [cors](https://github.com/expressjs/cors) (Cross-Origin Resource Sharing)

## How to Run Locally

### Prerequisites
Make sure you have Node.js and npm installed on your machine.

### 1. Start the Backend Server
Open a terminal and navigate to the `server` directory:
```bash
cd server
npm install
npm run start # Or 'node index.js'
```
*The server will start running on `http://127.0.0.1:3000`.*

### 2. Start the Frontend Application
Open a second terminal and navigate to the `client` directory:
```bash
cd client
npm install
npm run dev
```
*The frontend will be available at `http://localhost:5173`.*

## Testing the Flow
1. Open your browser and go to `http://localhost:5173`.
2. You will be greeted by the Login page.
3. Login using the mock credentials:
   - **Email:** `user@example.com`
   - **Password:** `password123`
4. Click "Sign In". You will be redirected to the secure Dashboard.
5. The Access token expires in 15 seconds. Wait for 15 seconds on the Dashboard.
6. Refresh the page or trigger an API call. You can open the Network tab in your browser's DevTools to watch the `401` error happen, followed immediately by a silent `/refresh` request that receives a new Access Token, allowing the `/protected` endpoint request to succeed transparently!
