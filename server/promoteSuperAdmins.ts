import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

// Admins that previously relied on hardcoded-email super-admin checks.
// After this script they are promoted to the SUPER_ADMIN role so the
// role-based authorization used across the app works.
const SUPER_ADMIN_EMAILS = ['akshaya@gmail.com', 'adarshaldkar@gmail.com'];

async function promoteSuperAdmins() {
  try {
    const result = await prisma.user.updateMany({
      where: { email: { in: SUPER_ADMIN_EMAILS } },
      data: { role: 'SUPER_ADMIN' },
    });

    console.log(`Promoted ${result.count} user(s) to SUPER_ADMIN role.`);

    const remaining = await prisma.user.findMany({
      where: { email: { in: SUPER_ADMIN_EMAILS } },
      select: { email: true, role: true },
    });

    if (remaining.length === 0) {
      console.log('WARNING: No matching users found for the SUPER_ADMIN emails.');
    }
  } catch (error) {
    console.error('Error promoting super admins:', error);
  } finally {
    await prisma.$disconnect();
  }
}

promoteSuperAdmins();