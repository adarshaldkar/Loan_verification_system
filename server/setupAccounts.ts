import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function createAccount(
  email: string,
  pass: string,
  role: string,
  firstName: string,
  lastName: string,
  branch?: string
) {
  // OWASP ASVS v4.0 compliant: 10 salt rounds with bcrypt
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(pass, salt);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      password: hashedPassword,
      role,
      firstName,
      lastName,
      isActive: true,
      ...(branch ? { branch } : {}),
    },
    create: {
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role,
      isActive: true,
      ...(branch ? { branch } : {}),
    },
  });

  return user;
}

async function main() {
  const adminEmail = process.argv[2] || 'adarshaldkar@gmail.com';
  const adminPass = process.argv[3] || 'Adarsh@1+777';
  const agentEmail = process.argv[4] || 'studywithmeadarsh@gmail.com';
  const agentPass = process.argv[5] || 'Adarsh@1+777';

  try {
    console.log('\n--- Creating Super Admin (Dynamic & Salt-Hashed via Bcrypt) ---');
    const admin = await createAccount(adminEmail, adminPass, 'SUPER_ADMIN', 'Adarsh', 'Aldkar');
    console.log(`✅ Super Admin created: ${admin.email} (Role: ${admin.role})`);

    console.log('\n--- Creating Field Agent (Dynamic & Salt-Hashed via Bcrypt) ---');
    const agent = await createAccount(agentEmail, agentPass, 'FIELD_AGENT', 'Adarsh', 'FieldAgent', 'Trichy Main');
    console.log(`✅ Field Agent created: ${agent.email} (Role: ${agent.role})`);

    console.log('\n============================================================');
    console.log('All accounts created dynamically in PostgreSQL with OWASP Bcrypt hashing!');
    console.log('Super Admin Login Portal:  http://187.127.175.49/login');
    console.log('Field Agent Login Portal:  http://187.127.175.49/agent/login');
    console.log('============================================================\n');
  } catch (err) {
    console.error('Error creating accounts:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
