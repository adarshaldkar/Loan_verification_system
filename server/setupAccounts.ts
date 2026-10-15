import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import readline from 'readline';

const prisma = new PrismaClient();

function prompt(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans.trim());
    });
  });
}

async function main() {
  console.log('\n======================================================');
  console.log('  DYNAMIC USER REGISTRATION (OWASP-Compliant Bcrypt)   ');
  console.log('======================================================\n');

  // Strictly dynamic: accept from CLI arguments or prompt interactively. ZERO hardcoded defaults.
  let email = process.argv[2];
  let password = process.argv[3];
  let role = process.argv[4];
  let firstName = process.argv[5];
  let lastName = process.argv[6];
  let branch = process.argv[7];

  if (!email) {
    email = await prompt('Enter Email: ');
  }
  if (!password) {
    password = await prompt('Enter Password: ');
  }
  if (!role) {
    role = await prompt('Enter Role (SUPER_ADMIN | ADMIN | FIELD_AGENT) [default: SUPER_ADMIN]: ');
    if (!role) role = 'SUPER_ADMIN';
  }
  if (!firstName) {
    firstName = await prompt('Enter First Name: ');
  }
  if (!lastName) {
    lastName = await prompt('Enter Last Name: ');
  }
  if (!branch && role === 'FIELD_AGENT') {
    branch = await prompt('Enter Branch Name (Optional for Agent): ');
  }

  if (!email || !password) {
    console.error('\n❌ ERROR: Email and Password are required. Nothing was created.');
    process.exit(1);
  }

  try {
    // OWASP ASVS Password Security: Individual 10-round cryptographic salt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        password: hashedPassword,
        role: role.toUpperCase(),
        firstName: firstName || 'User',
        lastName: lastName || 'Admin',
        isActive: true,
        ...(branch ? { branch } : {}),
      },
      create: {
        email,
        password: hashedPassword,
        firstName: firstName || 'User',
        lastName: lastName || 'Admin',
        role: role.toUpperCase(),
        isActive: true,
        ...(branch ? { branch } : {}),
      },
    });

    console.log('\n✅ User created successfully in database:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Role:  ${user.role}`);
    console.log(`   Name:  ${user.firstName} ${user.lastName}`);
    console.log('   Password hashed with OWASP Bcrypt (10 salt rounds).\n');
  } catch (error) {
    console.error('Error creating user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
