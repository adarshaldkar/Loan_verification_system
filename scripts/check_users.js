const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://neondb_owner:npg_zlZeSsC14uwF@ep-wandering-art-atgg456j-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require'
    }
  }
});
const bcrypt = require('bcryptjs');

async function test() {
  const users = await prisma.user.findMany({
    select: { email: true, role: true, isActive: true, password: true, firstName: true }
  });
  console.log('Total users in database:', users.length);
  for (const u of users) {
    const isZxc123 = await bcrypt.compare('zxc123', u.password).catch(() => false);
    console.log(`Email: ${u.email} | Name: ${u.firstName} | Role: ${u.role} | Active: ${u.isActive} | Password is 'zxc123': ${isZxc123}`);
  }
}

test()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
