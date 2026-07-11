# Loan Verification Management System (LVMS)

<div align="center">
  <img src="https://img.shields.io/badge/Next.js-15.0-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/Node.js-Express-green?style=for-the-badge&logo=node.js" alt="Express" />
  <img src="https://img.shields.io/badge/Prisma-ORM-blue?style=for-the-badge&logo=prisma" alt="Prisma" />
  <img src="https://img.shields.io/badge/Tailwind-v4-38B2AC?style=for-the-badge&logo=tailwind-css" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/PostgreSQL-Database-336791?style=for-the-badge&logo=postgresql" alt="PostgreSQL" />
</div>

<br />

The **Loan Verification Management System (LVMS)** is an enterprise-grade platform built to streamline and manage the end-to-end verification process for financial institutions. It consists of a powerful **Admin Dashboard** for dispatchers and managers, and a highly responsive **Agent Panel** for field verification officers.

## ✨ Core Features

### 👨‍💼 Admin Dashboard
* **Agent Management**: Register, track, and manage field verification agents.
* **Case Assignment**: Assign business and residential verification cases to agents.
* **Live GPS Tracking**: Monitor agent locations in real-time on interactive maps.
* **Data Import/Export**: Bulk upload cases via Excel/CSV.
* **Advanced Analytics**: Generate reports and track verification success rates.
* **Dark Mode**: Fully implemented responsive light/dark theme.

### 🕵️‍♂️ Agent Panel
* **Optimized Routing**: View assigned cases optimized for distance and time.
* **Offline Mode**: Continue capturing verification data and photos even without cellular service (auto-syncs when online).
* **Location Ping**: Background GPS tracking for security and analytics.
* **Image Uploads**: Geo-tagged evidence capture directly from the mobile browser.
* **Secure OTP Flow**: Reset passwords securely using email-based OTPs powered by Resend.

---

## 🛠️ Technology Stack

* **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS v4, Lucide/React-Icons, Shadcn UI
* **Backend**: Node.js, Express.js, TypeScript
* **Database**: PostgreSQL (hosted on Neon/Supabase)
* **ORM**: Prisma
* **Email Service**: Resend API
* **Maps/Routing**: MapLibre, OpenStreetMap
* **Validation**: Zod

---

## 🚀 Getting Started

Follow these instructions to set up the project locally on your machine.

### Prerequisites

* Node.js (v18 or higher)
* npm, yarn, or pnpm
* A PostgreSQL database instance (local or cloud)
* A Resend API key for email delivery

### 1. Clone the repository

```bash
git clone https://github.com/your-username/Loan_verification_system.git
cd Loan_verification_system
```

### 2. Backend Setup (Server)

Navigate to the server directory and install dependencies:

```bash
cd server
npm install
```

Create a `.env` file in the `server` directory and add the following variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
DATABASE_URL="postgresql://username:password@localhost:5432/lvms?schema=public"

# Authentication
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"

# Third-Party Services
RESEND_API_KEY="re_your_resend_api_key_here"
```

Initialize the database schema with Prisma:

```bash
npx prisma generate
npx prisma db push
```

Start the backend server:

```bash
npm run dev
```

### 3. Frontend Setup (Client)

Open a new terminal window, navigate to the root directory, and install dependencies:

```bash
cd Loan_verification_system
npm install
```

Start the Next.js development server:

```bash
npm run dev
```

The frontend will be available at `http://localhost:3000` and the API will run on `http://localhost:5000`.

---

## 📖 Usage Guide

### Logging In
* **Admin Portal**: Navigate to `http://localhost:3000/login` to access the dispatcher and management portal.
* **Agent Portal**: Navigate to `http://localhost:3000/agent/login` to access the mobile-friendly field officer interface.

### Testing the Forgot Password Flow
If you are using a free-tier Resend account, you can only send password reset emails to the exact email address you verified on Resend. Ensure you create an Admin user in the database with that specific email address to successfully test the OTP flow.

---

## 🔒 Security

* **Authentication**: Stateless JWT-based authentication stored in secure HttpOnly cookies.
* **Password Hashing**: Passwords are salted and hashed using `bcrypt`.
* **Rate Limiting**: Critical endpoints (like login and OTP requests) are rate-limited to prevent brute-force attacks.
* **Input Validation**: All incoming API requests are strictly typed and validated using `zod`.

---

## 📜 License

This project is licensed under the MIT License. You are free to use, modify, and distribute the code for both commercial and non-commercial purposes.
