import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import routes from './routes';
import { globalLimiter, ipBlacklistHandler, trackSecurityFailures } from './middlewares/security';

// Load environment variables FIRST
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy for rate limiting support (e.g. Loopback/DDoS protection)
app.set('trust proxy', 1);

// Security & Parsing Middlewares
app.use(ipBlacklistHandler); // Block blacklisted IPs immediately
app.use(trackSecurityFailures); // Track security failures to detect DDoS/scanning
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.COOKIE_SECRET || 'lvms-default-secure-secret-key'));
app.use(globalLimiter);

// API Routes (all routes prefixed with /api/v1)
app.use('/api/v1', routes);

// Global Error Handling Middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal Server Error', error: process.env.NODE_ENV === 'production' ? undefined : err.message });
});

import bcrypt from 'bcryptjs';
import prisma from './config/db';

async function seedSuperAdmins() {
  const superEmails = ['akshaya@gmail.com', 'adarshaldkar@gmail.com'];
  const superPassword = 'zxc123';
  
  const normalEmail = 'admin@loanverify.com';
  const normalPassword = 'admin123';
  
  let success = false;
  let attempts = 0;
  
  while (!success && attempts < 10) {
    try {
      attempts++;
      
      // Seed Super Admins
      for (const email of superEmails) {
        const existing = await prisma.user.findUnique({ where: { email } });
        if (!existing) {
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(superPassword, salt);
          await prisma.user.create({
            data: {
              email,
              password: hashedPassword,
              firstName: email.split('@')[0],
              lastName: 'SuperAdmin',
              role: 'ADMIN',
            }
          });
          console.log(`[SuperAdmin Seed] Created superadmin account: ${email}`);
        }
      }
      
      // Seed Normal Admin
      const normalExisting = await prisma.user.findUnique({ where: { email: normalEmail } });
      if (!normalExisting) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(normalPassword, salt);
        await prisma.user.create({
          data: {
            email: normalEmail,
            password: hashedPassword,
            firstName: 'Normal',
            lastName: 'Admin',
            role: 'ADMIN',
          }
        });
        console.log(`[SuperAdmin Seed] Created normal admin account: ${normalEmail}`);
      }
      
      success = true;
      console.log('[SuperAdmin Seed] Database seed completed successfully.');
    } catch (err: any) {
      console.error(`[SuperAdmin Seed] Attempt ${attempts} failed. Database not ready yet:`, err.message || err);
      if (attempts < 10) {
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }
}

// Start the server
app.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  await seedSuperAdmins();
});
// Trigger reload comment

