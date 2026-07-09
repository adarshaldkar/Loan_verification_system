import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_loan_verify_2026';

async function seedAdmin() {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    const admin = await prisma.user.upsert({
      where: { email: 'admin@loanverify.com' },
      update: {},
      create: {
        email: 'admin@loanverify.com',
        password: hashedPassword,
        firstName: 'Super',
        lastName: 'Admin',
        role: 'ADMIN',
      },
    });

    const token = jwt.sign({ id: admin.id, role: admin.role, branch: admin.branch }, JWT_SECRET, {
      expiresIn: '7d',
    });

    console.log('--- ADMIN TOKEN ---');
    console.log(token);
    console.log('-------------------');
  } catch (error) {
    console.error('Error seeding admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedAdmin();
