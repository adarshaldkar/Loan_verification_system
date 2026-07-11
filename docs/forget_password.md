# Goal Description

Implement a secure "Forgot Password" flow for Admin users using an Email-based OTP system powered by Resend.

## User Review Required

> [!IMPORTANT]
> **API Key Setup**: Since we are using Resend, you will need to add your new Resend API Key to the backend `.env` file once I start executing. I will set up the code to look for `RESEND_API_KEY`.
> 
> **Email Sender**: By default, Resend requires you to send *from* an onboarded domain. If you are using their free tier testing domain, you can only send emails to the email address you registered with (e.g. `onboarding@resend.dev` to `your-email@gmail.com`). Let me know if that is acceptable for this development phase.

## Proposed Changes

### Database Schema Updates
- **`server/prisma/schema.prisma`**
  - Add `resetPasswordOtp String?` and `resetPasswordOtpExpires DateTime?` to the `User` model.

### Backend Implementation
- **Dependencies**
  - Install `resend` in the `server` directory (`npm install resend`).
- **`server/src/routes/authRoutes.ts`**
  - Add routes: `POST /forgot-password`, `POST /verify-otp`, `POST /reset-password`.
- **`server/src/controllers/authController.ts`**
  - Implement `forgotPassword`: Generate a random 6-digit code, save it to the DB with a 10-minute expiry, and send an email using the Resend API.
  - Implement `verifyOtp`: Check if the provided OTP matches the DB and is not expired.
  - Implement `resetPassword`: Validate OTP again, hash the new password, update the DB, and clear the OTP fields.

### Frontend Implementation
- **`app/forgot-password/page.tsx` (NEW)**
  - Create a sleek, multi-step UI flow:
    1. Enter Email Address
    2. Enter 6-digit OTP
    3. Enter New Password & Confirm
  - Will include proper loading states and error handling.
- **`app/login/page.tsx`**
  - Update the "Forgot password?" text to be a working Next.js `<Link>` that routes to `/forgot-password`.

## Verification Plan

### Automated Tests
- I will run TypeScript compilation to ensure no type errors are introduced.

### Manual Verification
- We will click "Forgot Password" on the login screen.
- We will enter the admin email and verify that Resend sends an email.
- We will enter the OTP and verify the UI transitions to the new password step.
- We will reset the password and attempt to log in with the new credentials.
