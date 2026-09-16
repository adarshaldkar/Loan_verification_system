const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://neondb_owner:npg_zlZeSsC14uwF@ep-wandering-art-atgg456j-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require'
    }
  }
});
const bcrypt = require('bcryptjs');

async function resetPass() {
  const hash = await bcrypt.hash('zxc123', 10);
  const updated = await prisma.user.update({
    where: { email: 'adarshaldkar@gmail.com' },
    data: { password: hash, isActive: true }
  });
  console.log('SUCCESS: Reset password to zxc123 for:', updated.email);
}

resetPass()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
