const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.updateMany({
    where: { role: 'ADMIN' },
    data: { password: hashedPassword }
  });
  console.log('Admin password reset');
}
main().finally(() => prisma.$disconnect());
