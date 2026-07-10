# Phase 1: Security Hardening Implementation Plan

As agreed, we will start by securing the current backend before moving any folders. This plan addresses the critical and major vulnerabilities identified in the Security Audit.

## Proposed Changes

### 1. XSS Fix: Move JWT to HttpOnly Cookies
Currently, the frontend receives a token and stores it in `localStorage`, making it vulnerable to XSS.
- **Backend:** 
  - Install `cookie-parser`.
  - Update `server/src/controllers/authController.ts` (`loginUser`) to set the JWT as an `HttpOnly`, `Secure`, `SameSite=Strict` cookie instead of returning it in the JSON body.
  - Update `server/src/middlewares/auth.ts` (`authenticateToken`) to read the token from `req.cookies.token` instead of the `Authorization` header.
- **Frontend:**
  - Update `lib/api.ts` to configure the Axios instance with `withCredentials: true` so the browser automatically sends the cookie.
  - Remove all logic dealing with `localStorage.getItem("lvms_token")`.
  - Update the Next.js `login` page to handle the new cookie-based response.

### 2. DDoS & Brute Force Protection
Currently, the API has no limits.
- **Backend:**
  - Update `server/src/index.ts` to import and apply `express-rate-limit`.
  - **Global Limiter:** Apply a limit of 1000 requests per 15 minutes across all `/api/v1` routes to prevent DDoS.
  - **Login Limiter:** Apply a strict limit of 5 requests per 15 minutes specifically to the `/api/v1/auth/login` route to prevent password brute-forcing.

### 3. Tightening CORS
Currently, CORS is open to the entire internet (`app.use(cors())`).
- **Backend:**
  - Update `server/src/index.ts` to restrict CORS to only allow requests from `http://localhost:3000` (your frontend) and explicitly allow credentials (cookies) to be passed cross-origin.

### 4. Input Validation (Fixing the Major Issue)
Currently, the backend blindly trusts the data coming from the frontend.
- **Backend:**
  - Create a new file `server/src/middlewares/validate.ts`.
  - Write a generic middleware that takes a `zod` schema and validates `req.body` against it.
  - Apply this middleware to the `auth.ts` routes to strictly validate the `email` and `password` payload formats before they even reach the controller.

## Open Questions for You
1. If the server port is `5000` and the frontend runs on `3000`, setting cookies cross-port on `localhost` requires specific CORS and cookie settings (`SameSite: 'lax'` for local dev). Do you approve of handling local dev environments gracefully while enforcing strict rules in production?

## Verification Plan
1. Send a POST request to `/api/v1/auth/login`. Verify that the token is *not* in the JSON response, but instead is returned as a `Set-Cookie` header.
2. Attempt to hit `/api/v1/auth/login` 6 times in a row with wrong credentials. Verify that the 6th attempt is blocked with a `429 Too Many Requests` status.
3. Test the Admin Panel in the browser to ensure login, dashboard, and case fetching still work seamlessly with the new cookie-based auth.
